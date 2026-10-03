export const ACTIVE_VERSION_WATCH_RUNTIME = `(function () {
  var prefix = 'mock-generator:active-versions:';
  var noneLabel = 'нет';
  var pageKey = location.pathname + location.search;
  if (window.__activeVersionWatchPage !== pageKey) {
    window.__activeVersionWatchPage = pageKey;
    window.__activeVersionWatchShown = false;
    window.__activeVersionWatchChanges = null;
  }
  var ensureStyle = function () {
    if (document.getElementById('active-version-watch-style')) {
      return;
    }
    var style = document.createElement('style');
    style.id = 'active-version-watch-style';
    style.textContent =
      'html[data-active-version-open="true"] [data-active-version-dialog]{display:flex!important;}';
    document.head.appendChild(style);
  };
  var run = function (root) {
    if (!root) {
      return;
    }
    var dialog = root.querySelector('[data-active-version-dialog]');
    var rows = root.querySelector('[data-active-version-rows]');
    var jsonNode = root.querySelector('[data-active-version-snapshot]');
    var readJson = function () {
      if (!jsonNode || !jsonNode.textContent) {
        return null;
      }
      try {
        return JSON.parse(jsonNode.textContent);
      } catch (error) {
        return null;
      }
    };
    var snapshot = readJson();
    if (!snapshot || !snapshot.contour || !Array.isArray(snapshot.items)) {
      return;
    }
    var storageKey = prefix + snapshot.contour;
    var readStore = function () {
      try {
        return window.localStorage.getItem(storageKey);
      } catch (error) {
        return null;
      }
    };
    var writeStore = function () {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ contour: snapshot.contour, items: snapshot.items }),
        );
      } catch (error) {
        return;
      }
    };
    var parseStored = function (raw) {
      if (!raw) {
        return null;
      }
      try {
        var parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.items)) {
          return null;
        }
        return parsed.items
          .map(function (item) {
            if (!item || typeof item.documentType !== 'string' || !item.documentType) {
              return null;
            }
            var versionId = typeof item.versionId === 'string' && item.versionId ? item.versionId : null;
            return {
              documentType: item.documentType,
              title: typeof item.title === 'string' && item.title ? item.title : item.documentType,
              versionId: versionId,
              caption: typeof item.caption === 'string' && item.caption ? item.caption : versionId || noneLabel,
            };
          })
          .filter(Boolean);
      } catch (error) {
        return null;
      }
    };
    var diff = function (previous, current) {
      var previousByType = {};
      previous.forEach(function (item) {
        previousByType[item.documentType] = item;
      });
      var currentTypes = {};
      var changes = [];
      current.forEach(function (item) {
        currentTypes[item.documentType] = true;
        var was = previousByType[item.documentType];
        var wasId = was && was.versionId ? was.versionId : null;
        var nowId = item.versionId ? item.versionId : null;
        if (wasId === nowId) {
          return;
        }
        changes.push({
          title: item.title,
          was: was ? was.caption : noneLabel,
          became: nowId ? item.caption : noneLabel,
        });
      });
      previous.forEach(function (was) {
        if (currentTypes[was.documentType] || !was.versionId) {
          return;
        }
        changes.push({
          title: was.title,
          was: was.caption,
          became: noneLabel,
        });
      });
      return changes.sort(function (left, right) {
        return left.title.localeCompare(right.title, 'ru');
      });
    };
    var setOpen = function (open) {
      ensureStyle();
      document.documentElement.setAttribute(
        'data-active-version-open',
        open ? 'true' : 'false',
      );
      if (dialog) {
        dialog.setAttribute('data-open', open ? 'true' : 'false');
        dialog.style.display = open ? 'flex' : 'none';
      }
    };
    var fillRows = function (changes) {
      if (!rows) {
        return;
      }
      rows.textContent = '';
      changes.forEach(function (change) {
        var tr = document.createElement('tr');
        [change.title, change.was, change.became].forEach(function (text) {
          var td = document.createElement('td');
          td.textContent = text;
          tr.appendChild(td);
        });
        rows.appendChild(tr);
      });
    };
    var bindDismiss = function () {
      var closeBtn = root.querySelector('[data-active-version-dismiss]');
      if (!closeBtn || closeBtn.getAttribute('data-bound') === 'true') {
        return;
      }
      closeBtn.setAttribute('data-bound', 'true');
      closeBtn.addEventListener('click', function (event) {
        event.preventDefault();
        window.__activeVersionWatchShown = false;
        window.__activeVersionWatchChanges = null;
        writeStore();
        setOpen(false);
      });
    };
    if (snapshot.ready === false || snapshot.items.length === 0) {
      if (!window.__activeVersionWatchShown) {
        setOpen(false);
      }
      return;
    }
    var previous = parseStored(readStore());
    if (previous === null || previous.length === 0) {
      writeStore();
      setOpen(false);
      return;
    }
    var changes = diff(previous, snapshot.items);
    if (changes.length === 0) {
      if (window.__activeVersionWatchShown && window.__activeVersionWatchChanges) {
        fillRows(window.__activeVersionWatchChanges);
        setOpen(true);
        bindDismiss();
        return;
      }
      writeStore();
      setOpen(false);
      return;
    }
    window.__activeVersionWatchShown = true;
    window.__activeVersionWatchChanges = changes;
    writeStore();
    fillRows(changes);
    setOpen(true);
    bindDismiss();
  };
  var scan = function () {
    var nodes = document.querySelectorAll('[data-active-version-watch]');
    for (var i = 0; i < nodes.length; i += 1) {
      run(nodes[i]);
    }
  };
  scan();
  setTimeout(scan, 0);
  setTimeout(scan, 50);
})();`;
