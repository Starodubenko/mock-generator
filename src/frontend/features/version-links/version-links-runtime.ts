export const VERSION_LINKS_RUNTIME = `
(function () {
  var root = document.currentScript && document.currentScript.closest('[data-schema-edit]');
  if (!root || root.getAttribute('data-version-links-bound') === 'true') {
    return;
  }
  root.setAttribute('data-version-links-bound', 'true');
  var host = root.querySelector('[data-version-link-rows]');
  var dialog = root.querySelector('[data-link-add-dialog]');
  var readSelect = function (attr) {
    var wrap = root.querySelector('[' + attr + ']');
    var input = wrap && wrap.querySelector('[data-kit-select-value]');
    if (input) {
      return String(input.value || '');
    }
    var trigger = wrap && wrap.querySelector('[data-kit-select-trigger]');
    return trigger ? String(trigger.getAttribute('data-value') || '') : '';
  };
  var nextIndex = function () {
    var rows = root.querySelectorAll('[data-version-link-row]');
    return String(rows.length);
  };
  var hide = function (node) {
    if (node) {
      node.style.display = 'none';
    }
  };
  var show = function (node) {
    if (node) {
      node.style.display = 'flex';
    }
  };
  var hidden = function (name, value) {
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    return input;
  };
  var addRow = function (fields) {
    if (!host) {
      return;
    }
    var index = nextIndex();
    var row = document.createElement('tr');
    row.setAttribute('data-version-link-row', '');
    row.setAttribute('data-link-added', 'true');
    Object.keys(fields).forEach(function (key) {
      row.appendChild(hidden(key + ':' + index, fields[key]));
    });
    var kindCell = document.createElement('td');
    kindCell.textContent = fields.linkKind || '';
    var scopeCell = document.createElement('td');
    scopeCell.textContent = fields.linkScope || fields.linkArray || fields.linkRemoteType || 'документ';
    var pathsCell = document.createElement('td');
    pathsCell.textContent = fields.linkPaths || [fields.linkParent, fields.linkChild, fields.linkEarlier, fields.linkLater, fields.linkLocal].filter(Boolean).join(' → ');
    var action = document.createElement('td');
    var remove = document.createElement('button');
    remove.type = 'button';
    remove.setAttribute('data-link-remove', '');
    remove.textContent = 'Удалить';
    action.appendChild(remove);
    row.appendChild(kindCell);
    row.appendChild(scopeCell);
    row.appendChild(pathsCell);
    row.appendChild(action);
    host.appendChild(row);
    var empty = root.querySelector('[data-version-links-empty]');
    if (empty) {
      empty.style.display = 'none';
    }
  };
  root.addEventListener('click', function (event) {
    var node = event.target;
    if (!node || !node.closest) {
      return;
    }
    if (node.closest('[data-link-remove]')) {
      event.preventDefault();
      var row = node.closest('[data-version-link-row]');
      if (!row) {
        return;
      }
      if (row.getAttribute('data-link-added') === 'true') {
        if (row.parentNode) {
          row.parentNode.removeChild(row);
        }
        return;
      }
      row.setAttribute('data-link-removed', 'true');
      row.style.display = 'none';
      var inputs = row.querySelectorAll('input');
      for (var i = 0; i < inputs.length; i += 1) {
        inputs[i].disabled = true;
      }
      return;
    }
    if (node.closest('[data-link-add]')) {
      event.preventDefault();
      show(dialog);
      return;
    }
    if (node.closest('[data-link-add-back]')) {
      event.preventDefault();
      hide(dialog);
      return;
    }
    if (node.closest('[data-link-add-confirm]')) {
      event.preventDefault();
      var selected = readSelect('data-link-add-kind') || 'parent-child';
      var fields = { linkKind: selected };
      if (selected === 'parent-child') {
        var arrayPath = readSelect('data-link-add-array');
        var childFull = readSelect('data-link-add-child');
        fields.linkParent = readSelect('data-link-add-parent');
        fields.linkArray = arrayPath;
        fields.linkChild = arrayPath && childFull.indexOf(arrayPath + '.') === 0
          ? childFull.slice(arrayPath.length + 1)
          : childFull;
      } else if (selected === 'equality') {
        fields.linkScope = 'document';
        fields.linkPaths = [readSelect('data-link-add-parent'), readSelect('data-link-add-paths')].filter(Boolean).join(',');
      } else if (selected === 'date-order') {
        fields.linkEarlier = readSelect('data-link-add-earlier');
        fields.linkLater = readSelect('data-link-add-later');
      } else {
        fields.linkLocal = readSelect('data-link-add-local');
        fields.linkRemoteType = readSelect('data-link-add-remote-type') || 'document';
        fields.linkRemoteField = readSelect('data-link-add-remote-field') || 'id';
      }
      addRow(fields);
      hide(dialog);
    }
  });
})();
`;
