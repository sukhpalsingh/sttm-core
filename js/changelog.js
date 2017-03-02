const marked      = require("marked");
const fs          = require("fs");
const path        = require("path");

const changelogMD = fs.readFileSync(path.resolve(__dirname, "../../CHANGELOG"), "utf8");

const $changelogModal = document.getElementById("changelogModal");
const $changelog      = document.getElementById("changelog");

$changelog.innerHTML = marked(changelogMD);

$changelogModal.addEventListener("click", clickChangelog);

function clickChangelog(e) {
  if (e.target.classList.contains("modal-overlay")) {
    module.exports.closeChangelog();
  }
}

module.exports = {
  checkChangelogVersion: function() {
    let last_seen = platform.getPref("changelog-seen");
    if (last_seen != appVersion) {
      $search.blur();
      this.openChangelog();
    }
  },

  openChangelog: function() {
    $changelogModal.classList.add("is-active");
  },

  closeChangelog: function() {
    $changelogModal.classList.remove("is-active");
    platform.setPref("changelog-seen", appVersion);
  }
}
