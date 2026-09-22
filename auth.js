function tab(t) {
  ['L','R'].forEach(function (x) { $('f'+x).classList.add('hidden'); });
  $('f'+t).classList.remove('hidden');
  ['tL','tR'].forEach(function (x) {
    var on = (x==='tL'&&t==='L')||(x==='tR'&&t==='R');
    $(x).className = 'flex-1 py-2.5 rounded-lg text-sm font-bold ' + (on ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500');
  });
  $('msg').classList.add('hidden');
}
function am(m, ok) {
  var e = $('msg');
  e.classList.remove('hidden');
  e.className = 'mt-4 p-3 rounded-xl text-sm font-semibold ' + (ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700');
  e.textContent = m;
}
async function doLogin() {
  var e = vl('lE'), p = vl('lP');
  if (!e || !p) return am('Isi email dan password', false);
  $('bL').textContent = 'Memuat...';
  var r = await sb.auth.signInWithPassword({ email: e, password: p });
  $('bL').textContent = 'Masuk';
  if (r.error) return am('ERROR: ' + r.error.message, false);
  am('OK: Berhasil masuk!', true);
}
async function doRegister() {
  var n = vl('rN'), e = vl('rE'), p = vl('rP');
  if (!n || !e || !p) return am('Semua wajib diisi', false);
  if (p.length < 6) return am('Password minimal 6 karakter', false);
  $('bR').textContent = 'Memuat...';
  var r = await sb.auth.signUp({ email: e, password: p, options: { data: { store_name: n } } });
  $('bR').textContent = 'Daftar Toko Baru';
  if (r.error) return am('ERROR: ' + r.error.message, false);
  am('OK: Berhasil daftar! Klik tab Masuk.', true);
}
async function doLogout() { await sb.auth.signOut(); }

async function loadData(u) {
  var r1 = await sb.from('stores').select('*').eq('user_id', u.id).maybeSingle();
  var store = r1.data;
  if (!store) {
    var m = u.user_metadata || {};
    var r2 = await sb.from('stores').insert({ user_id: u.id, nama: m.store_name || 'Toko Saya', email: u.email }).select().single();
    if (r2.error) { tt('Gagal buat toko: ' + r2.error.message, 'err'); return; }
    store = r2.data;
    await sb.from('customers').insert({ store_id: store.id, nama: 'Umum / Walk-in', tipe: 'Umum' });
  }
  S.store = store;
  var rs = await Promise.all([
    sb.from('products').select('*').eq('store_id', store.id).order('nama'),
    sb.from('suppliers').select('*').eq('store_id', store.id).order('nama'),
    sb.from('customers').select('*').eq('store_id', store.id).order('nama'),
    sb.from('transactions').select('*').eq('store_id', store.id).order('tanggal', { ascending: false }).limit(500),
    sb.from('cashflow').select('*').eq('store_id', store.id).order('tanggal', { ascending: false }).limit(500)
  ]);
  S.products = rs[0].data || [];
  S.suppliers = rs[1].data || [];
  S.customers = rs[2].data || [];
  S.trx = rs[3].data || [];
  S.cash = rs[4].data || [];
}

async function enterApp(u) {
  S.user = u;
  $('ld').classList.remove('hidden'); $('ld').classList.add('flex');
  await loadData(u);
  if (!S.store) {
    $('ld').classList.add('hidden'); $('ld').classList.remove('flex');
    $('au').classList.remove('hidden'); $('au').classList.add('flex');
    return;
  }
  $('ld').classList.add('hidden'); $('ld').classList.remove('flex');
  $('au').classList.add('hidden'); $('au').classList.remove('flex');
  $('ap').classList.remove('hidden');
  $('sN').textContent = S.store.nama || 'Toko';
  $('uE').textContent = u.email;
  buildNav();
  rndr();
}