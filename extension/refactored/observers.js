// observers.js
(function() {
  // Initialize namespace
  window.PokerCraftExt = window.PokerCraftExt || {};
  
  // Expose observer setup function
  window.PokerCraftExt.setupDomObserver = function(callbacks) {
    console.log("Setting up DOM observers...");
    
    try {
      // Validate callbacks
      if (!callbacks) {
        console.error("No callbacks provided for observer setup");
        return false;
      }
      
      // Setup observers for various UI elements
      setupButtonObserver(callbacks);
      setupRouteObserver(callbacks);
      
      return true;
    } catch (error) {
      console.error("Error setting up DOM observers:", error);
      return false;
    }
  };
  
  // Private helper functions
  function setupButtonObserver(callbacks) {
    // Create mutation observer to detect when buttons appear
    const observer = new MutationObserver(function(mutations) {
      // Do a full check for all buttons after DOM changes
      checkForAllButtons(callbacks);
    });
    
    // Initial check for buttons that might already be on the page
    checkForAllButtons(callbacks);
    
    // Start observing the document body for changes with all possible options
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['kind', 'nav', 'class']
    });
    
    // Periodically check for buttons even without DOM changes
    // Angular can sometimes update UI without triggering mutations
    setInterval(() => checkForAllButtons(callbacks), 1000);
    
    return observer;
  }
  
  function checkForAllButtons(callbacks) {
    // Check for all types of buttons
    checkForEVGraphButton(callbacks);
    checkForNavigationButtons(callbacks);
    checkForNextHandsButton(callbacks);
  }
  
  function checkForEVGraphButton(callbacks) {
    if (!callbacks.onEvButtonFound) return;
    
    // Try multiple selector strategies for the EV Graph button
    const selectors = [
      'button[kind="EvGraph"]',
      'button.details-button',
      'button:not(.mat-mdc-menu-item)',
      'button.mat-mdc-button'
    ];
    
    let evButtonFound = false;
    
    // Try each selector
    for (const selector of selectors) {
      const buttons = document.querySelectorAll(selector);
      
      for (const button of buttons) {
        // Check if it's an EV Graph button by text content
        if ((button.textContent.includes('EV') || 
             button.textContent.includes('Graph')) && 
            !button.dataset.pokerCraftExtEnhanced) {
          
          console.log(`Found EV Graph button using selector: ${selector}`);
          button.dataset.pokerCraftExtEnhanced = "true";
          callbacks.onEvButtonFound(button);
          evButtonFound = true;
          
          // Log button details for debugging
          console.log('EV Button properties:', {
            kind: button.getAttribute('kind'),
            class: button.className,
            text: button.textContent.trim()
          });
        }
      }
      
      if (evButtonFound) break;
    }
  }
  
  function checkForNavigationButtons(callbacks) {
    // Rush & Cash button
    if (callbacks.onRushCashButtonFound) {
      const rushCashButtons = document.querySelectorAll('a.nav-item[nav="rnc"], a[href*="rush-and-cash"]');
      for (const button of rushCashButtons) {
        if (!button.dataset.pokerCraftExtEnhanced) {
          console.log("Found Rush & Cash button");
          button.dataset.pokerCraftExtEnhanced = "true";
          callbacks.onRushCashButtonFound(button);
        }
      }
    }
    
    // Hold'em button
    if (callbacks.onHoldemButtonFound) {
      const holdemButtons = document.querySelectorAll('a.nav-item[nav="holdem"], a[href*="holdem"]');
      for (const button of holdemButtons) {
        if (!button.dataset.pokerCraftExtEnhanced) {
          console.log("Found Hold'em button");
          button.dataset.pokerCraftExtEnhanced = "true";
          callbacks.onHoldemButtonFound(button);
        }
      }
    }
    
    // PLO button
    if (callbacks.onOmahaButtonFound) {
      const omahaButtons = document.querySelectorAll('a.nav-item[nav="omaha"], a[href*="omaha"]');
      for (const button of omahaButtons) {
        if (!button.dataset.pokerCraftExtEnhanced) {
          console.log("Found PLO button");
          button.dataset.pokerCraftExtEnhanced = "true";
          callbacks.onOmahaButtonFound(button);
        }
      }
    }
  }
  
  function checkForNextHandsButton(callbacks) {
    if (!callbacks.onNextHandsButtonFound) return;
    
    // Look for Next Hands button with different strategies
    
    // Strategy 1: Look for links with span containing "Next"
    const allLinks = document.querySelectorAll("a");
    for (const link of allLinks) {
      const span = link.querySelector("span");
      if (span && 
          span.textContent.includes("Next") && 
          !link.dataset.pokerCraftExtEnhanced) {
        console.log("Found Next Hands button (span):", span.textContent);
        link.dataset.pokerCraftExtEnhanced = "true";
        callbacks.onNextHandsButtonFound(link);
      }
    }
    
    // Strategy 2: Look for buttons with "Next" text
    const allButtons = document.querySelectorAll("button");
    for (const button of allButtons) {
      if (button.textContent.includes("Next") && 
          !button.dataset.pokerCraftExtEnhanced) {
        console.log("Found Next Hands button (button):", button.textContent);
        button.dataset.pokerCraftExtEnhanced = "true";
        callbacks.onNextHandsButtonFound(button);
      }
    }
  }
  
  function setupRouteObserver(callbacks) {
    // Create a variable to store the last URL
    let lastUrl = window.location.href;
    
    // Function to check for URL changes
    function checkForUrlChanges() {
      if (lastUrl !== window.location.href) {
        // URL has changed
        const oldUrl = lastUrl;
        lastUrl = window.location.href;
        
        console.log(`Route changed from ${oldUrl} to ${lastUrl}`);
        
        // Call route change callback if provided
        if (callbacks.onRouteChange) {
          callbacks.onRouteChange(oldUrl, lastUrl);
        }
        
        // Reset enhanced flags on route change
        resetEnhancedFlags();
        
        // Recheck for buttons after a delay to allow new page to load
        setTimeout(() => checkForAllButtons(callbacks), 500);
      }
      
      // Continue checking for changes
      requestAnimationFrame(checkForUrlChanges);
    }
    
    // Start checking for URL changes
    checkForUrlChanges();
  }
  
  function resetEnhancedFlags() {
    // Reset the 'enhanced' flags on all elements
    const elements = document.querySelectorAll("[data-poker-craft-ext-enhanced]");
    for (const element of elements) {
      element.removeAttribute("data-poker-craft-ext-enhanced");
    }
  }
  
  // Expose cleanup function for existing charts/elements
  window.PokerCraftExt.cleanupPreviousCharts = function() {
    console.log("Cleaning up previous charts");
    
    // Find and remove comparison charts
    const comparisonCharts = document.querySelectorAll(".rake-comparison-container");
    comparisonCharts.forEach(chart => chart.remove());
    
    return true;
  };
  
  // Additional cleanup for route changes
  window.PokerCraftExt.cleanupOnRouteChange = function() {
    // Find and remove all enhanced elements
    resetEnhancedFlags();
    
    // Remove chart containers
    window.PokerCraftExt.cleanupPreviousCharts();
    
    return true;
  };
})();