import test from 'node:test';import assert from 'node:assert/strict';
import {separateHubLabel,hubMap,hubDoors,hubResidents,hubPointBehind,hubCoverScale,clampHubZoom,clampHubView,hubScreenToWorld,anchorHubView,glideHubView,canStandInHub,moveHubPoint,findHubPath,createHubInput,hubDistance} from '../src/hub-world.js';
test('all doors reachable from spawn and every return position without leaving roads',()=>{for(const from of [hubMap.spawn,...hubDoors.map(d=>({x:d.x,y:d.y+18}))])for(const door of hubDoors){assert.ok(canStandInHub(from));const path=findHubPath(from,door);assert.ok(path.length>0);let pos={...from};for(const target of path){for(let frame=0;frame<2000&&hubDistance(pos,target)>.2;frame++){const d=hubDistance(pos,target),step=Math.min(1.5,d);const next=moveHubPoint(pos,{x:(target.x-pos.x)/d*step,y:(target.y-pos.y)/d*step});assert.ok(canStandInHub(next));assert.ok(hubDistance(pos,next)>.001,'path should never stick');pos=next;}}assert.ok(hubDistance(pos,door)<.3);}});
test('keyboard normalizes diagonals, Korean WASD, opposing and independent keyup',()=>{const input=createHubInput();input.press('ㅈ','KeyW');input.press('ㅇ','KeyD');const v=input.vector();assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-9);input.release('ㅈ','KeyW');assert.deepEqual(input.vector(),{x:1,y:0});input.press('ArrowLeft');assert.deepEqual(input.vector(),{x:0,y:0});input.clear();assert.deepEqual(input.vector(),{x:0,y:0});});
test('water and invalid coordinates cannot be walked on, even with long deltas',()=>{assert.ok(!canStandInHub({x:0,y:0}));assert.ok(!canStandInHub({x:NaN,y:100}));const end=moveHubPoint(hubMap.spawn,{x:5000,y:-5000});assert.ok(canStandInHub(end));assert.ok(hubDistance(end,hubMap.spawn)<600);});

test('holding one arrow follows a slanted road instead of sticking at its edge',()=>{let p={x:310,y:194};for(let i=0;i<60;i++)p=moveHubPoint(p,{x:2,y:0});assert.ok(p.x>390,`stalled at ${p.x}`);assert.ok(canStandInHub(p));});
test('sliding along a road never jumps further than the step taken',()=>{let p={...hubMap.spawn};for(const delta of [{x:2,y:0},{x:0,y:2},{x:-2,y:0},{x:0,y:-2}])for(let i=0;i<120;i++){const next=moveHubPoint(p,delta);assert.ok(hubDistance(p,next)<=4,`jumped ${hubDistance(p,next)}`);p=next;}});
test('the helper waits on the road behind the player at every doorstep',()=>{for(const door of hubDoors){const from={x:door.x,y:door.y+21},helper=hubPointBehind(from,27);assert.ok(canStandInHub(helper));assert.ok(hubDistance(from,helper)>12,`door ${door.id}`);}});
test('residents stand clear of the plaza spawn and of doors',()=>{for(const r of hubResidents){assert.ok(hubDistance(r,hubMap.spawn)>40);for(const door of hubDoors)assert.ok(hubDistance(r,door)>30);}});
test('zoom stays between the whole-map fit and 1.6 times the default view',()=>{assert.equal(clampHubZoom(.1,1280),1/1.55);assert.equal(clampHubZoom(9,1280),1.6);assert.equal(clampHubZoom(.1,700),1/1.45);assert.equal(clampHubZoom(1.2,1280),1.2);});
test('the view never shows past the map edge at any zoom',()=>{const w=1280,h=720;for(const scale of [hubCoverScale(w,h),2,4])for(const view of [{x:-500,y:-500},{x:5000,y:5000}]){const v=clampHubView(view,scale,w,h);assert.ok(v.x-w/2/scale>=-1e-9&&v.x+w/2/scale<=hubMap.width+1e-9);assert.ok(v.y-h/2/scale>=-1e-9&&v.y+h/2/scale<=hubMap.height+1e-9);}});
test('zooming keeps the world point under the fingers or cursor fixed',()=>{const w=1280,h=720,view={x:480,y:270},screen={x:900,y:200},world=hubScreenToWorld(view,2,screen,w,h),next=anchorHubView(world,screen,3,w,h),after=hubScreenToWorld(next,3,screen,w,h);assert.ok(hubDistance(world,after)<1e-9);});
test('a flicked map slows down, and stops dead at the map edge',()=>{const w=1280,h=720,scale=2;let view={x:480,y:270},velocity={x:.5,y:0},travelled=0;for(let i=0;i<200&&velocity.x;i++){const step=glideHubView(view,velocity,16,scale,w,h);assert.ok(step.velocity.x<velocity.x);travelled+=step.view.x-view.x;({view,velocity}=step);}assert.equal(velocity.x,0);assert.ok(travelled>100&&travelled<140,`glided ${travelled}`);const edge=glideHubView({x:640,y:270},{x:5,y:0},16,scale,w,h);assert.equal(edge.view.x,960-w/2/scale);assert.equal(edge.velocity.x,0);});

test('edge-clamped map names keep separate readable rows',()=>{
 const first={x:800,y:135,width:180,height:52};
 const second={x:813,y:145,width:150,height:52,minY:134,maxY:265};
 const y=separateHubLabel(second,[first]);
 assert.ok(y>=first.y+second.height+8);
 assert.ok(y<=second.maxY);
 assert.equal(separateHubLabel({...second,x:100},[first]),145);
});
