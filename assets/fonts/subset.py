import json
import sys
import unicodedata
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.pens.boundsPen import BoundsPen

source, output, family, charset_file = sys.argv[1:]
charset = set(json.loads(Path(charset_file).read_text()))
options = subset.Options()
options.flavor = "woff2"
options.recalc_timestamp = False
options.layout_features = ["*"]
font = subset.load_font(source, options)
glyphs = font.getGlyphSet()
empty = set()
for point, name in font.getBestCmap().items():
    if point not in charset or unicodedata.category(chr(point))[0] not in "LNPS":
        continue
    pen = BoundsPen(glyphs)
    glyphs[name].draw(pen)
    if pen.bounds is None:
        empty.add(point)
# Omit falsely supported blank glyphs so browser and canvas font fallback can work.
for table in font["cmap"].tables:
    if table.isUnicode():
        for point in empty:
            table.cmap.pop(point, None)
attribution = "\n".join(dict.fromkeys(record.toUnicode() for record in font["name"].names if record.nameID in {0, 8, 9, 11, 13, 14})).replace("*/", "* /")
expected = charset & font.getBestCmap().keys()
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=charset)
subsetter.subset(font)
destination = Path(output)
destination.mkdir(parents=True, exist_ok=True)
subset.save_font(font, str(destination / "font.woff2"), options)
with TTFont(destination / "font.woff2") as result:
    actual = set(result.getBestCmap())
assert expected <= actual, f"{family}: lost glyphs {expected - actual}"
assert not empty & actual, f"{family}: blank glyph mappings survived subsetting"
ranges = []
for codepoint in sorted(actual):
    if ranges and ranges[-1][1] + 1 == codepoint:
        ranges[-1][1] = codepoint
    else:
        ranges.append([codepoint, codepoint])
unicodes = ",".join(f"U+{start:X}" if start == end else f"U+{start:X}-{end:X}" for start, end in ranges)
(destination / "result.css").write_text(
    f'/* {attribution} */\n@font-face{{font-family:{json.dumps(family, ensure_ascii=False)};src:url("./font.woff2") format("woff2");font-display:swap;unicode-range:{unicodes};}}\n'
)
print(f"{family}: verified {len(expected)} glyphs, {len(charset - actual)} unsupported codepoints use fallback")
if empty:
    print(f"{family}: empty glyphs use fallback: {''.join(chr(point) for point in sorted(empty))}")
