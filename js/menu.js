const h = require('hyperscript');
const settings = require('./settings');

const menuButton = h(
  'a.menu-button.navigator-button',
  {
    onclick: () => {
      module.exports.toggleMenu();
    } },
  h('i.fa.fa-bars'));
const closeButton = h(
  'a.close-button.navigator-button',
  {
    onclick: () => {
      module.exports.toggleMenu();
    } },
  h('i.fa.fa-times'));

module.exports = {
  settings,

  init() {
    const $navigatorLeft = document.querySelector('.navigator-left');
    $navigatorLeft.appendChild(menuButton);
    $navigatorLeft.appendChild(closeButton);
    settings.init();
  },

  toggleMenu() {
    document.querySelector('a.menu-button.navigator-button').classList.toggle('active');
    document.querySelector('a.close-button.navigator-button').classList.toggle('active');
    document.querySelector('#menu-page').classList.toggle('active');
  },
};
