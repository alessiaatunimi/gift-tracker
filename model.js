export const itemStages = ['thinking', 'decided', 'bought', 'delivered', 'wrapped'];
export const stages = ['thinking', 'partly decided', 'decided', 'partly bought', 'bought', 'partly delivered', 'delivered', 'partly wrapped', 'wrapped', 'given'];
export function aggregatePhase(items) {
  if (!items.length) return 'thinking';
  const latest = itemStages[Math.max(...items.map(item => itemStages.indexOf(item.status)))];
  return items.every(item => item.status === latest) ? latest : `partly ${latest}`;
}
export function giftItems(gift) {
  if (Array.isArray(gift.items)) return gift.items;
  const phase = normalizeStage(gift.status);
  const status = phase === 'given' ? 'wrapped' : phase.replace('partly ', '');
  const first = { name: gift.idea || 'Gift idea', status: itemStages.includes(status) ? status : 'thinking' };
  // Retain partial progress when upgrading old records; the second item is editable.
  return phase.startsWith('partly ') ? [first, {name: 'Remaining gift items', status: 'thinking'}] : [first];
}
export function normalizeGift(gift) {
  const items = giftItems(gift);
  const given = gift.given ?? gift.status === 'given';
  return {...gift, items, given, status: given ? 'given' : aggregatePhase(items)};
}
// Interpret existing records without rewriting the database on page load.
export function normalizeStage(status) {
  return ({ deciding: 'thinking', buying: 'decided', wrapping: 'delivered', ready: 'wrapped' })[status] || status;
}
export function sortByPhase(gifts) {
  return [...gifts].sort((a, b) => stages.indexOf(normalizeStage(a.status)) - stages.indexOf(normalizeStage(b.status)) || a.recipient.localeCompare(b.recipient));
}
export function validateGift(raw) {
  const gift = { recipient: raw.recipient.trim(), idea: raw.idea.trim(), status: normalizeStage(raw.status), budget: raw.budget === '' ? 0 : Number(raw.budget), url: raw.url.trim(), notes: raw.notes.trim(), year: Number(raw.year) };
  if (!gift.recipient || gift.recipient.length > 100) throw new Error('Add a recipient (up to 100 characters).');
  if (gift.idea.length > 200 || gift.notes.length > 2000 || gift.url.length > 2000) throw new Error('Please shorten the gift details.');
  if (!stages.includes(gift.status)) throw new Error('Choose a valid stage.');
  if (!Number.isFinite(gift.budget) || gift.budget < 0 || gift.budget > 1000000) throw new Error('Enter a budget between €0 and €1,000,000.');
  if (!Number.isInteger(gift.year) || gift.year < 2000 || gift.year > 2200) throw new Error('Choose a valid year.');
  if (gift.url && !/^https?:\/\//i.test(gift.url)) throw new Error('Product links must start with https:// or http://.');
  if (gift.url) { try { new URL(gift.url); } catch { throw new Error('Enter a valid product link.'); } }
  const items = giftItems(raw).map(item => {
    if (typeof item.name !== 'string' || !item.name.trim() || item.name.trim().length > 200 || !itemStages.includes(item.status)) throw new Error('Each item needs a name (up to 200 characters) and a valid phase.');
    return {name: item.name.trim(), status: item.status};
  });
  if (items.length > 30) throw new Error('Use up to 30 items per person.');
  const given = raw.given ?? raw.status === 'given';
  if (typeof given !== 'boolean') throw new Error('Invalid given status.');
  return {...gift, items, given, status: given ? 'given' : aggregatePhase(items)};
}
export function summarize(gifts) {
  return { total: gifts.length, ready: gifts.filter(g => ['wrapped', 'given'].includes(normalizeStage(g.status))).length, budget: gifts.reduce((sum, g) => sum + g.budget, 0) };
}
