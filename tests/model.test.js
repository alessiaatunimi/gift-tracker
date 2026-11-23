import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGift, summarize } from '../model.js';
const gift = {recipient:' Mum ',idea:'Book',status:'deciding',budget:'20.50',url:'https://example.com',notes:'',year:'2026'};
test('normalizes form data', () => { const result = validateGift(gift); assert.equal(result.recipient,'Mum'); assert.equal(result.budget,20.5); assert.equal(result.year,2026); });
test('rejects unsafe links and invalid values', () => { for (const change of [{url:'javascript:alert(1)'},{url:'https://'},{budget:'NaN'},{budget:'-1'},{recipient:' '},{status:'unknown'},{year:2026.5}]) assert.throws(() => validateGift({...gift,...change})); });
test('counts ready and given gifts and totals budgets', () => { assert.deepEqual(summarize([{status:'ready',budget:20},{status:'given',budget:30},{status:'buying',budget:10}]),{total:3,ready:2,budget:60}); assert.deepEqual(summarize([]),{total:0,ready:0,budget:0}); });

test('legacy phases map to the new workflow without losing gifts', async () => {
  const {normalizeStage} = await import('../model.js');
  assert.deepEqual(['deciding','buying','wrapping','ready','given'].map(normalizeStage), ['thinking','decided','delivered','wrapped','given']);
});
test('sorts by the requested phase order, then recipient', async () => {
  const {stages, sortByPhase} = await import('../model.js');
  const gifts = [...stages].reverse().map(status => ({status,recipient:'Alex'}));
  assert.deepEqual(sortByPhase(gifts).map(g => g.status), stages);
  assert.equal(gifts[0].status, 'given');
  assert.deepEqual(sortByPhase([{status:'thinking',recipient:'Zoe'},{status:'thinking',recipient:'Amy'}]).map(g => g.recipient), ['Amy','Zoe']);
  for (const status of stages) assert.equal(validateGift({...gift,status}).status, status);
});

test('overall phase is partial plus the latest item phase for every mixed pair', async () => {
  const {aggregatePhase, itemStages} = await import('../model.js');
  assert.equal(aggregatePhase([]), 'thinking');
  for (let a = 0; a < itemStages.length; a++) for (let b = 0; b < itemStages.length; b++) {
    assert.equal(aggregatePhase([{status:itemStages[a]},{status:itemStages[b]}]), a === b ? itemStages[a] : `partly ${itemStages[Math.max(a,b)]}`);
  }
});
test('saving derives the phase and validates each item', () => {
  const items = [{name:' Book ',status:'bought'},{name:'Scarf',status:'wrapped'}];
  const saved = validateGift({...gift,items,given:false});
  assert.equal(saved.status,'partly wrapped');
  assert.equal(saved.items[0].name,'Book');
  assert.equal(validateGift({...gift,items,given:true}).status,'given');
  assert.throws(() => validateGift({...gift,items:[{name:'',status:'bought'}]}));
  assert.throws(() => validateGift({...gift,items:[{name:'Book',status:'partly bought'}]}));
  assert.throws(() => validateGift({...gift,items:Array(31).fill(items[0])}));
});
test('existing partial gifts preserve progress when converted', async () => {
  const {normalizeGift} = await import('../model.js');
  const result = normalizeGift({...gift,status:'partly bought'});
  assert.equal(result.status,'partly bought');
  assert.equal(result.items[0].name,'Book');
  assert.equal(result.items.length,2);
  assert.deepEqual(normalizeGift(result),result);
});
