const $logo             = document.getElementById("logo");
const $search           = document.getElementById("search");
const $mainUI           = document.getElementById("main-ui");
const $shabad           = document.getElementById("shabad");
const $shabadContainer  = document.getElementById("shabad-container");
const $results          = document.getElementById("results");
const $session          = document.getElementById("session");
const $sessionContainer = document.getElementById("session-container");
const $buttons          = document.getElementById("buttons");
const $actions          = document.querySelectorAll(".action");
const $headers          = document.querySelectorAll(".block-list header");

const Settings          = require('../desktop_www/js/settings');
const settings          = new Settings(platform.store);

const searchBar         = require("./js/search-bar");
const changelog         = require("./js/changelog");

$logo.addEventListener("click", clickLogo);
$search.addEventListener("focus", focusSearch);
$search.addEventListener("keyup", typeSearch);
$shabad.addEventListener("click", clickShabad);
$results.addEventListener("click", clickResult);
$session.addEventListener("click", clickSession);
$buttons.addEventListener("click", clickButtons);
//Allow any link with "action" class to execute a function name in "data-action"
Array.from($actions).forEach(el => el.addEventListener("click", e => eval(el.dataset.action + "()")));
Array.from($headers).forEach(el => el.addEventListener("click", clickHeader));

function clickLogo() {
  $mainUI.classList.remove("search");
  document.body.classList.add("home");
  $search.value = "";
  $search.focus();
}

window.onload = () => {
  $search.focus();
  changelog.checkChangelogVersion();
}

Mousetrap.bindGlobal("esc", escKey);
Mousetrap.bind(['up', 'left'], prevLine);
Mousetrap.bind(['down', 'right'], nextLine);
Mousetrap.bind("/", () => $search.focus(), "keyup");
Mousetrap.bind("space", spaceBar);

function escKey() {
  if (settings.$settings.classList.contains("animated")) {
    settings.closeSettings();
  }
}
function spaceBar(e) {
  const mainLineID = $shabad.querySelector("a.panktee.main").dataset.lineId;
  highlightLine(mainLineID);
  e.preventDefault();
}
function prevLine() {
  //Find position of current line in Shabad
  let pos = currentShabad.indexOf(currentLine);
  if (pos > 0) {
    highlightLine(currentShabad[pos-1]);
  }
}
function nextLine() {
  //Find position of current line in Shabad
  let pos = currentShabad.indexOf(currentLine);
  if (pos < (currentShabad.length-1)) {
    highlightLine(currentShabad[pos+1]);
  }
}
function highlightLine(new_line) {
  let $line = $shabad.querySelector("#line" + new_line);
  $line.click();
  let cur_panktee_top   = $line.parentNode.offsetTop;
  let cur_panktee_height  = $line.parentNode.offsetHeight;
  let container_top     = $shabadContainer.scrollTop;
  let container_height  = $shabadContainer.offsetHeight;

  if (container_top > cur_panktee_top) {
    $shabadContainer.scrollTop = cur_panktee_top;
  }
  if (container_top + container_height < cur_panktee_top + cur_panktee_height) {
    $shabadContainer.scrollTop = cur_panktee_top - container_height + cur_panktee_height;
  }
}

function clickHeader(e) {
  $mainUI.classList.toggle("search");
}
