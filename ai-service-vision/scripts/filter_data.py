"""
Lọc dataset đã scrape: bỏ duplicate ảnh, giá outlier, ảnh quá nhỏ, shop chuyên.

Input:  data/raw/metadata/<source>.jsonl + data/raw/images/
Output: data/filtered/clean.jsonl + data/filtered/dropped.jsonl (lý do)

Filter chain:
1. Listing phải có >= 2 ảnh hợp lệ (>= 200×200 px)
2. Giá hợp lý theo generation (table dưới)
3. Bỏ shop chuyên: 1 location + > 8 listing trong batch
4. Dedup ảnh theo perceptual hash (pHash) — giữ listing đầu tiên
5. Bỏ listing có >= 50% ảnh là duplicate với listing khác (likely repost)

Usage:
    python -m scripts.filter_data
    python -m scripts.filter_data --min-images 3 --max-listings-per-location 5
"""

from __future__ import annotations

import argparse
import json
import logging
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from PIL import Image

from scripts.utils import DATA_DIR, IMAGES_DIR, METADATA_DIR

logger = logging.getLogger(__name__)

FILTERED_DIR = DATA_DIR / "filtered"
FILTERED_DIR.mkdir(parents=True, exist_ok=True)

# Giá hợp lý theo generation (VND) — dùng để bỏ outlier scam/giá ảo
PRICE_RANGES: dict[str, tuple[int, int]] = {
    "gen_6":     (200_000,    4_000_000),
    "gen_7_8":   (500_000,    5_000_000),
    "gen_x_xs":  (1_500_000,  8_000_000),
    "gen_11":    (2_000_000, 10_000_000),
    "gen_12_13": (3_000_000, 15_000_000),
    "gen_14":    (5_000_000, 20_000_000),
    "gen_15":    (8_000_000, 25_000_000),
    "gen_16":   (10_000_000, 30_000_000),
    "gen_17":   (15_000_000, 40_000_000),
}


def phash(img_path: Path, hash_size: int = 8) -> int | None:
    """
    Perceptual hash đơn giản (DCT-free, dHash variant).
    Trả về int 64-bit để so sánh nhanh, None nếu ảnh lỗi.
    """
    try:
        img = Image.open(img_path).convert("L").resize((hash_size + 1, hash_size), Image.LANCZOS)
        pixels = list(img.getdata())
        bits = 0
        for row in range(hash_size):
            for col in range(hash_size):
                left = pixels[row * (hash_size + 1) + col]
                right = pixels[row * (hash_size + 1) + col + 1]
                bits = (bits << 1) | (1 if left > right else 0)
        return bits
    except Exception as exc:  # noqa: BLE001
        logger.warning("phash failed for %s: %s", img_path, exc)
        return None


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def check_image_quality(img_path: Path, min_size: int = 200) -> bool:
    try:
        with Image.open(img_path) as img:
            return img.width >= min_size and img.height >= min_size
    except Exception:  # noqa: BLE001
        return False


def is_price_outlier(price: int | None, generation: str | None) -> bool:
    """True nếu giá nằm ngoài range hợp lý cho generation."""
    if not price or not generation:
        return False  # không đủ info, không drop vì lý do giá
    rng = PRICE_RANGES.get(generation)
    if not rng:
        return False
    lo, hi = rng
    return price < lo or price > hi


def load_listings(sources: list[str]) -> list[dict[str, Any]]:
    listings: list[dict[str, Any]] = []
    for source in sources:
        path = METADATA_DIR / f"{source}.jsonl"
        if not path.exists():
            continue
        with path.open(encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    listings.append(json.loads(line))
    return listings


def filter_pipeline(
    listings: list[dict[str, Any]],
    min_images: int,
    max_per_location: int,
    dup_distance: int,
    dup_image_ratio_drop: float,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    kept: list[dict[str, Any]] = []
    dropped: list[dict[str, Any]] = []

    # Stage A: image quality + price + min images
    pre_kept: list[dict[str, Any]] = []
    for item in listings:
        reasons = []
        valid_paths = []
        for fname in item.get("image_paths", []):
            p = IMAGES_DIR / fname
            if p.exists() and check_image_quality(p):
                valid_paths.append(fname)
        item["image_paths"] = valid_paths

        if len(valid_paths) < min_images:
            reasons.append(f"too_few_images_{len(valid_paths)}")
        if is_price_outlier(item.get("price_vnd"), item.get("detected_generation")):
            reasons.append(f"price_outlier_{item.get('price_vnd')}")

        if reasons:
            dropped.append({**item, "drop_reasons": reasons})
        else:
            pre_kept.append(item)

    logger.info("After Stage A (quality+price): %d kept, %d dropped", len(pre_kept), len(dropped))

    # Stage B: bỏ shop chuyên (cùng location cụ thể có quá nhiều tin)
    # Chỉ apply nếu location đủ chi tiết (có dấu phẩy = "Tỉnh/TP, Quận/Huyện")
    # Tin với location thô ("Hồ Chí Minh") hoặc rỗng được giữ nguyên
    def is_specific_location(loc: str) -> bool:
        return bool(loc and "," in loc and len(loc.split(",")) >= 2)

    specific_counter = Counter(
        item.get("location", "")
        for item in pre_kept
        if is_specific_location(item.get("location", ""))
    )
    shop_locations = {
        loc for loc, c in specific_counter.items() if c > max_per_location
    }

    after_b: list[dict[str, Any]] = []
    location_kept_count: dict[str, int] = defaultdict(int)
    for item in pre_kept:
        loc = item.get("location", "")
        if loc in shop_locations:
            if location_kept_count[loc] >= max_per_location:
                dropped.append({**item, "drop_reasons": [f"shop_overflow_{loc}"]})
                continue
            location_kept_count[loc] += 1
        after_b.append(item)

    logger.info(
        "After Stage B (shop limit): %d kept, %d shop locations flagged",
        len(after_b),
        len(shop_locations),
    )

    # Stage C: dedup ảnh bằng pHash
    hash_to_listing: dict[int, str] = {}  # hash -> first listing source_id seeing it
    listing_dup_count: dict[str, int] = defaultdict(int)
    listing_total_count: dict[str, int] = defaultdict(int)

    logger.info("Computing pHash for %d listings...", len(after_b))
    for item in after_b:
        sid = item["source_id"]
        for fname in item["image_paths"]:
            listing_total_count[sid] += 1
            h = phash(IMAGES_DIR / fname)
            if h is None:
                continue

            duplicate_found = False
            for existing_h, owner in hash_to_listing.items():
                if owner == sid:
                    continue
                if hamming(existing_h, h) <= dup_distance:
                    duplicate_found = True
                    listing_dup_count[sid] += 1
                    break

            if not duplicate_found:
                hash_to_listing[h] = sid

    for item in after_b:
        sid = item["source_id"]
        total = listing_total_count[sid]
        dups = listing_dup_count[sid]
        ratio = dups / total if total else 0
        if ratio >= dup_image_ratio_drop:
            dropped.append({**item, "drop_reasons": [f"image_repost_ratio_{ratio:.2f}"]})
        else:
            kept.append(item)

    logger.info("After Stage C (dedup): %d kept, %d dropped (final)", len(kept), len(dropped))
    return kept, dropped


def write_jsonl(items: list[dict[str, Any]], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for item in items:
            f.write(json.dumps(item, ensure_ascii=False, default=str) + "\n")


def summarize(kept: list[dict[str, Any]], dropped: list[dict[str, Any]]) -> None:
    print("\n=== FILTER SUMMARY ===")
    print(f"Total in:    {len(kept) + len(dropped)}")
    print(f"Kept:        {len(kept)}")
    print(f"Dropped:     {len(dropped)}")

    drop_reasons: Counter[str] = Counter()
    for item in dropped:
        for r in item.get("drop_reasons", ["unknown"]):
            base = r.split("_")[0] + "_" + r.split("_")[1] if "_" in r else r
            drop_reasons[base] += 1
    print("\nDrop reason breakdown:")
    for reason, count in drop_reasons.most_common():
        print(f"  {reason:30s}: {count}")

    gen_kept: Counter[str] = Counter(
        item.get("detected_generation") or "no_gen" for item in kept
    )
    print("\nKept by generation:")
    for gen, count in sorted(gen_kept.items()):
        print(f"  {gen:14s}: {count}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sources", nargs="+", default=["chotot", "tgdd"])
    parser.add_argument("--min-images", type=int, default=2)
    parser.add_argument("--max-per-location", type=int, default=30)
    parser.add_argument("--dup-distance", type=int, default=5,
                        help="Hamming distance ngưỡng coi là ảnh trùng (0=identical, 5=tương đối lỏng)")
    parser.add_argument("--dup-ratio-drop", type=float, default=0.6,
                        help="Listing có >=X% ảnh trùng với listing khác sẽ bị bỏ")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    listings = load_listings(args.sources)
    if not listings:
        logger.error("No listings found. Did you run scrape first?")
        return

    logger.info("Loaded %d listings from %s", len(listings), args.sources)

    kept, dropped = filter_pipeline(
        listings,
        min_images=args.min_images,
        max_per_location=args.max_per_location,
        dup_distance=args.dup_distance,
        dup_image_ratio_drop=args.dup_ratio_drop,
    )

    write_jsonl(kept, FILTERED_DIR / "clean.jsonl")
    write_jsonl(dropped, FILTERED_DIR / "dropped.jsonl")

    summarize(kept, dropped)
    print(f"\nClean file:   {FILTERED_DIR / 'clean.jsonl'}")
    print(f"Dropped file: {FILTERED_DIR / 'dropped.jsonl'}")


if __name__ == "__main__":
    main()
