import os,json
os.environ['TEMP']=r'D:\DevTemp';os.environ['TMP']=r'D:\DevTemp'
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 page=b.new_page(viewport={'width':1280,'height':800})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:5173',wait_until='networkidle')
 page.locator('[data-action="go"][data-value="hub"]').first.click();page.wait_for_url('**/#hub')
 page.locator('[data-action="travel"][data-value="2"]').click()
 page.wait_for_function("document.querySelector('#arrival')?.textContent.includes('먼저')",timeout=12000)
 assert page.url.endswith('#hub')
 print('locked facility physical click PASS',flush=True)
 page.locator('[data-action="travel"][data-value="1"]').first.click();page.wait_for_url('**/#s1a',timeout=15000)
 page.locator('[data-action="back"]').click();page.wait_for_url('**/#hub');page.wait_for_timeout(400)
 assert page.url.endswith('#hub')
 print('first entry and return without reentry PASS',flush=True)
 page.evaluate("async()=>{const m=await import('/src/state.js');let s=m.freshState();s.settings.unlockAll=true;s.route='hub';localStorage.setItem(m.SAVE_KEY,JSON.stringify(s))}")
 page.reload(wait_until='networkidle')
 for n in range(1,6):
  page.locator('[data-action="travel"][data-value="'+str(n)+'"]').first.click()
  page.wait_for_url('**/#s'+str(n)+'a',timeout=15000)
  page.locator('[data-action="back"]').click();page.wait_for_url('**/#hub');page.wait_for_timeout(200)
  assert page.url.endswith('#hub')
  print('facility',n,'physical path and return PASS',flush=True)
 page.screenshot(path=str(root/'artifacts/map-debug.png'))
 result={'lockedReason':'PASS','automaticFirstEntry':'PASS','returnWithoutReentry':'PASS','allFivePhysicalPaths':'PASS','errors':errors}
 assert not errors
 (root/'artifacts/map-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 b.close()
