const h = require('hyperscript');
const settings = require('./settings');

const menuButton = h(
  'a.menu-button.navigator-button',
  {
    onclick: () => {
      module.exports.toggleMenu();
    } },
  h('i.fa.fa-bars'));

module.exports = {
  settings,

  init() {
    document.querySelector('.navigator-left').appendChild(menuButton);
    settings.init();
  },

  toggleMenu() {
    document.querySelector('a.menu-button.navigator-button').classList.toggle('active');
    document.querySelector('#menu-page').classList.toggle('active');
  },
};
