// uiEnhancements.js
(function() {
  // Initialize namespace
  window.PokerCraftExt = window.PokerCraftExt || {};
  
  // Expose UI enhancement functions
  window.PokerCraftExt.enhanceButton = function(button, buttonType) {
    console.log("Enhancing button:", buttonType);
    
    try {
      if (!button) return false;
      
      // Mark button as enhanced
      button.setAttribute("data-poker-craft-ext-enhanced", "true");
      
      // Determine button type
      const isSmallButton = buttonType !== "EV Graph";
      const isNavButton = 
        buttonType === "Rush & Cash" || 
        buttonType === "Hold'em" || 
        buttonType === "PLO";
      
      // Set position for absolute positioning if needed
      const originalPosition = window.getComputedStyle(button).position;
      if (originalPosition === "static") {
        button.style.position = "relative";
      }
      
      // Apply styling to the button
      button.style.overflow = "visible";
      
      if (isNavButton) {
        // For nav buttons, don't show any borders
        button.style.borderWidth = "0";
        button.style.boxSizing = "border-box";
        button.style.borderRadius = "0";
      } else {
        // For other buttons (like EV Graph), show full border with glow
        button.style.boxShadow = "0 0 10px rgba(157, 78, 221, 0.7)"; // glow
        button.style.borderWidth = "2px";
        button.style.borderStyle = "solid";
        button.style.borderColor = "#9d4edd"; // primary
        button.style.boxSizing = "border-box";
        button.style.borderRadius = "0";
      }
      
      // Create the badge container
      const badgeContainer = document.createElement("div");
      badgeContainer.className = "revamp-badge";
      
      // Apply badge styles
      Object.assign(badgeContainer.style, {
        position: "absolute",
        top: "0",
        right: "0",
        padding: isSmallButton ? "3px 6px 3px 6px" : "4px 8px 4px 8px",
        background: "transparent",
        zIndex: "5",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none"
      });
      
      // Add the text
      const revampText = document.createElement("span");
      revampText.textContent = "REVAMP.GG";
      
      // Brand text styles
      Object.assign(revampText.style, {
        display: "block",
        color: "#9d4edd", // primary
        fontFamily: "'Arial', sans-serif",
        fontWeight: "bold",
        fontSize: isSmallButton ? "8px" : "11px",
        letterSpacing: "0.5px",
        textShadow: "0 0 5px rgba(157, 78, 221, 0.7)", // textShadow
        pointerEvents: "none",
        lineHeight: "1",
        textAlign: "center",
        textTransform: "uppercase"
      });
      
      // Enhanced hover effect - only on the button but affects text color
      button.addEventListener("mouseover", function() {
        if (isNavButton) {
          // No border hover effect for nav buttons
        } else {
          // Apply hover effect to regular buttons
          button.style.boxShadow = "0 0 15px rgba(176, 102, 230, 0.9)"; // hoverGlow
          button.style.borderColor = "#b066e6"; // primaryLight
        }
        
        // Update text color
        revampText.style.color = "#b066e6"; // primaryLight
        revampText.style.textShadow = "0 0 10px rgba(176, 102, 230, 0.9)"; // hoverTextShadow
      });
      
      button.addEventListener("mouseout", function() {
        if (isNavButton) {
          // No border reset for nav buttons
        } else {
          // Reset regular buttons to default
          button.style.boxShadow = "0 0 10px rgba(157, 78, 221, 0.7)"; // glow
          button.style.borderColor = "#9d4edd"; // primary
        }
        
        // Reset text color
        revampText.style.color = "#9d4edd"; // primary
        revampText.style.textShadow = "0 0 5px rgba(157, 78, 221, 0.7)"; // textShadow
        
        // Restart animations
        button.style.animation = "none";
        revampText.style.animation = "none";
        
        setTimeout(() => {
          // Restore animations
          button.style.animation = isNavButton
            ? "none"
            : "borderGlow 3s infinite ease-in-out";
          revampText.style.animation = "textPulse 3s infinite ease-in-out";
        }, 10);
      });
      
      // Assemble and append
      badgeContainer.appendChild(revampText);
      button.appendChild(badgeContainer);
      
      console.log(`Enhanced ${buttonType} button with revamp.gg styling`);
      return true;
    } catch (error) {
      console.error("Error enhancing button:", error);
      return false;
    }
  };
  
  window.PokerCraftExt.cleanupPreviousCharts = function() {
    console.log("Cleaning up previous charts...");
    
    try {
      // Find and remove comparison charts
      const comparisonCharts = document.querySelectorAll(".rake-comparison-container");
      comparisonCharts.forEach(chart => {
        chart.remove();
      });
      
      return true;
    } catch (error) {
      console.error("Error cleaning up charts:", error);
      return false;
    }
  };
  
  // No longer needed as we're directly building the badge in enhanceButton
  
  // Expose functions for managing styling
  window.PokerCraftExt.injectGlobalStyles = function() {
    console.log("Injecting global styles...");
    
    try {
      // Create style element
      const styleEl = document.createElement("style");
      styleEl.id = "pokercraft-ext-styles";
      
      // Static CSS rules to avoid timing issues with styles object
      const css = `
        .rake-comparison-container {
          font-family: 'Arial', sans-serif;
          color: #f0f0f0;
        }
        
        .rake-comparison-container h2,
        .rake-comparison-container h3 {
          font-family: inherit;
          color: #9d4edd;
        }
        
        .revamp-badge {
          position: absolute;
          top: 0;
          right: 0;
          pointer-events: none;
          z-index: 5;
        }
        
        .revamp-brand-text {
          display: block;
          color: #9d4edd;
          font-family: 'Arial', sans-serif;
          font-weight: bold;
          letter-spacing: 0.5px;
          text-shadow: 0 0 5px rgba(157, 78, 221, 0.7);
          text-transform: uppercase;
        }
        
        /* Animation keyframes */
        @keyframes borderGlow {
          0% { border-color: rgba(157, 78, 221, 0.7); }
          25% { border-color: rgba(138, 43, 226, 0.9); }
          50% { border-color: rgba(186, 85, 211, 0.8); }
          75% { border-color: rgba(138, 43, 226, 0.9); }
          100% { border-color: rgba(157, 78, 221, 0.7); }
        }
        
        @keyframes textPulse {
          0% { color: rgba(157, 78, 221, 0.8); text-shadow: 0 0 5px rgba(157, 78, 221, 0.7); }
          50% { color: rgba(186, 85, 211, 1); text-shadow: 0 0 8px rgba(186, 85, 211, 0.9); }
          100% { color: rgba(157, 78, 221, 0.8); text-shadow: 0 0 5px rgba(157, 78, 221, 0.7); }
        }
        
        /* Apply animations to enhanced buttons */
        button[data-poker-craft-ext-enhanced="true"] {
          animation: borderGlow 3s infinite ease-in-out;
        }
        
        button[data-poker-craft-ext-enhanced="true"] .revamp-badge span,
        .revamp-brand-text {
          animation: textPulse 3s infinite ease-in-out;
        }
      `;
      
      // Add styles to document
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
      
      return true;
    } catch (error) {
      console.error("Error injecting global styles:", error);
      return false;
    }
  };
  
  // These container style helpers are used by the visualization module
  // We'll keep them as pure functions without storing them on the window object
  window.PokerCraftExt.getContainerStyle = function() {
    return {
      width: "100%",
      padding: "20px",
      marginTop: "20px",
      backgroundColor: "#1a1a1a", // Dark background
      border: "2px solid #9d4edd", // Purple border 
      borderRadius: "0px",
      boxShadow: "0 0 10px rgba(157, 78, 221, 0.7)", // Purple glow
      marginBottom: "20px",
      position: "relative",
      overflow: "visible",
      color: "#f0f0f0" // Light text color
    };
  };
  
  window.PokerCraftExt.getCardStyle = function() {
    return {
      flex: "1",
      minWidth: "220px",
      padding: "15px",
      backgroundColor: "#222222", // Medium background
      borderRadius: "0px",
      border: "1px solid #333333" // Border color
    };
  };
  
  window.PokerCraftExt.getSectionStyle = function() {
    return {
      padding: "15px",
      marginBottom: "15px",
      backgroundColor: "#222222", // Medium background
      borderRadius: "0px",
      border: "1px solid #333333" // Border color
    };
  };
  
  window.PokerCraftExt.getTableStyle = function() {
    return {
      width: "100%",
      borderCollapse: "collapse",
      color: "#f0f0f0", // Light text color
      fontSize: "14px"
    };
  };
})();