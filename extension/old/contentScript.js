// contentScript.js
(function () {
  // First, inject the styles
  const stylesScript = document.createElement("script");
  stylesScript.src = chrome.runtime.getURL("styles.js");
  
  // Add a delay to ensure the global styles object is fully initialized
  stylesScript.onload = function () {
    console.log("Styles loaded, waiting to ensure initialization...");
    
    // Wait a bit to ensure RevampStyles is fully initialized
    setTimeout(() => {
      console.log("Now loading page script...");
      
      // Then inject the main script that depends on the styles
      const pageScript = document.createElement("script");
      pageScript.src = chrome.runtime.getURL("pageScript.js");
      
      pageScript.onload = function () {
        console.log("Page script loaded successfully");
        
        // We'll keep both scripts loaded for the extension to work
        // as they interact with the page dynamically
      };
      
      (document.head || document.documentElement).appendChild(pageScript);
    }, 50); // Small delay to ensure styles initialization
  };
  
  // Add the styles script to the document
  (document.head || document.documentElement).appendChild(stylesScript);
})();
