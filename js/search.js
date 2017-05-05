// Gurmukhi keyboard layout file
const keyboardLayout = require('./keyboard.json');
const pageNavJSON = require('./footer-left.json');
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
  h('div#search-bg'),
  h(
    'button#search-options-toggle',
    {
      type: 'button',
      onclick: e => module.exports.toggleSearchOptions(e),
    },
    h('i.fa.fa-cog')),
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

const searchTypes = ['First Letter Start (Gurmukhi)', 'First Letter Anywhere (Gurmukhi)', 'Full Word (Gurmukhi)', 'English Translations (Full Word)'];
const searchType = parseInt(global.platform.getPref('searchOptions.searchType'), 10);

const searchTypeOptions = searchTypes.map((string, value) => h('option', { value }, string));

const searchOptions = h('div#search-options',
  h('select#search-type',
    {
      onchange() {
        module.exports.changeSearchType(parseInt(this.value, 10));
      },
    },
    searchTypeOptions));

searchOptions.querySelector('#search-type').value = searchType;

const navPageLinks = [];
Object.keys(pageNavJSON).forEach((id) => {
  navPageLinks.push(h('li',
    h(`a#${id}-pageLink`,
      {
        onclick: () => module.exports.navPage(id) },
      h(`i.fa.fa-${pageNavJSON[id].icon}`))));
});
const footerNav = h('ul.menu-bar', navPageLinks);

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
  searchType,

  init() {
    document.querySelector('.search-div').appendChild(searchInputs);
    document.querySelector('.search-div').appendChild(keyboard);
    document.querySelector('.search-div').appendChild(searchOptions);
    document.querySelector('#footer .menu-group-left').appendChild(footerNav);
    this.$searchPage = document.getElementById('search-page');
    this.$search = document.getElementById('search');
    this.$searchType = document.getElementById('search-type');
    this.$results = document.getElementById('results');
    this.$session = document.getElementById('session');
    this.$sessionContainer = document.querySelector('#session-page .block-list');
    this.$shabad = document.getElementById('shabad');
    this.$shabadContainer = document.querySelector('#shabad-page .block-list');
    this.$gurmukhiKB = document.getElementById('gurmukhi-keyboard');
    this.$kbPages = this.$gurmukhiKB.querySelectorAll('.page');
    this.$navPages = document.querySelectorAll('.nav-page');
    this.$navPageLinks = document.querySelectorAll('#footer .menu-group-left a');

    this.navPage('search');
    this.$search.focus();
    this.changeSearchType(this.searchType);
  },

  // eslint-disable-next-line no-unused-vars
  focusSearch(e) {
    // open the Gurmukhi keyboard if it was previously open
    if (global.platform.getPref('gurmukhiKB')) {
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

  // eslint-disable-next-line
  toggleSearchOptions(e) {
    this.$searchPage.classList.toggle('search-options-open');
  },

  changeSearchType(value) {
    this.searchType = value;
    this.search();
    global.platform.setPref('searchOptions.searchType', this.searchType);
    if (value >= 3) {
      this.$search.classList.add('roman');
      this.$search.classList.remove('gurmukhi');
    } else {
      this.$search.classList.remove('roman');
      this.$search.classList.add('gurmukhi');
    }
    document.body.classList.remove('searchResults_translationEnglish', 'searchResults_transliteration');
    switch (value) {
      case 3:
        document.body.classList.add('searchResults_translationEnglish');
        break;
      default:
        break;
    }
    this.$search.placeholder = this.$searchType.options[this.$searchType.selectedIndex].label;
    this.$search.focus();
  },

  // eslint-disable-next-line no-unused-vars
  toggleGurmukhiKB(e) {
    const gurmukhiKBPref = global.platform.getPref('gurmukhiKB');
    // no need to set a preference if user is just re-opening after KB was auto-closed
    if (!this.$gurmukhiKB.classList.contains('active') && gurmukhiKBPref) {
      this.openGurmukhiKB();
    } else {
      global.platform.setPref('gurmukhiKB', !gurmukhiKBPref);
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
    if (searchQuery.length > 1) {
      global.platform.search.search(searchQuery, this.searchType);
    } else {
      this.$results.innerHTML = '';
    }
  },

  printResults(rows) {
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
  },

  clickResult(e, ShabadID, LineID, Gurmukhi) {
    document.body.classList.remove('home');
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
    this.navPage('shabad');
  },

  loadShabad(ShabadID, LineID) {
    // clear the Shabad controller and empty out the currentShabad array
    this.$shabad.innerHTML = '';
    currentShabad.splice(0, currentShabad.length);
    global.platform.search.loadShabad(ShabadID, LineID);
  },

  printShabad(rows, ShabadID, LineID) {
    rows.forEach((item) => {
      const shabadLine = h(
        'li',
        {},
        h(
          `a#line${item.ID}.panktee${(parseInt(LineID, 10) === item.ID ? '.current.main' : '')}`,
          {
            'data-line-id': item.ID,
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
        this.currentLine = item.ID;
      }
    });
    // scroll the Shabad controller to the current Panktee
    const curPankteeTop = this.$shabad.querySelector('.current').parentNode.offsetTop;
    this.$shabadContainer.scrollTop = curPankteeTop;
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
    this.navPage('shabad');
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
      this.currentLine = LineID;
      global.controller.sendLine(ShabadID, LineID);
      // Remove 'current' class from all Panktees
      Array.from(lines).forEach(el => el.classList.remove('current'));
      // Add 'current' to selected Panktee
      $panktee.classList.add('current');
    }
  },

  navPage(page) {
    this.$navPages.forEach(($navPage) => {
      $navPage.classList.remove('active');
    });
    this.$navPageLinks.forEach(($navPageLink) => {
      $navPageLink.classList.remove('active');
    });
    document.querySelector(`#${page}-page`).classList.add('active');
    document.querySelector(`#${page}-pageLink`).classList.add('active');
  },
};
