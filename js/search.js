/* global platform globals */

// functions to be able to communicate with app.js
const controller = require('../../desktop_www/js/controller');
// Gurmukhi keyboard layout file
const keyboardLayout = require('./keyboard.json');
// HTMLElement builder
const h = require('hyperscript');

// the non-character keys that will register as a keypress when searching
const allowedKeys = [
  8,  // Backspace
  32, // Spacebar
  46, // Delete
];
const sessionList = [];
const currentShabad = [];
const kbPages = [];
let newSearchTimeout;

// build the search bar and toggles and append to HTML
const searchInputs = h('div#search-container', [
  h(
    'input#search.gurmukhi',
    {
      type: 'search',
      placeholder: 'Koj',
      onfocus: e => module.exports.focusSearch(e),
      onkeyup: e => module.exports.typeSearch(e),
    }),
  h(
    'button#gurmukhi-keyboard-toggle',
    {
      type: 'button',
      onclick: e => module.exports.toggleGurmukhiKB(e),
    },
    h('i.fa.fa-keyboard-o')),
]);
document.querySelector('.search-div').appendChild(searchInputs);

// build the Gurmukhi keyboard and append to HTML
Object.keys(keyboardLayout).forEach((i) => {
  const klPage = keyboardLayout[i];
  const page = [];

  Object.keys(klPage).forEach((j) => {
    const klRow = klPage[j];
    const row = [];

    Object.keys(klRow).forEach((k) => {
      const klRowSet = klRow[k];
      const rowSet = [];

      Object.keys(klRowSet).forEach((l) => {
        const klButton = klRowSet[l];
        if (typeof klButton === 'object') {
          rowSet.push(h('button', { type: 'button', onclick: e => module.exports.clickKBButton(e, klButton.action) }, (klButton.icon ? h(klButton.icon) : klButton.char)));
        } else {
          rowSet.push(h('button', { type: 'button', onclick: e => module.exports.clickKBButton(e) }, klButton));
        }
      });
      row.push(h('div.keyboard-row-set', rowSet));
    });
    page.push(h('div.keyboard-row', row));
  });
  kbPages.push(h(`div#gurmukhi-keyboard-page-${parseInt(i, 10) + 1}.page${(parseInt(i, 10) === 0 ? '.active' : '')}`, page));
});
const keyboard = h('div#gurmukhi-keyboard.gurmukhi', kbPages);
document.querySelector('.search-div').appendChild(keyboard);

const sources = {
  G: 'Guru Granth Sahib',
  D: 'Dasam Granth Sahib',
  B: 'Vaaran',
  N: 'Gazals',
  A: 'Amrit Keertan',
};

const $mainUI = document.getElementById('main-ui');
const $search = document.getElementById('search');
const $results = document.getElementById('results');
const $gurmukhiKB = document.getElementById('gurmukhi-keyboard');
const $session = document.getElementById('session');
const $sessionContainer = document.getElementById('session-container');
const $shabad = document.getElementById('shabad');
const $shabadContainer = document.getElementById('shabad-container');

module.exports = {
  $gurmukhiKB,
  $search,
  $results,
  $kbPages: $gurmukhiKB.querySelectorAll('.page'),

  // eslint-disable-next-line no-unused-vars
  focusSearch(e) {
    if (platform.getPref('gurmukhiKB')) {
      this.openGurmukhiKB();
    }
    if (!$mainUI.classList.contains('home')) {
      $mainUI.classList.add('search');
    }
  },

  typeSearch(e) {
    if (e === 'gKB' || (e.which <= 90 && e.which >= 48) || allowedKeys.indexOf(e.which) > -1) {
      document.body.classList.remove('home');
      $mainUI.classList.add('search');
      clearTimeout(newSearchTimeout);
      newSearchTimeout = setTimeout(() => this.search(), 100);
    }
  },

  // eslint-disable-next-line no-unused-vars
  toggleGurmukhiKB(e) {
    const gurmukhiKBPref = platform.getPref('gurmukhiKB');
    if (!$gurmukhiKB.classList.contains('active') && gurmukhiKBPref) {
      this.openGurmukhiKB();
    } else {
      platform.setPref('gurmukhiKB', !gurmukhiKBPref);
      this.focusSearch();
      $gurmukhiKB.classList.toggle('active');
    }
  },

  openGurmukhiKB() {
    $gurmukhiKB.classList.add('active');
  },

  closeGurmukhiKB() {
    $gurmukhiKB.classList.remove('active');
  },

  clickKBButton(e, action = false) {
    const button = e.currentTarget;
    if (action) {
      if (action === 'bksp') {
        $search.value = $search.value.substring(0, $search.value.length - 1);
        this.typeSearch('gKB');
      } else if (action === 'close') {
        this.toggleGurmukhiKB();
      } else if (action.includes('page')) {
        Array.from(this.$kbPages).forEach((el) => {
          el.classList.remove('active');
        });
        document.getElementById(`gurmukhi-keyboard-${action}`).classList.add('active');
      }
    } else {
      const char = button.dataset.value || button.innerText;
      $search.value += char;
      this.typeSearch('gKB');
    }
  },

  // eslint-disable-next-line no-unused-vars
  search(e) {
    const searchQuery = $search.value;

    const searchCol = 'first_ltr_start';
    let dbQuery = '';
    for (let x = 0, len = searchQuery.length; x < len; x += 1) {
      let charCode = searchQuery.charCodeAt(x);
      if (charCode < 100) {
        charCode = `0${charCode}`;
      }
      dbQuery += `${charCode},`;
    }
    // Strip trailing comma and add a wildcard
    dbQuery = `${dbQuery.substr(0, dbQuery.length - 1)}%`;
    if (searchQuery.length > 2) {
      platform.db.all(`SELECT s._id, s.gurmukhi, s.english_ssk, s.english_bms, s.transliteration, s.shabad_no, s.source_id, s.ang_id, w.writer_english AS writer, r.raag_english AS raag FROM shabad s JOIN writer w ON s.writer_id = w._id JOIN raag r ON s.raag_id = r._id WHERE ${searchCol} LIKE '${dbQuery}'`, (err, rows) => {
        if (rows.length > 0) {
          $results.innerHTML = '';
          rows.forEach((item) => {
            const resultNode = [];
            resultNode.push(h('span.gurmukhi', item.gurmukhi));
            resultNode.push(h('span.transliteration.roman', item.transliteration));

            const translationEnglish = platform.getUserPref('searchResults.translationEnglish') || 'ssk';
            resultNode.push(h('span.translation.english.roman', item[`english_${translationEnglish}`]));
            resultNode.push(h('span.meta.roman', `${sources[item.source_id]} - ${item.ang_id} - ${item.raag} - ${item.writer}`));
            const result = h(
              'li',
              {},
              // eslint-disable-next-line no-underscore-dangle
              h(
                'a.panktee.search-result',
                {
                  'data-shabad-id': item.shabad_no,
                  'data-line-id': item._id,
                  onclick: ev => this.clickResult(ev, item.shabad_no, item._id),
                },
                resultNode));
            $results.appendChild(result);
          });
        } else {
          $results.innerHTML = "<li class='roman'><span>No results</span></li>";
        }
      });
    } else {
      $results.innerHTML = '';
    }
  },

  clickResult(e, ShabadID, LineID) {
    this.closeGurmukhiKB();
    if (e.target.classList.contains('panktee') || e.target.parentElement.classList.contains('panktee')) {
      $mainUI.classList.add('shabad');
      $mainUI.classList.remove('search');
      const $panktee = (e.target.tagName === 'A' ? e.target : e.target.parentElement);
      const sessionLines = $session.querySelectorAll('a.panktee');
      Array.from(sessionLines).forEach(el => el.classList.remove('current'));
      if (sessionList.indexOf(ShabadID) < 0) {
        const sessionItem = h(
          'li',
          {},
          h(
            'a.panktee.current',
            {
              'data-shabad-id': ShabadID,
              'data-line-id': LineID,
              onclick: ev => this.clickSession(ev, ShabadID, LineID),
            },
            $panktee.children[0].innerText));
        $session.insertBefore(sessionItem, $session.firstChild);
        sessionList.push(ShabadID);
      } else {
        const line = $session.querySelector(`[data-shabad-id='${ShabadID}']`);
        if (line.dataset.lineId !== LineID) {
          line.dataset.lineId = LineID;
          line.classList.add('current');
          line.innerText = $panktee.children[0].innerText;
          $session.insertBefore(line.parentNode, $session.firstChild);
        }
      }
      controller.sendLine(ShabadID, LineID);
      this.loadShabad(ShabadID, LineID);
      $sessionContainer.scrollTop = 0;
    }
  },

  loadShabad(ShabadID, LineID) {
    platform.db.all(`SELECT _id, gurmukhi FROM shabad WHERE shabad_no = '${ShabadID}'`, (err, rows) => {
      if (rows.length > 0) {
        $shabad.innerHTML = '';
        currentShabad.splice(0, currentShabad.length);
        rows.forEach((item) => {
          const shabadLine = h(
            'li',
            {},
            h(
              `a#line${item._id}.panktee${(parseInt(LineID, 10) === item._id ? '.current.main' : '')}`,
              {
                onclick: e => this.clickShabad(e, ShabadID, item._id),
              },
              [
                h('i.fa.fa-fw.fa-home'),
                ' ',
                item.gurmukhi,
              ]));
          $shabad.appendChild(shabadLine);
          currentShabad.push(item._id);
          if (LineID === item._id) {
            globals.currentLine = item._id;
          }
        });
        const curPankteeTop = $shabad.querySelector('.current').parentNode.offsetTop;
        $shabadContainer.scrollTop = curPankteeTop;
      }
    });
  },

  clearSession() {
    while ($session.firstChild) {
      $session.removeChild($session.firstChild);
      sessionList.splice(0, sessionList.length);
    }
  },

  clickSession(e, ShabadID, LineID) {
    const $panktee = e.target;
    this.loadShabad(ShabadID, LineID);
    const sessionLines = $session.querySelectorAll('a.panktee');
    Array.from(sessionLines).forEach(el => el.classList.remove('current'));
    $panktee.classList.add('current');
  },

  clickShabad(e, ShabadID, LineID) {
    const lines = $shabad.querySelectorAll('a.panktee');
    if (e.target.classList.contains('fa-home')) {
      // Change main line
      const $panktee = e.target.parentNode;
      Array.from(lines).forEach(el => el.classList.remove('main'));
      $panktee.classList.add('main');
    } else if (e.target.classList.contains('panktee')) {
      // Change line to click target
      const $panktee = e.target;
      globals.currentLine = LineID;
      controller.sendLine(ShabadID, LineID);
      // Remove 'current' class from all Panktees
      Array.from(lines).forEach(el => el.classList.remove('current'));
      // Add 'current' to selected Panktee
      $panktee.classList.add('current');
    }
  },
};
