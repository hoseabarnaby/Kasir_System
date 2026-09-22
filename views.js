var T = {
  dashboard: ['Dashboard', 'Ringkasan bisnis'],
  kasir: ['Kasir / POS', 'Buat transaksi'],
  transaksi: ['Transaksi', 'Riwayat penjualan'],
  ai: ['AI Business Analyst', 'Analisis cerdas'],
  laporan: ['Laporan', 'Analisa penjualan & produk'],
  produk: ['Produk', 'Kelola barang'],
  supplier: ['Supplier', 'Data pemasok'],
  pelanggan: ['Pelanggan & Piutang', 'Barang yang belum dibayar'],
  aruskas: ['Arus Kas', 'Keuangan'],
  pengaturan: ['Pengaturan', 'Profil toko']
};

var NAV = [
  ['UTAMA', [['dashboard', 'Dashboard'], ['kasir', 'Kasir / POS'], ['transaksi', 'Transaksi']]],
  ['ANALITIK', [['ai', 'AI Bisnis'], ['laporan', 'Laporan']]],
  ['DATA', [['produk', 'Produk'], ['supplier', 'Supplier'], ['pelanggan', 'Pelanggan & Piutang']]],
  ['KEUANGAN', [['aruskas', 'Arus Kas']]],
  ['SISTEM', [['pengaturan', 'Pengaturan']]]
];

function buildNav() {
  var html = '';
  NAV.forEach(function (g) {
    html += '<div class="px-3 pt-5 pb-2 text-[10.5px] font-extrabold text-slate-500 uppercase tracking-[0.1em]">' + g[0] + '</div>';
    g[1].forEach(function (it) {
      html += '<div class="ni px-3.5 py-2.5 rounded-xl text-slate-400 text-sm font-semibold cursor-pointer mb-1 hover:bg-white/5 hover:text-slate-300 transition-all" data-n="' + it[0] + '" onclick="go(\'' + it[0] + '\')">' + it[1] + '</div>';
    });
  });
  $('nv').innerHTML = html;
  updN();
}

function updN() {
  var els = document.querySelectorAll('.ni');
  for (var i = 0; i < els.length; i++) {
    if (els[i].dataset.n === S.page) {
      els[i].className = 'ni px-3.5 py-2.5 rounded-xl text-white text-sm font-bold cursor-pointer mb-1 bg-brand-600 shadow-lg shadow-brand-500/50 transition-all';
    } else {
      els[i].className = 'ni px-3.5 py-2.5 rounded-xl text-slate-400 text-sm font-semibold cursor-pointer mb-1 hover:bg-white/5 hover:text-slate-300 transition-all';
    }
  }
}

function go(p) { S.page = p; updN(); rndr(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

function rndr() {
  $('pT').textContent = T[S.page][0];
  $('pS').textContent = T[S.page][1];
  var v = $('vw');
  v.classList.remove('fade-in'); void v.offsetWidth; v.classList.add('fade-in');

  if (S.page === 'dashboard') v.innerHTML = vDash();
  else if (S.page === 'kasir') { v.innerHTML = vKasir(); rGrid(); rCart(); }
  else if (S.page === 'transaksi') v.innerHTML = vTrx();
  else if (S.page === 'ai') v.innerHTML = vAI();
  else if (S.page === 'laporan') { v.innerHTML = vLap(); setTimeout(rLap, 30); }
  else if (S.page === 'produk') { v.innerHTML = vPrd(); setTimeout(rPrd, 30); }
  else if (S.page === 'supplier') v.innerHTML = vSup();
  else if (S.page === 'pelanggan') v.innerHTML = vCst();
  else if (S.page === 'aruskas') v.innerHTML = vCsh();
  else if (S.page === 'pengaturan') v.innerHTML = vStg();
}

function sc(l, v, s, c, ic) {
  var colors = {
    g: ['bg-emerald-100', 'text-emerald-600'],
    i: ['bg-indigo-100', 'text-indigo-600'],
    b: ['bg-sky-100', 'text-sky-600'],
    r: ['bg-red-100', 'text-red-600'],
    a: ['bg-amber-100', 'text-amber-600']
  };
  var co = colors[c] || colors.i;
  return '<div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-soft">' +
    '<div class="w-12 h-12 rounded-xl ' + co[0] + ' ' + co[1] + ' flex items-center justify-center text-sm font-black mb-4">' + ic + '</div>' +
    '<div class="text-[11.5px] font-extrabold text-slate-500 uppercase tracking-wider">' + l + '</div>' +
    '<div class="text-2xl font-black mt-1.5 tracking-tight">' + v + '</div>' +
    '<div class="text-xs text-slate-500 mt-1">' + s + '</div>' +
  '</div>';
}

function getUnpaidTrx(customerId) {
  return S.trx.filter(function (t) {
    return t.customer_id === customerId && t.status !== 'cancelled' && t.payment_status !== 'paid';
  }).sort(function (a, b) { return new Date(a.tanggal) - new Date(b.tanggal); });
}

function getUtang(customerId) {
  var list = getUnpaidTrx(customerId);
  var total = 0;
  for (var i = 0; i < list.length; i++) total += Number(list[i].total || 0) - Number(list[i].paid_amount || 0);
  return total;
}

function getJatuhTempoTercepat(customerId) {
  var list = getUnpaidTrx(customerId);
  var terkecil = null;
  for (var i = 0; i < list.length; i++) {
    if (!list[i].jatuh_tempo) continue;
    if (!terkecil || new Date(list[i].jatuh_tempo) < new Date(terkecil)) terkecil = list[i].jatuh_tempo;
  }
  return terkecil;
}

function utangScore(customerId) {
  var utang = getUtang(customerId);
  if (utang <= 0) return { status: 'lunas', days: 0, priority: 0 };
  var jt = getJatuhTempoTercepat(customerId);
  if (!jt) return { status: 'nojt', days: 0, priority: 0 };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var jDate = new Date(jt); jDate.setHours(0, 0, 0, 0);
  var diff = Math.round((jDate - today) / 86400000);
  if (diff < 0) return { status: 'telat', days: Math.abs(diff), priority: 2 };
  if (diff <= 7) return { status: 'hampir', days: diff, priority: 1 };
  return { status: 'belum', days: diff, priority: 0 };
}

/* ================ DASHBOARD ================ */
function vDash() {
  var td = todayLocal();
  var todayTrx = S.trx.filter(function (t) { return t.tanggal.slice(0, 10) === td && t.status !== 'cancelled'; });
  var st = todayTrx.reduce(function (a, b) { return a + Number(b.total || 0); }, 0);
  var active = S.trx.filter(function (t) { return t.status !== 'cancelled'; });
  var ts = active.reduce(function (a, b) { return a + Number(b.total || 0); }, 0);
  var sd = S.cash.reduce(function (a, b) { return a + (b.tipe === 'masuk' ? 1 : -1) * Number(b.jumlah || 0); }, 0);

  var laba = 0;
  for (var i = 0; i < active.length; i++) {
    var items = active[i].items || [];
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      laba += (Number(it.harga) - Number(it.harga_beli || 0)) * Number(it.qty);
    }
  }

  var totalPiutang = 0;
  for (var k = 0; k < S.customers.length; k++) totalPiutang += getUtang(S.customers[k].id);

  var telat = 0, hampir = 0;
  for (var x = 0; x < S.customers.length; x++) {
    var sc2 = utangScore(S.customers[x].id);
    if (sc2.status === 'telat') telat++;
    if (sc2.status === 'hampir') hampir++;
  }

  var alertHtml = '';
  if (telat > 0 || hampir > 0) {
    alertHtml = '<div class="bg-amber-50 border-l-4 border-amber-500 rounded-2xl p-5 flex items-start gap-4 cursor-pointer hover:bg-amber-100 transition" onclick="go(\'pelanggan\')">' +
      '<div class="text-2xl">!</div>' +
      '<div class="flex-1">' +
        '<div class="font-extrabold text-amber-900 mb-1">Perhatian Piutang</div>' +
        '<div class="text-sm text-amber-800">' +
          (telat > 0 ? '<b>' + telat + '</b> pelanggan terlambat bayar. ' : '') +
          (hampir > 0 ? '<b>' + hampir + '</b> pelanggan hampir jatuh tempo. ' : '') +
          'Klik untuk lihat detail.' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  var ls = S.products.filter(function (p) { return Number(p.stok) <= 10; }).slice(0, 5);
  var lsHtml = ls.length
    ? ls.map(function (p) {
        return '<div class="px-6 py-3.5 border-b border-slate-100 flex justify-between items-center last:border-0">' +
          '<span class="text-sm font-semibold text-slate-700">' + esc(p.nama) + '</span>' +
          '<span class="px-2.5 py-1 ' + (p.stok <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700') + ' text-xs font-bold rounded-full">' + p.stok + '</span>' +
        '</div>';
      }).join('')
    : '<div class="px-6 py-12 text-center text-slate-400 text-sm">Semua stok aman</div>';

  return '<div class="space-y-6">' +
    alertHtml +
    '<div class="bg-gradient-to-br from-slate-900 via-indigo-700 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">' +
      '<div class="relative">' +
        '<h1 class="text-3xl font-black tracking-tight">Halo, ' + esc((S.store && S.store.nama) || 'Admin') + '</h1>' +
        '<p class="text-indigo-100 text-sm mt-2">Berikut ringkasan bisnis hari ini</p>' +
      '</div>' +
    '</div>' +
    '<div class="grid grid-cols-4 gap-5">' +
      sc('Hari Ini', rp(st), todayTrx.length + ' transaksi', 'g', 'Rp') +
      sc('Omzet', rp(ts), active.length + ' transaksi', 'i', 'Ch') +
      sc('Laba Kotor', rp(laba), 'dari omzet', 'a', 'Lb') +
      sc('Saldo Kas', rp(sd), 'kas bersih', sd >= 0 ? 'b' : 'r', 'Ks') +
    '</div>' +
    '<div class="grid grid-cols-4 gap-5">' +
      sc('Total Piutang', rp(totalPiutang), 'belum dibayar', 'r', 'Ut') +
      sc('Produk', S.products.length, ls.length + ' stok tipis', 'i', 'Pr') +
      sc('Pelanggan', S.customers.length, 'terdaftar', 'g', 'Pl') +
      sc('Transaksi', active.length, 'sukses', 'b', 'Tx') +
    '</div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">' +
      '<div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">' +
        '<div class="font-extrabold text-base">Stok Menipis</div>' +
        '<span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">' + ls.length + ' item</span>' +
      '</div>' + lsHtml +
    '</div>' +
  '</div>';
}

/* ================ AI ================ */
function vAI() {
  var active = S.trx.filter(function (t) { return t.status !== 'cancelled'; });
  var ts = active.reduce(function (a, b) { return a + Number(b.total || 0); }, 0);
  var ms = S.cash.filter(function (c) { return c.tipe === 'masuk'; }).reduce(function (a, b) { return a + Number(b.jumlah || 0); }, 0);
  var kl = S.cash.filter(function (c) { return c.tipe === 'keluar'; }).reduce(function (a, b) { return a + Number(b.jumlah || 0); }, 0);
  var sd = ms - kl;
  var mg = S.products.length ? S.products.reduce(function (a, p) { return a + ((Number(p.harga_jual) - Number(p.harga_beli)) / Number(p.harga_jual) * 100); }, 0) / S.products.length : 0;
  var ls = S.products.filter(function (p) { return Number(p.stok) <= 10; });
  var at = active.length ? ts / active.length : 0;
  var piutang = 0;
  for (var z = 0; z < S.customers.length; z++) piutang += getUtang(S.customers[z].id);

  var hsc = Math.min(100, Math.round((sd > 0 ? 25 : 0) + (mg > 20 ? 25 : 15) + (ls.length < 3 ? 20 : 10) + (active.length > 3 ? 20 : 10) + (piutang < ts * 0.3 ? 10 : 0)));
  var hl = hsc >= 75 ? 'Sehat' : hsc >= 50 ? 'Perlu Perhatian' : 'Kritis';
  var hc = hsc >= 75 ? '#10b981' : hsc >= 50 ? '#f59e0b' : '#ef4444';
  var hbg = hsc >= 75 ? '#d1fae5' : hsc >= 50 ? '#fef3c7' : '#fee2e2';

  var insights = [
    'Total omzet ' + rp(ts) + ' dari ' + active.length + ' transaksi',
    'Rata-rata transaksi ' + rp(at),
    'Margin rata-rata ' + mg.toFixed(1) + '%',
    'Saldo kas ' + rp(sd),
    'Total piutang ' + rp(piutang) + ' belum dibayar'
  ];
  var recos = [
    mg < 25 ? 'Margin < 25% - naikkan harga jual' : 'Margin sehat, pertahankan',
    ls.length ? ls.length + ' produk perlu restock' : 'Semua stok aman',
    sd < 500000 ? 'Saldo kas tipis' : 'Saldo kas sehat',
    piutang > ts * 0.5 ? 'Piutang tinggi - segera tagih' : 'Piutang terkendali',
    'Fokus promosi produk terlaris'
  ];

  return '<div class="space-y-6">' +
    '<div class="bg-gradient-to-br from-slate-900 via-indigo-700 to-purple-700 rounded-3xl p-8 text-white shadow-xl">' +
      '<div class="grid grid-cols-[1fr_auto] gap-8 items-center">' +
        '<div><h1 class="text-2xl font-black">AI Business Analyst</h1>' +
        '<p class="text-indigo-100 text-sm mt-2">Analisis dari ' + active.length + ' transaksi</p></div>' +
        '<div class="text-center"><div class="relative w-32 h-32">' +
          '<svg width="128" height="128" viewBox="0 0 100 100" style="transform:rotate(-90deg)">' +
            '<circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,.15)" stroke-width="10" fill="none"/>' +
            '<circle cx="50" cy="50" r="42" stroke="url(#aig)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="' + (hsc * 2.64) + ' 264"/>' +
            '<defs><linearGradient id="aig"><stop offset="0" stop-color="#60a5fa"/><stop offset="1" stop-color="#c084fc"/></linearGradient></defs>' +
          '</svg>' +
          '<div class="absolute inset-0 flex flex-col items-center justify-center"><div class="text-3xl font-black">' + hsc + '</div><div class="text-[10px] text-indigo-200 uppercase font-bold">Score</div></div>' +
        '</div><div class="text-sm font-extrabold px-4 py-1.5 rounded-full mt-3 inline-block" style="background:' + hbg + ';color:' + hc + '">' + hl + '</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="grid grid-cols-4 gap-5">' +
      sc('Total Penjualan', rp(ts), active.length + ' trx', 'i', 'Rp') +
      sc('Saldo Kas', rp(sd), 'bersih', sd >= 0 ? 'g' : 'r', 'Ks') +
      sc('Margin', mg.toFixed(1) + '%', mg > 20 ? 'Sehat' : 'Naik', 'a', '%') +
      sc('Total Piutang', rp(piutang), 'belum dibayar', 'r', 'Ut') +
    '</div>' +
    '<div class="grid grid-cols-2 gap-5">' +
      '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-6"><div class="font-extrabold text-sm mb-4">Insight</div>' +
        '<div class="space-y-2.5">' + insights.map(function (x) { return '<div class="p-3 bg-slate-50 rounded-xl border-l-[3px] border-brand-500 text-[13px]">' + x + '</div>'; }).join('') + '</div></div>' +
      '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-6"><div class="font-extrabold text-sm mb-4">Rekomendasi</div>' +
        '<div class="space-y-2.5">' + recos.map(function (x) { return '<div class="p-3 bg-slate-50 rounded-xl text-[13px]">' + x + '</div>'; }).join('') + '</div></div>' +
    '</div>' +
  '</div>';
}

/* ================ LAPORAN ================ */
function vLap() {
  return '<div class="space-y-6">' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-5 flex flex-wrap items-center gap-4">' +
      '<div class="text-sm font-extrabold text-slate-700">Periode:</div>' +
      '<button onclick="setLap(\'today\')" data-lap="today" class="lapBtn px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg shadow-md">Hari Ini</button>' +
      '<button onclick="setLap(\'week\')" data-lap="week" class="lapBtn px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg">Minggu Ini</button>' +
      '<button onclick="setLap(\'month\')" data-lap="month" class="lapBtn px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg">Bulan Ini</button>' +
      '<button onclick="setLap(\'custom\')" data-lap="custom" class="lapBtn px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg">Custom</button>' +
      '<div id="lapCustom" class="hidden flex items-center gap-2 ml-auto">' +
        '<input type="date" id="lapFrom" class="px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-500 outline-none">' +
        '<span class="text-slate-400 text-xs">s/d</span>' +
        '<input type="date" id="lapTo" class="px-3 py-2 border-2 border-slate-200 rounded-lg text-xs font-semibold focus:border-brand-500 outline-none">' +
        '<button onclick="rLap()" class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg">Terapkan</button>' +
      '</div>' +
    '</div>' +
    '<div id="lapContent"></div>' +
  '</div>';
}

function setLap(period) {
  LAP.period = period;
  var els = document.querySelectorAll('.lapBtn');
  for (var i = 0; i < els.length; i++) {
    if (els[i].dataset.lap === period) els[i].className = 'lapBtn px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg shadow-md';
    else els[i].className = 'lapBtn px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg';
  }
  if (period === 'custom') {
    $('lapCustom').classList.remove('hidden');
    $('lapCustom').classList.add('flex');
    var t = todayLocal();
    if (!$('lapFrom').value) $('lapFrom').value = t;
    if (!$('lapTo').value) $('lapTo').value = t;
  } else {
    $('lapCustom').classList.add('hidden');
    $('lapCustom').classList.remove('flex');
    rLap();
  }
}

function rLap() {
  var from, to;
  var d = new Date();
  if (LAP.period === 'today') { from = to = todayLocal(); }
  else if (LAP.period === 'week') { from = localDateStr(new Date(Date.now() - 6 * 864e5)); to = todayLocal(); }
  else if (LAP.period === 'month') { from = d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-01'; to = todayLocal(); }
  else { from = vl('lapFrom') || todayLocal(); to = vl('lapTo') || todayLocal(); }

  var trx = S.trx.filter(function (t) {
    if (t.status === 'cancelled') return false;
    var tgl = t.tanggal.slice(0, 10);
    return tgl >= from && tgl <= to;
  });

  var totalTrx = trx.length, totalOmzet = 0, totalLaba = 0;
  var prodMap = {}, piutangBaru = 0;

  for (var i = 0; i < trx.length; i++) {
    var t = trx[i];
    totalOmzet += Number(t.total || 0);
    if (t.payment_status === 'unpaid') piutangBaru += Number(t.total || 0) - Number(t.paid_amount || 0);
    var items = t.items || [];
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      totalLaba += (Number(it.harga) - Number(it.harga_beli || 0)) * Number(it.qty);
      var key = it.productId || it.nama;
      if (!prodMap[key]) prodMap[key] = { nama: it.nama, qty: 0, rev: 0, laba: 0 };
      prodMap[key].qty += Number(it.qty);
      prodMap[key].rev += Number(it.harga) * Number(it.qty);
      prodMap[key].laba += (Number(it.harga) - Number(it.harga_beli || 0)) * Number(it.qty);
    }
  }
  var avgTrx = totalTrx ? totalOmzet / totalTrx : 0;

  var topProd = Object.values(prodMap).sort(function (a, b) { return b.qty - a.qty; }).slice(0, 10);
  var tidakLaku = S.products.filter(function (p) { return !prodMap[p.id] && !prodMap[p.nama]; });
  var hampirHabis = S.products.slice().filter(function (p) { return Number(p.stok) <= 10; }).sort(function (a, b) { return a.stok - b.stok; });

  var topHtml = topProd.length
    ? topProd.map(function (p, idx) {
        return '<tr class="border-b border-slate-100"><td class="px-6 py-3.5"><div class="flex items-center gap-3"><div class="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-900 to-brand-700 text-white flex items-center justify-center font-black text-xs">' + (idx + 1) + '</div><span class="text-sm font-bold">' + esc(p.nama) + '</span></div></td>' +
          '<td class="px-6 py-3.5 text-right font-bold">' + p.qty + '</td>' +
          '<td class="px-6 py-3.5 text-right font-bold text-brand-600">' + rp(p.rev) + '</td>' +
          '<td class="px-6 py-3.5 text-right font-bold text-emerald-600">' + rp(p.laba) + '</td></tr>';
      }).join('')
    : '<tr><td colspan="4" class="px-6 py-12 text-center text-slate-400 text-sm">Tidak ada penjualan</td></tr>';

  var tidakLakuHtml = tidakLaku.length
    ? tidakLaku.slice(0, 15).map(function (p) {
        return '<tr class="border-b border-slate-100"><td class="px-6 py-3.5"><div class="text-sm font-bold">' + esc(p.nama) + '</div></td>' +
          '<td class="px-6 py-3.5 text-right"><span class="px-2.5 py-1 ' + (p.stok <= 3 ? 'bg-red-100 text-red-700' : 'bg-slate-100') + ' text-[11px] font-bold rounded-full">' + p.stok + '</span></td>' +
          '<td class="px-6 py-3.5 text-right text-sm">' + rp(p.harga_jual) + '</td></tr>';
      }).join('')
    : '<tr><td colspan="3" class="px-6 py-12 text-center text-slate-400 text-sm">Semua produk terjual</td></tr>';

  var hampirHabisHtml = hampirHabis.length
    ? hampirHabis.map(function (p) {
        return '<tr class="border-b border-slate-100"><td class="px-6 py-3.5"><div class="text-sm font-bold">' + esc(p.nama) + '</div></td>' +
          '<td class="px-6 py-3.5 text-right"><span class="px-2.5 py-1 ' + (p.stok <= 3 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700') + ' text-[11px] font-bold rounded-full">' + p.stok + '</span></td>' +
          '<td class="px-6 py-3.5 text-right"><button onclick="fAddStok(\'' + p.id + '\')" class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">+ Stok</button></td></tr>';
      }).join('')
    : '<tr><td colspan="3" class="px-6 py-12 text-center text-slate-400 text-sm">Semua stok aman</td></tr>';

  var content = '<div class="space-y-6">' +
    '<div class="bg-brand-50 border border-brand-200 rounded-2xl p-4 text-sm text-brand-900"><b>Periode:</b> ' + new Date(from).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + ' s/d ' + new Date(to).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + '</div>' +
    '<div class="grid grid-cols-5 gap-5">' +
      sc('Total Transaksi', totalTrx, 'sukses', 'i', 'Tx') +
      sc('Total Omzet', rp(totalOmzet), 'pendapatan', 'g', 'Rp') +
      sc('Total Laba', rp(totalLaba), 'kotor', 'a', 'Lb') +
      sc('Rata-rata', rp(avgTrx), 'per transaksi', 'b', 'Av') +
      sc('Piutang Baru', rp(piutangBaru), 'belum dibayar', 'r', 'Ut') +
    '</div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden"><div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between"><div class="font-extrabold text-base">Produk Paling Laku</div><span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Top ' + topProd.length + '</span></div>' +
      '<table class="w-full"><thead class="bg-slate-50"><tr><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Produk</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Qty</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Omzet</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Laba</th></tr></thead><tbody>' + topHtml + '</tbody></table></div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden"><div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between"><div class="font-extrabold text-base">Produk Tidak Laku</div><span class="px-3 py-1 bg-slate-100 text-xs font-bold rounded-full">' + tidakLaku.length + '</span></div>' +
      '<table class="w-full"><thead class="bg-slate-50"><tr><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Produk</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Stok</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Harga</th></tr></thead><tbody>' + tidakLakuHtml + '</tbody></table></div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden"><div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between"><div class="font-extrabold text-base">Produk Hampir Habis</div><span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">' + hampirHabis.length + '</span></div>' +
      '<table class="w-full"><thead class="bg-slate-50"><tr><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Produk</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Stok</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Aksi</th></tr></thead><tbody>' + hampirHabisHtml + '</tbody></table></div>' +
  '</div>';

  $('lapContent').innerHTML = content;
}

/* ================ PRODUK ================ */
function vPrd() {
  return '<div class="space-y-6">' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-5 flex items-center gap-3 flex-wrap">' +
      '<input id="qp" oninput="rPrd()" placeholder="Cari produk..." class="flex-1 min-w-[240px] px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none">' +
      '<button onclick="fPrd()" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl shadow-lg">+ Tambah Produk</button>' +
    '</div>' +
    '<div id="pl" class="grid grid-cols-4 gap-5"></div>' +
  '</div>';
}

function rPrd() {
  var q = (vl('qp') || '').toLowerCase();
  var list = S.products.filter(function (p) {
    return !q || p.nama.toLowerCase().indexOf(q) >= 0 || (p.kode || '').toLowerCase().indexOf(q) >= 0 || (p.barcode || '').indexOf(q) >= 0;
  });
  var el = $('pl'); if (!el) return;
  if (!list.length) {
    el.className = '';
    el.innerHTML = '<div class="bg-white border border-slate-200 rounded-2xl p-16 text-center"><div class="text-slate-500 text-sm mb-5">Belum ada produk</div><button onclick="fPrd()" class="px-5 py-2.5 bg-brand-600 text-white text-sm font-bold rounded-xl">+ Tambah Produk</button></div>';
    return;
  }
  el.className = 'grid grid-cols-4 gap-5';
  el.innerHTML = list.map(function (p) {
    var bdg = p.stok <= 3 ? 'bg-red-100 text-red-700' : p.stok <= 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
    return '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden hover:shadow-card">' +
      '<div class="p-5"><div class="text-sm font-extrabold text-slate-800 mb-1">' + esc(p.nama) + '</div>' +
        '<div class="text-[11px] text-slate-500 font-mono">' + esc(p.kode || '-') + '</div></div>' +
      '<div class="px-5 py-3 bg-slate-50 border-y border-slate-100 flex justify-center"><svg class="bc-' + p.id + '" style="max-width:100%;height:36px"></svg></div>' +
      '<div class="p-5"><div class="flex items-center justify-between mb-4">' +
        '<div><div class="text-[10px] font-extrabold text-slate-500 uppercase">Harga Jual</div><div class="text-lg font-black text-brand-600">' + rp(p.harga_jual) + '</div></div>' +
        '<button onclick="fAddStok(\'' + p.id + '\')" class="px-2.5 py-1 ' + bdg + ' text-[11px] font-bold rounded-full">' + p.stok + ' +</button></div>' +
        '<div class="flex gap-2"><button onclick="fPrd(\'' + p.id + '\')" class="flex-1 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">Edit</button>' +
        '<button onclick="dPrd(\'' + p.id + '\')" class="px-3 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg">Hapus</button></div></div>' +
    '</div>';
  }).join('');
  list.forEach(function (p) {
    var e = document.querySelector('.bc-' + p.id);
    if (e && window.JsBarcode && p.barcode) { try { JsBarcode(e, p.barcode, { format: 'CODE128', displayValue: true, fontSize: 8, height: 28, margin: 0, width: 1 }); } catch (err) {} }
  });
}

function fPrd(id) {
  var p = id ? S.products.filter(function (x) { return x.id === id; })[0] : null;
  var bc = p ? p.barcode : gbc();
  var ic = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm bg-white focus:border-brand-500 outline-none';
  var lc = 'block text-xs font-bold text-slate-600 uppercase mb-2';
  var body = '<div class="p-6 space-y-4">' +
    (!p ? '<div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">Kalau nama sudah ada, otomatis buka form edit.</div>' : '') +
    '<div class="p-4 bg-slate-900 rounded-xl text-center"><div class="bg-white p-2 rounded-lg flex justify-center"><svg id="mb2" style="max-width:100%;height:40px"></svg></div></div>' +
    '<div class="grid grid-cols-2 gap-3">' +
      '<div><label class="' + lc + '">Kode</label><input id="fk" class="' + ic + '" value="' + esc(p ? p.kode : 'SKU-' + String(S.products.length + 1).padStart(4, '0')) + '"></div>' +
      '<div><label class="' + lc + '">Kategori</label><input id="ft" class="' + ic + '" value="' + esc(p ? p.kategori : 'Umum') + '"></div></div>' +
    '<div><label class="' + lc + '">Nama Produk *</label><input id="fn" class="' + ic + '" value="' + esc(p ? p.nama : '') + '"></div>' +
    '<div class="grid grid-cols-2 gap-3">' +
      '<div><label class="' + lc + '">Harga Beli</label><input id="fb" type="number" class="' + ic + '" value="' + (p ? p.harga_beli : 0) + '"></div>' +
      '<div><label class="' + lc + '">Harga Jual</label><input id="fj" type="number" class="' + ic + '" value="' + (p ? p.harga_jual : 0) + '"></div></div>' +
    '<div class="grid grid-cols-2 gap-3">' +
      '<div><label class="' + lc + '">Stok</label><input id="fs" type="number" class="' + ic + '" value="' + (p ? p.stok : 0) + '"></div>' +
      '<div><label class="' + lc + '">Satuan</label><input id="fsat" class="' + ic + '" value="' + esc(p ? p.satuan : 'pcs') + '"></div></div>' +
  '</div>';
  md(p ? 'Edit Produk' : 'Tambah Produk', body, async function () {
    if (!vl('fn')) return tt('Nama wajib', 'err');
    if (!p) {
      var namaBaru = vl('fn').toLowerCase().trim();
      var dup = null;
      for (var i = 0; i < S.products.length; i++) if (S.products[i].nama.toLowerCase().trim() === namaBaru) { dup = S.products[i]; break; }
      if (dup) { cm(); setTimeout(function () { fPrd(dup.id); }, 150); tt('Produk sudah ada.', 'info'); return; }
    }
    var d = { store_id: S.store.id, kode: vl('fk'), barcode: bc, nama: vl('fn'), kategori: vl('ft') || 'Umum', harga_beli: nu('fb'), harga_jual: nu('fj'), stok: nu('fs'), satuan: vl('fsat') || 'pcs' };
    var r = p ? await sb.from('products').update(d).eq('id', p.id) : await sb.from('products').insert(d);
    if (r.error) return tt(r.error.message, 'err');
    cm(); await loadData(S.user); rndr(); tt('Tersimpan');
  });
  setTimeout(function () { var s = $('mb2'); if (s && window.JsBarcode) { try { JsBarcode(s, bc, { format: 'CODE128', displayValue: false, height: 38, margin: 0, width: 1.4 }); } catch (err) {} } }, 50);
}

function dPrd(id) { md('Hapus Produk', '<div class="p-6 text-center text-sm">Yakin hapus?</div>', async function () { var r = await sb.from('products').delete().eq('id', id); if (r.error) return tt('Gagal', 'err'); cm(); await loadData(S.user); rndr(); tt('Terhapus', 'info'); }, 'Hapus'); }

function fAddStok(id) {
  var p = null;
  for (var i = 0; i < S.products.length; i++) if (S.products[i].id === id) { p = S.products[i]; break; }
  if (!p) return;
  var ic = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none';
  var body = '<div class="p-6 space-y-4">' +
    '<div class="p-4 bg-slate-50 rounded-xl"><div class="text-xs font-bold text-slate-500 uppercase">Produk</div><div class="font-extrabold">' + esc(p.nama) + '</div>' +
    '<div class="mt-3 flex items-baseline gap-2"><div class="text-xs font-bold text-slate-500 uppercase">Stok</div><div class="text-xl font-black">' + p.stok + '</div></div></div>' +
    '<div><label class="block text-xs font-bold text-slate-600 uppercase mb-2">Jumlah Tambahan *</label>' +
    '<input id="tambah" type="number" class="' + ic + '" value="10" min="1">' +
    '<div class="flex gap-2 mt-2"><button type="button" onclick="document.getElementById(\'tambah\').value=10" class="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">+10</button>' +
    '<button type="button" onclick="document.getElementById(\'tambah\').value=50" class="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">+50</button>' +
    '<button type="button" onclick="document.getElementById(\'tambah\').value=100" class="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">+100</button></div></div></div>';
  md('Tambah Stok: ' + p.nama, body, async function () {
    var t = nu('tambah');
    if (!t || t <= 0) return tt('Jumlah tidak valid', 'err');
    var r = await sb.from('products').update({ stok: Number(p.stok) + t }).eq('id', p.id);
    if (r.error) return tt('Gagal', 'err');
    cm(); await loadData(S.user); rndr(); tt('Stok ditambah ' + t);
  }, 'Tambah');
}

/* ================ KASIR ================ */
function vKasir() {
  S.q = ''; S.cat = 'all';
  var cs = ['all'].concat(Array.from(new Set(S.products.map(function (p) { return p.kategori; }))));
  var cats = cs.map(function (c) {
    var cls = c === 'all' ? 'px-3.5 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg' : 'px-3.5 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg';
    return '<button onclick="pCat(\'' + esc(c) + '\')" data-pc="' + esc(c) + '" class="pcs ' + cls + '">' + (c === 'all' ? 'Semua' : esc(c)) + '</button>';
  }).join('');

  return '<div class="grid grid-cols-[1fr_400px] gap-6 items-start">' +
    '<div class="space-y-5">' +
      '<div class="bg-gradient-to-br from-brand-50 to-indigo-50 border-2 border-brand-500 rounded-2xl p-5">' +
        '<div class="flex items-center justify-between mb-3"><span class="text-sm font-extrabold text-indigo-900">Scan Barcode</span>' +
        '<span id="ss" class="px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full">SIAP</span></div>' +
        '<input id="si" onkeypress="hs(event)" placeholder="Scan atau ketik barcode, tekan Enter" class="w-full px-4 py-3 bg-white border-2 border-brand-500 rounded-xl text-sm font-mono font-bold focus:ring-4 focus:ring-brand-500/20 outline-none">' +
        '<div class="grid grid-cols-2 gap-2 mt-3"><button onclick="ms()" class="py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg">Input Manual</button>' +
        '<button onclick="document.getElementById(\'si\').focus()" class="py-2 bg-brand-600 text-white text-xs font-bold rounded-lg">Fokus</button></div>' +
      '</div>' +
      '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-5">' +
        '<input id="ps" oninput="S.q=this.value;rGrid()" placeholder="Cari produk..." class="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm mb-3 focus:border-brand-500 outline-none">' +
        '<div class="flex flex-wrap gap-2">' + cats + '</div>' +
      '</div>' +
      '<div id="pg" class="grid grid-cols-5 gap-3"></div>' +
    '</div>' +
    '<div class="sticky top-24">' +
      '<div class="bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden">' +
        '<div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between"><span class="text-sm font-extrabold">Keranjang</span><span id="cc" class="text-xs text-slate-500">0 item</span></div>' +
        '<div id="cl" class="max-h-72 overflow-y-auto"></div>' +
        '<div id="cs" class="p-5 bg-slate-50 border-t border-slate-100"></div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function pCat(c) {
  S.cat = c;
  var els = document.querySelectorAll('.pcs');
  for (var i = 0; i < els.length; i++) {
    els[i].className = 'pcs ' + (els[i].dataset.pc === c ? 'px-3.5 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg' : 'px-3.5 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg');
  }
  rGrid();
}

function rGrid() {
  var q = (S.q || '').toLowerCase();
  var list = S.products.filter(function (p) { return (!q || p.nama.toLowerCase().indexOf(q) >= 0 || (p.barcode || '').indexOf(q) >= 0) && (S.cat === 'all' || p.kategori === S.cat); });
  var el = $('pg'); if (!el) return;
  if (!list.length) { el.className = ''; el.innerHTML = '<div class="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-sm">Tidak ditemukan</div>'; return; }
  el.className = 'grid grid-cols-5 gap-3';
  el.innerHTML = list.map(function (p) {
    var out = Number(p.stok) <= 0;
    return '<div class="pcard bg-white border border-slate-200 rounded-xl p-3 ' + (out ? 'out' : '') + '" data-pid="' + p.id + '">' +
      '<div class="aspect-square rounded-lg bg-slate-100 flex items-center justify-center text-xs font-extrabold text-slate-500 mb-2.5">' + esc(p.nama.slice(0, 3).toUpperCase()) + '</div>' +
      '<div class="text-xs font-bold text-slate-800 leading-tight mb-1.5" style="min-height:32px">' + esc(p.nama) + '</div>' +
      '<div class="text-sm font-black text-brand-600">' + rp(p.harga_jual) + '</div></div>';
  }).join('');
  el.onclick = function (e) { var c = e.target.closest('.pcard'); if (!c || c.classList.contains('out')) return; e.preventDefault(); addC(c.dataset.pid); };
}

function hs(e) { if (e.key === 'Enter') { e.preventDefault(); var c = e.target.value.trim(); if (c) { ps2(c); e.target.value = ''; } } }

function ps2(code) {
  var p = null;
  for (var i = 0; i < S.products.length; i++) if (S.products[i].barcode === code) { p = S.products[i]; break; }
  if (!p) for (var j = 0; j < S.products.length; j++) if ((S.products[j].kode || '').toLowerCase() === code.toLowerCase()) { p = S.products[j]; break; }
  if (!p) return tt('Barcode tidak dikenal', 'err');
  if (p.stok <= 0) return tt('Stok habis', 'err');
  addC(p.id);
  tt('Ditambahkan: ' + p.nama);
}

function addC(id) {
  var p = null;
  for (var i = 0; i < S.products.length; i++) if (S.products[i].id === id) { p = S.products[i]; break; }
  if (!p || Number(p.stok) <= 0) return;
  var wasEmpty = S.cart.length === 0;
  var it = null;
  for (var j = 0; j < S.cart.length; j++) if (S.cart[j].id === id) { it = S.cart[j]; break; }
  if (it) { if (it.qty >= Number(p.stok)) return tt('Stok tidak cukup', 'err'); it.qty++; }
  else S.cart.push({ id: p.id, nama: p.nama, harga: Number(p.harga_jual), qty: 1 });
  if (wasEmpty) { S.diskon = 0; S.bayar = 0; }
  rCart();
}

function chQ(id, d) {
  var it = null;
  for (var i = 0; i < S.cart.length; i++) if (S.cart[i].id === id) { it = S.cart[i]; break; }
  if (!it) return;
  var p = null;
  for (var j = 0; j < S.products.length; j++) if (S.products[j].id === id) { p = S.products[j]; break; }
  it.qty += d;
  if (it.qty <= 0) { var nc = []; for (var k = 0; k < S.cart.length; k++) if (S.cart[k].id !== id) nc.push(S.cart[k]); S.cart = nc; }
  else if (it.qty > Number(p.stok)) it.qty = Number(p.stok);
  rCart();
}

function clr() { S.cart = []; S.diskon = 0; S.bayar = 0; S.metodeBayar = 'tunai'; rCart(); }

function setMetode(m) {
  S.metodeBayar = m;
  rCart();
}

function rCart() {
  var el = $('cl'); if (!el) return;
  var tq = 0;
  for (var i = 0; i < S.cart.length; i++) tq += S.cart[i].qty;
  if ($('cc')) $('cc').textContent = tq + ' item';
  if (!S.cart.length) el.innerHTML = '<div class="p-8 text-center text-slate-400 text-sm">Keranjang kosong</div>';
  else {
    var html = '';
    for (var j = 0; j < S.cart.length; j++) {
      var it = S.cart[j];
      html += '<div class="px-5 py-3 border-b border-slate-100 flex items-center gap-3 last:border-0">' +
        '<div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-extrabold text-slate-500 flex-shrink-0">' + esc(it.nama.slice(0, 2).toUpperCase()) + '</div>' +
        '<div class="flex-1 min-w-0"><div class="text-xs font-bold truncate">' + esc(it.nama) + '</div><div class="text-[11px] text-slate-500">' + rp(it.harga) + '</div></div>' +
        '<div class="flex items-center border border-slate-200 rounded-md overflow-hidden">' +
        '<button onclick="chQ(\'' + it.id + '\',-1)" class="w-6 h-6 bg-slate-50 text-xs font-bold">-</button>' +
        '<span class="w-6 text-center text-xs font-extrabold">' + it.qty + '</span>' +
        '<button onclick="chQ(\'' + it.id + '\',1)" class="w-6 h-6 bg-slate-50 text-xs font-bold">+</button></div>' +
        '<div class="text-xs font-extrabold text-right min-w-[70px]">' + rp(it.harga * it.qty) + '</div></div>';
    }
    el.innerHTML = html;
  }
  var sm = $('cs'); if (!sm) return;
  var sub = 0;
  for (var k = 0; k < S.cart.length; k++) sub += S.cart[k].harga * S.cart[k].qty;
  var dis = Number(S.diskon) || 0;
  var tot = Math.max(0, sub - dis);
  var byr = Number(S.bayar) || tot;

  var custOpts = '<option value="">-- Pilih Pelanggan --</option>';
  for (var c = 0; c < S.customers.length; c++) {
    var cc = S.customers[c];
    var ut = getUtang(cc.id);
    custOpts += '<option value="' + cc.id + '" data-nama="' + esc(cc.nama) + '">' + esc(cc.nama) + (ut > 0 ? ' - Utang: ' + rp(ut) : '') + '</option>';
  }

  if (!S.cart.length) { sm.innerHTML = '<div class="text-center text-slate-400 text-xs">Total muncul di sini</div>'; return; }

  var mb = S.metodeBayar || 'tunai';
  var cT = mb === 'tunai' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500';
  var cQ = mb === 'qris' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500';
  var cH = mb === 'hutang' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-500';

  sm.innerHTML =
    '<div class="mb-4"><label class="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Pelanggan</label>' +
    '<select id="posCust" class="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm font-semibold focus:border-brand-500 outline-none">' + custOpts + '</select></div>' +
    '<div class="mb-4"><label class="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Metode Bayar</label>' +
    '<div class="grid grid-cols-3 gap-2">' +
      '<button type="button" onclick="setMetode(\'tunai\')" class="py-2 rounded-lg border-2 ' + cT + ' font-bold text-xs">Tunai</button>' +
      '<button type="button" onclick="setMetode(\'qris\')" class="py-2 rounded-lg border-2 ' + cQ + ' font-bold text-xs">QRIS</button>' +
      '<button type="button" onclick="setMetode(\'hutang\')" class="py-2 rounded-lg border-2 ' + cH + ' font-bold text-xs">Hutang</button>' +
    '</div></div>' +
    '<div class="space-y-2 mb-4">' +
      '<div class="flex justify-between text-sm"><span class="text-slate-500">Subtotal</span><b>' + rp(sub) + '</b></div>' +
      '<div class="flex justify-between items-center text-sm"><span class="text-slate-500">Diskon</span><input type="number" value="' + dis + '" oninput="S.diskon=this.value;rCart()" class="w-24 px-2 py-1 text-right border border-slate-200 rounded-md text-xs font-semibold focus:border-brand-500 outline-none"></div>' +
      (mb !== 'hutang' ? '<div class="flex justify-between items-center text-sm"><span class="text-slate-500">Bayar</span><input type="number" value="' + byr + '" oninput="S.bayar=this.value;rCart()" class="w-28 px-2 py-1 text-right border border-slate-200 rounded-md text-xs font-semibold focus:border-brand-500 outline-none"></div>' : '') +
      '<div class="flex justify-between items-center pt-3 border-t-2 border-dashed border-slate-200"><span class="font-extrabold">TOTAL</span><span class="text-xl font-black ' + (mb === 'hutang' ? 'text-red-600' : 'text-brand-600') + '">' + rp(tot) + '</span></div>' +
    '</div>' +
    (mb === 'hutang'
      ? '<button onclick="co()" class="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg">Simpan sebagai Hutang</button>'
      : mb === 'qris'
        ? '<button onclick="co()" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg">Proses QRIS & Cetak</button>'
        : '<button onclick="co()" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg">Proses & Cetak Struk</button>') +
    '<button onclick="clr()" class="w-full mt-2 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl">Kosongkan</button>';
}

function ms() {
  var ic = 'w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-mono font-bold focus:border-brand-500 outline-none';
  md('Input Barcode', '<div class="p-6"><label class="block text-xs font-bold text-slate-600 uppercase mb-2">Barcode</label><input id="mb" class="' + ic + '"></div>', function () { var c = vl('mb'); if (!c) return; ps2(c); cm(); }, 'Scan');
  setTimeout(function () { var e = $('mb'); if (e) e.focus(); }, 100);
}

async function co() {
  if (!S.cart.length) return tt('Keranjang kosong', 'err');
  var custSel = $('posCust');
  var custId = custSel ? custSel.value : '';
  var custNama = 'Umum';
  if (custId && custSel.options[custSel.selectedIndex]) custNama = custSel.options[custSel.selectedIndex].dataset.nama;

  var mb = S.metodeBayar || 'tunai';
  var isHutang = mb === 'hutang';
  if (isHutang && !custId) return tt('Pilih pelanggan dulu untuk hutang', 'err');

  var sub = 0;
  for (var i = 0; i < S.cart.length; i++) sub += S.cart[i].harga * S.cart[i].qty;
  var dis = Number(S.diskon) || 0;
  var tot = Math.max(0, sub - dis);
  var byr = isHutang ? 0 : (Number(S.bayar) || tot);
  if (!isHutang && byr < tot) return tt('Pembayaran kurang', 'err');

  var inv = 'INV-' + Date.now().toString(36).toUpperCase().slice(-6);
  var items = [];
  for (var j = 0; j < S.cart.length; j++) {
    var it = S.cart[j];
    var p = null;
    for (var m = 0; m < S.products.length; m++) if (S.products[m].id === it.id) { p = S.products[m]; break; }
    items.push({ productId: it.id, nama: it.nama, qty: it.qty, harga: it.harga, harga_beli: p ? Number(p.harga_beli || 0) : 0, subtotal: it.harga * it.qty });
  }

  var metodeStr = mb === 'qris' ? 'QRIS' : mb === 'hutang' ? 'Hutang' : 'Tunai';

  var r = await sb.from('transactions').insert({
    store_id: S.store.id, invoice_no: inv,
    customer_id: custId || null, customer_nama: custNama,
    items: items, subtotal: sub, diskon: dis, total: tot,
    bayar: byr, kembali: isHutang ? 0 : (byr - tot),
    metode: metodeStr,
    kasir_email: S.user.email, status: 'completed',
    payment_status: isHutang ? 'unpaid' : 'paid',
    paid_amount: isHutang ? 0 : tot
  }).select().single();
  if (r.error) return tt('Gagal: ' + r.error.message, 'err');

  var se = [];
  for (var k = 0; k < S.cart.length; k++) {
    var itx = S.cart[k]; var px = null;
    for (var n = 0; n < S.products.length; n++) if (S.products[n].id === itx.id) { px = S.products[n]; break; }
    if (!px) continue;
    var ur = await sb.from('products').update({ stok: Number(px.stok) - itx.qty }).eq('id', px.id);
    if (ur.error) se.push(px.nama);
  }
  if (se.length) { tt('Stok gagal: ' + se.join(', '), 'err'); await loadData(S.user); rndr(); return; }

  if (!isHutang) {
    var cr = await sb.from('cashflow').insert({ store_id: S.store.id, tipe: 'masuk', kategori: 'Penjualan', keterangan: 'Penjualan ' + inv + ' (' + metodeStr + ')', jumlah: tot, ref_id: r.data.id });
    if (cr.error) { tt('Kas gagal', 'err'); await loadData(S.user); rndr(); return; }
  }

  if (!isHutang) prt(r.data, items);
  S.cart = []; S.diskon = 0; S.bayar = 0; S.metodeBayar = 'tunai';
  await loadData(S.user); rndr();
  tt(isHutang ? 'Disimpan sebagai hutang' : 'Transaksi ' + metodeStr + ' berhasil');
}

function prt(t, items) {
  var co2 = S.store || {};
  var rows = '';
  for (var i = 0; i < items.length; i++) rows += '<div>' + esc(items[i].nama) + '</div><table><tr><td>' + items[i].qty + ' x ' + rp(items[i].harga) + '</td><td class="r">' + rp(items[i].subtotal) + '</td></tr></table>';
  var h = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:76mm auto;margin:0}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Courier New,monospace;font-size:11px;width:76mm;padding:4mm;line-height:1.45}.c{text-align:center}.r{text-align:right}.b{font-weight:bold}hr{border:none;border-top:1px dashed #000;margin:5px 0}table{width:100%;border-collapse:collapse}td{padding:0}</style></head><body><div class="c b">' + esc(co2.nama || 'Toko') + '</div><hr><table><tr><td>No</td><td class="r">' + esc(t.invoice_no) + '</td></tr><tr><td>Tgl</td><td class="r">' + fDT(t.tanggal) + '</td></tr><tr><td>Metode</td><td class="r">' + esc(t.metode || 'Tunai') + '</td></tr></table><hr>' + rows + '<hr><table><tr><td>Subtotal</td><td class="r">' + rp(t.subtotal) + '</td></tr><tr class="b"><td>TOTAL</td><td class="r">' + rp(t.total) + '</td></tr><tr><td>Bayar</td><td class="r">' + rp(t.bayar) + '</td></tr><tr><td>Kembali</td><td class="r">' + rp(t.kembali) + '</td></tr></table><hr><div class="c">Terima kasih</div></body></html>';
  var w = window.open('', '_blank', 'width=400,height=600');
  if (!w) return tt('Popup diblokir', 'err');
  w.document.open(); w.document.write(h); w.document.close();
  setTimeout(function () { w.focus(); w.print(); }, 400);
}

/* ================ TRANSAKSI ================ */
function vTrx() {
  var list = S.trx;
  var ac = list.filter(function (t) { return t.status !== 'cancelled'; });
  var tot = 0;
  for (var i = 0; i < ac.length; i++) tot += Number(ac[i].total || 0);
  var rows = '';
  if (list.length) {
    for (var j = 0; j < list.length; j++) {
      var t = list[j]; var vd = t.status === 'cancelled';
      var un = t.payment_status === 'unpaid';
      var sisa = un ? Number(t.total || 0) - Number(t.paid_amount || 0) : 0;
      rows += '<tr class="border-b border-slate-100 hover:bg-slate-50 ' + (vd ? 'bg-red-50/50' : un ? 'bg-amber-50/50' : '') + '">' +
        '<td class="px-6 py-3.5"><b class="font-mono text-xs ' + (vd ? 'line-through text-slate-400' : '') + '">' + esc(t.invoice_no) + '</b><div class="text-[11px] text-slate-500 mt-0.5">' + esc(t.customer_nama || 'Umum') + ' · ' + esc(t.metode || 'Tunai') + '</div></td>' +
        '<td class="px-6 py-3.5 text-xs text-slate-500">' + fDT(t.tanggal) + '</td>' +
        '<td class="px-6 py-3.5 text-right font-bold">' + rp(t.total) + (un ? '<div class="text-[11px] text-red-600">Sisa: ' + rp(sisa) + '</div>' : '') + '</td>' +
        '<td class="px-6 py-3.5"><span class="px-2.5 py-1 ' + (vd ? 'bg-red-100 text-red-700' : un ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700') + ' text-[11px] font-bold rounded-full">' + (vd ? 'BATAL' : un ? 'HUTANG' : 'LUNAS') + '</span></td>' +
        '<td class="px-6 py-3.5 text-right">' + (!vd ? '<button onclick="reP(\'' + t.id + '\')" class="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded-lg">Print</button>' : '') + '</td></tr>';
    }
  } else rows = '<tr><td colspan="5" class="px-6 py-16 text-center text-slate-400 text-sm">Belum ada transaksi</td></tr>';
  var bc = 0, hc2 = 0;
  for (var k = 0; k < list.length; k++) { if (list[k].status === 'cancelled') bc++; if (list[k].payment_status === 'unpaid') hc2++; }
  return '<div class="space-y-6">' +
    '<div class="grid grid-cols-4 gap-5">' + sc('Transaksi', ac.length, 'Sukses', 'i', 'Tx') + sc('Omzet', rp(tot), 'Total', 'g', 'Rp') + sc('Hutang', hc2, 'Belum bayar', 'a', 'Ut') + sc('Batal', bc, 'Void', 'r', 'X') + '</div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden"><table class="w-full"><thead class="bg-slate-50"><tr>' +
    '<th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Invoice</th>' +
    '<th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Waktu</th>' +
    '<th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Total</th>' +
    '<th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Status</th>' +
    '<th class="px-6 py-3.5"></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function reP(id) { var t = null; for (var i = 0; i < S.trx.length; i++) if (S.trx[i].id === id) { t = S.trx[i]; break; } if (t) prt(t, t.items || []); }

/* ================ SUPPLIER ================ */
function vSup() {
  var rows = '';
  if (S.suppliers.length) {
    for (var i = 0; i < S.suppliers.length; i++) {
      var s = S.suppliers[i];
      rows += '<tr class="border-b border-slate-100"><td class="px-6 py-4 font-bold text-sm">' + esc(s.nama) + '</td>' +
        '<td class="px-6 py-4 text-sm">' + esc(s.kontak || '-') + '</td>' +
        '<td class="px-6 py-4 text-sm">' + esc(s.telepon || '-') + '</td>' +
        '<td class="px-6 py-4 text-right whitespace-nowrap"><button onclick="fSup(\'' + s.id + '\')" class="px-3 py-1.5 bg-white border text-xs font-bold rounded-lg mr-1">Edit</button>' +
        '<button onclick="dSup(\'' + s.id + '\')" class="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg">Hapus</button></td></tr>';
    }
  } else rows = '<tr><td colspan="4" class="px-6 py-16 text-center text-slate-400 text-sm">Belum ada</td></tr>';
  return '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden"><div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between"><div class="font-extrabold text-base">Data Supplier</div><button onclick="fSup()" class="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg">+ Tambah</button></div>' +
    '<table class="w-full"><thead class="bg-slate-50"><tr><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Nama</th><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Kontak</th><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Telepon</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
}

function fSup(id) {
  var s = null;
  if (id) for (var i = 0; i < S.suppliers.length; i++) if (S.suppliers[i].id === id) { s = S.suppliers[i]; break; }
  var ic = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none';
  var lc = 'block text-xs font-bold text-slate-600 uppercase mb-2';
  var body = '<div class="p-6 space-y-4"><div><label class="' + lc + '">Nama *</label><input id="sn" class="' + ic + '" value="' + esc(s ? s.nama : '') + '"></div>' +
    '<div class="grid grid-cols-2 gap-3"><div><label class="' + lc + '">Kontak</label><input id="sk" class="' + ic + '" value="' + esc(s ? s.kontak : '') + '"></div>' +
    '<div><label class="' + lc + '">Telepon</label><input id="st" class="' + ic + '" value="' + esc(s ? s.telepon : '') + '"></div></div>' +
    '<div><label class="' + lc + '">Alamat</label><input id="sa" class="' + ic + '" value="' + esc(s ? s.alamat : '') + '"></div></div>';
  md(s ? 'Edit Supplier' : 'Tambah Supplier', body, async function () {
    if (!vl('sn')) return tt('Nama wajib', 'err');
    var d = { store_id: S.store.id, nama: vl('sn'), kontak: vl('sk'), telepon: vl('st'), alamat: vl('sa') };
    var r = s ? await sb.from('suppliers').update(d).eq('id', s.id) : await sb.from('suppliers').insert(d);
    if (r.error) return tt(r.error.message, 'err');
    cm(); await loadData(S.user); rndr(); tt('Tersimpan');
  });
}
function dSup(id) { md('Hapus', '<div class="p-6 text-center text-sm">Yakin hapus?</div>', async function () { var r = await sb.from('suppliers').delete().eq('id', id); if (r.error) return tt('Gagal', 'err'); cm(); await loadData(S.user); rndr(); tt('Terhapus', 'info'); }, 'Hapus'); }

/* ================ PELANGGAN & PIUTANG ================ */
function vCst() {
  var sorted = S.customers.slice().sort(function (a, b) {
    var sa = utangScore(a.id), sb = utangScore(b.id);
    if (sa.priority !== sb.priority) return sb.priority - sa.priority;
    return getUtang(b.id) - getUtang(a.id);
  });
  var totalPiutang = 0, cAktif = 0, cHampir = 0, cTelat = 0;
  for (var i = 0; i < S.customers.length; i++) {
    var u = getUtang(S.customers[i].id);
    totalPiutang += u;
    if (u > 0) { cAktif++; var s = utangScore(S.customers[i].id); if (s.status === 'hampir') cHampir++; if (s.status === 'telat') cTelat++; }
  }
  var rows = '';
  if (sorted.length) {
    for (var j = 0; j < sorted.length; j++) {
      var c = sorted[j];
      var u = getUtang(c.id);
      var sc2 = utangScore(c.id);
      var bc = 'bg-slate-100 text-slate-600', bt = 'Lunas';
      if (u > 0) {
        if (sc2.status === 'telat') { bc = 'bg-red-100 text-red-700'; bt = 'Telat ' + sc2.days + ' hr'; }
        else if (sc2.status === 'hampir') { bc = 'bg-amber-100 text-amber-700'; bt = 'H-' + sc2.days; }
        else if (sc2.status === 'belum') { bc = 'bg-blue-100 text-blue-700'; bt = 'H-' + sc2.days; }
        else { bc = 'bg-slate-100 text-slate-600'; bt = 'Tanpa JT'; }
      }
      var jt = getJatuhTempoTercepat(c.id);
      var jtStr = jt ? new Date(jt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
      rows += '<tr class="border-b border-slate-100 hover:bg-slate-50">' +
        '<td class="px-6 py-4"><div class="font-bold text-sm">' + esc(c.nama) + '</div>' + (c.telepon ? '<div class="text-[11px] text-slate-500 mt-0.5">' + esc(c.telepon) + '</div>' : '') + '</td>' +
        '<td class="px-6 py-4"><span class="px-2.5 py-1 ' + (u > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700') + ' text-[11px] font-bold rounded-full">' + (u > 0 ? rp(u) : 'Lunas') + '</span></td>' +
        '<td class="px-6 py-4 text-sm">' + jtStr + '</td>' +
        '<td class="px-6 py-4"><span class="px-2.5 py-1 ' + bc + ' text-[11px] font-bold rounded-full">' + bt + '</span></td>' +
        '<td class="px-6 py-4 text-right whitespace-nowrap">' +
          (u > 0 ? '<button onclick="vDetailHutang(\'' + c.id + '\')" class="px-3 py-1.5 bg-sky-600 text-white text-xs font-bold rounded-lg mr-1">Detail</button>' : '') +
          (u > 0 ? '<button onclick="fBayarUtang(\'' + c.id + '\')" class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg mr-1">Bayar</button>' : '') +
          (u > 0 ? '<button onclick="prtInvoice(\'' + c.id + '\')" class="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg mr-1">Invoice</button>' : '') +
          '<button onclick="fCst(\'' + c.id + '\')" class="px-3 py-1.5 bg-white border text-xs font-bold rounded-lg mr-1">Edit</button>' +
          '<button onclick="dCst(\'' + c.id + '\')" class="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg">Hapus</button>' +
        '</td></tr>';
    }
  } else rows = '<tr><td colspan="5" class="px-6 py-16 text-center text-slate-400 text-sm">Belum ada pelanggan</td></tr>';
  return '<div class="space-y-6">' +
    '<div class="grid grid-cols-4 gap-5">' +
      sc('Total Piutang', rp(totalPiutang), cAktif + ' pelanggan', 'r', 'Rp') +
      sc('Pelanggan Aktif', cAktif, 'dengan hutang', 'i', 'Pl') +
      sc('Hampir JT', cHampir, '<= 7 hari', 'a', 'H-') +
      sc('Terlambat', cTelat, 'sudah lewat', 'r', 'X') +
    '</div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden">' +
      '<div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">' +
        '<div><div class="font-extrabold text-base">Data Pelanggan & Piutang</div><div class="text-xs text-slate-500 mt-0.5">Barang yang belum dibayar</div></div>' +
        '<button onclick="fCst()" class="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg">+ Tambah Pelanggan</button>' +
      '</div>' +
      '<table class="w-full"><thead class="bg-slate-50"><tr>' +
        '<th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Nama</th>' +
        '<th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Total Utang</th>' +
        '<th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Jatuh Tempo</th>' +
        '<th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Status</th>' +
        '<th class="px-6 py-3.5"></th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '</div>' +
  '</div>';
}

function vDetailHutang(custId) {
  var c = null;
  for (var i = 0; i < S.customers.length; i++) if (S.customers[i].id === custId) { c = S.customers[i]; break; }
  if (!c) return;
  var unpaid = getUnpaidTrx(custId);
  var totalUtang = getUtang(custId);

  var rows = '';
  if (unpaid.length) {
    for (var j = 0; j < unpaid.length; j++) {
      var t = unpaid[j];
      var sisa = Number(t.total || 0) - Number(t.paid_amount || 0);
      var itemStr = (t.items || []).map(function (it) {
        return '<div class="text-[12px] text-slate-600 ml-3">- ' + esc(it.nama) + ' x' + it.qty + ' = ' + rp(it.subtotal) + '</div>';
      }).join('');
      rows += '<div class="p-4 border border-slate-200 rounded-xl mb-3">' +
        '<div class="flex justify-between items-start mb-2">' +
          '<div><div class="font-mono text-xs font-bold text-slate-700">' + esc(t.invoice_no) + '</div>' +
          '<div class="text-[11px] text-slate-500 mt-0.5">' + fDT(t.tanggal) + ' · ' + esc(t.metode || 'Hutang') + '</div></div>' +
          '<div class="text-right"><div class="text-xs text-slate-500">Sisa</div><div class="font-black text-red-600">' + rp(sisa) + '</div></div>' +
        '</div>' +
        '<div class="pt-2 border-t border-slate-100">' + itemStr + '</div>' +
      '</div>';
    }
  } else rows = '<div class="p-8 text-center text-slate-400 text-sm">Tidak ada hutang</div>';

  var body = '<div class="p-6">' +
    '<div class="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">' +
      '<div class="text-xs font-bold text-red-700 uppercase mb-1">Total Hutang</div>' +
      '<div class="text-2xl font-black text-red-700">' + rp(totalUtang) + '</div>' +
      '<div class="text-xs text-red-600 mt-1">' + unpaid.length + ' transaksi belum dibayar</div>' +
    '</div>' +
    rows +
  '</div>';

  md('Detail Hutang: ' + c.nama, body, function () { cm(); }, 'Tutup');
}

function fCst(id) {
  var c = null;
  if (id) for (var i = 0; i < S.customers.length; i++) if (S.customers[i].id === id) { c = S.customers[i]; break; }
  var ic = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none';
  var lc = 'block text-xs font-bold text-slate-600 uppercase mb-2';
  var body = '<div class="p-6 space-y-4">' +
    '<div><label class="' + lc + '">Nama *</label><input id="cn" class="' + ic + '" value="' + esc(c ? c.nama : '') + '"></div>' +
    '<div class="grid grid-cols-2 gap-3"><div><label class="' + lc + '">Telepon</label><input id="ct" class="' + ic + '" value="' + esc(c ? c.telepon : '') + '"></div>' +
    '<div><label class="' + lc + '">Tipe</label><select id="ct2" class="' + ic + '"><option ' + (c && c.tipe === 'Umum' ? 'selected' : '') + '>Umum</option><option ' + (c && c.tipe === 'Grosir' ? 'selected' : '') + '>Grosir</option><option ' + (c && c.tipe === 'Toko' ? 'selected' : '') + '>Toko</option></select></div></div>' +
    '<div><label class="' + lc + '">Alamat</label><input id="ca" class="' + ic + '" value="' + esc(c ? c.alamat : '') + '"></div>' +
  '</div>';
  md(c ? 'Edit Pelanggan' : 'Tambah Pelanggan', body, async function () {
    if (!vl('cn')) return tt('Nama wajib', 'err');
    var d = { store_id: S.store.id, nama: vl('cn'), tipe: vl('ct2'), telepon: vl('ct'), alamat: vl('ca') };
    var r = c ? await sb.from('customers').update(d).eq('id', c.id) : await sb.from('customers').insert(d);
    if (r.error) return tt(r.error.message, 'err');
    cm(); await loadData(S.user); rndr(); tt('Tersimpan');
  });
}

function dCst(id) { md('Hapus Pelanggan', '<div class="p-6 text-center text-sm">Yakin?</div>', async function () { var r = await sb.from('customers').delete().eq('id', id); if (r.error) return tt('Gagal', 'err'); cm(); await loadData(S.user); rndr(); tt('Terhapus', 'info'); }, 'Hapus'); }

function fBayarUtang(id) {
  var c = null;
  for (var i = 0; i < S.customers.length; i++) if (S.customers[i].id === id) { c = S.customers[i]; break; }
  if (!c) return;
  var u = getUtang(id);
  if (u <= 0) return tt('Tidak ada utang', 'err');
  var unpaid = getUnpaidTrx(id);
  var ic = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none';
  var lc = 'block text-xs font-bold text-slate-600 uppercase mb-2';

  var body = '<div class="p-6 space-y-4">' +
    '<div class="p-4 bg-slate-50 rounded-xl">' +
      '<div class="text-xs font-bold text-slate-500 uppercase mb-1">Pelanggan</div>' +
      '<div class="font-extrabold">' + esc(c.nama) + '</div>' +
      '<div class="mt-3 flex items-baseline gap-2"><div class="text-xs font-bold text-slate-500 uppercase">Total Utang</div>' +
      '<div class="text-xl font-black text-red-600">' + rp(u) + '</div></div>' +
      '<div class="text-xs text-slate-500 mt-1">' + unpaid.length + ' transaksi akan dibayar (FIFO - yang lama dulu)</div>' +
    '</div>' +
    '<div><label class="' + lc + '">Jumlah Bayar (Rp) *</label>' +
    '<input id="byr" type="number" class="' + ic + '" value="' + u + '" max="' + u + '">' +
    '<div class="flex gap-2 mt-2">' +
      '<button type="button" onclick="document.getElementById(\'byr\').value=' + u + '" class="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Lunas (' + rp(u) + ')</button>' +
      '<button type="button" onclick="document.getElementById(\'byr\').value=' + Math.floor(u / 2) + '" class="px-3 py-1.5 bg-slate-100 text-xs font-bold rounded-lg">Setengah</button>' +
    '</div></div>' +
    '<div><label class="' + lc + '">Keterangan</label><input id="ket" class="' + ic + '"></div>' +
  '</div>';

  md('Bayar Utang: ' + c.nama, body, async function () {
    var byr = nu('byr');
    if (!byr || byr <= 0) return tt('Jumlah tidak valid', 'err');
    if (byr > u) return tt('Melebihi utang', 'err');

    var sisa = byr;
    var updates = [];
    for (var k = 0; k < unpaid.length && sisa > 0; k++) {
      var t = unpaid[k];
      var tSisa = Number(t.total || 0) - Number(t.paid_amount || 0);
      var bayarKe = Math.min(sisa, tSisa);
      var newPaid = Number(t.paid_amount || 0) + bayarKe;
      var newStatus = newPaid >= Number(t.total || 0) ? 'paid' : 'unpaid';
      updates.push({ id: t.id, paid_amount: newPaid, payment_status: newStatus });
      sisa -= bayarKe;
    }

    for (var m = 0; m < updates.length; m++) {
      var ur = await sb.from('transactions').update({ paid_amount: updates[m].paid_amount, payment_status: updates[m].payment_status }).eq('id', updates[m].id);
      if (ur.error) return tt('Gagal', 'err');
    }

    var ket = vl('ket') || 'Pembayaran hutang dari ' + c.nama;
    var cr = await sb.from('cashflow').insert({ store_id: S.store.id, tipe: 'masuk', kategori: 'Pembayaran Utang', keterangan: ket + ' - ' + c.nama, jumlah: byr });
    if (cr.error) return tt('Kas gagal', 'err');

    cm(); await loadData(S.user); rndr();
    tt('Diterima ' + rp(byr));
  }, 'Konfirmasi');
}

function prtInvoice(id) {
  var c = null;
  for (var i = 0; i < S.customers.length; i++) if (S.customers[i].id === id) { c = S.customers[i]; break; }
  if (!c) return;
  if (!window.jspdf || !window.jspdf.jsPDF) return tt('PDF belum dimuat. Refresh.', 'err');
  var u = getUtang(id);
  if (u <= 0) return tt('Tidak ada utang', 'err');
  var unpaid = getUnpaidTrx(id);

  try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var co = S.store || {};
    var invNo = 'INV-' + Date.now().toString(36).toUpperCase().slice(-6);
    var today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    var jt = getJatuhTempoTercepat(id);
    var jtStr = jt ? new Date(jt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';

    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text(co.nama || 'Toko Saya', 20, 18);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text((co.alamat || '') + (co.telepon ? ' | ' + co.telepon : ''), 20, 26);
    if (co.email) doc.text('Email: ' + co.email, 20, 32);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE TAGIHAN', 20, 55);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('No: ' + invNo, 20, 62);
    doc.text('Tanggal: ' + today, 20, 68);

    doc.setFillColor(248, 250, 252);
    doc.rect(20, 78, 170, 30, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(20, 78, 170, 30);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('DITAGIHKAN KEPADA:', 25, 85);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.text(c.nama || '-', 25, 93);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(71, 85, 105);
    if (c.telepon) doc.text('Telp: ' + c.telepon, 25, 100);

    var tableData = [];
    for (var k = 0; k < unpaid.length; k++) {
      var t = unpaid[k];
      var items = t.items || [];
      for (var m = 0; m < items.length; m++) {
        var it = items[m];
        var tgl = new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        tableData.push([tgl, it.nama, it.qty + 'x', rp(it.harga), rp(it.subtotal)]);
      }
    }

    doc.autoTable({
      startY: 115,
      head: [['Tgl', 'Barang', 'Qty', 'Harga', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 70 }, 2: { cellWidth: 15, halign: 'center' }, 3: { cellWidth: 30, halign: 'right' }, 4: { cellWidth: 32, halign: 'right' } },
      styles: { cellPadding: 2, lineColor: [226, 232, 240], lineWidth: 0.3 }
    });

    var fy = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(254, 226, 226);
    doc.rect(120, fy, 70, 20, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(120, fy, 70, 20);
    doc.setTextColor(153, 27, 27);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL TAGIHAN', 125, fy + 7);
    doc.setFontSize(14);
    doc.text(rp(u), 185, fy + 15, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text('Jatuh Tempo:', 20, fy + 10);
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(12);
    doc.text(jtStr, 20, fy + 17);

    var ny = fy + 32;
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('Mohon lakukan pembayaran sebelum tanggal jatuh tempo.', 20, ny);

    var ph = doc.internal.pageSize.height;
    doc.setDrawColor(226, 232, 240);
    doc.line(20, ph - 20, 190, ph - 20);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Digenerate otomatis oleh Kasir Pro', 20, ph - 13);

    var fname = 'Invoice-' + (c.nama || 'Pelanggan').replace(/[^a-zA-Z0-9]/g, '-') + '-' + invNo + '.pdf';
    doc.save(fname);
    tt('Invoice terdownload');
  } catch (err) { tt('Gagal PDF: ' + err.message, 'err'); }
}

/* ================ ARUS KAS ================ */
function vCsh() {
  var ms = 0, kl = 0;
  for (var i = 0; i < S.cash.length; i++) { if (S.cash[i].tipe === 'masuk') ms += Number(S.cash[i].jumlah || 0); else kl += Number(S.cash[i].jumlah || 0); }
  var rows = '';
  if (S.cash.length) {
    for (var j = 0; j < S.cash.length; j++) {
      var c = S.cash[j]; var isIn = c.tipe === 'masuk';
      rows += '<tr class="border-b border-slate-100"><td class="px-6 py-3.5 text-xs text-slate-500">' + fDT(c.tanggal) + '</td>' +
        '<td class="px-6 py-3.5"><span class="px-2.5 py-1 ' + (isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700') + ' text-[11px] font-bold rounded-full">' + c.tipe + '</span></td>' +
        '<td class="px-6 py-3.5 text-sm">' + esc(c.keterangan || '-') + '</td>' +
        '<td class="px-6 py-3.5 text-right font-extrabold ' + (isIn ? 'text-emerald-600' : 'text-red-600') + '">' + (isIn ? '+' : '-') + rp(c.jumlah) + '</td></tr>';
    }
  } else rows = '<tr><td colspan="4" class="px-6 py-16 text-center text-slate-400 text-sm">Belum ada</td></tr>';
  return '<div class="space-y-6">' +
    '<div class="grid grid-cols-3 gap-5">' + sc('Kas Masuk', rp(ms), 'Pemasukan', 'g', 'In') + sc('Kas Keluar', rp(kl), 'Pengeluaran', 'r', 'Out') + sc('Saldo', rp(ms - kl), 'Bersih', 'i', 'Sal') + '</div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft overflow-hidden"><div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between"><div class="font-extrabold text-base">Riwayat Arus Kas</div><button onclick="fCsh()" class="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg">+ Catat</button></div>' +
    '<table class="w-full"><thead class="bg-slate-50"><tr><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Tgl</th><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Tipe</th><th class="text-left px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Keterangan</th><th class="text-right px-6 py-3.5 text-[11px] uppercase font-extrabold text-slate-500">Jumlah</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function fCsh() {
  S.cashType = 'masuk';
  var ic = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none';
  var lc = 'block text-xs font-bold text-slate-600 uppercase mb-2';
  var body = '<div class="p-6 space-y-4"><div><label class="' + lc + '">Tipe</label>' +
    '<div class="grid grid-cols-2 gap-3"><button type="button" onclick="pcft(\'masuk\')" data-ct="masuk" class="cft py-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold text-sm">Masuk</button>' +
    '<button type="button" onclick="pcft(\'keluar\')" data-ct="keluar" class="cft py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-500 font-extrabold text-sm">Keluar</button></div></div>' +
    '<div><label class="' + lc + '">Kategori</label><input id="ck" class="' + ic + '"></div>' +
    '<div><label class="' + lc + '">Jumlah *</label><input id="cj" type="number" class="' + ic + '" value="0"></div>' +
    '<div><label class="' + lc + '">Keterangan</label><input id="ct" class="' + ic + '"></div></div>';
  md('Catat Arus Kas', body, async function () {
    if (!nu('cj')) return tt('Jumlah wajib', 'err');
    var tp = S.cashType || 'masuk';
    var cr = await sb.from('cashflow').insert({ store_id: S.store.id, tipe: tp, kategori: vl('ck') || 'Umum', jumlah: nu('cj'), keterangan: vl('ct') || '-' });
    if (cr.error) return tt('Gagal', 'err');
    cm(); await loadData(S.user); rndr(); tt('Tercatat');
  });
}

function pcft(t) {
  S.cashType = t;
  var els = document.querySelectorAll('.cft');
  for (var i = 0; i < els.length; i++) {
    if (els[i].dataset.ct === t) els[i].className = 'cft py-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold text-sm';
    else els[i].className = 'cft py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-500 font-extrabold text-sm';
  }
}

/* ================ PENGATURAN ================ */
function vStg() {
  var co = S.store || {};
  var ic = 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-brand-500 outline-none';
  var lc = 'block text-xs font-bold text-slate-600 uppercase mb-2';
  return '<div class="grid grid-cols-2 gap-6">' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-6"><div class="font-extrabold text-base mb-5">Profil Toko</div>' +
    '<div class="space-y-4"><div><label class="' + lc + '">Nama Toko</label><input id="cn2" class="' + ic + '" value="' + esc(co.nama || '') + '"></div>' +
    '<div><label class="' + lc + '">Alamat</label><input id="ca2" class="' + ic + '" value="' + esc(co.alamat || '') + '"></div>' +
    '<div class="grid grid-cols-2 gap-3"><div><label class="' + lc + '">Telepon</label><input id="cp2" class="' + ic + '" value="' + esc(co.telepon || '') + '"></div>' +
    '<div><label class="' + lc + '">Email</label><input id="ce2" class="' + ic + '" value="' + esc(co.email || '') + '"></div></div>' +
    '<button onclick="saveCo()" class="w-full py-3 bg-brand-600 text-white text-sm font-bold rounded-xl">Simpan</button></div></div>' +
    '<div class="space-y-6"><div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-6"><div class="font-extrabold text-base mb-3">ID Toko</div>' +
    '<div class="p-4 bg-slate-100 rounded-xl font-mono text-xs font-bold break-all">' + esc(S.store.id) + '</div></div>' +
    '<div class="bg-white border border-slate-200 rounded-2xl shadow-soft p-6"><div class="font-extrabold text-base mb-4">Statistik</div>' +
    '<div class="grid grid-cols-2 gap-3">' +
      '<div class="p-3 bg-slate-50 rounded-xl"><div class="text-[10px] font-extrabold text-slate-500 uppercase">Produk</div><div class="text-xl font-black">' + S.products.length + '</div></div>' +
      '<div class="p-3 bg-slate-50 rounded-xl"><div class="text-[10px] font-extrabold text-slate-500 uppercase">Transaksi</div><div class="text-xl font-black">' + S.trx.length + '</div></div>' +
      '<div class="p-3 bg-slate-50 rounded-xl"><div class="text-[10px] font-extrabold text-slate-500 uppercase">Pelanggan</div><div class="text-xl font-black">' + S.customers.length + '</div></div>' +
      '<div class="p-3 bg-slate-50 rounded-xl"><div class="text-[10px] font-extrabold text-slate-500 uppercase">Supplier</div><div class="text-xl font-black">' + S.suppliers.length + '</div></div>' +
    '</div></div></div></div>';
}

async function saveCo() {
  var r = await sb.from('stores').update({ nama: vl('cn2'), alamat: vl('ca2'), telepon: vl('cp2'), email: vl('ce2') }).eq('id', S.store.id);
  if (r.error) return tt(r.error.message, 'err');
  await loadData(S.user);
  $('sN').textContent = S.store.nama;
  tt('Tersimpan');
}
