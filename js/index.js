var $search = document.getElementById("search");
var $shabad = document.getElementById("shabad");
var $shabadContainer = document.getElementById("shabad-container");
var $results = document.getElementById("results");
var $session = document.getElementById("session");
var $buttons = document.getElementById("buttons");
var $changelog = document.getElementById("changelogModal");
const $actions = document.querySelectorAll(".action");

$search.addEventListener("keyup", typeSearch);
$shabad.addEventListener("click", clickShabad);
$results.addEventListener("click", clickResult);
$session.addEventListener("click", clickSession);
$buttons.addEventListener("click", clickButtons);
$changelog.addEventListener("click", clickChangelog);
//Allow any link with "action" class to execute a function name in "data-action"
Array.from($actions).forEach(el => el.addEventListener("click", e => eval(el.dataset.action + "()")));

window.onload = () => {
  $search.focus();
  checkChangelogVersion();
}
