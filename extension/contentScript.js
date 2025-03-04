// contentScript.js
(function () {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("pageScript.js");
  (document.head || document.documentElement).appendChild(script);
  script.onload = function () {
    script.remove();
  };
})();
