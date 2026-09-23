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

  /* Toggle sidebar mobile */
  window.toggleSidebar = function() {
    var sb2 = $('sidebarMain');
    var ov = $('sidebarOverlay');
    if (!sb2 || !ov) return;
    var closed = sb2.classList.contains('-translate-x-full');
    if (closed) {
      sb2.classList.remove('-translate-x-full');
      sb2.classList.add('translate-x-0');
      ov.classList.remove('hidden');
    } else {
      sb2.classList.add('-translate-x-full');
      sb2.classList.remove('translate-x-0');
      ov.classList.add('hidden');
    }
  };

  /* Realtime listener untuk scan dari HP */
  window.startScanListener = function() {
    if (!S.store) return;
    if (window._scanChannel) sb.removeChannel(window._scanChannel);
    window._scanChannel = sb.channel('scan-' + S.store.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scan_queue',
        filter: 'store_id=eq.' + S.store.id
      }, function(payload) {
        var code = payload.new.barcode;
        var p = null;
        for (var i = 0; i < S.products.length; i++) {
          if (S.products[i].barcode === code || (S.products[i].kode || '').toLowerCase() === code.toLowerCase()) { p = S.products[i]; break; }
        }
        if (p && p.stok > 0) {
          S.cart.push({ id: p.id, nama: p.nama, harga: Number(p.harga_jual), qty: 1 });
          if (S.page === 'kasir') { rCart(); }
          tt('📱 Scan HP: ' + p.nama, 'ok');
        } else if (!p) {
          tt('📱 Barcode tidak dikenal: ' + code, 'err');
        } else {
          tt('📱 Stok habis: ' + p.nama, 'err');
        }
        sb.from('scan_queue').delete().eq('id', payload.new.id);
      })
      .subscribe();
  };
})();
