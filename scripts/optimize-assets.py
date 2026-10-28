# Non-destructive conversion with verification and atomic final file replacement.
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
for p in (root/'public'/'assets').glob('*.png'):
 dest=p.with_suffix('.webp')
 if dest.exists():
  try:
   with Image.open(dest) as check: check.verify()
   continue
  except Exception: pass
 with Image.open(p) as im:
  temp=dest.with_suffix('.tmp.webp')
  im.save(temp,'WEBP',quality=90,method=4)
 with Image.open(temp) as check: check.verify()
 temp.replace(dest)
 print(p.name,p.stat().st_size,dest.stat().st_size,flush=True)
