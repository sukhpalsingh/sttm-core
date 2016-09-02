var db,
    new_search_timeout;

var $search = document.getElementById("search");
var $shabad = document.getElementById("shabad");
var $results = document.getElementById("results");
var $session = document.getElementById("session");
var $buttons = document.getElementById("buttons");

$search.addEventListener("keyup", typeSearch);
$shabad.addEventListener("click", clickShabad);
$results.addEventListener("click", clickResult);
$session.addEventListener("click", clickSession);
$buttons.addEventListener("click", clickButtons);

function typeSearch() {
  clearTimeout(new_search_timeout);
  new_search_timeout = setTimeout(search, 500);
}

function search() {
  var search_query = $search.value;
  if (search_query.length > 2) {
    getResults(search_query, parseResults);
  } else {
    $results.innerHTML = "";
  }
}

function parseResults(results) {
  var content = JSON.parse(results);
  if (content.length > 0) {
    $results.innerHTML = "";
    content.forEach(function(item, i) {
      $results.innerHTML = $results.innerHTML + "<li><a href='#' class='panktee' data-shabad-id='" + item.ShabadID + "'>" + item.Gurmukhi + "</a></li>";
    });
  } else {
    $results.innerHTML = "<li class='english'>No results.</li>";
  }
}

function clickResult(e) {
  if (e.target.classList.contains("panktee")) {
    var $panktee = e.target;
    var ShabadID = $panktee.dataset.shabadId;
    console.log(ShabadID);
    $session.innerHTML = $session.innerHTML + '<li><a href="#" class="panktee" data-shabad-id="' + ShabadID + '">' + $panktee.innerText + '</a></li>';
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

function writeShabadLines(results) {
  var content = JSON.parse(results);
  if (content.length > 0) {
    $shabad.innerHTML = "";
    content.forEach(function(item, i) {
      $shabad.innerHTML = $shabad.innerHTML + '<li><a href="#" class="panktee">' + item.Gurmukhi + '</a></li>';
    });
  }
}

function clickShabad(e) {
  if (e.target.classList.contains("panktee")) {
    var $panktee = e.target;
    sendText($panktee.innerText);
  }
}

function clickButtons(e) {
  if (e.target.classList.contains("msg")) {
    var $msg = e.target;
    sendText($msg.innerText);
  }
}

if (typeof getResults !== 'function') {
  function getResults(search_query, callback) {
    localRequest("search=" + search_query, callback);
  }
}

if (typeof loadShabad !== 'function') {
  function loadShabad(ShabadID) {
    localRequest("shabad=" + ShabadID, writeShabadLines);
  }
}

function localRequest(query, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', "http://127.0.0.1/bani.php?" + query, true);

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      // Success!
      if (typeof callback == "function") {
        callback(this.response);
      }
    }
  };
  request.send();
}
