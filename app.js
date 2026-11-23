import { firebaseConfig } from './firebase-config.js';
import { stages, validateGift, summarize } from './model.js';
const $ = id => document.getElementById(id);
const money = value => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
let gifts = [], user = null, demo = false, editing = null, unsubscribe, auth, db, api, busy = false;
const currentYear = new Date().getFullYear();
for (let y = currentYear - 3; y <= currentYear + 5; y++) $('year').add(new Option(`Christmas ${y}`, y, false, y === currentYear));
function notice(message) { $('notice').textContent = message; $('notice').hidden = !message; }
function node(tag, className, text) { const el = document.createElement(tag); el.className = className; if (text !== undefined) el.textContent = text; return el; }
function render() {
  const annual = gifts.filter(g => g.year === Number($('year').value));
  const summary = summarize(annual);
  $('total').textContent = summary.total;
  $('ready').replaceChildren(document.createTextNode(`${summary.ready} `), node('small', '', `/ ${summary.total}`));
  $('budget').textContent = money(summary.budget);
  const percent = summary.total ? Math.round(summary.ready / summary.total * 100) : 0;
  $('progress').style.width = `${percent}%`;
  $('progress-text').textContent = summary.total ? `${percent}% ready for Christmas` : 'A little magic starts here';
  $('add').disabled = !(user || demo); $('export').disabled = !annual.length;
  $('demo-label').hidden = !demo;
  const search = $('search').value.toLowerCase();
  const visible = annual.filter(g => ($('filter').value === 'all' || g.status === $('filter').value) && `${g.recipient} ${g.idea}`.toLowerCase().includes(search));
  $('gifts').replaceChildren();
  for (const gift of visible) {
    const card = node('article', 'gift');
    const top = node('div', 'gift-top');
    const edit = node('button', 'icon', '···'); edit.setAttribute('aria-label', `Edit gift for ${gift.recipient}`); edit.onclick = () => openEditor(gift);
    top.append(node('span', 'avatar', gift.recipient.slice(0, 1).toUpperCase()), node('h3', '', gift.recipient), edit);
    card.append(top, node('p', 'idea', gift.idea || 'The perfect idea is still out there…'));
    if (gift.notes) card.append(node('p', 'notes', gift.notes));
    if (/^https?:\/\//i.test(gift.url)) { const link = node('a', '', 'View gift idea ↗'); link.href = gift.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; card.append(link); }
    const bottom = node('div', 'gift-bottom'); const status = node('select', ''); status.setAttribute('aria-label', `Stage for ${gift.recipient}`);
    for (const stage of stages) status.add(new Option(stage[0].toUpperCase() + stage.slice(1), stage, false, gift.status === stage));
    status.onchange = async () => { status.disabled = true; try { await persist(gift.id, { ...gift, status: status.value }); } catch (e) { notice(errorMessage(e)); render(); } };
    bottom.append(status, node('span', 'money', money(gift.budget))); card.append(bottom); $('gifts').append(card);
  }
  $('empty').hidden = visible.length > 0;
  $('empty').querySelector('h3').textContent = annual.length ? 'No gifts match just yet.' : 'A thoughtful Christmas starts here.';
  $('empty').querySelector('p').textContent = annual.length ? 'Try another search or stage.' : 'Add someone special and let the ideas begin.';
}
function errorMessage(error) {
  const messages = { 'permission-denied': 'Access was denied. Check that your Firestore security rules are published for this account.', 'auth/unauthorized-domain': 'Add this website’s domain to Firebase Authentication → Settings → Authorized domains.', 'auth/popup-blocked': 'Your browser blocked sign-in. Allow pop-ups for this site and try again.', 'auth/popup-closed-by-user': 'Sign-in was cancelled. You can try again when you’re ready.', 'unavailable': 'Cannot reach Firebase. Check your connection and try again.' };
  return messages[error.code] || error.message || 'Something went wrong. Please try again.';
}
function openEditor(gift) {
  editing = gift?.id || null; $('gift-form').reset(); $('form-error').textContent = ''; $('delete').hidden = !gift;
  $('editor-title').textContent = gift ? 'A thoughtful little update' : 'A little something for…';
  if (gift) for (const key of ['recipient', 'idea', 'status', 'budget', 'url', 'notes']) $('gift-form').elements[key].value = gift[key];
  $('editor').showModal();
}
async function persist(id, raw) {
  const data = validateGift(raw);
  if (demo) { if (id) gifts = gifts.map(g => g.id === id ? { ...data, id } : g); else gifts.push({ ...data, id: crypto.randomUUID() }); render(); return; }
  if (!user) throw new Error('Please sign in first.');
  if (id) await api.updateDoc(api.doc(db, 'users', user.uid, 'gifts', id), data);
  else await api.addDoc(api.collection(db, 'users', user.uid, 'gifts'), data);
}
$('add').onclick = () => openEditor();
$('close').onclick = () => { if (!busy) $('editor').close(); };
$('editor').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
function setBusy(value) { busy = value; for (const button of $('gift-form').querySelectorAll('button')) button.disabled = value; }
$('gift-form').onsubmit = async event => {
  event.preventDefault(); setBusy(true); $('form-error').textContent = '';
  try { const raw = Object.fromEntries(new FormData(event.target)); raw.year = editing ? gifts.find(g => g.id === editing).year : Number($('year').value); await persist(editing, raw); $('editor').close(); }
  catch (e) { $('form-error').textContent = errorMessage(e); } finally { setBusy(false); }
};
$('delete').onclick = async () => {
  if (!confirm('Delete this gift? This cannot be undone.')) return;
  setBusy(true);
  try { if (demo) { gifts = gifts.filter(g => g.id !== editing); render(); } else await api.deleteDoc(api.doc(db, 'users', user.uid, 'gifts', editing)); $('editor').close(); }
  catch (e) { $('form-error').textContent = errorMessage(e); } finally { setBusy(false); }
};
for (const id of ['search', 'filter', 'year']) $(id).addEventListener('input', render);
$('demo').onclick = () => {
  demo = true;
  gifts = [{recipient:'Mum',idea:'A pottery class together',status:'deciding',budget:65,notes:'Something we can make a day of.'},{recipient:'Alex',idea:'The cookbook on their wishlist',status:'buying',budget:32,notes:'Check the bookshop this weekend.'},{recipient:'Sophie',idea:'A cosy winter scarf',status:'ready',budget:40,notes:'Wrapped and tucked away.'}].map((g,i) => ({...g,id:`sample-${i}`,year:Number($('year').value),url:''}));
  notice('Sample mode — these are fictional gifts. Changes are temporary and disappear when you reload or sign in.'); render();
};
$('export').onclick = () => {
  const data = gifts.filter(g => g.year === Number($('year').value)).map(({id, ...gift}) => gift);
  const url = URL.createObjectURL(new Blob([JSON.stringify({version:1,gifts:data},null,2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = `christmas-gifts-${$('year').value}${demo ? '-sample' : ''}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
render();
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain || !firebaseConfig.appId) {
  $('auth').disabled = true; $('auth').textContent = 'Firebase setup needed';
  $('welcome-text').textContent = 'Your tracker is ready to connect. Follow README.md to add your Firebase web config and publish the private database rules. Try the sample list in the meantime.';
} else {
  $('auth').disabled = true; $('auth').textContent = 'Connecting…';
  try {
    const [core, authentication, firestore] = await Promise.all([import('https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js'), import('https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js'), import('https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js')]);
    api = { ...authentication, ...firestore }; const app = core.initializeApp(firebaseConfig); auth = api.getAuth(app); db = api.getFirestore(app);
    api.onAuthStateChanged(auth, account => {
      unsubscribe?.(); user = account; demo = false; gifts = []; $('editor').close(); notice('');
      $('auth').disabled = false; $('auth').textContent = account ? 'Sign out' : 'Sign in with Google';
      $('identity').textContent = account?.displayName || 'A little planning. A lot of joy.'; $('welcome').hidden = !!account; render();
      if (account) unsubscribe = api.onSnapshot(api.collection(db, 'users', account.uid, 'gifts'), snapshot => {
        gifts = snapshot.docs.map(d => ({ ...d.data(), id:d.id })).sort((a,b) => a.recipient.localeCompare(b.recipient));
        for (const year of new Set(gifts.map(g => g.year))) if (![...$('year').options].some(o => Number(o.value) === year)) $('year').add(new Option(`Christmas ${year}`,year));
        render();
      }, error => { gifts = []; render(); notice(errorMessage(error)); });
    });
    $('auth').onclick = async () => {
      $('auth').disabled = true;
      try { if (user) await api.signOut(auth); else await api.signInWithPopup(auth,new api.GoogleAuthProvider()); }
      catch (e) { notice(errorMessage(e)); } finally { $('auth').disabled = false; }
    };
  } catch (e) { $('auth').textContent = 'Connection unavailable'; notice('Could not load Firebase. Check your configuration and internet connection, then reload.'); }
}
