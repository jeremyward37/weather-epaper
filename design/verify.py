"""Check selected 1-bit weather design exports and their review references.

Run after build.js and threshold.py: python3 design/verify.py
"""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parent
NORMAL_IDS = ('summer', 'winter', 'spring', 'widths', 'night')
STATE_IDS = ('setup', 'low-battery')
ICON_DIR = ROOT / 'assets/icons'


def check_icon_assets(build_all=False):
    markdown = (ROOT / 'icon-map.md').read_text()
    mapping = markdown.split('| Condition | Day source | Night source |\n', 1)[1].split('**Gaps:**', 1)[0]
    mapped_sources = set(re.findall(r'`(wi-[^`]+\.svg)`', mapping))
    manifest = markdown.split('## Firmware bitmap manifest\n', 1)[1].split('\n## ', 1)[0]
    rows = re.findall(r'^\| (Condition|Support) \| `([^`]+)` \| `([^`]+)` \| (\d+) \| `([^`]+)` \|$', manifest, re.M)
    assert len(rows) == 96, f'Icon manifest: expected 96 rows, found {len(rows)}'
    expected = set()
    condition_sizes = {}
    support_sizes = {}
    for kind, filename, name, dimension, source in rows:
        size = int(dimension)
        assert filename == f'{name}-{size}.png', f'Icon manifest mismatch: {filename}'
        assert (ROOT / 'assets/source' / source).is_file(), f'Missing icon source: {source}'
        expected.add(filename)
        sizes = condition_sizes if kind == 'Condition' else support_sizes
        sizes.setdefault(name, set()).add(size)
    assert len(expected) == len(rows), 'Duplicate icon manifest filename'
    assert len(condition_sizes) == 30, f'Expected 30 conditions, found {len(condition_sizes)}'
    manifested_sources = {source for kind, _, _, _, source in rows if kind == 'Condition'}
    assert manifested_sources == mapped_sources, f'Condition source mapping mismatch: {sorted(mapped_sources ^ manifested_sources)}'
    assert all(sizes == {32, 36, 66} for sizes in condition_sizes.values()), f'Incomplete condition sizes: {condition_sizes}'
    assert support_sizes == {'dawn': {30}, 'dusk': {30}, 'refresh': {14},
                             'lowBattery': {14}, 'logo': {20, 64}}, f'Support sizes: {support_sizes}'
    actual = {path.name for path in ICON_DIR.iterdir()}
    assert expected <= actual, f'Missing firmware bitmaps: {sorted(expected - actual)}'
    if not build_all:
        assert actual == expected, f'Unexpected firmware assets: {sorted(actual - expected)}'
    for filename in actual:
        path = ICON_DIR / filename
        assert path.is_file() and path.suffix == '.png', f'Unexpected icon entry: {path}'
        with Image.open(path) as icon:
            assert icon.mode == '1', f'{path}: icon asset is not 1-bit'
            if filename in expected:
                size = int(filename.rsplit('-', 1)[1].removesuffix('.png'))
                assert icon.size == (size, size), f'{path}: size {icon.size}'
            assert set(icon.convert('L').get_flattened_data()) == {0, 255}, f'{path}: extra colors or blank icon'
    return len(expected), len(actual)


class ImageReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.paths.append(dict(attrs)['src'])


def ink_box(image, bounds):
    x0, y0, x1, y1 = bounds
    crop = ImageOps.invert(image.crop(bounds))
    box = crop.getbbox()
    return None if box is None else (x0 + box[0], y0 + box[1], x0 + box[2] - 1, y0 + box[3] - 1)


def aligned(boxes, cy, label):
    centers = [(box[1] + box[3]) / 2 for box in boxes if box]
    assert centers, f'{label}: no visible ink'
    assert all(abs(center - cy) <= .5 for center in centers), f'{label}: {centers} vs {cy}'


def check_rows(image, label):
    hourly_centers = (121, 161, 201, 241)
    daily_centers = (126, 178, 230)
    smallest_gap = 400
    for i, cy in enumerate(hourly_centers):
        boxes = [ink_box(image, (x0, cy-18, x1, cy+18)) for x0, x1 in
                 ((8, 66), (70, 118), (119, 152), (164, 205))]
        aligned(boxes, cy, f'{label} hourly {i}')
        for left, right in zip(boxes, boxes[1:]):
            if left and right:
                gap = right[0] - left[2] - 1
                smallest_gap = min(smallest_gap, gap)
                assert gap >= 5, f'{label} hourly {i}: {gap}px horizontal gap'
    for i, cy in enumerate(daily_centers):
        boxes = [ink_box(image, (218, cy-15, 258, cy+13)),
                 ink_box(image, (260, cy-19, 297, cy+19)),
                 ink_box(image, (303, cy-15, 395, cy+12))]
        aligned(boxes, cy, f'{label} daily {i}')
    return smallest_gap


def check_png(path):
    with Image.open(path) as original:
        assert original.size == (400, 300), f'{path}: size {original.size}'
        assert original.mode == '1', f'{path}: mode {original.mode}'
        image = original.convert('L')
    assert set(image.get_flattened_data()) == {0, 255}, f'{path}: extra colors'
    box = ImageOps.invert(image).getbbox()
    assert box and box[0] >= 4 and box[1] >= 4 and box[2] <= 396 and box[3] <= 296, f'{path}: safe margin {box}'
    preview = ROOT / 'exports/preview@3x' / path.name
    with Image.open(preview) as enlarged:
        assert enlarged.size == (1200, 900), f'{preview}: size {enlarged.size}'
        assert list(enlarged.convert('L').get_flattened_data()) == list(image.resize((1200, 900), Image.Resampling.NEAREST).get_flattened_data()), f'{preview}: not nearest-neighbor'
    return image


def main():
    assert sys.argv[1:] in ([], ['--all']), f'Unknown verify arguments: {sys.argv[1:]}'
    expected_icons, actual_icons = check_icon_assets('--all' in sys.argv)
    refs = ImageReferences()
    refs.feed((ROOT / 'index.html').read_text())
    missing = [ref for ref in refs.paths if not (ROOT / ref).is_file()]
    assert not missing, f'Broken review image references: {missing}'

    min_gap = 400
    for identifier in NORMAL_IDS:
        path = ROOT / 'exports/normal' / f'normal-{identifier}.png'
        image = check_png(path)
        aligned([ink_box(image, (10, 10, 76, 93)), ink_box(image, (82, 10, 244, 93))], 55, f'{identifier} current')
        aligned([ink_box(image, (255, 45, 285, 86)), ink_box(image, (286, 45, 395, 86))], 64, f'{identifier} sun')
        min_gap = min(min_gap, check_rows(image, identifier))
        aligned([ink_box(image, (7, 275, 22, 298)), ink_box(image, (27, 275, 130, 298)), ink_box(image, (375, 275, 395, 298))], 285.5, f'{identifier} footer')
        svg = (ROOT / '.build/svg' / f'normal-{identifier}.svg').read_text()
        for forbidden in ('CURRENT', 'NEXT 6 HOURS', 'NEXT 5 DAYS', 'Marriott-Slaterville'):
            assert forbidden not in svg, f'{identifier}: obsolete field {forbidden}'
        fixture = json.loads((ROOT / 'fixtures' / f'normal-{identifier}.json').read_text())
        assert len(fixture['threeHourly']) == 4 and len(fixture['daily']) == 3

    for identifier in STATE_IDS:
        image = check_png(ROOT / 'exports/states' / f'state-{identifier}.png')
        if identifier != 'setup':
            min_gap = min(min_gap, check_rows(image, identifier))
        if identifier == 'low-battery':
            assert ink_box(image, (136, 275, 150, 298)), f'{identifier}: low-battery glyph missing'


    print(f'PASS: 5 normal and 2 state exports, {len(refs.paths)} review images, {expected_icons} firmware bitmaps ({actual_icons} assets in this build), 1-bit assets, 4 px margins, pixel-center alignment, and >= {min_gap} px hourly gaps.')


if __name__ == '__main__':
    main()
