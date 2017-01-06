var $search = document.getElementById("search");
var $shabad = document.getElementById("shabad");
var $shabadContainer = document.getElementById("shabad-container");
var $results = document.getElementById("results");
var $session = document.getElementById("session");
var $buttons = document.getElementById("buttons");

$search.addEventListener("keyup", typeSearch);
$shabad.addEventListener("click", clickShabad);
$results.addEventListener("click", clickResult);
$session.addEventListener("click", clickSession);
$buttons.addEventListener("click", clickButtons);

$search.focus();
