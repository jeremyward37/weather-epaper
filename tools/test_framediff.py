from __future__ import annotations

import contextlib
import io
from pathlib import Path
import tempfile
import unittest

from PIL import Image

from tools import framediff


def pack_raw(image: Image.Image, one_is_white: bool = True, msb_first: bool = True) -> bytes:
    monochrome = image.convert("1")
    packed = bytearray()
    for y in range(framediff.HEIGHT):
        for byte_x in range(framediff.ROW_BYTES):
            value = 0
            for pixel_index in range(8):
                white = monochrome.getpixel((byte_x * 8 + pixel_index, y)) != 0
                bit = white if one_is_white else not white
                destination_bit = 7 - pixel_index if msb_first else pixel_index
                value |= int(bit) << destination_bit
            packed.append(value)
    return bytes(packed)


class FrameDiffTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.white = Image.new("1", (framediff.WIDTH, framediff.HEIGHT), 1)
        self.marked = self.white.copy()
        self.marked.putpixel((12, 34), 0)

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def run_cli(self, *arguments: str) -> tuple[int, str]:
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            status = framediff.main(list(arguments))
        return status, output.getvalue()

    def test_png_vs_png_reports_pixel_and_bbox(self) -> None:
        first = self.root / "first.png"
        second = self.root / "second.png"
        out = self.root / "diff.png"
        self.white.save(first)
        self.marked.save(second)

        status, output = self.run_cli(str(first), str(second), "--out", str(out))

        self.assertEqual(status, 1)
        self.assertIn("Differing pixels: 1", output)
        self.assertIn("Bounding box: 12,34,1,1", output)
        self.assertEqual(out.read_bytes()[:8], b"\x89PNG\r\n\x1a\n")

    def test_raw_vs_png_defaults_to_one_white_msb_first(self) -> None:
        raw = self.root / "frame.bin"
        png = self.root / "frame.png"
        raw.write_bytes(pack_raw(self.marked))
        self.marked.save(png)

        status, output = self.run_cli(str(raw), str(png))

        self.assertEqual(status, 0)
        self.assertIn("Differing pixels: 0", output)

    def test_raw_black_polarity(self) -> None:
        raw = self.root / "frame.bin"
        png = self.root / "frame.png"
        raw.write_bytes(pack_raw(self.marked, one_is_white=False))
        self.marked.save(png)

        status, _ = self.run_cli(str(raw), str(png), "--polarity", "black")

        self.assertEqual(status, 0)

    def test_raw_lsb_first(self) -> None:
        raw = self.root / "frame.bin"
        png = self.root / "frame.png"
        raw.write_bytes(pack_raw(self.marked, msb_first=False))
        self.marked.save(png)

        status, _ = self.run_cli(str(raw), str(png), "--lsb-first")

        self.assertEqual(status, 0)

    def test_region_reports_inside_and_outside_separately(self) -> None:
        first = self.root / "first.png"
        second = self.root / "second.png"
        changed = self.marked.copy()
        changed.putpixel((200, 200), 0)
        self.white.save(first)
        changed.save(second)

        status, output = self.run_cli(str(first), str(second), "--region", "10,30,10,10")

        self.assertEqual(status, 1)
        self.assertIn("Region differences: 1", output)
        self.assertIn("Outside-region differences: 1", output)

    def test_rejects_wrong_raw_size(self) -> None:
        raw = self.root / "short.bin"
        png = self.root / "frame.png"
        raw.write_bytes(b"\0")
        self.white.save(png)

        with contextlib.redirect_stderr(io.StringIO()):
            status, _ = self.run_cli(str(raw), str(png))

        self.assertEqual(status, 2)


if __name__ == "__main__":
    unittest.main()
