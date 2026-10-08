"""Verify T24 changes only daily temperatures against an extracted base export tree.

Usage: python design/test/check-t24-rebaseline.py /path/to/base/exports
"""
from pathlib import Path
import subprocess
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
BEFORE = Path(sys.argv[1])
FRAMES = [f'normal/normal-{name}.png' for name in ('summer', 'winter', 'spring', 'widths', 'night')]
FRAMES += ['states/state-setup.png', 'states/state-low-battery.png']

for name in FRAMES:
    old_path, new_path = BEFORE / name, ROOT / 'design/exports' / name
    with Image.open(old_path) as old, Image.open(new_path) as new:
        assert old.mode == new.mode == '1' and old.size == new.size == (400, 300), name
        old_pixels, new_pixels = list(old.get_flattened_data()), list(new.get_flattened_data())
    changed = [(i % 400, i // 400) for i, (a, b) in enumerate(zip(old_pixels, new_pixels)) if a != b]
    outside = [(x, y) for x, y in changed if not (
        303 <= x < 396 and any(cy - 15 <= y < cy + 12 for cy in (126, 178, 230)))]
    assert not outside, f'{name}: differences outside daily text masks: {outside[:5]}'
    if name == 'states/state-setup.png':
        assert old_path.read_bytes() == new_path.read_bytes(), 'setup bytes changed'
    else:
        assert changed, f'{name}: expected low/high re-baseline difference missing'
    result = subprocess.run([sys.executable, str(ROOT / 'tools/framediff.py'),
                             str(old_path), str(new_path)], capture_output=True, text=True)
    assert result.returncode == (1 if changed else 0), result.stdout + result.stderr
    assert f'Differing pixels: {len(changed)}' in result.stdout, result.stdout
    print(f'{name}: changed={len(changed)}, outside=0, setup byte check={name.endswith("setup.png")}')

print('PASS: T24 differences confined to daily temperature masks; setup byte-identical.')
