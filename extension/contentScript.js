// contentScript.js
(function () {
  // Inject the page script directly
  const pageScript = document.createElement("script");
  pageScript.src = chrome.runtime.getURL("pageScript.js");
  
  pageScript.onload = function () {
    console.log("Page script loaded successfully");
  };
  
  // Add the page script to the document
  (document.head || document.documentElement).appendChild(pageScript);
})();