#!/usr/bin/env python3
"""Compare two 400x300 1-bit frames supplied as PNGs or raw framebuffers."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from PIL import Image, ImageChops


WIDTH = 400
HEIGHT = 300
ROW_BYTES = WIDTH // 8
FRAME_BYTES = ROW_BYTES * HEIGHT


def _parse_region(value: str) -> tuple[int, int, int, int]:
    try:
        x, y, width, height = (int(part) for part in value.split(","))
    except (TypeError, ValueError):
        raise argparse.ArgumentTypeError("region must be x,y,w,h") from None
    if width <= 0 or height <= 0:
        raise argparse.ArgumentTypeError("region width and height must be positive")
    if x < 0 or y < 0 or x + width > WIDTH or y + height > HEIGHT:
        raise argparse.ArgumentTypeError(f"region must fit inside {WIDTH}x{HEIGHT}")
    return x, y, width, height


def _raw_to_image(data: bytes, one_is_white: bool, msb_first: bool) -> Image.Image:
    if len(data) != FRAME_BYTES:
        raise ValueError(f"raw framebuffer must be exactly {FRAME_BYTES} bytes, got {len(data)}")
    pixels = bytearray(FRAME_BYTES)
    for byte_index, value in enumerate(data):
        decoded = 0
        for pixel_index in range(8):
            source_bit = 7 - pixel_index if msb_first else pixel_index
            bit = (value >> source_bit) & 1
            white = bit == 1 if one_is_white else bit == 0
            if white:
                decoded |= 1 << (7 - pixel_index)
        pixels[byte_index] = decoded
    return Image.frombytes("1", (WIDTH, HEIGHT), bytes(pixels))


def load_frame(path: Path, one_is_white: bool = True, msb_first: bool = True) -> Image.Image:
    if path.suffix.lower() == ".bin":
        return _raw_to_image(path.read_bytes(), one_is_white, msb_first)
    try:
        with Image.open(path) as source:
            if source.size != (WIDTH, HEIGHT):
                raise ValueError(f"PNG must be {WIDTH}x{HEIGHT}, got {source.size[0]}x{source.size[1]}")
            grayscale = source.convert("L")
            return grayscale.point(lambda value: 255 if value >= 128 else 0, mode="1")
    except Image.UnidentifiedImageError as error:
        raise ValueError(f"input must be a PNG or a {FRAME_BYTES}-byte .bin framebuffer") from error


def compare_frames(first: Image.Image, second: Image.Image) -> tuple[int, tuple[int, int, int, int] | None, Image.Image]:
    diff = ImageChops.logical_xor(first, second)
    count = sum(1 for value in diff.get_flattened_data() if value)
    bounds = diff.getbbox()
    return count, bounds, diff


def _count_in_region(diff: Image.Image, region: tuple[int, int, int, int]) -> tuple[int, int]:
    x, y, width, height = region
    inside = sum(1 for value in diff.crop((x, y, x + width, y + height)).get_flattened_data() if value)
    total = sum(1 for value in diff.get_flattened_data() if value)
    return inside, total - inside


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("first", type=Path)
    parser.add_argument("second", type=Path)
    parser.add_argument(
        "--polarity",
        choices=("white", "black"),
        default="white",
        help="meaning of a 1 bit in raw inputs (default: white)",
    )
    order = parser.add_mutually_exclusive_group()
    order.add_argument("--msb-first", dest="msb_first", action="store_true", default=True,
                       help="decode raw bytes most-significant bit first (default)")
    order.add_argument("--lsb-first", dest="msb_first", action="store_false",
                       help="decode raw bytes least-significant bit first")
    parser.add_argument("--region", type=_parse_region, metavar="X,Y,W,H")
    parser.add_argument("--out", type=Path, help="write a 1-bit PNG with differing pixels in black")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        first = load_frame(args.first, args.polarity == "white", args.msb_first)
        second = load_frame(args.second, args.polarity == "white", args.msb_first)
    except (OSError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    count, bounds, diff = compare_frames(first, second)
    print(f"Differing pixels: {count}")
    if bounds is None:
        print("Bounding box: none")
    else:
        left, top, right, bottom = bounds
        print(f"Bounding box: {left},{top},{right - left},{bottom - top}")
    if args.region:
        inside, outside = _count_in_region(diff, args.region)
        print(f"Region differences: {inside}")
        print(f"Outside-region differences: {outside}")
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        ImageChops.invert(diff.convert("L")).convert("1").save(args.out)
    return 0 if count == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
