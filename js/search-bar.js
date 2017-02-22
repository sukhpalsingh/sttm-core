const keyboardLayout  = require("./keyboard.json");
const pages           = [];
for (i in keyboardLayout) {
  const klPage  = keyboardLayout[i];
  const page    = [];

  for (j in klPage) {
    const klRow = klPage[j];
    const row   = [];

    for (k in klRow) {
      const klRowSet  = klRow[k];
      const rowSet    = [];

      for (l in klRowSet) {
        const klButton = klRowSet[l];
        if (typeof klButton === "object") {
          rowSet.push(h("button", { type: "button", "data-kbAction": klButton.action }, klButton.char));
        } else {
          rowSet.push(h("button", { type: "button" }, klButton));
        }
      }
      row.push(h("div", { class: "keyboard-row-set" }, rowSet));
    }
    page.push(h("div", { class: "keyboard-row" }, row));
  }
  pages.push(h("div", { id: "gurmukhi-keyboard-page-" + (parseInt(i)+1), class: "page" + (i == 0 ? " active" : "") }, page));
}
const keyboard = h("div", { id: "gurmukhi-keyboard", class: "gurmukhi" }, pages);
document.getElementById("search_div").appendChild(keyboard);

const $gurmukhiKBToggle   = document.getElementById("gurmukhi-keyboard-toggle");
const $gurmukhiKB         = document.getElementById("gurmukhi-keyboard");
const $gurmukhiKBButtons  = $gurmukhiKB.querySelectorAll("button");

module.exports = {
  $search: document.getElementById("search"),
  $gurmukhiKB: $gurmukhiKB,
  $kbPages: $gurmukhiKB.querySelectorAll(".page"),
  toggleGurmukhiKB: function(e) {
    const gurmukhiKBPref = platform.getPref("gurmukhiKB");
    if (!$gurmukhiKB.classList.contains("active") && gurmukhiKBPref) {
      this.openGurmukhiKB();
    } else {
      platform.setPref("gurmukhiKB", !gurmukhiKBPref);
      focusSearch();
      $gurmukhiKB.classList.toggle("active");
    }
  },

  openGurmukhiKB: function() {
    $gurmukhiKB.classList.add("active");
  },

  closeGurmukhiKB: function() {
    $gurmukhiKB.classList.remove("active");
  },

  clickKBButton: function(e) {
    const button  = e.currentTarget;
    const action  = button.dataset.kbaction;
    const $search = this.$search;
    if (action) {
      if (action == "bksp") {
        $search.value = $search.value.substring(0, $search.value.length-1);
        typeSearch("gKB");
      } else if (action == "close") {
        this.toggleGurmukhiKB();
      } else if (action.includes("page")) {
        Array.from(this.$kbPages).forEach(el => {
          el.classList.remove("active")
        });
        document.getElementById("gurmukhi-keyboard-" + action).classList.add("active");
      }
    } else {
      const char = button.dataset.value || button.innerText;
      $search.value = $search.value + char;
      typeSearch("gKB");
    }
  }
}

$gurmukhiKBToggle.addEventListener("click", e => module.exports.toggleGurmukhiKB(e));
Array.from($gurmukhiKBButtons).forEach(el => {
  el.addEventListener("click", e => module.exports.clickKBButton(e))
});
