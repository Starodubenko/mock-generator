export const SCHEMA_EXPAND_RUNTIME = `(function () {
  var root = document.currentScript && document.currentScript.parentElement;
  if (!root || root.getAttribute('data-schema-expand-bound') === 'true') {
    return;
  }
  root.setAttribute('data-schema-expand-bound', 'true');
  var overflowNodes = [];
  var readText = function (selector) {
    var node = document.querySelector(selector);
    return node && 'value' in node ? String(node.value || '').trim() : '';
  };
  var readVersion = function () {
    var trigger = document.getElementById('profile-version-select');
    var host = trigger && trigger.closest('[data-kit-select]');
    var label = host && host.querySelector('[data-kit-select-label]');
    var text = label ? String(label.textContent || '').trim() : '';
    return text || 'Рабочая версия контура';
  };
  var fillMeta = function () {
    var map = {
      version: readVersion(),
      seed: readText('#generate-seed'),
      count: readText('#generate-count'),
    };
    var nodes = root.querySelectorAll('[data-schema-expand-value]');
    for (var i = 0; i < nodes.length; i += 1) {
      var key = nodes[i].getAttribute('data-schema-expand-value');
      if (key && map[key] !== undefined) {
        nodes[i].textContent = map[key] || '—';
      }
    }
  };
  var unlockOverflow = function () {
    var node = root.parentElement;
    while (node && node !== document.documentElement) {
      var computed = window.getComputedStyle(node);
      var clipped =
        computed.overflow !== 'visible' ||
        computed.overflowX !== 'visible' ||
        computed.overflowY !== 'visible';
      var contained =
        (computed.transform && computed.transform !== 'none') ||
        (computed.filter && computed.filter !== 'none') ||
        (computed.perspective && computed.perspective !== 'none');
      if (clipped || contained) {
        overflowNodes.push({
          node: node,
          overflow: node.style.overflow,
          overflowX: node.style.overflowX,
          overflowY: node.style.overflowY,
          transform: node.style.transform,
          filter: node.style.filter,
          perspective: node.style.perspective,
        });
        node.style.overflow = 'visible';
        node.style.overflowX = 'visible';
        node.style.overflowY = 'visible';
        if (contained) {
          node.style.transform = 'none';
          node.style.filter = 'none';
          node.style.perspective = 'none';
        }
      }
      node = node.parentElement;
    }
  };
  var restoreOverflow = function () {
    for (var i = 0; i < overflowNodes.length; i += 1) {
      var item = overflowNodes[i];
      item.node.style.overflow = item.overflow;
      item.node.style.overflowX = item.overflowX;
      item.node.style.overflowY = item.overflowY;
      item.node.style.transform = item.transform;
      item.node.style.filter = item.filter;
      item.node.style.perspective = item.perspective;
    }
    overflowNodes = [];
  };
  var setOpen = function (open) {
    if (open) {
      unlockOverflow();
      root.setAttribute('data-open', 'true');
      root.setAttribute('aria-modal', 'true');
      root.style.position = 'fixed';
      root.style.inset = '0px';
      root.style.top = '0px';
      root.style.right = '0px';
      root.style.bottom = '0px';
      root.style.left = '0px';
      root.style.zIndex = '2000';
      root.style.width = '100vw';
      root.style.height = '100dvh';
      root.style.maxHeight = '100dvh';
      var box = root.getBoundingClientRect();
      if (Math.abs(box.top) > 1 || Math.abs(box.left) > 1) {
        root.style.inset = 'auto';
        root.style.top = -box.top + 'px';
        root.style.left = -box.left + 'px';
        root.style.right = 'auto';
        root.style.bottom = 'auto';
        root.style.width = window.innerWidth + 'px';
        root.style.height = window.innerHeight + 'px';
        root.style.maxHeight = window.innerHeight + 'px';
      }
      document.body.style.overflow = 'hidden';
      var panels = root.querySelectorAll('[data-version-panel]');
      for (var p = 0; p < panels.length; p += 1) {
        panels[p].open = true;
      }
      fillMeta();
      return;
    }
    root.setAttribute('data-open', 'false');
    root.setAttribute('aria-modal', 'false');
    root.style.position = '';
    root.style.inset = '';
    root.style.top = '';
    root.style.right = '';
    root.style.bottom = '';
    root.style.left = '';
    root.style.zIndex = '';
    root.style.width = '';
    root.style.height = '';
    root.style.maxHeight = '';
    document.body.style.overflow = '';
    restoreOverflow();
  };
  root.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) {
      return;
    }
    if (target.closest('[data-schema-expand-open]')) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(true);
      return;
    }
    if (target.closest('[data-schema-expand-close]')) {
      event.preventDefault();
      setOpen(false);
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && root.getAttribute('data-open') === 'true') {
      setOpen(false);
    }
  });
})();`;
