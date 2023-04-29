window.onload = function () {
  chrome.tabs.create({ url: "tab.html" }, tab => { });
}