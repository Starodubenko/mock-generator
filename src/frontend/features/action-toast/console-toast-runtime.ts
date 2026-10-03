import {
  CONSOLE_TOAST_ERROR_MS,
  CONSOLE_TOAST_SUCCESS_MS,
} from './console-toast-timing';

export const CONSOLE_TOAST_RUNTIME = `(function () {
  var SUCCESS_MS = ${CONSOLE_TOAST_SUCCESS_MS};
  var ERROR_MS = ${CONSOLE_TOAST_ERROR_MS};
  var STORAGE_KEY = 'console-toast';
  var colors = {
    success: '#2e7d32',
    error: '#d32f2f',
    warning: '#ed6c02',
    info: '#0288d1',
  };
  var durationOf = function (severity) {
    if (severity === 'error' || severity === 'warning') {
      return ERROR_MS;
    }
    return SUCCESS_MS;
  };
  var nodes = function () {
    var root = document.querySelector('[data-console-toast-host]');
    return {
      root: root,
      card: root ? root.querySelector('[data-console-toast]') : null,
      title: root ? root.querySelector('[data-console-toast-title]') : null,
      body: root ? root.querySelector('[data-console-toast-body]') : null,
    };
  };
  var readSaved = function () {
    try {
      var raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.until || parsed.until <= Date.now()) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch (error) {
      return null;
    }
  };
  var writeSaved = function (payload) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      return;
    }
  };
  var clearSaved = function () {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      return;
    }
  };
  var hide = function () {
    clearSaved();
    window.clearTimeout(window.__consoleToastHideTimer);
    window.__consoleToastHideTimer = 0;
    var card = nodes().card;
    if (!card) {
      return;
    }
    card.setAttribute('data-open', 'false');
    card.style.display = 'none';
  };
  var stripToastQuery = function () {
    try {
      var url = new URL(window.location.href);
      if (!url.searchParams.has('toast')) {
        return;
      }
      url.searchParams.delete('toast');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch (error) {
      return;
    }
  };
  var apply = function (title, body, severity, until) {
    var view = nodes();
    if (!view.card || !view.title || !view.body) {
      return;
    }
    var tone = colors[severity] ? severity : 'info';
    view.title.textContent = title || '';
    view.body.textContent = body || '';
    view.title.style.display = title ? 'block' : 'none';
    view.card.style.background = colors[tone];
    view.card.setAttribute('data-open', 'true');
    view.card.setAttribute('data-severity', tone);
    view.card.style.display = 'block';
    window.clearTimeout(window.__consoleToastHideTimer);
    window.__consoleToastHideTimer = 0;
    if (tone !== 'error' && tone !== 'warning') {
      var remain = until - Date.now();
      if (remain > 0) {
        window.__consoleToastHideTimer = window.setTimeout(hide, remain);
      }
    }
  };
  var show = function (title, body, severity, persist) {
    var tone = colors[severity] ? severity : 'info';
    var ms = durationOf(tone);
    var until = Date.now() + (ms > 0 ? ms : 24 * 60 * 60 * 1000);
    if (persist !== false) {
      writeSaved({ title: title || '', body: body || '', severity: tone, until: until });
    }
    apply(title, body, tone, until);
  };
  var restore = function () {
    var view = nodes();
    if (!view.card) {
      return;
    }
    if (
      view.card.getAttribute('data-open') === 'true' &&
      view.card.style.display !== 'none'
    ) {
      return;
    }
    if (view.root && view.root.getAttribute('data-initial-open') === 'true') {
      stripToastQuery();
      show(
        view.title ? view.title.textContent : '',
        view.body ? view.body.textContent : '',
        view.card.getAttribute('data-severity') || 'success',
        true,
      );
      return;
    }
    var seeds = document.querySelectorAll('[data-console-toast-seed]');
    if (seeds.length > 0) {
      var seed = seeds[0];
      show(
        seed.getAttribute('data-toast-title') || '',
        seed.getAttribute('data-toast-body') || '',
        seed.getAttribute('data-toast-severity') || 'error',
        true,
      );
      return;
    }
    var saved = readSaved();
    if (saved) {
      apply(saved.title, saved.body, saved.severity, saved.until);
    }
  };
  if (document.documentElement.getAttribute('data-console-toast-runtime') !== 'true') {
    document.documentElement.setAttribute('data-console-toast-runtime', 'true');
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest) {
        return;
      }
      var closeBtn = target.closest('[data-console-toast-close]');
      if (!closeBtn) {
        return;
      }
      event.preventDefault();
      hide();
    });
    document.addEventListener('console-toast', function (event) {
      var detail = event.detail || {};
      show(detail.title || '', detail.body || '', detail.severity || 'info', true);
    });
    document.addEventListener(
      'submit',
      function (event) {
        var form = event.target;
        if (!form || !form.method || String(form.method).toLowerCase() !== 'post') {
          return;
        }
        var els = form.elements || [];
        for (var i = 0; i < els.length; i += 1) {
          var el = els[i];
          if (el && el.required && !String(el.value || '').trim()) {
            return;
          }
        }
        show('Отправляем', 'Запрос ушёл. Дождитесь ответа страницы.', 'info', false);
      },
      true,
    );
    [0, 50, 200, 800].forEach(function (ms) {
      window.setTimeout(restore, ms);
    });
  }
  restore();
})();`;
