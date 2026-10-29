import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

source, output, family, charset_file = sys.argv[1:]
charset = set(json.loads(Path(charset_file).read_text()))
options = subset.Options()
options.flavor = "woff2"
options.recalc_timestamp = False
options.layout_features = ["*"]
font = subset.load_font(source, options)
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
