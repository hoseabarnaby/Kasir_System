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

  /* ===== Toggle sidebar mobile ===== */
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

  /* ===== Realtime listener untuk scan dari HP (FIXED) ===== */
  window.startScanListener = function() {
    if (!S.store) return;

    /* Hapus channel lama kalau ada */
    if (window._scanChannel) {
      try { sb.removeChannel(window._scanChannel); } catch (e) {}
      window._scanChannel = null;
    }

    /* Nama channel UNIK tiap kali (kunci utama fix) */
    var chName = 'scan-' + S.store.id + '-' + Date.now();
    console.log('[Scan] Subscribing to', chName);

    window._scanChannel = sb.channel(chName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'scan_queue',
        filter: 'store_id=eq.' + S.store.id
      }, function(payload) {
        console.log('[Scan] Received:', payload.new);

        var code = payload.new.barcode;
        var rowId = payload.new.id;
        var p = null;

        /* Cari produk berdasarkan barcode atau kode */
        for (var i = 0; i < S.products.length; i++) {
          if (S.products[i].barcode === code ||
              (S.products[i].kode || '').toLowerCase() === code.toLowerCase()) {
            p = S.products[i];
            break;
          }
        }

        if (p && Number(p.stok) > 0) {
          /* Cek stok cukup */
          var currentQty = 0;
          for (var j = 0; j < S.cart.length; j++) {
            if (S.cart[j].id === p.id) { currentQty = S.cart[j].qty; break; }
          }
          if (currentQty >= Number(p.stok)) {
            tt('📱 Stok tidak cukup: ' + p.nama, 'err');
          } else {
            /* Merge ke cart (tambah qty kalau sudah ada) */
            var found = false;
            for (var k = 0; k < S.cart.length; k++) {
              if (S.cart[k].id === p.id) { S.cart[k].qty++; found = true; break; }
            }
            if (!found) {
              S.cart.push({ id: p.id, nama: p.nama, harga: Number(p.harga_jual), qty: 1 });
            }
            if (S.page === 'kasir') rCart();
            tt('📱 ' + p.nama, 'ok');
          }
        } else if (!p) {
          tt('📱 Barcode tidak dikenal: ' + code, 'err');
        } else {
          tt('📱 Stok habis: ' + p.nama, 'err');
        }

        /* Hapus dari queue */
        sb.from('scan_queue').delete().eq('id', rowId).then(function(res) {
          if (res.error) console.error('[Scan] delete error:', res.error);
        });
      })
      .subscribe(function(status) {
        console.log('[Scan] Channel status:', status);
        var el = $('scanStatus');
        if (!el) return;
        if (status === 'SUBSCRIBED') {
          el.textContent = '📱 Live';
          el.className = 'px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full';
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          el.textContent = '📱 Offline';
          el.className = 'px-3 py-1 bg-red-100 text-red-700 text-[11px] font-bold rounded-full';
        } else if (status === 'CLOSED') {
          el.textContent = '📱 Closed';
          el.className = 'px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-full';
        }
      });
  };
})();
