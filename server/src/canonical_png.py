"""Write the renderer's 1-bit PNG with the pinned Pillow export encoding."""

import sys
from PIL import Image


with Image.open(sys.stdin.buffer) as frame:
    if frame.mode != "1" or frame.size != (400, 300):
        raise ValueError("expected a 400x300 1-bit frame")
    frame.save(sys.stdout.buffer, format="PNG")
