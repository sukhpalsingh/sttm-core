/* global platform */

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
let currentLine;
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
          rowSet.push(h(
            'button',
            {
              type: 'button',
              onclick: e => module.exports.clickKBButton(e, klButton.action),
            },
            (klButton.icon ? h(klButton.icon) : klButton.char)));
        } else {
          rowSet.push(h(
            'button',
            {
              type: 'button',
              onclick: e => module.exports.clickKBButton(e),
            },
            klButton));
        }
      });
      row.push(h('div.keyboard-row-set', rowSet));
    });
    page.push(h('div.keyboard-row', row));
  });
  kbPages.push(h(`div#gurmukhi-keyboard-page-${parseInt(i, 10) + 1}.page${(parseInt(i, 10) === 0 ? '.active' : '')}`, page));
});
const keyboard = h('div#gurmukhi-keyboard.gurmukhi', kbPages);

const sources = {
  G: 'Guru Granth Sahib',
  D: 'Dasam Granth Sahib',
  B: 'Vaaran',
  N: 'Gazals',
  A: 'Amrit Keertan',
  S: 'Vaaran',
};


module.exports = {
  currentShabad,
  currentLine,

  init() {
    document.querySelector('.search-div').appendChild(searchInputs);
    document.querySelector('.search-div').appendChild(keyboard);
    this.$gurmukhiKB = document.getElementById('gurmukhi-keyboard');
    this.$kbPages = this.$gurmukhiKB.querySelectorAll('.page');
    this.$search = document.getElementById('search');
    this.$results = document.getElementById('results');
    this.$session = document.getElementById('session');
    this.$sessionContainer = document.getElementById('session-container');
    this.$shabad = document.getElementById('shabad');
    this.$shabadContainer = document.getElementById('shabad-container');

    this.$search.focus();
  },

  // eslint-disable-next-line no-unused-vars
  focusSearch(e) {
    // open the Gurmukhi keyboard if it was previously open
    if (platform.getPref('gurmukhiKB')) {
      this.openGurmukhiKB();
    }
  },

  typeSearch(e) {
    // if a key is pressed in the Gurmukhi KB or is one of the allowed keys
    if (e === 'gKB' || (e.which <= 90 && e.which >= 48) || allowedKeys.indexOf(e.which) > -1) {
      // don't search if there is less than a 100ms gap in between key presses
      clearTimeout(newSearchTimeout);
      newSearchTimeout = setTimeout(() => this.search(), 100);
    }
  },

  // eslint-disable-next-line no-unused-vars
  toggleGurmukhiKB(e) {
    const gurmukhiKBPref = platform.getPref('gurmukhiKB');
    // no need to set a preference if user is just re-opening after KB was auto-closed
    if (!this.$gurmukhiKB.classList.contains('active') && gurmukhiKBPref) {
      this.openGurmukhiKB();
    } else {
      platform.setPref('gurmukhiKB', !gurmukhiKBPref);
      this.focusSearch();
      this.$gurmukhiKB.classList.toggle('active');
    }
  },

  openGurmukhiKB() {
    this.$gurmukhiKB.classList.add('active');
  },

  closeGurmukhiKB() {
    this.$gurmukhiKB.classList.remove('active');
  },

  clickKBButton(e, action = false) {
    const button = e.currentTarget;
    if (action) {
      if (action === 'bksp') {
        this.$search.value = this.$search.value.substring(0, this.$search.value.length - 1);
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
      // some buttons may have a different value than what is displayed on the key,
      // in which case use the data-value attribute
      const char = button.dataset.value || button.innerText;
      this.$search.value += char;
      // simulate a physical keyboard button press
      this.typeSearch('gKB');
    }
  },

  // eslint-disable-next-line no-unused-vars
  search(e) {
    const searchQuery = this.$search.value;
    const searchCol = 'v.FirstLetterStr';
    let dbQuery = '';
    for (let x = 0, len = searchQuery.length; x < len; x += 1) {
      let charCode = searchQuery.charCodeAt(x);
      if (charCode < 100) {
        charCode = `0${charCode}`;
      }
      dbQuery += `,${charCode}`;
    }
    // Add trailing wildcard
    dbQuery += '%';
    if (searchQuery.length > 1) {
      const query = `SELECT v.ID, v.Gurmukhi, v.English, v.Transliteration, s.ShabadID, v.SourceID, v.PageNo AS PageNo, w.WriterEnglish, r.RaagEnglish FROM Verse v
        LEFT JOIN Shabad s ON s.VerseID = v.ID AND s.ShabadID < 5000000
        LEFT JOIN Writer w USING(WriterID)
        LEFT JOIN Raag r USING(RaagID)
        WHERE ${searchCol} LIKE '${dbQuery}' LIMIT 0,20`;
      platform.db.all(query, (err, rows) => {
        if (rows.length > 0) {
          this.$results.innerHTML = '';
          rows.forEach((item) => {
            const resultNode = [];
            resultNode.push(h('span.gurmukhi', item.Gurmukhi));
            resultNode.push(h('span.transliteration.roman', item.Transliteration));
            resultNode.push(h('span.translation.english.roman', item.English));
            resultNode.push(h('span.meta.roman', `${sources[item.SourceID]} - ${item.PageNo} - ${item.RaagEnglish} - ${item.WriterEnglish}`));
            const result = h(
              'li',
              {},
              h(
                'a.panktee.search-result',
                {
                  onclick: ev => this.clickResult(ev, item.ShabadID, item.ID, item.Gurmukhi),
                },
                resultNode));
            this.$results.appendChild(result);
          });
        } else {
          this.$results.innerHTML = '';
          this.$results.appendChild(h(
            'li.roman',
            h('span', 'No results')));
        }
      });
    } else {
      this.$results.innerHTML = '';
    }
  },

  clickResult(e, ShabadID, LineID, Gurmukhi) {
    this.closeGurmukhiKB();
    const sessionItem = h(
      `li#session-${ShabadID}`,
      {},
      h(
        'a.panktee.current',
        {
          onclick: ev => this.clickSession(ev, ShabadID, LineID),
        },
        Gurmukhi));
    // get all the lines in the session block and remove the .current class from them
    const sessionLines = this.$session.querySelectorAll('a.panktee');
    Array.from(sessionLines).forEach(el => el.classList.remove('current'));
    // if the ShabadID of the clicked Panktee isn't in the sessionList variable,
    // add it to the variable
    if (sessionList.indexOf(ShabadID) < 0) {
      sessionList.push(ShabadID);
    } else {
      // if the ShabadID is already in the session, just remove the HTMLElement,
      // and leave the sessionList
      const line = this.$session.querySelector(`#session-${ShabadID}`);
      this.$session.removeChild(line);
    }
    // add the line to the top of the session block
    this.$session.insertBefore(sessionItem, this.$session.firstChild);
    // send the line to app.js, which will send it to the viewer window
    global.controller.sendLine(ShabadID, LineID);
    // load the Shabad into the controller
    this.loadShabad(ShabadID, LineID);
    // scroll the session block to the top to see the highlighted line
    this.$sessionContainer.scrollTop = 0;
  },

  loadShabad(ShabadID, LineID) {
    platform.db.all(`SELECT v.ID, v.Gurmukhi FROM Verse v LEFT JOIN Shabad s ON v.ID = s.VerseID WHERE s.ShabadID = '${ShabadID}' ORDER BY v.ID`, (err, rows) => {
      if (rows.length > 0) {
        // clear the Shabad controller and empty out the currentShabad array
        this.$shabad.innerHTML = '';
        currentShabad.splice(0, currentShabad.length);
        rows.forEach((item) => {
          const shabadLine = h(
            'li',
            {},
            h(
              `a#line${item.ID}.panktee${(parseInt(LineID, 10) === item.ID ? '.current.main' : '')}`,
              {
                onclick: e => this.clickShabad(e, ShabadID, item.ID),
              },
              [
                h('i.fa.fa-fw.fa-home'),
                ' ',
                item.Gurmukhi,
              ]));
          // write the Panktee to the controller
          this.$shabad.appendChild(shabadLine);
          // append the currentShabad array
          currentShabad.push(item.ID);
          if (LineID === item.ID) {
            currentLine = item.ID;
          }
        });
        // scroll the Shabad controller to the current Panktee
        const curPankteeTop = this.$shabad.querySelector('.current').parentNode.offsetTop;
        this.$shabadContainer.scrollTop = curPankteeTop;
      }
    });
  },

  clearSession() {
    while (this.$session.firstChild) {
      this.$session.removeChild(this.$session.firstChild);
      sessionList.splice(0, sessionList.length);
    }
  },

  clickSession(e, ShabadID, LineID) {
    const $panktee = e.target;
    this.loadShabad(ShabadID, LineID);
    const sessionLines = this.$session.querySelectorAll('a.panktee');
    Array.from(sessionLines).forEach(el => el.classList.remove('current'));
    $panktee.classList.add('current');
  },

  clickShabad(e, ShabadID, LineID) {
    const lines = this.$shabad.querySelectorAll('a.panktee');
    if (e.target.classList.contains('fa-home')) {
      // Change main line
      const $panktee = e.target.parentNode;
      Array.from(lines).forEach(el => el.classList.remove('main'));
      $panktee.classList.add('main');
    } else if (e.target.classList.contains('panktee')) {
      // Change line to click target
      const $panktee = e.target;
      currentLine = LineID;
      global.controller.sendLine(ShabadID, LineID);
      // Remove 'current' class from all Panktees
      Array.from(lines).forEach(el => el.classList.remove('current'));
      // Add 'current' to selected Panktee
      $panktee.classList.add('current');
    }
  },
};
