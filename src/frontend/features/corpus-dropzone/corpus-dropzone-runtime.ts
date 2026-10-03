export const CORPUS_DROPZONE_RUNTIME = `(function () {
  var root = document.currentScript && document.currentScript.parentElement;
  if (!root) {
    return;
  }
  var input = root.querySelector('input[name="corpus"]');
  var list = root.querySelector('[data-corpus-file-list]');
  var zone = root.querySelector('[data-corpus-dropzone]');
  if (!input || !list || !zone) {
    return;
  }
  var isCorpus = function (file) {
    var name = String(file.name || '').toLowerCase();
    return (
      name.slice(-5) === '.json' ||
      name.slice(-7) === '.ndjson' ||
      name.slice(-6) === '.jsonl' ||
      file.type === 'application/json'
    );
  };
  var pick = function (files) {
    var out = [];
    for (var i = 0; i < files.length && out.length < 10; i += 1) {
      if (isCorpus(files[i])) {
        out.push(files[i]);
      }
    }
    return out;
  };
  var assign = function (files) {
    var transfer = new DataTransfer();
    for (var i = 0; i < files.length; i += 1) {
      transfer.items.add(files[i]);
    }
    input.files = transfer.files;
  };
  var sizeLabel = function (bytes) {
    if (bytes < 1024) {
      return bytes + ' Б';
    }
    if (bytes < 1024 * 1024) {
      return Math.round(bytes / 1024) + ' КБ';
    }
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };
  var render = function () {
    var files = Array.prototype.slice.call(input.files || []);
    list.replaceChildren();
    files.forEach(function (file, index) {
      var row = document.createElement('div');
      row.setAttribute('data-corpus-file-row', '');
      var meta = document.createElement('span');
      meta.setAttribute('data-corpus-file-meta', '');
      var name = document.createElement('span');
      name.setAttribute('data-corpus-file-name', '');
      name.textContent = file.name;
      var size = document.createElement('span');
      size.setAttribute('data-corpus-file-size', '');
      size.textContent = sizeLabel(file.size);
      meta.appendChild(name);
      meta.appendChild(size);
      var remove = document.createElement('button');
      remove.type = 'button';
      remove.setAttribute('data-corpus-remove', '');
      remove.textContent = 'Удалить';
      remove.addEventListener('click', function (event) {
        event.preventDefault();
        assign(
          files.filter(function (_, fileIndex) {
            return fileIndex !== index;
          }),
        );
        render();
      });
      row.appendChild(meta);
      row.appendChild(remove);
      list.appendChild(row);
    });
    if (files.length) {
      input.setAttribute('data-filled', 'true');
    } else {
      input.removeAttribute('data-filled');
    }
  };
  input.addEventListener('change', function () {
    assign(pick(input.files || []));
    render();
  });
  var depth = 0;
  zone.addEventListener('dragenter', function (event) {
    event.preventDefault();
    depth += 1;
    zone.setAttribute('data-drag', 'true');
  });
  zone.addEventListener('dragover', function (event) {
    event.preventDefault();
  });
  zone.addEventListener('dragleave', function () {
    depth -= 1;
    if (depth <= 0) {
      depth = 0;
      zone.removeAttribute('data-drag');
    }
  });
  zone.addEventListener('drop', function (event) {
    event.preventDefault();
    depth = 0;
    zone.removeAttribute('data-drag');
    assign(pick(event.dataTransfer ? event.dataTransfer.files : []));
    render();
  });
  render();
})();`;
