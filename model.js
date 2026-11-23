export const stages = ['deciding', 'buying', 'wrapping', 'ready', 'given'];
export function validateGift(raw) {
  const gift = { recipient: raw.recipient.trim(), idea: raw.idea.trim(), status: raw.status, budget: raw.budget === '' ? 0 : Number(raw.budget), url: raw.url.trim(), notes: raw.notes.trim(), year: Number(raw.year) };
  if (!gift.recipient || gift.recipient.length > 100) throw new Error('Add a recipient (up to 100 characters).');
  if (gift.idea.length > 200 || gift.notes.length > 2000 || gift.url.length > 2000) throw new Error('Please shorten the gift details.');
  if (!stages.includes(gift.status)) throw new Error('Choose a valid stage.');
  if (!Number.isFinite(gift.budget) || gift.budget < 0 || gift.budget > 1000000) throw new Error('Enter a budget between €0 and €1,000,000.');
  if (!Number.isInteger(gift.year) || gift.year < 2000 || gift.year > 2200) throw new Error('Choose a valid year.');
  if (gift.url && !/^https?:\/\//i.test(gift.url)) throw new Error('Product links must start with https:// or http://.');
  if (gift.url) { try { new URL(gift.url); } catch { throw new Error('Enter a valid product link.'); } }
  return gift;
}
export function summarize(gifts) {
  return { total: gifts.length, ready: gifts.filter(g => ['ready', 'given'].includes(g.status)).length, budget: gifts.reduce((sum, g) => sum + g.budget, 0) };
}
