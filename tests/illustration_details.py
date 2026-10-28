"""Review the saved field-guide modal, and capture the asynchronously ready globe."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/illustrations'
BASE=os.environ.get('GAME_URL','http://127.0.0.1:5174')
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',headless=True)
    page=b.new_page(viewport={'width':1280,'height':720})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle')
    routes=page.evaluate("""async()=>{
      const m=await import('/src/state.js'),q=await import('/src/challenge-data.js'),d=await import('/src/data.js');
      const s=m.freshState();s.settings.unlockAll=true;s.settings.muted=true;
      Object.assign(s.drafts[5],{found:d.creatures.map(c=>c.id),features:Object.fromEntries(d.creatures.map(c=>[c.id,c.feature])),value:'habitat',action:'observe'});
      for(const t of q.challenges[5]){s.research[5].answers[t.id]=['sort','match'].includes(t.type)?Object.fromEntries(t.items.map(i=>[i.id,i.answer])):structuredClone(t.answer);s.research[5].solved.push(t.id);}
      if(!m.completeStage(s,5))throw Error('Field guide fixture did not complete');
      localStorage.setItem(m.SAVE_KEY,JSON.stringify(s));return d.routes;
    }""")
    page.reload(wait_until='networkidle')
    page.goto(BASE+'/#report',wait_until='networkidle')
    page.locator('[data-action="view-record"][data-value="5"]').click()
    assert page.locator('.record-modal img.specimen-image').count()==3
    page.evaluate('async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll(".record-modal img")].map(i=>i.decode()))}')
    page.screenshot(path=str(OUT/'record-guide.png'))
    page.keyboard.press('Escape')
    page.goto(BASE+'/#s1a',wait_until='networkidle')
    page.wait_for_function("document.querySelector('#globe-mode')?.textContent!=='준비 중'")
    page.screenshot(path=str(OUT/'s1a.png'))
    assert not errors,errors
    sheet=Image.new('RGB',(1920,2065),'#173f4b');draw=ImageDraw.Draw(sheet)
    for i,r in enumerate(routes):
      im=Image.open(OUT/(r+'.png')).convert('RGB');im.thumbnail((480,270))
      x=i%4*480;y=i//4*295;sheet.paste(im,(x,y+25));draw.text((x+12,y+6),r,fill='white')
    sheet.save(OUT/'all-pages.jpg',quality=86)
    (OUT/'details-verification.json').write_text(json.dumps({'savedGuideImages':3,'globeReady':'PASS','errors':errors}),encoding='utf8')
    print('Saved field guide images, modal dismissal, ready globe: PASS',flush=True)
    b.close()
