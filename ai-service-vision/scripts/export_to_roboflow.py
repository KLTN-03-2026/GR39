"""
Chuẩn bị dataset đã filter để upload lên Roboflow.

Output: data/labeled/roboflow_upload/
- images/ : copy ảnh đã filter sang đây
- annotations.coco.json : format COCO chứa pre-label damage box từ Gemini

Roboflow chấp nhận COCO format → import 1 click. Nó sẽ hiện damage box gợi ý
khi bạn label thủ công, bạn chỉ cần verify/adjust thay vì vẽ từ đầu.

Generation class (gen_6 → gen_17) KHÔNG export ở đây vì Gemini không tin được
cho việc nhận diện model — bạn label generation tay trên Roboflow.

Usage:
    python -m scripts.export_to_roboflow
    python -m scripts.export_to_roboflow --copy-images   # copy ảnh sang folder mới (mặc định symlink)
"""

from __future__ import annotations

import argparse
import json
import logging
import shutil
from pathlib import Path
from typing import Any

from scripts.utils import DATA_DIR, IMAGES_DIR

logger = logging.getLogger(__name__)

FILTERED_DIR = DATA_DIR / "filtered"
LABELED_DIR = DATA_DIR / "labeled"
UPLOAD_DIR = LABELED_DIR / "roboflow_upload"

DAMAGE_CLASSES = ["crack", "scratch", "dent"]


def load_prelabels() -> dict[str, dict[str, Any]]:
    """Map image_filename -> prelabel record."""
    path = FILTERED_DIR / "prelabel_damage.jsonl"
    if not path.exists():
        logger.warning("No prelabel file found at %s — exporting without damage hints", path)
        return {}
    out: dict[str, dict[str, Any]] = {}
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rec = json.loads(line)
                out[rec["image_filename"]] = rec
    return out


def load_clean_listings() -> list[dict[str, Any]]:
    path = FILTERED_DIR / "clean.jsonl"
    if not path.exists():
        raise FileNotFoundError(f"Run filter_data.py first: missing {path}")
    listings: list[dict[str, Any]] = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                listings.append(json.loads(line))
    return listings


def select_best_images(
    fnames: list[str],
    prelabels: dict[str, dict[str, Any]],
    max_per_listing: int,
) -> list[str]:
    """
    Chọn top-N ảnh tốt nhất từ 1 listing.

    Ưu tiên:
    1. Ảnh có damage detection (Gemini đã flag) — quan trọng cho train damage
    2. Ảnh size lớn (>= 800px chiều ngắn nhất)
    3. Skip ảnh đầu (thường là cover/banner)
    """
    if max_per_listing <= 0 or len(fnames) <= max_per_listing:
        return fnames

    scored: list[tuple[float, str]] = []
    for idx, fname in enumerate(fnames):
        score = 0.0
        prelabel = prelabels.get(fname)

        if prelabel and prelabel["detections"]:
            score += 100  # damage = ưu tiên cao nhất

        if prelabel:
            min_dim = min(prelabel.get("width", 0), prelabel.get("height", 0))
            if min_dim >= 800:
                score += 10
            elif min_dim >= 500:
                score += 5

        if idx == 0:
            score -= 5  # ảnh cover thường ít info

        scored.append((score, fname))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [f for _, f in scored[:max_per_listing]]


def build_coco(
    listings: list[dict[str, Any]],
    prelabels: dict[str, dict[str, Any]],
    images_out_dir: Path,
    copy_images: bool,
    max_images_per_listing: int = 0,
) -> dict[str, Any]:
    images_out_dir.mkdir(parents=True, exist_ok=True)

    categories = [
        {"id": i + 1, "name": cls, "supercategory": "damage"}
        for i, cls in enumerate(DAMAGE_CLASSES)
    ]
    cat_lookup = {c["name"]: c["id"] for c in categories}

    coco_images: list[dict[str, Any]] = []
    coco_annotations: list[dict[str, Any]] = []

    img_id = 1
    ann_id = 1

    for listing in listings:
        all_fnames = listing.get("image_paths", [])
        selected = select_best_images(all_fnames, prelabels, max_images_per_listing)

        for fname in selected:
            src = IMAGES_DIR / fname
            if not src.exists():
                continue
            dst = images_out_dir / fname

            if not dst.exists():
                if copy_images:
                    shutil.copy2(src, dst)
                else:
                    try:
                        dst.symlink_to(src.resolve())
                    except OSError:
                        # Windows non-admin fallback to copy
                        shutil.copy2(src, dst)

            prelabel = prelabels.get(fname)
            width = prelabel["width"] if prelabel else 0
            height = prelabel["height"] if prelabel else 0
            if width == 0 or height == 0:
                from PIL import Image as PIL
                with PIL.open(src) as im:
                    width, height = im.size

            coco_images.append(
                {
                    "id": img_id,
                    "file_name": fname,
                    "width": width,
                    "height": height,
                    "listing_id": listing["source_id"],
                    "claimed_generation": listing.get("detected_generation"),
                    "title": listing.get("title", ""),
                }
            )

            if prelabel:
                for det in prelabel["detections"]:
                    if det["label"] not in cat_lookup:
                        continue
                    x_min, y_min, x_max, y_max = det["bbox_pixels"]
                    w = max(0, x_max - x_min)
                    h = max(0, y_max - y_min)
                    if w < 5 or h < 5:
                        continue
                    coco_annotations.append(
                        {
                            "id": ann_id,
                            "image_id": img_id,
                            "category_id": cat_lookup[det["label"]],
                            "bbox": [x_min, y_min, w, h],
                            "area": w * h,
                            "iscrowd": 0,
                            "score": det.get("confidence", 0.5),
                        }
                    )
                    ann_id += 1

            img_id += 1

    return {
        "info": {
            "description": "iPhone pricing dataset — damage pre-label from Gemini Flash",
            "version": "0.1.0",
        },
        "licenses": [],
        "images": coco_images,
        "annotations": coco_annotations,
        "categories": categories,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--copy-images", action="store_true",
                        help="Copy ảnh thay vì symlink (an toàn hơn cho Windows non-admin)")
    parser.add_argument("--max-images-per-listing", type=int, default=2,
                        help="Số ảnh tối đa giữ lại mỗi listing (0 = giữ tất cả). "
                             "Default 2 để giảm khối lượng label thủ công.")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    listings = load_clean_listings()
    prelabels = load_prelabels()
    images_out = UPLOAD_DIR / "images"

    coco = build_coco(
        listings,
        prelabels,
        images_out,
        copy_images=args.copy_images,
        max_images_per_listing=args.max_images_per_listing,
    )

    coco_path = UPLOAD_DIR / "annotations.coco.json"
    with coco_path.open("w", encoding="utf-8") as f:
        json.dump(coco, f, ensure_ascii=False, indent=2)

    logger.info("Images:      %d → %s", len(coco["images"]), images_out)
    logger.info("Annotations: %d", len(coco["annotations"]))
    logger.info("Categories:  %s", [c["name"] for c in coco["categories"]])
    logger.info("COCO file:   %s", coco_path)
    logger.info("\nNext: zip thư mục %s và upload lên Roboflow", UPLOAD_DIR)


if __name__ == "__main__":
    main()
