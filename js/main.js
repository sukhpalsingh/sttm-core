var db,
    new_search_timeout,
    electron    = false,
    cordova     = false,
    dbPath      = "./",
    storage,
    sessionList = [];
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
  var dbPath  = "../";
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
    var stmt = db.prepare("SELECT _id, gurmukhi, shabad_no, source_id, ang_id, writer_id, raag_id FROM shabad WHERE " + search_col + " LIKE '" + db_query + "'");
    var rows = stmt.all();
    if (rows.length > 0) {
      $results.innerHTML = "";
      rows.forEach(function(item, i) {
        $results.innerHTML = $results.innerHTML + "<li><a href='#' class='panktee' data-shabad-id='" + item.shabad_no + "' data-line-id='" + item._id + "'><span class='result gurmukhi'>" + item.gurmukhi + "</span><span class='meta english'>" + sources[item.source_id] + " - " + item.ang_id + "</span></a></li>";
      });
    } else {
     $results.innerHTML = "<li class='english'><span>No results</span></li>";
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
    if (sessionList.indexOf(ShabadID) < 0) {
      $session.innerHTML = $session.innerHTML + '<li><a href="#" class="panktee" data-shabad-id="' + ShabadID + '" data-line-id="' + LineID + '">' + $panktee.children[0].innerText + '</a></li>';
      sessionList.push(ShabadID);
    } else {
      var line = $session.querySelector("[data-shabad-id='" + ShabadID + "']");
      if (line.dataset.lineId != LineID) {
        line.dataset.lineId = LineID;
        line.innerText = $panktee.children[0].innerText;
      }
    }
    sendLine(LineID);
    loadShabad(ShabadID, LineID);
  }
}

function clickSession(e) {
  if (e.target.classList.contains("panktee")) {
    var $panktee  = e.target;
    var ShabadID  = $panktee.dataset.shabadId;
    var LineID    = $panktee.dataset.lineId;
    loadShabad(ShabadID, LineID);
  }
}

function loadShabad(ShabadID, LineID) {
  var stmt = db.prepare("SELECT _id, gurmukhi FROM shabad WHERE shabad_no = '" + ShabadID + "'");
  var rows = stmt.all();
  if (rows.length > 0) {
    $shabad.innerHTML = "";
    rows.forEach(function(item, i) {
      $shabad.innerHTML = $shabad.innerHTML + '<li><a href="#" class="panktee' + (LineID == item._id ? ' current' : '') + '" data-line-id="' + item._id + '">' + item.gurmukhi + '</a></li>';
    });
  }
}

function clickShabad(e) {
  if (e.target.classList.contains("panktee")) {
    var $panktee = e.target;
    sendLine($panktee.dataset.lineId);
    //Remove 'current' class from all Panktees
    var lines = $shabad.querySelectorAll("a.panktee");
    Array.prototype.forEach.call(lines, function(el, i){
      el.classList.remove("current");
    });
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
