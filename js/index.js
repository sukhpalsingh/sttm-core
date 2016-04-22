var db,
    new_search_timeout;

var xhr = new XMLHttpRequest();
xhr.open('GET', '../gurbani.sqlite', true);
xhr.responseType = 'arraybuffer';

xhr.onload = function(e) {
  var uInt8Array = new Uint8Array(this.response);
  db = new SQL.Database(uInt8Array);
};
xhr.send();

var $search = document.getElementById("search");
var $results = document.getElementById("results");

$search.addEventListener("keyup", typeSearch);

function typeSearch() {
  clearTimeout(new_search_timeout);
  new_search_timeout = setTimeout(search, 500);
}

function search() {
  var search_query = $search.value;
  if (search_query.length > 2) {
    var content = db.exec("SELECT ID, Gurmukhi, ShabadID FROM Shabad WHERE FirstLetters LIKE '%" + search_query + "%'");
    if (content.length > 0) {
      $results.innerHTML = "";
      content[0].values.forEach(function(item, i) {
        $results.innerHTML = $results.innerHTML + "<li><a href='#'>" + item[1] + "</a></li>";
      });
    } else {
      $results.innerHTML = "<li class='english'>No results.</li>";
    }
  } else {
    $results.innerHTML = "";
  }
}