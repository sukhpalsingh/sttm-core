var new_search_timeout,
    electron        = false,
    cordova         = false;
const sessionList   = [];
const currentShabad = [];
let currentLine     = null;
const allowedKeys = [
  8,  //Backspace
  32, //Spacebar
  46  //Delete
]
var sources = {
  "G": "Guru Granth Sahib",
  "D": "Dasam Granth Sahib",
  "B": "Vaaran",
  "N": "Gazals",
  "A": "Amrit Keertan"
}
if (!scripts) {
  var scripts = [];
}

//Check if we're in Electron
if (window && window.process && window.process.type == "renderer") {
  electron    = true;
  scripts.unshift("../desktop_www/js/desktop_scripts.js");
  scripts.push("../desktop_www/js/controller.js");
}

//Defaults
var defaults = {
  searchType:     "fls",
  bgColour:       "#333",
  view:           "slide",
  slideTemplate:  [
    {
      tag:    "h1",
      data:   "gurmukhi",
      colour: "#fff"
    },
    {
      tag:    "h2",
      data:   "english_ssk",
      colour:  "#ccc"
    },
    {
      tag:    "h2",
      data:   "transliteration",
      colour: "#ffc"
    },
    {
      tag:    "h2",
      data:   "sggs_darpan",
      colour: "#cff"
    }
  ]
}

if (scripts) {
  for (var key in scripts) {
    var s   = document.createElement("script");
    s.type  = "text/javascript";
    s.src   = scripts[key];
    document.body.appendChild(s);
  }
}

function typeSearch(e) {
  if (e.which <= 90 && e.which >= 48 || allowedKeys.indexOf(e.which) > -1) {
    document.body.classList.remove("home");
    clearTimeout(new_search_timeout);
    new_search_timeout = setTimeout(search, 100);
  }
}

function search() {
  var search_col;
  var search_query  = $search.value;
  
  search_col    = "first_ltr_start";
  var db_query  = '';
  for (var x = 0, len = search_query.length; x < len; x++) {
      var charCode = search_query.charCodeAt(x);
      if (charCode < 100) {
          charCode = '0' + charCode;
      }
      db_query += charCode + ',';
  }
  //Strip trailing comma and add a wildcard
  db_query = db_query.substr(0, db_query.length - 1) + '%';
  if (search_query.length > 2) {
    db.all("SELECT s._id, s.gurmukhi, s.english_ssk, s.english_bms, s.transliteration, s.shabad_no, s.source_id, s.ang_id, w.writer_english AS writer, r.raag_english AS raag FROM shabad s JOIN writer w ON s.writer_id = w._id JOIN raag r ON s.raag_id = r._id WHERE " + search_col + " LIKE '" + db_query + "'", function(err, rows) {
      if (rows.length > 0) {
        $results.innerHTML = "";
        rows.forEach(function(item, i) {
          let searchResultsPrefs = getPref("searchResults");
          let resultNode = [];
          resultNode.push(h("span", { "class": "result gurmukhi" }, item.gurmukhi));
          if (searchResultsPrefs.transliteration) {
            resultNode.push(h("span", { "class": "result english" }, item.transliteration));
          }
          if (searchResultsPrefs.translationEnglish) {
            resultNode.push(h("span", { "class": "result english" }, item["english_" + searchResultsPrefs.translationEnglish]));
          }
          resultNode.push(h("span", { "class": "meta english" }, sources[item.source_id] + " - " + item.ang_id + " - " + item.raag + " - " + item.writer));
          let result = h(
            'li',
            {},
            h(
              'a',
              {
                "class": "panktee",
                "data-shabad-id": item.shabad_no,
                "data-line-id": item._id
              },
              resultNode
            )
          );
          $results.appendChild(result);
        });
      } else {
       $results.innerHTML = "<li class='english'><span>No results</span></li>";
      }
    });
  } else {
    $results.innerHTML = "";
  }
}

function clickResult(e) {
  if (e.target.classList.contains("panktee") || e.target.parentElement.classList.contains("panktee")) {
    let $panktee  = (e.target.tagName == "A" ? e.target : e.target.parentElement);
    let ShabadID  = $panktee.dataset.shabadId;
    let LineID    = $panktee.dataset.lineId;
    let sessionLines = $session.querySelectorAll("a.panktee");
    Array.from(sessionLines).forEach(el => el.classList.remove("current"));
    if (sessionList.indexOf(ShabadID) < 0) {
      let sessionItem = h(
        'li',
        {},
        h(
          'a',
          {
            "class": "panktee current",
            "data-shabad-id": ShabadID,
            "data-line-id": LineID
          },
          $panktee.children[0].innerText
        )
      );
      $session.insertBefore(sessionItem, $session.firstChild);
      sessionList.push(ShabadID);
    } else {
      let line = $session.querySelector("[data-shabad-id='" + ShabadID + "']");
      if (line.dataset.lineId != LineID) {
        line.dataset.lineId = LineID;
        line.classList.add("current");
        line.innerText = $panktee.children[0].innerText;
        $session.insertBefore(line.parentNode, $session.firstChild);
      }
    }
    sendLine(LineID);
    loadShabad(ShabadID, LineID);
    $sessionContainer.scrollTop = 0;
  }
}

function clearSession() {
  while ($session.firstChild) {
    $session.removeChild($session.firstChild);
    sessionList.splice(0,sessionList.length);
  }
}
function clickSession(e) {
  if (e.target.classList.contains("panktee")) {
    let $panktee  = e.target;
    let ShabadID  = $panktee.dataset.shabadId;
    let LineID    = $panktee.dataset.lineId;
    loadShabad(ShabadID, LineID);
    let session_lines = $session.querySelectorAll('a.panktee');
    Array.from(session_lines).forEach(el => el.classList.remove("current"));
    $panktee.classList.add("current");
  }
}

function loadShabad(ShabadID, LineID) {
  db.all("SELECT _id, gurmukhi FROM shabad WHERE shabad_no = '" + ShabadID + "'", function(err, rows) {
    if (rows.length > 0) {
      $shabad.innerHTML = "";
      currentShabad.splice(0, currentShabad.length);
      rows.forEach(function(item, i) {
        let shabadLine = h(
          'li',
          {},
          h(
            'a',
            {
              "class": "panktee" + (LineID == item._id ? " current" : ""),
              "data-line-id": item._id,
              "id": "line" + item._id
            },
            item.gurmukhi
          )
        );
        $shabad.appendChild(shabadLine);
        currentShabad.push(item._id);
        if (LineID == item._id) {
          currentLine = item._id;
        }
      });
      var cur_panktee_top = $shabad.querySelector(".current").parentNode.offsetTop;
      $shabadContainer.scrollTop = cur_panktee_top;
    }
  });
}

function clickShabad(e) {
  if (e.target.classList.contains("panktee")) {
    let $panktee = e.target;
    currentLine = parseInt($panktee.dataset.lineId);
    sendLine(currentLine);
    //Remove 'current' class from all Panktees
    let lines = $shabad.querySelectorAll("a.panktee");
    Array.from(lines).forEach(el => el.classList.remove("current"));
    //Add 'current' to selected Panktee
    $panktee.classList.add("current");
  }
}

function clickButtons(e) {
  if (e.target.classList.contains("msg")) {
    var $msg = e.target;
    sendText($msg.innerText);
  }
}

function checkChangelogVersion() {
  let last_seen = getPref("changelog-seen");
  if (last_seen != appVersion) {
    $search.blur();
    openChangelog();
  }
}
function clickChangelog(e) {
  var classList = e.target.classList;
  if (classList.contains("modal-overlay") || classList.contains("close-button")) {
    $changelog.classList.remove("is-active");
    setPref("changelog-seen", appVersion);
  }
}
function openChangelog() {
  $changelog.classList.add("is-active");
}


function h(type = 'div', attributes = { }, children = '') {
  let el = document.createElement(type);

  Object.keys(attributes).forEach(key => {
    let value = attributes[key];
    if (typeof value === 'function') {
      el.addEventListener(key, e => value(e), false);
    } else {
      el.setAttribute(key, value);
    }
  });

  if (children instanceof Array) {
    children.forEach(child => el.appendChild(child));
  } else if (children instanceof HTMLElement) {
    el.appendChild(children);
  } else if (typeof children === 'string') {
    el.textContent = children;
  }

  return el;
}
