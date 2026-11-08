import test from 'node:test';
import assert from 'node:assert/strict';
import { tideScene } from '../src/screens.js';
import { tideHeight } from '../src/data.js';
import { freshState } from '../src/state.js';
import { challengeScreen } from '../src/challenges.js';

test('tide illustration is static while all seven water levels remain model-driven',()=>{
  const scenes=Array.from({length:7},(_,t)=>tideScene(t));
  for(let t=0;t<7;t++){
    assert.match(scenes[t],/tide-foreshore\.webp/);
    assert.ok(scenes[t].includes(`data-water-height="${tideHeight(t)}"`));
    assert.ok(scenes[t].includes(`M0 ${240-tideHeight(t)} Q240 ${200-tideHeight(t)} 480 ${220-tideHeight(t)}`));
    assert.match(scenes[t],/x="319" y="69" width="21" height="163"/);
    assert.match(scenes[t],/M120 211 145 160 183 149 207 214Z/);
    assert.ok(scenes[t].indexOf('tide-foreshore')<scenes[t].indexOf('M120 211'));
  }
  assert.equal(tideHeight(0),tideHeight(6));
  assert.ok(tideHeight(3)>tideHeight(0));
});
test('tide evidence challenges reuse the terrain without baking water or labels into the asset',()=>{
  const s=freshState();s.settings.unlockAll=true;
  for(const step of ['c','d'])for(let index=0;index<4;index++){
    s.route=`s4${step}`;s.research[4][step]=index;
    const html=challengeScreen(s,4,step);
    if(html.includes('challenge-tide-pair')){
      assert.match(html,/tide-foreshore\.webp/);
      assert.match(html,/<figcaption>/);
      assert.match(html,/fill="#3299ad"/);
    }
  }
});
