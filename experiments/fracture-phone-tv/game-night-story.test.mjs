import test from 'node:test';
import assert from 'node:assert/strict';
import {startGameNightStory,advanceGameNightStory,gameNightStoryView} from './game-night-story.mjs';

const receipt=(id,status='succeeded',extra={})=>({id,status,...extra});
const action=(verb,target='guard')=>({verb,target,text:`${verb} ${target}`});

test('the game-night situation opens with a free-form mystery',()=>{
 const story=startGameNightStory(100,'story-1');
 assert.equal(story.stage,'theft');
 assert.match(story.prompt,/missing/i);
 assert.equal(gameNightStoryView(story).beats.length,0);
});

test('confirmed player choices advance the situation without inventing engine outcomes',()=>{
 const story=startGameNightStory(100,'story-1');
 assert.ok(advanceGameNightStory(story,{player:'Ava',attempt:action('talk'),receipt:receipt('talk-1')},200));
 assert.equal(story.stage,'whispers');
 assert.equal(story.clues,1);
 const beat=advanceGameNightStory(story,{player:'Bryn',attempt:action('creative','campfire'),receipt:receipt('fire-1','succeeded',{object:{verb:'ignite',name:'campfire'}})},300);
 assert.ok(beat);
 assert.equal(story.heat,2);
 assert.equal(story.stage,'alarm');
 assert.equal(story.beats.length,2);
});

test('failed or duplicate receipts never create false progress',()=>{
 const story=startGameNightStory(100,'story-1');
 const failed=advanceGameNightStory(story,{player:'Ava',attempt:action('talk'),receipt:receipt('same','failed')},200);
 assert.equal(failed.text.includes('fails'),true);
 assert.equal(story.clues,0);
 assert.equal(advanceGameNightStory(story,{player:'Ava',attempt:action('talk'),receipt:receipt('same','succeeded')},300),null);
 assert.equal(story.clues,0);
});
