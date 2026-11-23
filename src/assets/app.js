// Theme, header search, outline drawer, course progress, library filters, PDF preview. No libraries.
(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---- Theme
  var toggle = $('#theme-toggle');
  function themeLabel() {
    if (toggle) toggle.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  themeLabel();
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      themeLabel();
    });
  }

  // ---- Header search: icon button on phones, "/" shortcut everywhere
  var search = $('.search');
  var searchBtn = $('.search-btn');
  var searchInput = $('#hs');
  if (searchBtn && search) {
    searchBtn.addEventListener('click', function () {
      var open = search.classList.toggle('open');
      searchBtn.setAttribute('aria-expanded', String(open));
      if (open) searchInput.focus();
    });
  }
  document.addEventListener('keydown', function (e) {
    var t = e.target;
    var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && searchInput) {
      e.preventDefault();
      if (search && !search.offsetParent && searchBtn) searchBtn.click();
      else searchInput.focus();
    }
  });

  // ---- Outline drawer (below 1100px)
  var outline = $('#outline');
  var menuBtn = $('.menu-btn');
  var scrim = $('.scrim');
  function setDrawer(open) {
    if (!outline) return;
    if (open) outline.setAttribute('data-open', ''); else outline.removeAttribute('data-open');
    if (scrim) scrim.hidden = !open;
    if (menuBtn) menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { var c = $('.close-outline'); if (c) c.focus(); } else if (menuBtn && menuBtn.offsetParent) menuBtn.focus();
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setDrawer(true); });
  if (scrim) scrim.addEventListener('click', function () { setDrawer(false); });
  var closeBtn = $('.close-outline');
  if (closeBtn) closeBtn.addEventListener('click', function () { setDrawer(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (outline && outline.hasAttribute('data-open')) setDrawer(false);
      else if (search && search.classList.contains('open')) { search.classList.remove('open'); searchBtn.setAttribute('aria-expanded', 'false'); searchBtn.focus(); }
    }
  });

  // ---- Course progress (saved on this device only)
  var KEY = 'gbc-progress';
  var course = [];
  try { course = JSON.parse($('#course-data').textContent); } catch (e) {}
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }
  var progress = load();

  function paint() {
    var done = course.filter(function (c) { return progress[c.id]; }).length;
    var pct = course.length ? Math.round((done / course.length) * 100) : 0;
    $$('[data-progress-text]').forEach(function (el) { el.textContent = done + ' of ' + course.length + ' projects done'; });
    $$('[data-progress-pct]').forEach(function (el) { el.textContent = pct + '%'; });
    $$('[data-progress-bar]').forEach(function (el) {
      el.style.width = pct + '%';
      if (el.parentNode) el.parentNode.setAttribute('aria-valuenow', String(pct));
    });
    $$('.lesson-link[data-id]').forEach(function (a) {
      var d = !!progress[a.getAttribute('data-id')];
      a.classList.toggle('is-done', d);
      var s = $('.sr', a);
      if (s) s.hidden = !d;
    });
    var next = course.filter(function (c) { return !progress[c.id]; })[0];
    $$('[data-continue]').forEach(function (a) {
      if (!course.length) return;
      if (!next) { a.href = '/projects/'; a.textContent = 'All projects done. Review them'; return; }
      a.href = '/r/' + next.id + '/';
      var label = next.title.split(':')[0];
      a.textContent = (done ? 'Continue with ' : 'Start ') + label;
    });
    var btn = $('[data-complete]');
    if (btn) btn.setAttribute('aria-pressed', String(!!progress[btn.getAttribute('data-complete')]));
  }
  var completeBtn = $('[data-complete]');
  if (completeBtn) {
    completeBtn.addEventListener('click', function () {
      var id = completeBtn.getAttribute('data-complete');
      if (progress[id]) delete progress[id]; else progress[id] = true;
      save(progress);
      paint();
      var msg = $('#complete-msg');
      if (msg) msg.textContent = progress[id] ? 'Project marked complete.' : 'Project marked as not complete.';
    });
  }
  paint();

  // ---- Library search and filters
  var items = $$('#rows .item');
  if (items.length) {
    var q = $('#q'), cat = $('#f-category'), type = $('#f-type'), level = $('#f-level'), off = $('#f-offline');
    var count = $('#count'), empty = $('#empty'), reset = $('#reset');
    var params = new URLSearchParams(location.search);
    q.value = params.get('q') || '';
    cat.value = params.get('category') || '';
    type.value = params.get('type') || '';
    level.value = params.get('level') || '';
    off.checked = params.get('offline') === '1';

    var apply = function () {
      var term = q.value.trim().toLowerCase();
      var words = term ? term.split(/\s+/) : [];
      var shown = 0;
      items.forEach(function (it) {
        var hay = it.getAttribute('data-hay');
        var ok =
          words.every(function (w) { return hay.indexOf(w) !== -1; }) &&
          (!cat.value || it.dataset.category === cat.value) &&
          (!type.value || it.dataset.type === type.value) &&
          (!level.value || it.dataset.level === level.value) &&
          (!off.checked || it.dataset.offline === 'true');
        it.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = shown + ' of ' + items.length + ' resources';
      empty.hidden = shown !== 0;
      var p = new URLSearchParams();
      if (term) p.set('q', q.value.trim());
      if (cat.value) p.set('category', cat.value);
      if (type.value) p.set('type', type.value);
      if (level.value) p.set('level', level.value);
      if (off.checked) p.set('offline', '1');
      var qs = p.toString();
      try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch (e) {}
    };
    [q, cat, type, level, off].forEach(function (el) {
      el.addEventListener('input', apply);
      el.addEventListener('change', apply);
    });
    reset.addEventListener('click', function () {
      q.value = ''; cat.value = ''; type.value = ''; level.value = ''; off.checked = false;
      apply();
      q.focus();
    });
    apply();
  }

  // ---- PDF preview: only offered when the browser can show PDFs inline
  $$('[data-pdf]').forEach(function (btn) {
    if (navigator.pdfViewerEnabled !== true) return;
    btn.hidden = false;
    btn.addEventListener('click', function () {
      var slot = btn.parentNode.querySelector('.pdf-slot');
      if (slot.firstChild) {
        slot.innerHTML = '';
        btn.textContent = btn.textContent.replace('Hide', 'Preview');
        return;
      }
      var f = document.createElement('iframe');
      f.src = btn.getAttribute('data-pdf');
      f.title = 'PDF preview';
      slot.appendChild(f);
      btn.textContent = btn.textContent.replace('Preview', 'Hide');
    });
  });
})();
