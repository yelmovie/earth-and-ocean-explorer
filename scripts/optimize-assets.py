# Non-destructive conversion with verification and atomic final file replacement.
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
# PNG originals live outside public/ so they never ship; outputs go to public/assets.
for p in (root/'assets'/'source-png').glob('*.png'):
 dest=root/'public'/'assets'/(p.stem+'.webp')
 if dest.exists():
  try:
   with Image.open(dest) as check: check.verify()
   continue
  except Exception: pass
 with Image.open(p) as im:
  temp=dest.with_name(dest.stem+'.tmp.webp')
  im.save(temp,'WEBP',quality=90,method=4)
 with Image.open(temp) as check: check.verify()
 temp.replace(dest)
 print(p.name,p.stat().st_size,dest.stat().st_size,flush=True)
