import os,json,time
from pathlib import Path
os.environ['TEMP']=r'D:\DevTemp';os.environ['TMP']=r'D:\DevTemp'
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 page=browser.new_page(viewport={'width':1280,'height':800})
 errors=[];failed=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
 page.on('response',lambda r:failed.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 page.goto('http://127.0.0.1:5173',wait_until='networkidle')
 awaitable="async()=>{const m=await import('/src/state.js');let s=m.freshState();s.settings.unlockAll=true;localStorage.setItem(m.SAVE_KEY,JSON.stringify(s));const d=await import('/src/data.js');return d.routes}"
 routes=page.evaluate(awaitable)
 for route in routes:
  page.goto('http://127.0.0.1:5173/?verify='+route+'#'+route,wait_until='networkidle')
  assert 'route-'+route in page.locator('#app').get_attribute('class').split()
  if route in ['home','hub','s1c','s4b','certificate']:
   page.screenshot(path=str(root/'artifacts'/('final-'+route+'-1280.png')))
 page.goto('http://127.0.0.1:5173/#home',wait_until='networkidle')
 image=page.evaluate("async()=>{const i=new Image();i.src='/assets/characters.webp';await i.decode();return [i.naturalWidth,i.naturalHeight]}")
 assert image==[1672,941]
 assert errors==[],errors
 assert failed==[],failed
 result={'routes':len(routes),'consoleErrors':errors,'httpErrors':failed,'charactersDecoded':image,'mode':'admin preview rendering, distinct from completed student journey'}
 (root/'artifacts/final-render-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(result,ensure_ascii=False),flush=True)
 browser.close()
