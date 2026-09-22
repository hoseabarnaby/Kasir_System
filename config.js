
var SUPABASE_URL = 'https://rgfjpekyejrtqxcryhnn.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZmpwZWt5ZWpydHF4Y3J5aG5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5NzY4NDYsImV4cCI6MjEwNTU1Mjg0Nn0.wo1NK9d7cyCsJancNiDwVvKXYFo4YjzN8mrLmBiOZnE';
/* ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════ */

var sb = null;
var LAP = { period: 'today', from: '', to: '' };

var S = {
  user: null, store: null,
  products: [], suppliers: [], customers: [], trx: [], cash: [],
  cart: [], diskon: 0, bayar: 0,
  page: 'dashboard', cat: 'all', q: '',
  cashType: 'masuk', metodeBayar: 'tunai'
};

function $(id) { return document.getElementById(id); }
function rp(n) { return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID'); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }
function fDT(d) { try { return new Date(d).toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); } catch(e){ return '-'; } }
function vl(id) { var e = $(id); return e ? String(e.value||'').trim() : ''; }
function nu(id) { return Number(vl(id)) || 0; }
function gbc() { return 'PRD' + Math.floor(1000000000 + Math.random()*8999999999); }
function pad2(n) { return n < 10 ? '0' + n : '' + n; }
function todayLocal() { var d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }
function localDateStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth()+1) + '-' + pad2(d.getDate()); }

function tt(m, t) {
  var colors = { ok: 'bg-emerald-600', err: 'bg-red-600', info: 'bg-brand-600' };
  var el = document.createElement('div');
  el.className = 'pointer-events-auto px-4 py-3 rounded-xl text-white text-sm font-semibold shadow-2xl ' + (colors[t] || colors.ok);
  el.textContent = m;
  $('tt').appendChild(el);
  setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '.3s'; setTimeout(function(){el.remove();},300); }, 2500);
}

function md(title, body, onOk, okText) {
  var m = $('mdl');
  m.classList.remove('hidden');
  m.classList.add('flex');
  $('mb').innerHTML =
    '<div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">' +
      '<b class="text-base font-extrabold">' + esc(title) + '</b>' +
      '<button onclick="cm()" class="text-2xl text-slate-400 hover:text-slate-700 leading-none px-2">&times;</button>' +
    '</div>' +
    '<div class="overflow-y-auto flex-1">' + body + '</div>' +
    '<div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">' +
      '<button onclick="cm()" class="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl">Batal</button>' +
      '<button id="mK" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-xl">' + (okText || 'Simpan') + '</button>' +
    '</div>';
  setTimeout(function () { $('mK').onclick = onOk; }, 0);
}
function cm() { var m = $('mdl'); m.classList.add('hidden'); m.classList.remove('flex'); }
