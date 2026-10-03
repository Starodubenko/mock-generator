export const KIT_SELECT_RUNTIME = `(function () {
  if (document.documentElement.getAttribute('data-kit-select-runtime') === 'true') {
    return;
  }
  document.documentElement.setAttribute('data-kit-select-runtime', 'true');
  var close = function (root) {
    if (!root) {
      return;
    }
    var menu = root.querySelector('[data-kit-select-menu]');
    var trigger = root.querySelector('[data-kit-select-trigger]');
    if (menu) {
      menu.setAttribute('data-open', 'false');
      menu.style.display = 'none';
    }
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }
  };
  var closeAll = function (except) {
    var roots = document.querySelectorAll('[data-kit-select]');
    for (var i = 0; i < roots.length; i += 1) {
      if (roots[i] !== except) {
        close(roots[i]);
      }
    }
  };
  var open = function (root) {
    var menu = root.querySelector('[data-kit-select-menu]');
    var trigger = root.querySelector('[data-kit-select-trigger]');
    if (!menu || !trigger) {
      return;
    }
    closeAll(root);
    var rect = trigger.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = rect.bottom + 4 + 'px';
    menu.style.left = rect.left + 'px';
    menu.style.width = Math.max(rect.width, 160) + 'px';
    menu.style.zIndex = '2000';
    menu.style.display = 'block';
    menu.setAttribute('data-open', 'true');
    trigger.setAttribute('aria-expanded', 'true');
  };
  var applyValue = function (root, value, text) {
    var input = root.querySelector('[data-kit-select-value]');
    var trigger = root.querySelector('[data-kit-select-trigger]');
    var label = root.querySelector('[data-kit-select-label]');
    var menu = root.querySelector('[data-kit-select-menu]');
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (trigger) {
      trigger.setAttribute('data-value', value);
    }
    if (label) {
      label.textContent = text;
    }
    if (!menu) {
      return;
    }
    var items = menu.querySelectorAll('[data-value]');
    for (var i = 0; i < items.length; i += 1) {
      var selected = items[i].getAttribute('data-value') === value;
      items[i].setAttribute('aria-selected', selected ? 'true' : 'false');
      items[i].classList.toggle('Mui-selected', selected);
    }
  };
  var submitIfNeeded = function (root, value) {
    var form = root.closest('form');
    if (!form || root.getAttribute('data-submit-on-change') !== 'true') {
      return;
    }
    var prefix = root.getAttribute('data-action-prefix');
    if (prefix) {
      if (!value) {
        return;
      }
      form.action = prefix + encodeURIComponent(value);
    }
    form.submit();
  };
  document.addEventListener('click', function (event) {
    var node = event.target;
    if (node && node.nodeType !== 1) {
      node = node.parentElement;
    }
    if (!node) {
      return;
    }
    var item = node.closest('[data-kit-select-menu] [data-value]');
    if (item) {
      event.preventDefault();
      var itemRoot = item.closest('[data-kit-select]');
      if (!itemRoot) {
        return;
      }
      var value = item.getAttribute('data-value') || '';
      applyValue(itemRoot, value, item.textContent || '');
      close(itemRoot);
      submitIfNeeded(itemRoot, value);
      return;
    }
    var trigger = node.closest('[data-kit-select-trigger]');
    if (trigger) {
      event.preventDefault();
      var triggerRoot = trigger.closest('[data-kit-select]');
      if (!triggerRoot) {
        return;
      }
      var menu = triggerRoot.querySelector('[data-kit-select-menu]');
      if (menu && menu.getAttribute('data-open') === 'true') {
        close(triggerRoot);
        return;
      }
      open(triggerRoot);
      return;
    }
    closeAll();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAll();
    }
  });
})();`;
