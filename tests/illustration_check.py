"""Whole-page visual review and map image failure/recovery on real Edge."""
import os, json
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('GAME_URL', 'http://127.0.0.1:5174')
OUT = ROOT / 'artifacts/illustrations'
OUT.mkdir(exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe', headless=True)
    page = browser.new_page(viewport={'width':1280,'height':720}, has_touch=True)
    page.set_default_timeout(15000)
    errors, failed, inspected = [], [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: failed.append([r.status,r.url]) if r.status>=400 else None)
    page.goto(BASE, wait_until='networkidle')
    routes = page.evaluate("""async()=>{
        const m=await import('/src/state.js'),d=await import('/src/data.js');
        const s=m.freshState();s.settings.unlockAll=true;s.settings.muted=true;
        localStorage.setItem(m.SAVE_KEY,JSON.stringify(s));return d.routes;
    }""")
    page.reload(wait_until='networkidle')
    def route(r):
        page.goto(BASE+'/#'+r, wait_until='networkidle')
        page.wait_for_function('(r)=>document.querySelector("#app").classList.contains("route-"+r)',arg=r)
        if r=='s1a':
            page.wait_for_function("document.querySelector('#globe-mode')?.textContent!=='준비 중'")
        page.evaluate("async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()))}")
        if r=='hub': page.locator('.hub-art-status').wait_for(state='hidden')
    def capture(name):
        page.screenshot(path=str(OUT/(name+'.png')))
    def measure(r):
        data=page.evaluate("""()=>({horizontal:document.documentElement.scrollWidth-innerWidth,
            images:[...document.images].filter(i=>i.closest('main,dialog')).map(i=>({src:i.currentSrc,w:i.naturalWidth,h:i.naturalHeight})),
            footer:document.querySelector('.mission-footer')?.getBoundingClientRect().bottom??null})""")
        assert all(i['w']>0 and i['h']>0 for i in data['images']), (r,data)
        assert data['horizontal']<=2,(r,data)
        assert data['footer'] is None or data['footer']<=page.viewport_size['height']+2,(r,data)
        inspected.append({'route':r,'viewport':page.viewport_size,**data})
    for w,h in [(1280,720),(1024,768),(1920,1080)]:
        page.set_viewport_size({'width':w,'height':h})
        for r in routes:
            route(r)
            measure(r)
            if w==1280: capture(r)
            if r=='s5a':
                for animal in ['crab','skipper','reed']:
                    page.locator('[data-action="creature"][data-value="'+animal+'"]').click()
                    page.locator('.specimen-image').evaluate('i=>i.decode()')
                    measure(r+'-'+animal)
                    if w==1280: capture(r+'-'+animal)
        print('pages',w,h,'PASS',flush=True)
    page.set_viewport_size({'width':1280,'height':720})
    route('home');page.locator('[data-action="settings"]').click();page.locator('[data-action="replay-story"]').click()
    assert page.locator('.story-friends img.character').count()==2
    page.evaluate('async()=>{await Promise.all([...document.querySelectorAll(".story-friends img")].map(i=>i.decode()))}')
    capture('story');page.keyboard.press('Escape')
    route('hub')
    page.locator('[data-action="travel"][data-value="1"]').click();page.wait_for_url('**/#s1a',timeout=20000)
    page.locator('[data-action="back"]').click();page.wait_for_url('**/#hub')
    page.locator('.hub-art-status').wait_for(state='hidden');page.wait_for_timeout(300)
    assert page.url.endswith('#hub')
    # A cold image failure must give a usable retry, then recover when online.
    context=browser.new_context(viewport={'width':1280,'height':720})
    bad=context.new_page();bad.goto(BASE,wait_until='networkidle')
    bad.route('**/illustrations/buri-map.webp',lambda r:r.abort())
    bad.goto(BASE+'/#hub',wait_until='networkidle')
    bad.locator('.hub-art-status button').wait_for(state='visible')
    bad.unroute('**/illustrations/buri-map.webp')
    bad.locator('.hub-art-status button').click();bad.locator('.hub-art-status').wait_for(state='hidden')
    context.close()
    assert not errors,errors
    assert not failed,failed
    result={'pages':len(inspected),'routes':len(routes),'sizes':3,'allImagesDecoded':'PASS','mapTravelAndReturn':'PASS','mapImageRetry':'PASS','errors':errors,'httpErrors':failed,'inspected':inspected}
    (OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
    sheet=Image.new('RGB',(4*480,7*295),'#173f4b');draw=ImageDraw.Draw(sheet)
    for i,r in enumerate(routes):
        im=Image.open(OUT/(r+'.png')).convert('RGB');im.thumbnail((480,270))
        x=i%4*480;y=i//4*295;sheet.paste(im,(x,y+25));draw.text((x+12,y+6),r,fill='white')
    sheet.save(OUT/'all-pages.jpg',quality=86)
    print(json.dumps({k:v for k,v in result.items() if k!='inspected'},ensure_ascii=False),flush=True)
    browser.close()
