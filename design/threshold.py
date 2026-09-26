"""Threshold every raw PNG in .build/raw to true 1-bit, write nearest-neighbor 3x previews, and validate.

Routing by file name:
  normal-<id>.png          -> exports/normal/    (canonical, checked by verify.py)
  state-<id>.png           -> exports/states/    (canonical, checked by verify.py)
  everything else          -> exports/archive/   (concepts, normal-6hour-*, normal-summer-logo*, audit)
Previews go to exports/preview@3x/ for canonical frames and exports/archive/preview@3x/ for archived ones.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent
raw = root / '.build/raw'
normal = root / 'exports/normal'
states = root / 'exports/states'
archive = root / 'exports/archive'
preview = root / 'exports/preview@3x'
archive_preview = archive / 'preview@3x'
for folder in (normal, states, archive, preview, archive_preview): folder.mkdir(parents=True, exist_ok=True)

HISTORICAL_PREFIXES = ('normal-6hour-', 'normal-summer-logo')

def route(name):
    if name.startswith(HISTORICAL_PREFIXES): return archive, archive_preview
    if name.startswith('normal-'): return normal, preview
    if name.startswith('state-'): return states, preview
    return archive, archive_preview

for input_file in sorted(raw.glob('*.png')):
    im = Image.open(input_file).convert('L')
    if im.size != (400, 300): raise ValueError((input_file, im.size))
    bw = im.point(lambda p: 255 if p >= 160 else 0).convert('1')
    target_dir, preview_dir = route(input_file.name)
    target = target_dir / input_file.name
    bw.save(target)
    bw.resize((1200, 900), Image.Resampling.NEAREST).save(preview_dir / input_file.name)
    colors = set(Image.open(target).convert('RGB').get_flattened_data())
    if colors != {(0,0,0),(255,255,255)}: raise ValueError((target, colors))
    print(f'{target.relative_to(root)}: {bw.size}, {sorted(colors)}')

for input_file in sorted((root / 'assets/icons').glob('*.png')):
    im = Image.open(input_file).convert('L')
    im.point(lambda p: 255 if p >= 160 else 0).convert('1').save(input_file)
