import test from 'node:test';
import assert from 'node:assert/strict';
import { tideScene, learning } from '../src/screens.js';
import { tideHeight } from '../src/data.js';
import { freshState } from '../src/state.js';
import { challengeScreen } from '../src/challenges.js';
import { PAGE_SIZE } from '../src/challenge-data.js';

test('tide illustration is static while all seven water levels remain model-driven',()=>{
  const scenes=Array.from({length:7},(_,t)=>tideScene(t));
  for(let t=0;t<7;t++){
    assert.match(scenes[t],/tide-foreshore\.webp/);
    assert.ok(scenes[t].includes(`data-water-height="${tideHeight(t)}"`));
    assert.ok(scenes[t].includes(`M0 ${240-tideHeight(t)} Q240 ${200-tideHeight(t)} 480 ${220-tideHeight(t)}`));
    // The rock and the pole are fixed painted references; only the water line moves.
    assert.match(scenes[t],/tide-rock\.webp" x="92" y="136" width="160" height="74"/);
    assert.match(scenes[t],/tide-pole\.webp" x="319" y="66" width="21" height="168"/);
    assert.ok(scenes[t].indexOf('tide-foreshore')<scenes[t].indexOf('tide-rock'));
    assert.ok(scenes[t].indexOf('tide-pole')<scenes[t].indexOf(`M0 ${240-tideHeight(t)}`),'water is drawn over the pole');
  }
  assert.equal(tideHeight(0),tideHeight(6));
  assert.ok(tideHeight(3)>tideHeight(0));
});
test('tide evidence challenges reuse the terrain without baking water or labels into the asset',()=>{
  const s=freshState();s.settings.unlockAll=true;
  for(const step of ['c','d'])for(let index=0;index<PAGE_SIZE;index++){
    s.route=`s4${step}`;s.research[4][step]=index;
    const html=challengeScreen(s,4,step);
    if(html.includes('challenge-tide-pair')){
      assert.match(html,/tide-foreshore\.webp/);
      assert.match(html,/<figcaption>/);
      assert.match(html,/fill="#3299ad"/);
    }
  }
});


test('tide states are distinct from the incoming and outgoing processes and official field guidance',()=>{
 assert.match(tideScene(0),/data-tide-state="물이 가장 낮은 상태"/);
 assert.match(tideScene(3),/data-tide-state="물이 가장 높은 상태"/);
 const s=freshState(),html=learning(s,4,'b');
 assert.match(html,/밀물은 물이 들어오며 높아지는 과정.*썰물은 빠지며 낮아지는 과정/);
 assert.match(html,/1. 물 높이의 상태 비교/);
 assert.match(learning(s,4,'a'),/해당 장소·날짜의 국립해양조사원 공식 물때/);
});
