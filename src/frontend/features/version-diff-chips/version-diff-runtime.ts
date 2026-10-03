export const VERSION_DIFF_RUNTIME = `
(function () {
  var root = document.currentScript && document.currentScript.closest('[data-version-diff]');
  if (!root || root.getAttribute('data-version-diff-bound') === 'true') {
    return;
  }
  root.setAttribute('data-version-diff-bound', 'true');
  var dialogs = root.querySelectorAll('[data-diff-dialog]');
  var setOpen = function (dialog, open) {
    if (!dialog) {
      return;
    }
    dialog.setAttribute('data-open', open ? 'true' : 'false');
    dialog.style.display = open ? 'flex' : 'none';
    if (open) {
      var close = dialog.querySelector('[data-diff-close]');
      if (close && close.focus) {
        close.focus();
      }
    }
  };
  var closeAll = function () {
    for (var i = 0; i < dialogs.length; i += 1) {
      setOpen(dialogs[i], false);
    }
  };
  root.addEventListener('click', function (event) {
    var node = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
    if (!node || !node.closest) {
      return;
    }
    var open = node.closest('[data-diff-open]');
    if (open) {
      event.preventDefault();
      var field = open.getAttribute('data-diff-open') || '';
      closeAll();
      setOpen(root.querySelector('[data-diff-dialog="' + field + '"]'), true);
      return;
    }
    if (node.closest('[data-diff-close]')) {
      event.preventDefault();
      closeAll();
      return;
    }
    if (node.hasAttribute('data-diff-dialog') && node.getAttribute('data-open') === 'true') {
      event.preventDefault();
      closeAll();
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeAll();
    }
  });
})();
`;
