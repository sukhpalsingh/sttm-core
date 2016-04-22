var db;

var xhr = new XMLHttpRequest();
console.log("xhr.open");
xhr.open('GET', '../gurbani.sqlite', true);
xhr.responseType = 'arraybuffer';

xhr.onload = function(e) {
  var uInt8Array = new Uint8Array(this.response);
  db = new SQL.Database(uInt8Array);
  //var contents = db.exec("SELECT DISTINCT source_id FROM shabad");
  //console.dir(contents);// contents is now [{columns:['col1','col2',...], values:[[first row], [second row], ...]}]
};
xhr.send();

var $search = document.getElementById("search");
var $results = document.getElementById("results");

function search() {
  var search_query = $search.value;
  if (search_query.length > 2) {
    $results.innerHTML = "";
    var content = db.exec("SELECT ID, Gurmukhi, ShabadID FROM Shabad WHERE FirstLetters LIKE '%" + search_query + "%'");
    if (content.length > 0) {
      content[0].values.forEach(function(item, i) {
        $results.innerHTML = $results.innerHTML + "<div><a href='#'>" + item[1] + "</a></div>";
      });
    }
  }
}