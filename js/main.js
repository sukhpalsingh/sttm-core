var db,
    new_search_timeout,
    electron  = false,
    cordova   = false,
    dbPath    = "./",
    storage;
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
  var storage = require("electron-json-storage");
  dbPath      = "../";
  scripts.unshift("../desktop_www/js/desktop_scripts.js");
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

//Settings
var settings = {};
storage.get('user-settings', function(error, data) {
  if (error) throw error;
  for (var key in defaults) {
    settings[key] = data[key] || defaults[key];
  }
});


if (scripts) {
  for (var key in scripts) {
    var s   = document.createElement("script");
    s.type  = "text/javascript";
    s.src   = scripts[key];
    document.body.appendChild(s);
  }
}


function typeSearch() {
  document.body.className = document.body.className.replace("home","");
  clearTimeout(new_search_timeout);
  new_search_timeout = setTimeout(search, 500);
}

function search() {
  var search_col;
  var search_query  = $search.value;
  switch (settings.searchType) {
    case 'fls':
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
  }
  if (search_query.length > 2) {
    var content = db.exec("SELECT _id, gurmukhi, shabad_no, source_id, ang_id, writer_id, raag_id FROM shabad WHERE " + search_col + " LIKE '" + db_query + "'");
    if (content.length > 0) {
      $results.innerHTML = "";
      content[0].values.forEach(function(item, i) {
        $results.innerHTML = $results.innerHTML + "<li><a href='#' class='panktee' data-shabad-id='" + item[2] + "' data-line-id='" + item[0] + "'><span class='result gurmukhi'>" + item[1] + "</span><span class='meta english'>" + sources[item[3]] + " - " + item[4] + "</span></a></li>";
      });
    } else {
      $results.innerHTML = "<li class='english'>No results.</li>";
    }
  } else {
    $results.innerHTML = "";
  }
}

function clickResult(e) {
  if (e.target.classList.contains("panktee") || e.target.parentElement.classList.contains("panktee")) {
    var $panktee  = (e.target.tagName == "A" ? e.target : e.target.parentElement);
    var ShabadID  = $panktee.dataset.shabadId;
    var LineID    = $panktee.dataset.lineId;
    $session.innerHTML = $session.innerHTML + '<li><a href="#" class="panktee" data-shabad-id="' + ShabadID + '" data-line-id="' + LineID + '">' + $panktee.children[0].innerText + '</a></li>';
    loadShabad(ShabadID);
  }
}

function clickSession(e) {
  if (e.target.classList.contains("panktee")) {
    var $panktee = e.target;
    var ShabadID = $panktee.dataset.shabadId;
    loadShabad(ShabadID);
  }
}

function loadShabad(ShabadID) {
  var content = db.exec("SELECT _id, gurmukhi FROM shabad WHERE shabad_no = '" + ShabadID + "'");
  if (content.length > 0) {
    $shabad.innerHTML = "";
    content[0].values.forEach(function(item, i) {
      $shabad.innerHTML = $shabad.innerHTML + '<li><a href="#" class="panktee" data-line-id="' + item[0] + '">' + item[1] + '</a></li>';
    });
  }
}

function clickShabad(e) {
  if (e.target.classList.contains("panktee")) {
    var $panktee = e.target;
    sendLine($panktee.dataset.lineId);
  }
}

function clickButtons(e) {
  if (e.target.classList.contains("msg")) {
    var $msg = e.target;
    sendText($msg.innerText);
  }
}

//If we're not in Electron, grab the database via AJAX
if (!electron) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', dbPath + 'gurbani.sqlite', true);
  xhr.responseType = 'arraybuffer';

  xhr.onload = function(e) {
    var uInt8Array = new Uint8Array(this.response);
    db = new SQL.Database(uInt8Array);
  };
  xhr.send();
}
