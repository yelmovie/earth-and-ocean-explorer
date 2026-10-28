# Extract generated facility atlas and align transparent sprites to one foot anchor.
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
im=Image.open(root/'references/generated/facilities-atlas.png').convert('RGBA')
manifest={'source':'references/generated/facilities-atlas.png','size':[512,512],'pivot':[256,440],'sprites':[]}
for i in range(5):
 col=i%3; row=i//3
 box=[(0,0,512,498),(512,0,1024,540),(1024,0,1536,560),(0,498,512,1024),(512,540,1024,1024)][i]
 tile=im.crop(box)
 alpha=tile.getchannel('A')
 bounds=alpha.point(lambda a:255 if a>=128 else 0).getbbox()
 content=tile.crop(bounds)
 ratio=min(432/content.width,424/content.height)
 content=content.resize((round(content.width*ratio),round(content.height*ratio)),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(512,512),(0,0,0,0))
 out.alpha_composite(content,((512-content.width)//2,440-content.height))
 dest=root/'public/assets'/('facility-'+str(i+1)+'.webp')
 out.save(dest,'WEBP',quality=95,method=4)
 manifest['sprites'].append({'stage':i+1,'file':dest.name,'sourceCrop':box,'alphaBounds':bounds,'bytes':dest.stat().st_size})
(root/'public/assets/facilities-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(manifest,ensure_ascii=False))
