export const SCHEMA_EDIT_RUNTIME = `(function () {
  var root = document.currentScript && document.currentScript.closest('[data-schema-edit]');
  if (!root || root.getAttribute('data-schema-edit-bound') === 'true') {
    return;
  }
  root.setAttribute('data-schema-edit-bound', 'true');
  var saveDialog = root.querySelector('[data-schema-save-dialog]');
  var cancelDialog = root.querySelector('[data-schema-cancel-dialog]');
  var enumDialog = root.querySelector('[data-schema-enum-dialog]');
  var addDialog = root.querySelector('[data-schema-add-dialog]');
  var activateInput = root.querySelector('[data-schema-activate-value]');
  var enumPathInput = root.querySelector('[data-schema-enum-path]');
  var enumChips = root.querySelector('[data-schema-enum-chips]');
  var enumField = root.querySelector('[data-schema-enum-field]');
  var addName = root.querySelector('[data-schema-add-name]');
  var addType = root.querySelector('[data-schema-add-type]');
  var isEditing = function () {
    return root.getAttribute('data-schema-editing') === 'true';
  };
  var showToast = function (title, body, severity) {
    document.dispatchEvent(
      new CustomEvent('console-toast', { detail: { title: title, body: body, severity: severity || 'success' } }),
    );
  };
  var setActivateOn = function (on) {
    var toggle = root.querySelector('[data-schema-activate-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    if (activateInput) {
      activateInput.value = on ? '1' : '0';
    }
  };
  var setOpen = function (dialog, open) {
    if (!dialog) {
      return;
    }
    dialog.setAttribute('data-open', open ? 'true' : 'false');
    dialog.style.display = open ? 'flex' : 'none';
  };
  var setEditing = function (open) {
    root.setAttribute('data-schema-editing', open ? 'true' : 'false');
    var starts = root.querySelectorAll('[data-schema-edit-start]');
    var saves = root.querySelectorAll('[data-schema-edit-save]');
    var cancels = root.querySelectorAll('[data-schema-edit-cancel]');
    var adds = root.querySelectorAll('[data-schema-add-field], [data-link-add]');
    var removes = root.querySelectorAll('[data-link-remove]');
    for (var s = 0; s < starts.length; s += 1) {
      starts[s].style.display = open ? 'none' : '';
    }
    for (var v = 0; v < saves.length; v += 1) {
      saves[v].style.display = open ? 'inline-flex' : 'none';
    }
    for (var c = 0; c < cancels.length; c += 1) {
      cancels[c].style.display = open ? 'inline-flex' : 'none';
    }
    for (var a = 0; a < adds.length; a += 1) {
      adds[a].style.display = open ? 'inline-flex' : 'none';
    }
    for (var r = 0; r < removes.length; r += 1) {
      removes[r].style.display = open ? 'inline-flex' : 'none';
    }
    if (!open) {
      setOpen(saveDialog, false);
      setOpen(cancelDialog, false);
      setOpen(enumDialog, false);
      setOpen(addDialog, false);
    }
    syncRows();
    syncAddType();
  };
  var selectValue = function (host) {
    var input = host && host.querySelector('[data-kit-select-value], [data-schema-class-value]');
    if (input) {
      return String(input.value || '');
    }
    var trigger = host && host.querySelector('[data-kit-select-trigger]');
    return trigger ? String(trigger.getAttribute('data-value') || '') : '';
  };
  var paintCaption = function (path) {
    var captions = root.querySelectorAll('[data-schema-enum-caption="' + path + '"]');
    var text = '[' + currentValues(path).join(', ') + ']';
    for (var c = 0; c < captions.length; c += 1) {
      captions[c].textContent = text;
    }
  };
  var syncRow = function (row) {
    if (!row) {
      return;
    }
    var shell = row.closest('[data-schema-row]') || row;
    var host = shell.querySelector('[data-schema-path-class]');
    var button = shell.querySelector('[data-schema-enum-edit]');
    var caption = shell.querySelector('[data-schema-enum-caption]');
    var mark = shell.querySelector('[data-schema-changed]');
    var nameInput = shell.querySelector('[data-schema-name-edit]');
    var path = button ? button.getAttribute('data-path') || '' : '';
    var selected = selectValue(host);
    var category = isEditing() && (selected === 'category' || selected === 'array:category');
    if (button && button.getAttribute('data-path') !== '__add__') {
      button.style.display = category ? 'inline-flex' : 'none';
    }
    if (caption) {
      caption.style.display = category ? 'inline' : 'none';
      if (category && path) {
        paintCaption(path);
      }
    }
    var dirtyType = host && selectValue(host) !== (host.getAttribute('data-original') || '');
    var draft = shell.querySelector('[data-enum-added]');
    var dirtyEnum = Boolean(draft && String(draft.value || '').trim());
    var dirtyName = Boolean(
      nameInput && String(nameInput.value || '') !== (nameInput.getAttribute('data-original') || ''),
    );
    if (mark) {
      mark.style.display = isEditing() && (dirtyType || dirtyEnum || dirtyName) ? 'inline-block' : 'none';
    }
  };
  var syncRows = function () {
    var rows = root.querySelectorAll('[data-schema-row], [data-schema-type-edit]');
    for (var i = 0; i < rows.length; i += 1) {
      syncRow(rows[i]);
    }
  };
  var syncAddType = function () {
    var button = addDialog && addDialog.querySelector('[data-schema-enum-edit]');
    if (!button) {
      return;
    }
    var selected = selectValue(addType);
    button.style.display =
      isEditing() && (selected === 'category' || selected === 'array:category') ? 'inline-flex' : 'none';
  };
  var isDirty = function () {
    var hosts = root.querySelectorAll('[data-schema-path-class]');
    for (var i = 0; i < hosts.length; i += 1) {
      var original = hosts[i].getAttribute('data-original') || '';
      if (selectValue(hosts[i]) !== original) {
        return true;
      }
    }
    var drafts = root.querySelectorAll('[data-enum-added]');
    for (var j = 0; j < drafts.length; j += 1) {
      if (String(drafts[j].value || '').trim()) {
        return true;
      }
    }
    var names = root.querySelectorAll('[data-schema-name-edit]');
    for (var n = 0; n < names.length; n += 1) {
      if (String(names[n].value || '') !== (names[n].getAttribute('data-original') || '')) {
        return true;
      }
    }
    if (root.querySelector('[data-schema-added-row], [data-link-removed], [data-link-added]')) {
      return true;
    }
    return false;
  };
  var resetLinks = function () {
    var added = root.querySelectorAll('[data-link-added]');
    for (var a = 0; a < added.length; a += 1) {
      if (added[a].parentNode) {
        added[a].parentNode.removeChild(added[a]);
      }
    }
    var removed = root.querySelectorAll('[data-link-removed]');
    for (var r = 0; r < removed.length; r += 1) {
      removed[r].removeAttribute('data-link-removed');
      removed[r].style.display = '';
      var inputs = removed[r].querySelectorAll('input');
      for (var i = 0; i < inputs.length; i += 1) {
        inputs[i].disabled = false;
      }
    }
  };
  var resetSelect = function (host) {
    var original = host.getAttribute('data-original') || '';
    var originalLabel = host.getAttribute('data-original-label') || original;
    var input = host.querySelector('[data-kit-select-value]');
    var trigger = host.querySelector('[data-kit-select-trigger]');
    var label = host.querySelector('[data-kit-select-label]');
    if (input) {
      input.value = original;
    }
    if (trigger) {
      trigger.setAttribute('data-value', original);
    }
    if (label) {
      label.textContent = originalLabel;
    }
    var items = host.querySelectorAll('[data-kit-select-menu] [data-value]');
    for (var i = 0; i < items.length; i += 1) {
      var selected = items[i].getAttribute('data-value') === original;
      items[i].setAttribute('aria-selected', selected ? 'true' : 'false');
      items[i].classList.toggle('Mui-selected', selected);
    }
  };
  var resetDrafts = function () {
    var drafts = root.querySelectorAll('[data-enum-added]');
    for (var i = 0; i < drafts.length; i += 1) {
      drafts[i].value = '';
    }
    var captions = root.querySelectorAll('[data-schema-enum-caption]');
    for (var j = 0; j < captions.length; j += 1) {
      var base = captions[j].getAttribute('data-original-values') || '';
      captions[j].textContent = base ? '[' + base + ']' : '';
    }
  };
  var resetNames = function () {
    var names = root.querySelectorAll('[data-schema-name-edit]');
    for (var i = 0; i < names.length; i += 1) {
      names[i].value = names[i].getAttribute('data-original') || '';
    }
  };
  var clearAdded = function () {
    var rows = root.querySelectorAll('[data-schema-added-row]');
    for (var i = 0; i < rows.length; i += 1) {
      rows[i].parentNode && rows[i].parentNode.removeChild(rows[i]);
    }
  };
  var resetAddForm = function () {
    if (addName) {
      addName.value = '';
    }
    if (addType) {
      resetSelect(addType);
      var input = addType.querySelector('[data-kit-select-value]');
      var trigger = addType.querySelector('[data-kit-select-trigger]');
      var label = addType.querySelector('[data-kit-select-label]');
      if (input) {
        input.value = 'free-text';
      }
      if (trigger) {
        trigger.setAttribute('data-value', 'free-text');
      }
      if (label) {
        label.textContent = 'string';
      }
    }
    var draft = root.querySelector('[data-enum-added="__add__"]');
    if (draft) {
      draft.value = '';
    }
    syncAddType();
  };
  var resetAll = function () {
    var hosts = root.querySelectorAll('[data-schema-path-class]');
    for (var i = 0; i < hosts.length; i += 1) {
      resetSelect(hosts[i]);
    }
    resetDrafts();
    resetNames();
    clearAdded();
    resetLinks();
    resetAddForm();
    setActivateOn(false);
    setEditing(false);
  };
  var currentValues = function (path) {
    var caption = root.querySelector('[data-schema-enum-caption="' + path + '"]');
    var original = caption ? caption.getAttribute('data-original-values') || '' : '';
    var draft = root.querySelector('[data-enum-added="' + CSS.escape(path) + '"]');
    if (!draft) {
      draft = root.querySelector('[data-enum-added="' + path + '"]');
    }
    var added = draft ? String(draft.value || '') : '';
    var list = (original + ',' + added)
      .split(',')
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
    var unique = [];
    for (var i = 0; i < list.length; i += 1) {
      if (unique.indexOf(list[i]) === -1) {
        unique.push(list[i]);
      }
    }
    return unique;
  };
  var renderEnumChips = function (values) {
    if (!enumChips) {
      return;
    }
    enumChips.textContent = '';
    if (values.length === 0) {
      var empty = document.createElement('span');
      empty.textContent = 'Пока нет значений';
      enumChips.appendChild(empty);
      return;
    }
    for (var i = 0; i < values.length; i += 1) {
      var chip = document.createElement('span');
      chip.setAttribute('data-enum-chip', '');
      chip.textContent = values[i];
      enumChips.appendChild(chip);
    }
  };
  var openEnumDialog = function (path) {
    if (!enumDialog || !enumPathInput) {
      return;
    }
    enumPathInput.textContent = path === '__add__' ? 'нового поля' : path;
    enumDialog.setAttribute('data-path', path);
    renderEnumChips(currentValues(path));
    if (enumField) {
      enumField.value = '';
    }
    setOpen(enumDialog, true);
  };
  var addEnumDraft = function () {
    var path = enumDialog && enumDialog.getAttribute('data-path');
    var value = enumField ? String(enumField.value || '').trim() : '';
    if (!path || !value) {
      return;
    }
    var hidden = root.querySelector('[data-enum-added="' + path + '"]');
    var current = hidden ? String(hidden.value || '') : '';
    var parts = current.split(',').map(function (item) { return item.trim(); }).filter(Boolean);
    if (parts.indexOf(value) === -1) {
      parts.push(value);
    }
    if (hidden) {
      hidden.value = parts.join(',');
    }
    renderEnumChips(currentValues(path));
    if (enumField) {
      enumField.value = '';
    }
    var row = root.querySelector('[data-schema-enum-edit][data-path="' + path + '"]');
    if (row) {
      syncRow(row.closest('[data-schema-row]') || row.closest('[data-schema-type-edit]'));
    }
    showToast(
      'Значение добавлено',
      'Оно попадёт в новую версию после сохранения. Текущий снимок не менялся.',
      'success',
    );
  };
  var validPath = function (value) {
    return /^[A-Za-z_][A-Za-z0-9_]*([.][A-Za-z_][A-Za-z0-9_]*)*$/.test(value);
  };
  var existingPaths = function () {
    var used = {};
    var rows = root.querySelectorAll('[data-schema-row][data-path]');
    for (var i = 0; i < rows.length; i += 1) {
      var path = rows[i].getAttribute('data-path') || '';
      if (!path || path.indexOf('__') === 0) {
        continue;
      }
      var nameInput = rows[i].querySelector('[data-schema-name-edit]');
      var next = nameInput ? String(nameInput.value || '').trim() : '';
      var parts = path.split('.');
      if (next && /^[A-Za-z_][A-Za-z0-9_]*$/.test(next) && parts.length) {
        parts[parts.length - 1] = next;
        used[parts.join('.')] = true;
      } else {
        used[path] = true;
      }
    }
    return used;
  };
  var appendAddedRow = function (path, classValue, classLabel, enumText) {
    var host = root.querySelector('[data-schema-added-host]');
    if (!host) {
      return;
    }
    var row = document.createElement('div');
    row.setAttribute('data-schema-added-row', '');
    row.setAttribute('data-schema-row', '');
    row.setAttribute('data-path', path);
    row.style.cssText = 'display:flex;align-items:center;column-gap:8px;min-height:40px;width:max-content;min-width:100%;font:inherit;';
    var mark = document.createElement('span');
    mark.setAttribute('data-schema-changed', '');
    mark.setAttribute('aria-label', 'Изменено');
    mark.style.cssText = 'display:inline-block;width:10px;height:10px;border-radius:50%;flex-shrink:0;background:#ff3d00;box-shadow:0 0 0 4px rgba(255,61,0,0.28);';
    var name = document.createElement('span');
    name.textContent = path;
    name.style.cssText = 'color:#3b4151;font-weight:600;min-width:140px;';
    var colon = document.createElement('span');
    colon.textContent = ':';
    colon.style.color = 'rgba(0,0,0,0.6)';
    var typeHost = document.createElement('span');
    typeHost.setAttribute('data-schema-path-class', '');
    typeHost.setAttribute('data-original', classValue);
    var typeInput = document.createElement('input');
    typeInput.type = 'hidden';
    typeInput.name = 'pathClass:' + path;
    typeInput.value = classValue;
    typeInput.setAttribute('data-schema-class-value', '');
    var typeLabel = document.createElement('span');
    typeLabel.textContent = classLabel;
    typeLabel.style.cssText = 'font-weight:600;min-width:78px;';
    typeHost.appendChild(typeInput);
    typeHost.appendChild(typeLabel);
    var caption = document.createElement('span');
    caption.setAttribute('data-schema-enum-caption', path);
    caption.setAttribute('data-original-values', '');
    caption.style.cssText = 'display:none;color:rgba(0,0,0,0.6);font-size:12px;white-space:nowrap;';
    caption.textContent = '[]';
    var edit = document.createElement('a');
    edit.setAttribute('data-schema-enum-edit', '');
    edit.setAttribute('data-path', path);
    edit.href = '#schema-enum';
    edit.textContent = 'Изменить';
    edit.style.cssText = 'display:none;font-size:12px;white-space:nowrap;';
    var enumInput = document.createElement('input');
    enumInput.type = 'hidden';
    enumInput.name = 'enumAdded:' + path;
    enumInput.value = enumText;
    enumInput.setAttribute('data-enum-added', path);
    row.appendChild(mark);
    row.appendChild(name);
    row.appendChild(colon);
    row.appendChild(typeHost);
    row.appendChild(caption);
    row.appendChild(edit);
    row.appendChild(enumInput);
    host.appendChild(row);
    syncRow(row);
  };
  var confirmAddField = function () {
    var path = addName ? String(addName.value || '').trim() : '';
    if (!validPath(path)) {
      showToast('Некорректное имя', 'Латиница, цифры и подчёркивание. Вложенность через точку.', 'error');
      return;
    }
    if (existingPaths()[path]) {
      showToast('Имя занято', 'Такой путь уже есть в схеме.', 'error');
      return;
    }
    var classValue = selectValue(addType) || 'free-text';
    var classLabel = addType && addType.querySelector('[data-kit-select-label]')
      ? String(addType.querySelector('[data-kit-select-label]').textContent || classValue)
      : classValue;
    var draft = root.querySelector('[data-enum-added="__add__"]');
    var enumText =
      (classValue === 'category' || classValue === 'array:category') && draft
        ? String(draft.value || '')
        : '';
    appendAddedRow(path, classValue, classLabel, enumText);
    if (draft) {
      draft.value = '';
    }
    resetAddForm();
    setOpen(addDialog, false);
    showToast('Поле добавлено', 'Оно попадёт в новую версию после сохранения.', 'success');
  };
  root.addEventListener(
    'click',
    function (event) {
      var node = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
      if (node && node.closest('[data-schema-name-edit]')) {
        event.stopPropagation();
      }
    },
    true,
  );
  root.addEventListener('click', function (event) {
    var node = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
    var start = node && node.closest('[data-schema-edit-start]');
    var activateRow = node && node.closest('[data-schema-activate-row]');
    if (activateRow) {
      event.preventDefault();
      var current = root.querySelector('[data-schema-activate-toggle]');
      setActivateOn(Boolean(current && current.getAttribute('aria-checked') !== 'true'));
      return;
    }
    if (start) {
      event.preventDefault();
      setEditing(true);
      showToast('Режим правки', 'Можно менять имена и типы, добавлять поля. Сохранение создаст новую версию схемы.', 'info');
      return;
    }
    var addOpen = node && node.closest('[data-schema-add-field]');
    if (addOpen) {
      event.preventDefault();
      resetAddForm();
      setOpen(addDialog, true);
      return;
    }
    var addBack = node && node.closest('[data-schema-add-back]');
    if (addBack) {
      event.preventDefault();
      setOpen(addDialog, false);
      return;
    }
    var addConfirm = node && node.closest('[data-schema-add-confirm]');
    if (addConfirm) {
      event.preventDefault();
      confirmAddField();
      return;
    }
    var save = node && node.closest('[data-schema-edit-save]');
    if (save) {
      event.preventDefault();
      if (!isDirty()) {
        setEditing(false);
        return;
      }
      setOpen(saveDialog, true);
      return;
    }
    var cancel = node && node.closest('[data-schema-edit-cancel]');
    if (cancel) {
      event.preventDefault();
      if (!isDirty()) {
        resetAll();
        return;
      }
      setOpen(cancelDialog, true);
      return;
    }
    var closeSave = node && node.closest('[data-schema-save-back]');
    if (closeSave) {
      event.preventDefault();
      setOpen(saveDialog, false);
      return;
    }
    var closeCancel = node && node.closest('[data-schema-cancel-back]');
    if (closeCancel) {
      event.preventDefault();
      setOpen(cancelDialog, false);
      return;
    }
    var discard = node && node.closest('[data-schema-cancel-confirm]');
    if (discard) {
      event.preventDefault();
      resetAll();
      showToast('Правки отменены', 'Схема вернулась к сохранённому снимку этой версии.', 'warning');
      return;
    }
    var enumEdit = node && node.closest('[data-schema-enum-edit]');
    if (enumEdit) {
      event.preventDefault();
      openEnumDialog(enumEdit.getAttribute('data-path') || '');
      return;
    }
    var enumBack = node && node.closest('[data-schema-enum-back]');
    if (enumBack) {
      event.preventDefault();
      setOpen(enumDialog, false);
      syncRows();
      syncAddType();
      return;
    }
    var enumAdd = node && node.closest('[data-schema-enum-add]');
    if (enumAdd) {
      event.preventDefault();
      addEnumDraft();
    }
  });
  root.addEventListener('change', function (event) {
    var target = event.target;
    if (target && target.hasAttribute && target.hasAttribute('data-kit-select-value')) {
      if (addType && addType.contains(target)) {
        syncAddType();
        return;
      }
      var row = target.closest('[data-schema-row]') || target.closest('[data-schema-type-edit]');
      if (row) {
        syncRow(row);
      } else {
        syncRows();
      }
    }
  });
  root.addEventListener('input', function (event) {
    var target = event.target;
    if (target && target.hasAttribute && target.hasAttribute('data-schema-name-edit')) {
      syncRow(target.closest('[data-schema-row]'));
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') {
      return;
    }
    if (enumDialog && enumDialog.getAttribute('data-open') === 'true') {
      setOpen(enumDialog, false);
      syncRows();
      syncAddType();
      return;
    }
    if (addDialog && addDialog.getAttribute('data-open') === 'true') {
      setOpen(addDialog, false);
      return;
    }
    if (saveDialog && saveDialog.getAttribute('data-open') === 'true') {
      setOpen(saveDialog, false);
      return;
    }
    if (cancelDialog && cancelDialog.getAttribute('data-open') === 'true') {
      setOpen(cancelDialog, false);
    }
  });
  syncRows();
  syncAddType();
})();`;
