import os,json,time
from pathlib import Path
os.environ['TEMP']=r'D:\DevTemp';os.environ['TMP']=r'D:\DevTemp'
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 samples=[];errors=[]
 for i in range(3):
  context=b.new_context(viewport={'width':1280,'height':800})
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None);page.on('response',lambda r:errors.append('HTTP '+str(r.status)+' '+r.url) if r.status>=400 else None)
  start=time.perf_counter();page.goto('http://127.0.0.1:4174',wait_until='networkidle')
  assert page.locator('h1').inner_text()=='푸른행성 조사본부'
  decoded=page.evaluate(r"""async()=>{const urls=new Set();for(const el of document.querySelectorAll('*')){for(const pseudo of [null,'::before','::after']){const css=getComputedStyle(el,pseudo).backgroundImage;for(const m of css.matchAll(/url\([\"']?([^\"')]+)[\"']?\)/g))urls.add(m[1]);}if(el.tagName==='IMG')urls.add(el.currentSrc);}await Promise.all([...urls].map(async url=>{const i=new Image();i.src=url;await i.decode();}));return [...urls]}""")
  assert any('characters.webp' in u for u in decoded) and any('home.webp' in u for u in decoded)
  metrics=page.evaluate("()=>{const n=performance.getEntriesByType('navigation')[0],r=performance.getEntriesByType('resource');return {loadMs:Math.round(n.loadEventEnd),bytes:n.transferSize+r.reduce((a,v)=>a+v.transferSize,0),encodedBytes:n.encodedBodySize+r.reduce((a,v)=>a+v.encodedBodySize,0),requests:r.length+1,origins:[...new Set(r.map(v=>new URL(v.name).origin))]}}")
  metrics['networkIdleSeconds']=round(time.perf_counter()-start,2);samples.append(metrics)
  if i==0:
   page.screenshot(path=str(root/'artifacts/preview-home.png'))
   page.locator('[data-action="go"][data-value="hub"]').first.click();page.wait_for_url('**/#hub');page.wait_for_timeout(700)
   page.screenshot(path=str(root/'artifacts/preview-map.png'))
  context.close()
 result={'profile':'local production preview; fresh browser context for each sample; no throttling','samples':samples,'errors':errors}
 assert not errors
 (root/'artifacts/production-metrics.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(result,ensure_ascii=False),flush=True)
 b.close()
