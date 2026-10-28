"""OFL derivatives with new internal names, covering the game's actual copy."""
from pathlib import Path
import sys
from fontTools import subset
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[1]
chars=''.join(p.read_text(encoding='utf-8') for p in (root/'src').glob('*') if p.suffix in ['.js','.css'])
chars+=''.join(chr(i) for i in range(32,256))+'✓○●→←↑↓↶↷＋⌕✧≋▰'
specs=[('Jua-Regular.ttf','BluePlanetDisplay','Regular'),('Pretendard-Regular.woff2','BluePlanetBody','Regular'),('Pretendard-Bold.woff2','BluePlanetBody','Bold')]
if len(sys.argv)>1:
 specs=[spec for spec in specs if spec[0]==sys.argv[1]]
 if not specs:raise SystemExit('Unknown source font')
for original,family,style in specs:
 src=root/'assets/font-sources'/original
 src.parent.mkdir(exist_ok=True)
 public=root/'public/assets/fonts'/original
 if not src.exists():src.write_bytes(public.read_bytes())
 font=TTFont(src)
 options=subset.Options();options.flavor='woff2';options.layout_features=['*']
 sub=subset.Subsetter(options=options);sub.populate(text=chars);sub.subset(font)
 for platform,encoding,lang in [(3,1,0x409),(1,0,0)]:
  for name_id,value in [(1,family),(2,style),(3,family+'-'+style),(4,family+' '+style),(6,family+'-'+style),(16,family),(17,style)]:
   font['name'].setName(value,name_id,platform,encoding,lang)
 font.flavor='woff2';dest=root/'public/assets/fonts'/f'{family}-{style}.woff2';font.save(dest)
 print(dest.name,dest.stat().st_size)
