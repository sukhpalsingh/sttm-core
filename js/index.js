var $search = document.getElementById("search");
var $shabad = document.getElementById("shabad");
var $shabadContainer = document.getElementById("shabad-container");
var $results = document.getElementById("results");
const $session = document.getElementById("session");
const $sessionContainer = document.getElementById("session-container");
var $buttons = document.getElementById("buttons");
var $changelog = document.getElementById("changelogModal");
const $actions = document.querySelectorAll(".action");
const $settings = document.getElementById("settings");

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

Mousetrap.bind("esc", escKey);
Mousetrap.bind(['up', 'left'], prevLine);
Mousetrap.bind(['down', 'right'], nextLine);

function escKey() {
  if ($settings.classList.contains("animated")) {
    closeSettings();
  }
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

function openSettings() {
  $settings.classList.add("animated", "fadeInUp");
  $search.blur();
}
function closeSettings() {
  $settings.classList.add("fadeOutDown");
  setTimeout(() => {
    $settings.classList.remove("animated", "fadeInUp", "fadeOutDown");
  }, 300);
}
