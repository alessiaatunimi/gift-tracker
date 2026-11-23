import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGift, summarize } from '../model.js';
const gift = {recipient:' Mum ',idea:'Book',status:'deciding',budget:'20.50',url:'https://example.com',notes:'',year:'2026'};
test('normalizes form data', () => { const result = validateGift(gift); assert.equal(result.recipient,'Mum'); assert.equal(result.budget,20.5); assert.equal(result.year,2026); });
test('rejects unsafe links and invalid values', () => { for (const change of [{url:'javascript:alert(1)'},{url:'https://'},{budget:'NaN'},{budget:'-1'},{recipient:' '},{status:'unknown'},{year:2026.5}]) assert.throws(() => validateGift({...gift,...change})); });
test('counts ready and given gifts and totals budgets', () => { assert.deepEqual(summarize([{status:'ready',budget:20},{status:'given',budget:30},{status:'buying',budget:10}]),{total:3,ready:2,budget:60}); assert.deepEqual(summarize([]),{total:0,ready:0,budget:0}); });
