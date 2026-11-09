import test from 'node:test';import assert from 'node:assert/strict';
import {freshState,normalize} from '../src/state.js';import {placeRestorationPhoto} from '../src/photo-restoration.js';
test('photo pins require earned chapter and are idempotent',()=>{const s=freshState();assert.equal(placeRestorationPhoto(s,1,0),false);s.completed=[1];assert.equal(placeRestorationPhoto(s,1,0),true);assert.equal(placeRestorationPhoto(s,1,0),false);assert.equal(placeRestorationPhoto(s,1,7),false);assert.deepEqual(s.restoration,{1:[0]});assert.deepEqual(s.evidence,{});});
test('normalization removes cosmetic claims without learning proof',()=>{const s=freshState();s.restoration={1:[0,1,2]};assert.deepEqual(normalize(s).restoration,{});delete s.restoration;assert.deepEqual(normalize(s).restoration,{});});
