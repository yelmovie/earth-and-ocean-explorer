"""Isolated-browser regression checks for student records and teacher preview."""
import os,json
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('GAME_URL','http://127.0.0.1:5330')
OUT=Path(__file__).resolve().parents[1]/os.environ.get('QA_OUTPUT','artifacts/series-20261107')
OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('BROWSER_PATH','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless=True)
 context=browser.new_context(viewport={'width':1280,'height':800})
 page=context.new_page();page.goto(BASE)
 def click(action):page.locator('[data-action="'+action+'"]').first.click()
 def teacher_toggle():
  click('settings');page.get_by_text('교사용 가이드',exact=True).click();page.get_by_text('교사용 도구',exact=True).click();click('toggle-unlock');click('close-settings')
 click('go');before=page.evaluate("localStorage.getItem('blue-planet-hq:v2')")
 teacher_toggle();page.goto(BASE+'/#s2a');page.locator('[data-action="choose"][data-value="same"]').click()
 assert page.locator('.admin-label').is_visible()
 assert page.evaluate("localStorage.getItem('blue-planet-hq:v2')")==before
 teacher_toggle()
 page.locator('.admin-label').wait_for(state='detached')
 assert page.url.endswith('#hub')
 restored=page.evaluate("JSON.parse(localStorage.getItem('blue-planet-hq:v2'))")
 assert restored['drafts']['2']['prediction']=='' and restored['completed']==[]
 # Two tabs begin from the same saved snapshot. Second writer cannot overwrite first.
 other=context.new_page();other.goto(BASE);page.locator('[data-action="sound"]').click()
 latest=page.evaluate("localStorage.getItem('blue-planet-hq:v2')")
 other.locator('[data-action="sound"]').click()
 assert other.locator('.storage-warning').is_visible()
 assert other.evaluate("localStorage.getItem('blue-planet-hq:v2')")==latest
 other.close()
 # Damaged save remains byte-for-byte, including after navigating away from home.
 page.evaluate("localStorage.setItem('blue-planet-hq:v2','{broken')");page.goto(BASE+'/#home');page.reload();click('go')
 assert page.evaluate("localStorage.getItem('blue-planet-hq:v2')")=='{broken'
 assert page.locator('.storage-warning').is_visible()
 page.screenshot(path=str(OUT/'protected-save.png'))
 # Confirmed in-app reset is the only way to replace protected saved state.
 click('settings');click('reset-ask');click('reset-confirm')
 assert page.evaluate("JSON.parse(localStorage.getItem('blue-planet-hq:v2')).version")==2
 # Legacy teacher flag still allows teacher exploration but never persists it.
 page.evaluate("async()=>{const {freshState}=await import('/src/state.js');const s=freshState();s.settings.unlockAll=true;localStorage.setItem('blue-planet-hq:v2',JSON.stringify(s));}")
 page.reload();legacy=page.evaluate("localStorage.getItem('blue-planet-hq:v2')")
 page.goto(BASE+'/#s2a');page.locator('[data-action="choose"][data-value="same"]').click()
 assert page.evaluate("localStorage.getItem('blue-planet-hq:v2')")==legacy
 result={'teacherDraftIsolation':'PASS','teacherReturnRoute':'PASS','twoTabConflict':'PASS','corruptOriginalPreserved':'PASS','explicitReset':'PASS','legacyTeacherPreview':'PASS'}
 (OUT/'safety-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print(json.dumps(result));browser.close()
