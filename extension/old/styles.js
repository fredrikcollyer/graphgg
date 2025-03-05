// styles.js - Shared styling configuration for Revamp.GG extensions

// Create a global RevampStyles object to hold all styling configuration
// Using a self-executing function to ensure all initialization is complete
(function () {
  // First, define the full object before assigning to window
  const RevampStyles = {
    // Base colors
    colors: {
      primary: "#9d4edd", // Main theme color (purple)
      primaryLight: "#b066e6", // Lighter theme color for hover states
      darkBg: "#1a1a1a", // Dark background
      mediumBg: "#222222", // Medium background
      lightBg: "#2a2a2a", // Lighter background for contrast
      borderColor: "#333333", // Border color for containers
      textColor: "#f0f0f0", // Main text color
      mutedTextColor: "#aaaaaa", // Muted text color for less important text
      positiveColor: "#16d609",
      negativeColor: "#FF0000",
      originalLineColor: "#64B5F6", // Blue for original data lines
      adjustedLineColor: "#4CAF50", // Green for adjusted data lines (same as positiveColor)
      gridColor: "rgba(64, 64, 64, 1)", // Slightly lighter grid lines for better visibility
    },

    // Borders
    borders: {
      radius: 0, // Border radius for UI elements (0 for square corners)
      width: "2px", // Default border width
      style: "solid", // Default border style
    },

    // Shadows and effects
    effects: {
      glow: "0 0 10px rgba(157, 78, 221, 0.7)", // Default glow effect
      hoverGlow: "0 0 15px rgba(176, 102, 230, 0.9)", // Glow effect on hover
      textShadow: "0 0 5px rgba(157, 78, 221, 0.7)", // Text shadow for branded text
      hoverTextShadow: "0 0 10px rgba(176, 102, 230, 0.9)", // Text shadow on hover
    },

    // Animations
    animations: {
      // Border glow animation keyframes
      borderGlow: `
      @keyframes borderGlow {
        0% { border-color: rgba(157, 78, 221, 0.7); }
        25% { border-color: rgba(138, 43, 226, 0.9); }
        50% { border-color: rgba(186, 85, 211, 0.8); }
        75% { border-color: rgba(138, 43, 226, 0.9); }
        100% { border-color: rgba(157, 78, 221, 0.7); }
      }
    `,

      // Text pulse animation keyframes
      textPulse: `
      @keyframes textPulse {
        0% { color: rgba(157, 78, 221, 0.8); text-shadow: 0 0 5px rgba(157, 78, 221, 0.7); }
        50% { color: rgba(186, 85, 211, 1); text-shadow: 0 0 8px rgba(186, 85, 211, 0.9); }
        100% { color: rgba(157, 78, 221, 0.8); text-shadow: 0 0 5px rgba(157, 78, 221, 0.7); }
      }
    `,
    },

    // Typography
    typography: {
      fontFamily: "'Arial', sans-serif",
      defaultSize: "14px",
      titleSize: "16px",
      subtitleSize: "14px",
      smallSize: "12px",
      tinySize: "11px",
      brandTextSize: "11px",
      smallBrandTextSize: "8px",
    },

    // Spacing
    spacing: {
      small: "8px",
      medium: "15px",
      large: "20px",
    },

    // Combined styles for common UI elements
    ui: {
      // Function to get standard container style
      getContainerStyle: function () {
        const styles = window.RevampStyles;
        return {
          backgroundColor: styles.colors.darkBg,
          padding: styles.spacing.medium,
          border: `${styles.borders.width} ${styles.borders.style} ${styles.colors.primary}`,
          borderRadius: `${styles.borders.radius}px`,
          boxShadow: styles.effects.glow,
          marginTop: styles.spacing.large,
          marginBottom: styles.spacing.large,
          position: "relative",
          overflow: "visible",
        };
      },

      // Function to get standard badge style
      getBadgeStyle: function (isSmall = false) {
        return {
          position: "absolute",
          top: "0",
          right: "0",
          padding: isSmall ? "3px 6px 3px 6px" : "4px 8px 4px 8px",
          background: "transparent",
          zIndex: "5",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        };
      },

      // Function to get standard brand text style
      getBrandTextStyle: function (isSmall = false) {
        const styles = window.RevampStyles;
        return {
          display: "block",
          color: styles.colors.primary,
          fontFamily: styles.typography.fontFamily,
          fontWeight: "bold",
          fontSize: isSmall
            ? styles.typography.smallBrandTextSize
            : styles.typography.brandTextSize,
          letterSpacing: "0.5px",
          textShadow: styles.effects.textShadow,
          pointerEvents: "none",
          lineHeight: "1",
          textAlign: "center",
          textTransform: "uppercase",
        };
      },

      // Function to get standard section style
      getSectionStyle: function () {
        const styles = window.RevampStyles;
        return {
          padding: styles.spacing.medium,
          marginBottom: styles.spacing.medium,
          backgroundColor: styles.colors.mediumBg,
          borderRadius: `${styles.borders.radius}px`,
          border: `1px solid ${styles.colors.borderColor}`,
        };
      },

      // Function to get standard table style
      getTableStyle: function () {
        const styles = window.RevampStyles;
        return {
          width: "100%",
          borderCollapse: "collapse",
          color: styles.colors.textColor,
          fontSize: styles.typography.defaultSize,
        };
      },
    },

    // Helper method to inject styles into document head
    injectGlobalStyles: function () {
      // Add animations to document if not already present
      if (!document.getElementById("revamp-global-styles")) {
        const styles = window.RevampStyles;
        const styleEl = document.createElement("style");
        styleEl.id = "revamp-global-styles";
        styleEl.textContent = `
        ${styles.animations.borderGlow}
        ${styles.animations.textPulse}
        
        /* Apply animations to enhanced buttons */
        button[revamp-enhanced="true"] {
          animation: borderGlow 3s infinite ease-in-out;
        }
        
        button[revamp-enhanced="true"] .revamp-badge span,
        .revamp-brand-text {
          animation: textPulse 3s infinite ease-in-out;
        }
      `;
        document.head.appendChild(styleEl);
      }
    },
  };

  // Now that the object is fully defined, assign it to the window
  window.RevampStyles = RevampStyles;

  // Inject global styles when this script loads
  window.RevampStyles.injectGlobalStyles();

  console.log("RevampStyles loaded and initialized!");
})();
