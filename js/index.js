/* global Mousetrap */
const search = require('./search');
const menu = require('./menu');

/* const Settings = require('../../js/settings');
const settings = new Settings(platform.store); */

function escKey() {
  /* if (settings.$settings.classList.contains('animated')) {
    settings.closeSettings();
  } */
}

function highlightLine(newLine) {
  const $line = search.$shabad.querySelector(`#line${newLine}`);
  $line.click();
  const curPankteeTop = $line.parentNode.offsetTop;
  const curPankteeHeight = $line.parentNode.offsetHeight;
  const containerTop = search.$shabadContainer.scrollTop;
  const containerHeight = search.$shabadContainer.offsetHeight;

  if (containerTop > curPankteeTop) {
    search.$shabadContainer.scrollTop = curPankteeTop;
  }
  if (containerTop + containerHeight < curPankteeTop + curPankteeHeight) {
    search.$shabadContainer.scrollTop = (curPankteeTop - containerHeight) + curPankteeHeight;
  }
}

function spaceBar(e) {
  const mainLineID = search.$shabad.querySelector('a.panktee.main').dataset.lineId;
  highlightLine(mainLineID);
  e.preventDefault();
}

function prevLine() {
  // Find position of current line in Shabad
  const pos = search.currentShabad.indexOf(search.currentLine);
  if (pos > 0) {
    highlightLine(search.currentShabad[pos - 1]);
  }
}

function nextLine() {
  // Find position of current line in Shabad
  const pos = search.currentShabad.indexOf(search.currentLine);
  if (pos < (search.currentShabad.length - 1)) {
    highlightLine(search.currentShabad[pos + 1]);
  }
}

// Keyboard shortcuts
Mousetrap.bindGlobal('esc', escKey);
Mousetrap.bind(['up', 'left'], prevLine);
Mousetrap.bind(['down', 'right'], nextLine);
Mousetrap.bind('/', () => search.$search.focus(), 'keyup');
Mousetrap.bind('space', spaceBar);

module.exports = {
  menu,
  search,
};
