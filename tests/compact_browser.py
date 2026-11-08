"""Small landscape/portrait reachability, not a zero-vertical-scroll claim."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('GAME_URL','http://127.0.0.1:5330');OUT=Path(__file__).resolve().parents[1]/'artifacts/series-20261107'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless=True)
 page=browser.new_page();page.goto(BASE)
 page.evaluate("async()=>{const {freshState}=await import('/src/state.js');const s=freshState();s.settings.unlockAll=true;localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s));}");page.reload()
 routes=page.evaluate("async()=>(await import('/src/data.js')).routes")
 failures=[];checks=0
 for w,h in [(915,412),(830,515),(1024,600),(375,812)]:
  page.set_viewport_size({'width':w,'height':h})
  for r in routes:
   page.goto(BASE+'/#'+r);page.wait_for_function('(r)=>document.querySelector("#app").classList.contains("route-"+r)',arg=r)
   metrics=page.evaluate('({overflow:document.documentElement.scrollWidth-innerWidth})')
   if metrics['overflow']>2:failures.append({'size':[w,h],'route':r,**metrics})
   primary=page.locator('.mission-footer .primary').first
   if primary.count():
    primary.scroll_into_view_if_needed()
    visible=primary.evaluate('el=>{const r=el.getBoundingClientRect();const x=r.x+r.width/2,y=r.y+r.height/2;return y>=0&&y<innerHeight&&el.contains(document.elementFromPoint(x,y))}')
    if not visible:failures.append({'size':[w,h],'route':r,'footerCovered':True})
   checks+=1
   if r=='s2a':page.screenshot(path=str(OUT/('compact-'+str(w)+'x'+str(h)+'.png')))
 print(json.dumps({'checks':checks,'failures':failures}));(OUT/'compact-verification.json').write_text(json.dumps({'checks':checks,'failures':failures},indent=2));browser.close()
 assert not failures
