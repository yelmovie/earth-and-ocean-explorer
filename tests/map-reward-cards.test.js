import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {REWARD_CARDS,ownedRewardCards,newRewardCards} from '../src/map-reward-cards.js';
import {mapEncounterIds} from '../src/map-villain-content.js';
import {chapters} from '../src/data.js';

test('one achievement card per map villain, in facility order, with its art and thumbnail',()=>{
  assert.deepEqual(REWARD_CARDS.map(card=>card.id),mapEncounterIds);
  assert.deepEqual(REWARD_CARDS.map(card=>card.stage),chapters.map(chapter=>chapter.title));
  assert.equal(new Set(REWARD_CARDS.map(card=>card.title)).size,5);
  for(const card of REWARD_CARDS)for(const file of [card.art,card.thumb]){
    assert.match(file,/assets\/reward-cards\/(card|thumb)-[1-5]-[1-5]\.webp$/);
    assert.ok(existsSync(new URL('../public/'+file.replace(/^\.?\//,''),import.meta.url)),file);
  }
});

test('a card is owned only after the third hit, from the existing hit record',()=>{
  assert.deepEqual(ownedRewardCards({}),[false,false,false,false,false]);
  assert.deepEqual(ownedRewardCards(undefined),[false,false,false,false,false]);
  assert.deepEqual(ownedRewardCards({1:3,2:2,4:3}),[true,false,false,true,false]);
});

test('a card is won only by the hit that takes a villain from under three to three',()=>{
  assert.deepEqual(newRewardCards({},{2:1}),[]);
  assert.deepEqual(newRewardCards({2:2},{2:3}),[1]);
  assert.deepEqual(newRewardCards({2:3},{2:3}),[]);
  assert.deepEqual(newRewardCards({1:3,5:2},{1:3,5:3}),[4]);
});
