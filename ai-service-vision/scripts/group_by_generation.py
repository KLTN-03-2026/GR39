"""
Re-organize ảnh đã export sang Roboflow thành 9 folder theo generation.

Lý do: Roboflow upload theo batch — group theo generation giúp người label biết
trước class generation, chỉ cần focus vẽ box + label damage. Tốc độ tăng 3x.

Mapping: dùng `detected_generation` từ clean.jsonl, áp lên image_paths của listing.

Input:  data/filtered/clean.jsonl (đã có detected_generation)
        data/labeled/roboflow_upload/images/ (5816 ảnh đã export)
Output: data/labeled/roboflow_upload_grouped/<gen>/...

Usage:
    python -m scripts.group_by_generation
"""

from __future__ import annotations

import argparse
import json
import logging
import shutil
from collections import Counter
from pathlib import Path

from scripts.utils import DATA_DIR

logger = logging.getLogger(__name__)

FILTERED_DIR = DATA_DIR / "filtered"
ROBOFLOW_FLAT_DIR = DATA_DIR / "labeled" / "roboflow_upload" / "images"
ROBOFLOW_GROUPED_DIR = DATA_DIR / "labeled" / "roboflow_upload_grouped"


def load_image_to_generation_map() -> dict[str, str]:
    """Đọc clean.jsonl → map filename → detected_generation."""
    clean_path = FILTERED_DIR / "clean.jsonl"
    if not clean_path.exists():
        raise FileNotFoundError(f"Run filter_data.py first: missing {clean_path}")

    img_to_gen: dict[str, str] = {}
    with clean_path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            gen = obj.get("detected_generation") or "no_gen"
            for fname in obj.get("image_paths", []):
                img_to_gen[fname] = gen
    return img_to_gen


def group(use_symlink: bool = False) -> None:
    img_to_gen = load_image_to_generation_map()
    flat_files = list(ROBOFLOW_FLAT_DIR.glob("*.jpg"))

    logger.info("Found %d flat images in %s", len(flat_files), ROBOFLOW_FLAT_DIR)
    logger.info("Mapping covers %d filenames", len(img_to_gen))

    counts: Counter[str] = Counter()
    not_found = 0

    for src in flat_files:
        gen = img_to_gen.get(src.name, "no_gen")
        target_dir = ROBOFLOW_GROUPED_DIR / gen
        target_dir.mkdir(parents=True, exist_ok=True)
        dst = target_dir / src.name

        if dst.exists():
            counts[gen] += 1
            continue

        try:
            if use_symlink:
                dst.symlink_to(src.resolve())
            else:
                shutil.copy2(src, dst)
            counts[gen] += 1
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to place %s: %s", src.name, exc)
            not_found += 1

    print("\n=== Grouping complete ===")
    print(f"Output: {ROBOFLOW_GROUPED_DIR}\n")
    total = 0
    for gen in sorted(counts.keys()):
        count = counts[gen]
        total += count
        bar = "█" * int(count / max(counts.values()) * 30) if counts else ""
        print(f"  {gen:14s}: {count:5d}  {bar}")
    print(f"\nTotal: {total} files")
    if not_found:
        print(f"Failed: {not_found} files")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symlink", action="store_true",
                        help="Dùng symlink thay vì copy (nhanh hơn, tiết kiệm disk)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    group(use_symlink=args.symlink)


if __name__ == "__main__":
    main()
