import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
os.environ['TEMP']=r'D:\DevTemp';os.environ['TMP']=r'D:\DevTemp'
root=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
 context=b.new_context(viewport={'width':1280,'height':800});page=context.new_page()
 page.goto('http://127.0.0.1:4174',wait_until='networkidle');context.set_offline(True)
 page.locator('[data-action="go"][data-value="hub"]').first.click();page.wait_for_url('**/#hub')
 memory_navigation=page.locator('#hub-map').count()==1
 stored=page.evaluate("JSON.parse(localStorage.getItem('blue-planet-hq:v2')).route")=='hub'
 refresh=True
 try:page.reload(wait_until='domcontentloaded',timeout=5000)
 except Exception:refresh=False
 if refresh:refresh=page.locator('#app .hub-page').count()==1
 result={'loadedAppCanNavigateInMemory':memory_navigation,'offlineProgressStored':stored,'offlineRefreshSupported':refresh,'school30DeviceLoad':'NOT TESTED','unvisitedVisualsOffline':'NOT GUARANTEED; no service worker'}
 (root/'artifacts/offline-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
 print(json.dumps(result,ensure_ascii=False),flush=True)
 b.close()
