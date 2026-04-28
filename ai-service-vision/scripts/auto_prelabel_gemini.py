"""
Pre-label damage bounding boxes bằng Gemini Flash.

Mục đích: Mỗi ảnh trong dataset clean → gọi Gemini Vision với prompt detect
crack/scratch/dent → nhận bbox (đã normalize 0-1000 theo Gemini convention) →
convert về pixel → lưu thành JSON để import vào Roboflow.

LƯU Ý:
- Gemini KHÔNG dùng để gán generation (do sycophancy). Chỉ gán damage.
- Output là gợi ý — phải verify bằng tay khi label trên Roboflow.
- Cost ước tính: 15.000 ảnh × $0.0001 (Flash) ≈ $1.50

Usage:
    export GEMINI_API_KEY=...        # set trong .env
    python -m scripts.auto_prelabel_gemini --limit 100 --concurrency 4
    python -m scripts.auto_prelabel_gemini --resume    # tiếp tục nếu đã có cache
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any

from PIL import Image

from scripts.utils import DATA_DIR, IMAGES_DIR

logger = logging.getLogger(__name__)

FILTERED_DIR = DATA_DIR / "filtered"
PRELABEL_PATH = FILTERED_DIR / "prelabel_damage.jsonl"

PROMPT = """You are labeling images for an iPhone damage detection dataset.
Look at this image of a phone (or part of one). Identify VISIBLE physical damage and return STRICT JSON only.

Schema:
{
  "detections": [
    {
      "label": "crack" | "scratch" | "dent",
      "box_2d": [ymin, xmin, ymax, xmax],
      "confidence": 0.0-1.0
    }
  ]
}

Rules:
- box_2d coordinates are NORMALIZED to [0, 1000] range (Gemini convention)
- Only label damage VISIBLE on the phone body or screen
- Skip stickers, dust, reflections, fingerprints, screen content
- "crack" = visible fracture line (screen or back glass)
- "scratch" = surface abrasion
- "dent" = deformation on metal frame/body edges
- If no damage visible, return: {"detections": []}
- Return ONLY the JSON, no markdown, no explanation
"""

GEMINI_MODEL = "gemini-2.5-flash-lite"  # free tier rộng nhất + đủ tốt cho pre-label damage


def load_clean_listings() -> list[dict[str, Any]]:
    if not (FILTERED_DIR / "clean.jsonl").exists():
        raise FileNotFoundError("Run filter_data.py first to produce clean.jsonl")
    items: list[dict[str, Any]] = []
    with (FILTERED_DIR / "clean.jsonl").open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                items.append(json.loads(line))
    return items


def load_already_labeled() -> set[str]:
    """Set of image filenames đã có pre-label (resume)."""
    if not PRELABEL_PATH.exists():
        return set()
    seen: set[str] = set()
    with PRELABEL_PATH.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                seen.add(json.loads(line)["image_filename"])
    return seen


def normalize_to_pixels(box_2d: list[float], width: int, height: int) -> list[float]:
    """Convert Gemini [ymin, xmin, ymax, xmax] in 0-1000 → [x_min, y_min, x_max, y_max] pixels."""
    if len(box_2d) != 4:
        raise ValueError(f"Invalid box_2d: {box_2d}")
    ymin, xmin, ymax, xmax = box_2d
    return [
        round(xmin / 1000 * width, 1),
        round(ymin / 1000 * height, 1),
        round(xmax / 1000 * width, 1),
        round(ymax / 1000 * height, 1),
    ]


async def label_image(
    client: Any,
    image_path: Path,
    semaphore: asyncio.Semaphore,
) -> dict[str, Any] | None:
    async with semaphore:
        try:
            with Image.open(image_path) as img:
                width, height = img.size
                if img.mode != "RGB":
                    img = img.convert("RGB")
                from io import BytesIO
                buf = BytesIO()
                img.save(buf, format="JPEG", quality=85)
                image_bytes = buf.getvalue()

            response = await asyncio.to_thread(
                client.generate_content,
                [
                    PROMPT,
                    {"mime_type": "image/jpeg", "data": image_bytes},
                ],
            )
            text = response.text.strip()
            if text.startswith("```"):
                text = text.strip("`").lstrip("json").strip()
            data = json.loads(text)

            detections = []
            for d in data.get("detections", []):
                try:
                    pixels = normalize_to_pixels(d["box_2d"], width, height)
                    detections.append(
                        {
                            "label": d["label"],
                            "bbox_pixels": pixels,
                            "confidence": float(d.get("confidence", 0.5)),
                        }
                    )
                except (KeyError, ValueError) as e:
                    logger.debug("Skip invalid detection %s: %s", d, e)

            return {
                "image_filename": image_path.name,
                "width": width,
                "height": height,
                "detections": detections,
            }
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed %s: %s", image_path.name, exc)
            return None


async def run(limit: int, concurrency: int, resume: bool) -> None:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        logger.error("GEMINI_API_KEY not set. Get one at https://aistudio.google.com/app/apikey")
        return

    try:
        import google.generativeai as genai
    except ImportError:
        logger.error("Run: pip install google-generativeai")
        return

    genai.configure(api_key=api_key)
    client = genai.GenerativeModel(GEMINI_MODEL)

    listings = load_clean_listings()
    all_image_files: list[Path] = []
    for item in listings:
        for fname in item.get("image_paths", []):
            all_image_files.append(IMAGES_DIR / fname)

    seen = load_already_labeled() if resume else set()
    todo = [p for p in all_image_files if p.name not in seen]
    if limit > 0:
        todo = todo[:limit]

    logger.info(
        "Total images: %d, already labeled: %d, todo this run: %d",
        len(all_image_files),
        len(seen),
        len(todo),
    )
    if not todo:
        logger.info("Nothing to do.")
        return

    semaphore = asyncio.Semaphore(concurrency)
    PRELABEL_PATH.parent.mkdir(parents=True, exist_ok=True)

    completed = 0
    has_damage = 0
    with PRELABEL_PATH.open("a", encoding="utf-8") as fout:
        tasks = [label_image(client, p, semaphore) for p in todo]
        for coro in asyncio.as_completed(tasks):
            result = await coro
            if result is None:
                continue
            fout.write(json.dumps(result, ensure_ascii=False) + "\n")
            fout.flush()
            completed += 1
            if result["detections"]:
                has_damage += 1
            if completed % 50 == 0:
                logger.info(
                    "Progress: %d/%d (%.0f%%), with damage: %d",
                    completed,
                    len(todo),
                    completed / len(todo) * 100,
                    has_damage,
                )

    logger.info("Done. Total labeled: %d, with damage detected: %d", completed, has_damage)
    logger.info("Output: %s", PRELABEL_PATH)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=200,
                        help="Max images to label this run (0=all)")
    parser.add_argument("--concurrency", type=int, default=4,
                        help="Parallel API calls (Gemini Flash limit ~10 RPS)")
    parser.add_argument("--resume", action="store_true",
                        help="Skip images already in prelabel_damage.jsonl")
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.debug else logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
    )

    asyncio.run(run(limit=args.limit, concurrency=args.concurrency, resume=args.resume))


if __name__ == "__main__":
    main()
