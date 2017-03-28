/* global platform */

const appVersion = require('../package.json').version;
const marked = require('marked');
const fs = require('fs');
const path = require('path');

document.getElementById('app-version').innerText = `v${appVersion}`;

const changelogMD = fs.readFileSync(path.resolve(__dirname, '../../CHANGELOG'), 'utf8');

const $changelogModal = document.getElementById('changelog-modal');
const $changelog = document.getElementById('changelog');
const $search = document.getElementById('search');

$changelog.innerHTML = marked(changelogMD);

function clickChangelog(e) {
  if (e.target.classList.contains('modal-overlay')) {
    module.exports.closeChangelog();
  }
}

$changelogModal.addEventListener('click', clickChangelog);

module.exports = {
  checkChangelogVersion() {
    const lastSeen = platform.getPref('changelog-seen');
    if (lastSeen !== appVersion) {
      $search.blur();
      this.openChangelog();
    }
  },

  openChangelog() {
    $changelogModal.classList.add('is-active');
  },

  closeChangelog() {
    $changelogModal.classList.remove('is-active');
    platform.setPref('changelog-seen', appVersion);
  },
};
