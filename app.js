function showError(msg) {
  var e = $('er');
  e.classList.remove('hidden');
  e.textContent = 'ERROR: ' + msg;
  var s = document.querySelector('#ld .animate-spin');
  if (s) s.style.display = 'none';
}

(function boot() {
  if (typeof window.supabase === 'undefined') { showError('Supabase gagal dimuat. Cek internet.'); return; }
  if (SUPABASE_URL.indexOf('xxxxx') >= 0) { showError('CONFIG BELUM DIISI. Buka config.js, ganti SUPABASE_URL & SUPABASE_ANON_KEY.'); return; }

  try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  } catch (e) { showError('Gagal init: ' + e.message); return; }

  sb.auth.onAuthStateChange(async function (ev, se) {
    if (se && se.user) await enterApp(se.user);
    else {
      $('ld').classList.add('hidden'); $('ld').classList.remove('flex');
      $('ap').classList.add('hidden');
      $('au').classList.remove('hidden'); $('au').classList.add('flex');
    }
  });

  (async function () {
    try {
      var r = await sb.auth.getSession();
      var s = r.data.session;
      if (s && s.user) await enterApp(s.user);
      else {
        $('ld').classList.add('hidden'); $('ld').classList.remove('flex');
        $('au').classList.remove('hidden'); $('au').classList.add('flex');
      }
    } catch (e) { showError('Gagal connect: ' + e.message); }
  })();

  $('bL').onclick = doLogin;
  $('bR').onclick = doRegister;
  $('lP').addEventListener('keypress', function (e) { if (e.key === 'Enter') doLogin(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'F2' && S.page === 'kasir') { e.preventDefault(); var el = $('si'); if (el) { el.focus(); el.select(); } tt('Scanner siap', 'info'); }
    if (e.key === 'F4' && S.page === 'kasir') { e.preventDefault(); ms(); }
  });
})();
