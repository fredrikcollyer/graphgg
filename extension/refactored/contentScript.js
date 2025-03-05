// contentScript.js
(function() {
  const scripts = [
    "dataExtraction.js", 
    "dataProcessing.js",
    "calculations.js",
    "visualization.js",
    "uiEnhancements.js", // Contains styling needed by other modules
    "observers.js",
    "pageScript.js"  // Main script must be last
  ];
  
  function injectNextScript(index) {
    if (index >= scripts.length) return;
    
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL(scripts[index]);
    
    script.onload = () => {
      console.log(`Loaded ${scripts[index]}`);
      injectNextScript(index + 1);
    };
    
    (document.head || document.documentElement).appendChild(script);
  }
  
  // Start injection sequence
  console.log("PokerCraft Extension: Starting script injection sequence");
  injectNextScript(0);
})();