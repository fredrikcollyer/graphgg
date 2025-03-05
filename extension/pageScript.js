// pageScript.js
console.log("PokerCraft extension loaded on " + window.location.href);

// Define theme styles directly in this file
const themeColors = {
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
  adjustedLineColor: "#4CAF50", // Green for adjusted data lines
  gridColor: "rgba(64, 64, 64, 1)", // Slightly lighter grid lines for better visibility
};

const themeBorders = {
  radius: 0, // Border radius for UI elements (0 for square corners)
  width: "2px", // Default border width
  style: "solid", // Default border style
};

const themeEffects = {
  glow: "0 0 10px rgba(157, 78, 221, 0.7)", // Default glow effect
  hoverGlow: "0 0 15px rgba(176, 102, 230, 0.9)", // Glow effect on hover
  textShadow: "0 0 5px rgba(157, 78, 221, 0.7)", // Text shadow for branded text
  hoverTextShadow: "0 0 10px rgba(176, 102, 230, 0.9)", // Text shadow on hover
};

const themeAnimations = {
  // Border glow animation keyframes
  borderGlow: `
  @keyframes borderGlow {
    0% { border-color: rgba(157, 78, 221, 0.7); }
    25% { border-color: rgba(138, 43, 226, 0.9); }
    50% { border-color: rgba(186, 85, 211, 0.8); }
    75% { border-color: rgba(138, 43, 226, 0.9); }
    100% { border-color: rgba(157, 78, 221, 0.7); }
  }`,

  // Text pulse animation keyframes
  textPulse: `
  @keyframes textPulse {
    0% { color: rgba(157, 78, 221, 0.8); text-shadow: 0 0 5px rgba(157, 78, 221, 0.7); }
    50% { color: rgba(186, 85, 211, 1); text-shadow: 0 0 8px rgba(186, 85, 211, 0.9); }
    100% { color: rgba(157, 78, 221, 0.8); text-shadow: 0 0 5px rgba(157, 78, 221, 0.7); }
  }`,
};

const themeTypography = {
  fontFamily: "'Arial', sans-serif",
  defaultSize: "14px",
  titleSize: "16px",
  subtitleSize: "14px",
  smallSize: "12px",
  tinySize: "11px",
  brandTextSize: "11px",
  smallBrandTextSize: "8px",
};

const themeSpacing = {
  small: "8px",
  medium: "15px",
  large: "20px",
};

// Style utility functions
/**
 * Returns styling for main containers
 * Uses: themeColors, themeSpacing, themeBorders, themeEffects
 */
const getContainerStyle = () => {
  return {
    backgroundColor: themeColors.darkBg,
    padding: themeSpacing.medium,
    border: `${themeBorders.width} ${themeBorders.style} ${themeColors.primary}`,
    borderRadius: `${themeBorders.radius}px`,
    boxShadow: themeEffects.glow,
    marginTop: themeSpacing.large,
    marginBottom: themeSpacing.large,
    position: "relative",
    overflow: "visible",
  };
};

/**
 * Returns styling for badges
 * Uses: none
 */
const getBadgeStyle = (isSmall = false) => {
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
};

/**
 * Returns styling for brand text
 * Uses: themeColors, themeTypography, themeEffects
 */
const getBrandTextStyle = (isSmall = false) => {
  return {
    display: "block",
    color: themeColors.primary,
    fontFamily: themeTypography.fontFamily,
    fontWeight: "bold",
    fontSize: isSmall
      ? themeTypography.smallBrandTextSize
      : themeTypography.brandTextSize,
    letterSpacing: "0.5px",
    textShadow: themeEffects.textShadow,
    pointerEvents: "none",
    lineHeight: "1",
    textAlign: "center",
    textTransform: "uppercase",
  };
};

/**
 * Returns styling for sections
 * Uses: themeSpacing, themeColors, themeBorders
 */
const getSectionStyle = () => {
  return {
    padding: themeSpacing.medium,
    marginBottom: themeSpacing.medium,
    backgroundColor: themeColors.mediumBg,
    borderRadius: `${themeBorders.radius}px`,
    border: `1px solid ${themeColors.borderColor}`,
  };
};

/**
 * Returns styling for tables
 * Uses: themeColors, themeTypography
 */
const getTableStyle = () => {
  return {
    width: "100%",
    borderCollapse: "collapse",
    color: themeColors.textColor,
    fontSize: themeTypography.defaultSize,
  };
};

/**
 * Injects global styles for animations
 * Uses: themeAnimations
 */
const injectGlobalStyles = () => {
  if (!document.getElementById("revamp-global-styles")) {
    const styleEl = document.createElement("style");
    styleEl.id = "revamp-global-styles";
    styleEl.textContent = `
      ${themeAnimations.borderGlow}
      ${themeAnimations.textPulse}
      
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
};

// Call to inject styles
injectGlobalStyles();

// =================================================================
// CONSTANTS AND STATE
// =================================================================

// Button selectors
const evButtonSelector = 'button[kind="EvGraph"]';
const rushAndCashSelector = 'a.nav-item[nav="rnc"]';
const holdemSelector = 'a.nav-item[nav="holdem"]';
const omahaSelector = 'a.nav-item[nav="omaha"]';

// List of selectors for buttons that should trigger cleanup
const cleanupTriggerSelectors = [
  'button[kind="Hands"]', // Game History
  'button[kind="HoleCards"]', // Hole Cards
  'button[kind="Position"]', // Position
  "a.ng-star-inserted span", // Next X hands (will verify text content)
];

// Timing constants
const MAX_ATTEMPTS = 180;
const MS_BETWEEN_ATTEMPTS = 1000;

// App state variables
let isProcessing = false; // Flag to prevent multiple simultaneous executions
let buttonObserver = null;
let lastUrl = location.href;

// =================================================================
// EVENT HANDLER FUNCTIONS
// =================================================================

/**
 * Handles EV Graph button click event
 * Uses: pollForChartDataAndCreate
 */
function handleEvButtonClick() {
  console.log("EV Graph button clicked.");
  pollForChartDataAndCreate();
}

/**
 * Handles Next Hands button click event
 * Uses: cleanupPreviousCharts, pollForChartDataAndCreate
 */
function handleNextHandsButtonClick(e) {
  console.log("Next hands button clicked.");

  // Clean up previous charts
  cleanupPreviousCharts();

  // Make sure we're not processing anything else
  if (isProcessing) {
    console.log("Already processing, aborting current process");
    isProcessing = false;
  }

  // Wait for the original chart to update
  setTimeout(() => {
    pollForChartDataAndCreate();
  }, MS_BETWEEN_ATTEMPTS);
}

/**
 * Handles cleanup trigger button click events
 * Uses: cleanupPreviousCharts
 */
function handleCleanupTriggerClick(e) {
  console.log(
    `Cleanup trigger clicked: ${
      e.currentTarget.textContent || e.currentTarget.innerText
    }`
  );
  cleanupPreviousCharts();
}

/**
 * Handles URL change events
 * Uses: setupButtonObserver
 */
function handleUrlChange(newUrl) {
  console.log("URL changed to", newUrl);

  // Reset and re-setup our observers
  if (buttonObserver) {
    buttonObserver.disconnect();
  }

  // Wait a bit for the new page to load its components
  setTimeout(() => {
    setupButtonObserver();
  }, MS_BETWEEN_ATTEMPTS);
}

/**
 * Handles button hover events
 * Uses: themeEffects, themeColors
 */
function handleButtonHover(e, revampText, isNavButton) {
  // Check if event target and text element exist
  if (!e || !e.currentTarget || !e.currentTarget.style) {
    console.warn("Button element missing in hover handler");
    return;
  }

  if (!revampText || !revampText.style) {
    console.warn("Text element missing in hover handler");
    return;
  }

  if (!isNavButton) {
    // Apply hover effect to regular buttons
    e.currentTarget.style.boxShadow = themeEffects.hoverGlow;
    e.currentTarget.style.borderColor = themeColors.primaryLight;
  }

  // Update text color
  revampText.style.color = themeColors.primaryLight;
  revampText.style.textShadow = themeEffects.hoverTextShadow;
}

/**
 * Handles button mouseout events
 * Uses: themeEffects, themeColors
 */
function handleButtonMouseout(e, revampText, isNavButton) {
  // Check if event target and text element exist
  if (!e || !e.currentTarget || !e.currentTarget.style) {
    console.warn("Button element missing in mouseout handler");
    return;
  }

  if (!revampText || !revampText.style) {
    console.warn("Text element missing in mouseout handler");
    return;
  }

  if (!isNavButton) {
    // Reset regular buttons to default
    e.currentTarget.style.boxShadow = themeEffects.glow;
    e.currentTarget.style.borderColor = themeColors.primary;
  }

  // Reset text color
  revampText.style.color = themeColors.primary;
  revampText.style.textShadow = themeEffects.textShadow;

  // Restart animations
  e.currentTarget.style.animation = "none";
  revampText.style.animation = "none";

  setTimeout(() => {
    // Restore animations - check if currentTarget still exists
    if (e.currentTarget && e.currentTarget.style) {
      e.currentTarget.style.animation = isNavButton
        ? "none"
        : "borderGlow 3s infinite ease-in-out";
    }

    // Check if revampText still exists
    if (revampText && revampText.style) {
      revampText.style.animation = "textPulse 3s infinite ease-in-out";
    }
  }, 10);
}

// =================================================================
// ELEMENT DETECTION AND INITIALIZATION
// =================================================================

// We've moved the button finding and handler attachment logic directly
// into the findAndAttachButtonHandlers function for a more direct control flow

// =================================================================
// DOM OBSERVATION FUNCTIONS
// =================================================================

// The DOM observation approach has been simplified.
// The new control flow is:
//
// initApp() → sets up URL change detection and initial button handlers
//     ↓
// setupButtonHandlers() → sets up the DOM mutation observer
//     ↓
// findAndAttachButtonHandlers() → directly attaches handlers to all buttons
//
// This provides a clear, explicit flow with less indirection

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Function to remove any previously created charts
 * Uses: none
 */
function cleanupPreviousCharts() {
  console.log("Cleaning up previous charts");

  // Find all elements with our custom class
  const customElements = document.querySelectorAll(
    ".poker-craft-rake-adjusted-wrapper"
  );
  if (customElements.length > 0) {
    console.log(
      `Found ${customElements.length} custom chart elements to remove`
    );
    customElements.forEach((el) => el.remove());
  } else {
    console.log("No existing charts found to remove");
  }
}

/**
 * Function to check for chart data and create graph
 * Uses: isProcessing, extractEVGraphData, createRakeAdjustedGraph, findAndAttachButtonHandlers, MAX_ATTEMPTS, MS_BETWEEN_ATTEMPTS
 */
function pollForChartDataAndCreate() {
  if (isProcessing) {
    console.log("Already processing a chart request, ignoring");
    return;
  }

  isProcessing = true;
  console.log("Polling for chart data readiness...");

  let attempts = 0;
  const pollInterval = setInterval(() => {
    attempts++;
    const evGraphComponent = document.querySelector(
      "app-game-session-detail-ev-graph"
    );
    if (evGraphComponent) {
      const contextKey = Object.keys(evGraphComponent).find((key) =>
        key.startsWith("__ngContext__")
      );
      if (contextKey) {
        const chartData = extractEVGraphData();
        if (chartData && chartData.length > 0) {
          console.log(
            "Chart data detected on attempt " +
              attempts +
              ". Running extension code."
          );
          clearInterval(pollInterval);

          // Create the new chart
          createRakeAdjustedGraph();

          // After creating the graph, check for buttons that might have appeared
          setTimeout(findAndAttachButtonHandlers, MS_BETWEEN_ATTEMPTS);

          isProcessing = false;
          return;
        } else {
          console.log(
            "Angular context found but chart data not ready. Attempt " +
              attempts
          );
        }
      } else {
        console.log("Angular context not available yet. Attempt " + attempts);
      }
    } else {
      console.log("EV graph component not found yet. Attempt " + attempts);
      clearInterval(pollInterval);
      isProcessing = false;
      return;
    }
    if (attempts >= MAX_ATTEMPTS) {
      console.error(
        "Chart data still not available after " + MAX_ATTEMPTS + " attempts."
      );
      clearInterval(pollInterval);
      isProcessing = false;
    }
  }, MS_BETWEEN_ATTEMPTS);
}

/**
 * Enhance a button with revamp.gg styling
 * Uses: themeEffects, themeBorders, themeColors, getBadgeStyle, getBrandTextStyle, handleButtonHover, handleButtonMouseout
 */
function enhanceButton(button, buttonType) {
  if (button.hasAttribute("revamp-enhanced")) {
    return; // Already enhanced
  }

  // Mark button as enhanced
  button.setAttribute("revamp-enhanced", "true");

  // Set position for absolute positioning if needed
  const originalPosition = window.getComputedStyle(button).position;
  if (originalPosition === "static") {
    button.style.position = "relative";
  }

  const isSmallButton = buttonType !== "EV Graph";
  const isNavButton =
    buttonType === "Rush & Cash" ||
    buttonType === "Hold'em" ||
    buttonType === "PLO";

  // Apply styling to the button
  button.style.overflow = "visible";

  if (isNavButton) {
    // For nav buttons, don't show any borders
    button.style.borderWidth = "0";
    button.style.boxSizing = "border-box";
    button.style.borderRadius = "0";
  } else {
    // For other buttons (like EV Graph), show full border with glow
    button.style.boxShadow = themeEffects.glow;
    button.style.borderWidth = themeBorders.width;
    button.style.borderStyle = themeBorders.style;
    button.style.borderColor = themeColors.primary;
    button.style.boxSizing = "border-box";
    button.style.borderRadius = `${themeBorders.radius}px`;
  }

  // Create the badge container
  const badgeContainer = document.createElement("div");
  badgeContainer.className = "revamp-badge";

  // Apply badge styles
  const badgeStyle = getBadgeStyle(isSmallButton);
  Object.keys(badgeStyle).forEach((key) => {
    badgeContainer.style[key] = badgeStyle[key];
  });

  // Add the text
  const revampText = document.createElement("span");
  revampText.textContent = "REVAMP.GG";

  // Apply brand text styles
  const textStyle = getBrandTextStyle(isSmallButton);
  Object.keys(textStyle).forEach((key) => {
    revampText.style[key] = textStyle[key];
  });

  // Enhanced hover effect - only on the button but affects text color
  button.addEventListener("mouseover", (e) =>
    handleButtonHover(e, revampText, isNavButton)
  );

  button.addEventListener("mouseout", (e) =>
    handleButtonMouseout(e, revampText, isNavButton)
  );

  // Assemble and append
  badgeContainer.appendChild(revampText);
  button.appendChild(badgeContainer);

  console.log(`Enhanced ${buttonType} button with revamp.gg styling`);
}

// =================================================================
// MAIN RAKE ADJUSTMENT LOGIC
// =================================================================

/**
 * Creates the rake-adjusted graph with all components
 * Uses: extractPokerSessionData, extractEVGraphData, matchHandsToSessions, calculateRakeAdjustedData, displayComparisonChart
 */
function createRakeAdjustedGraph() {
  // Constants for rake calculation - only those that don't depend on big blind size
  const RAKE_PERCENTAGE = 0.05; // 5%
  const RAKE_CAP_IN_BB = 3; // 3 big blinds

  console.log("Starting rake-adjusted graph creation...");

  // Step 1: Extract session data from the table
  const sessionData = extractPokerSessionData();
  if (
    !sessionData ||
    !sessionData.sessions ||
    sessionData.sessions.length === 0
  ) {
    console.error("Could not extract session data");
    return;
  }
  console.log(`Found ${sessionData.sessions.length} sessions`);

  // Step 2: Extract the original chart data
  const originalData = extractEVGraphData();
  if (!originalData) {
    console.error("Could not extract original chart data");
    return;
  }
  console.log(`Found ${originalData.length} hands in chart data`);

  // Step 3: Match hands to sessions and prepare data for rake adjustment
  const { matchedData, sessionStats, stakeDistribution, unmatchedHandsCount } =
    matchHandsToSessions(originalData, sessionData.sessions);

  console.log("Matching hands to sessions complete");

  // Step 4: Calculate rake-adjusted data with dynamic big blind sizes
  const rakeAdjustedData = calculateRakeAdjustedData(
    matchedData,
    RAKE_PERCENTAGE,
    RAKE_CAP_IN_BB
  );

  // Step 5: Display the comparison chart
  displayComparisonChart(originalData, rakeAdjustedData, stakeDistribution);

  return {
    originalData,
    rakeAdjustedData,
    sessionData,
    sessionStats,
    stakeDistribution,
    unmatchedHandsCount,
  };
}

/**
 * Extract poker session data from the HTML table
 * Uses: none
 */
function extractPokerSessionData() {
  const sessionRows = document.querySelectorAll("tr.mat-row.cdk-row");

  if (!sessionRows.length) {
    console.error("No session rows found in the table");
    return { sessions: [] };
  }

  // First, extract all tooltip dates with years from the DOM
  const dateTooltips = document.querySelectorAll(
    ".cdk-describedby-message-container div[role='tooltip']"
  );

  // Create a mapping from "MMM DD, HH:MM" format (without year) to year
  const dateTimeToYearMap = {};

  Array.from(dateTooltips).forEach((tooltip) => {
    const fullDateStr = tooltip.textContent.trim(); // e.g. "Jan 07 2025, 15:56"

    // Parse the full date string to extract parts
    const match = fullDateStr.match(/^(\w+) (\d+) (\d{4}), (\d+:\d+)$/);
    if (match) {
      const [_, month, day, year, time] = match;

      // Create a key format that matches what we extract from the session row (without year)
      const lookupKey = `${month} ${day}, ${time}`;
      dateTimeToYearMap[lookupKey] = year;
    }
  });

  console.log(
    `Found ${
      Object.keys(dateTimeToYearMap).length
    } dates with years in tooltips`
  );

  const sessions = Array.from(sessionRows).map((row, index) => {
    // Helper function to get text content from a cell by column class
    const getCellContent = (columnClass) => {
      const cell = row.querySelector(`.cdk-column-${columnClass}`);
      return cell ? cell.textContent.trim() : null;
    };

    const startTimeCell = row.querySelector(".cdk-column-SessionStart");
    let startTime = null;
    if (startTimeCell) {
      const fullTimeSpan = startTimeCell.querySelector("span[hide-on-lte-md]");
      startTime = fullTimeSpan ? fullTimeSpan.textContent.trim() : null;
    }

    // Extract duration and convert to milliseconds
    const durationStr = getCellContent("Duration");
    let durationMs = 0;
    if (durationStr) {
      if (durationStr === "-") {
        // If duration is shown as "-", set it to 1 minute
        durationMs = 60000; // 1 minute in milliseconds
        console.warn("Duration is missing for session", index + 1);
      } else {
        const [hours, minutes, seconds] = durationStr.split(":").map(Number);
        durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      }
    }
    // Extract stake information
    const stakesStr = getCellContent("Stakes");
    let bigBlind = null;
    if (stakesStr) {
      // Use a regex to capture the number after "/$"
      const bbMatch = stakesStr.match(/\/\$(\d+(?:\.\d+)?)/);
      if (bbMatch) {
        bigBlind = parseFloat(bbMatch[1]);
      } else {
        console.error("Big blind not found in stakes:", stakesStr);
      }
    }

    let startTimestamp = null;
    if (startTime) {
      //   console.log("Session start time:", startTime);

      // Get the year from our mapping
      const year = dateTimeToYearMap[startTime];

      // Throw an error if we can't find the year for this session
      if (!year) {
        console.error("=== SESSION YEAR ERROR ===");
        console.error(
          `Could not find year for session starting at: ${startTime}`
        );
        console.error(
          `Available dates in tooltips: ${
            Object.keys(dateTimeToYearMap).length
          }`
        );

        // Log a few sample dates from the mapping for debugging
        const sampleDates = Object.keys(dateTimeToYearMap).slice(0, 5);
        console.error("Sample dates from tooltips:", sampleDates);

        throw new Error(
          `ERROR: Could not determine year for session: ${startTime}`
        );
      }

      const [monthDay, time] = startTime.split(", ");
      const [month, day] = monthDay.split(" ");
      const [hour, minute] = time.split(":");

      // Map month abbreviation to month number
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };

      const monthNum = monthMap[month];
      if (monthNum !== undefined) {
        const dateObj = new Date(
          parseInt(year),
          monthNum,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        startTimestamp = dateObj.getTime();
        // console.log(`Using year ${year} for session ${startTime}`);
      }
    }

    // Add a 3-minute buffer to the start and end timestamps for better matching
    const THREE_MINUTE_BUFFER = 180000;

    const session = {
      index: index + 1,
      startTime: startTime,
      startTimestamp: startTimestamp,
      endTimestamp: startTimestamp
        ? startTimestamp + durationMs + THREE_MINUTE_BUFFER
        : null,
      duration: durationStr,
      durationMs: durationMs,
      gameType: getCellContent("Game"),
      stakes: getCellContent("Stakes"),
      hands: parseInt(getCellContent("Hands"), 10) || 0,
      bigBlind: bigBlind,
      winloss:
        parseFloat((getCellContent("Winloss") || "0").replace("$", "")) || 0,
      assignedHands: 0,
    };

    return session;
  });

  // Sort sessions by start timestamp (earliest first)
  sessions.sort((a, b) => (a.startTimestamp || 0) - (b.startTimestamp || 0));
  return {
    sessions,
  };
}

/**
 * Extract EV graph data from the Angular component
 * Uses: none
 */
function extractEVGraphData() {
  const evGraphComponent = document.querySelector(
    "app-game-session-detail-ev-graph"
  );
  if (!evGraphComponent) {
    console.error("EV Graph component not found");
    return null;
  }

  try {
    // Find the __ngContext__ property
    const contextKey = Object.keys(evGraphComponent).find((key) =>
      key.startsWith("__ngContext__")
    );
    if (!contextKey) throw new Error("Angular context not found");

    // Navigate to the chart builder
    const context = evGraphComponent[contextKey];
    const componentInstance = context[13];
    if (!componentInstance) throw new Error("Component instance not found");

    // Find the chartBuilder by searching through properties
    let chartBuilder = null;
    for (const key in componentInstance) {
      if (componentInstance[key] && componentInstance[key].chartBuilder) {
        chartBuilder = componentInstance[key].chartBuilder;
        break;
      }
    }

    if (!chartBuilder) throw new Error("Chart builder not found");

    // Extract data points
    const dataPoints = chartBuilder.options?.data?.[0]?.dataPoints;
    if (!dataPoints || !dataPoints.length)
      throw new Error("Data points not found");
    return dataPoints;
  } catch (error) {
    console.error("Error extracting data:", error);
    return null;
  }
}

/**
 * Match hands to sessions based on timestamps using a network flow algorithm
 * Uses: findMaximumBipartiteMatching
 */
function matchHandsToSessions(handData, sessions) {
  console.log("Matching hands to sessions using network flow algorithm...");

  // Make a deep copy of hand data that we'll update with session information
  const matchedData = JSON.parse(JSON.stringify(handData));

  // Initialize tracking for matched hands in each session
  const sortedSessions = [...sessions].sort(
    (a, b) => (a.startTimestamp || 0) - (b.startTimestamp || 0)
  );

  sortedSessions.forEach((session) => {
    session.assignedHands = 0;
  });

  // Initialize session stats to track matching
  const sessionStats = sortedSessions.map((session) => ({
    startTime: session.startTime,
    expectedHands: session.hands,
    matchedHands: 0,
    bigBlind: session.bigBlind,
    stakes: session.stakes,
  }));

  // Create stake distribution object
  const stakeDistribution = {};

  // Find all valid hand-to-session possibilities
  const handSessionCompatibility = [];

  // For each hand, determine which session(s) it could belong to
  matchedData.forEach((hand, handIndex) => {
    const timestamp = hand.data.timestamp;
    const handDateTime = new Date(timestamp).toLocaleString();

    // Find sessions where this hand's timestamp falls within the session time range
    const matchingSessions = sortedSessions
      .filter(
        (session) =>
          session.startTimestamp &&
          session.endTimestamp &&
          timestamp >= session.startTimestamp &&
          timestamp <= session.endTimestamp
      )
      .map((session) => sortedSessions.indexOf(session));

    // Store compatibility info
    handSessionCompatibility.push({
      handIndex,
      compatibleSessions: matchingSessions,
    });

    // Error if no session matches the timestamp
    if (matchingSessions.length === 0) {
      console.error("=== SESSION MATCHING ERROR ===");
      console.error(
        `Hand ${hand.label} (timestamp: ${timestamp}, ${handDateTime}) does not fall into any session timeframe.`
      );

      // Log first few sessions for reference
      const numSessionsToLog = 5;
      console.error("Available sessions:");
      sortedSessions.slice(0, numSessionsToLog).forEach((session, idx) => {
        console.error(
          `Session ${idx + 1}: ${session.startTime} to ${new Date(
            session.endTimestamp
          ).toLocaleString()}`
        );
        console.error(
          `  - Timestamp range: ${session.startTimestamp} - ${session.endTimestamp}`
        );
        console.error(
          `  - Expected hands: ${session.hands}, Assigned: ${session.assignedHands}`
        );
        console.error(
          `  - Stakes: ${session.stakes}, Big Blind: ${session.bigBlind}`
        );
      });

      throw new Error(
        `ERROR: Hand ${hand.label} (timestamp: ${timestamp}, ${handDateTime}) does not fall into any session timeframe.`
      );
    }
  });

  // Run Ford-Fulkerson max flow algorithm with additional checks
  const assignments = findMaximumBipartiteMatching(
    handSessionCompatibility,
    sortedSessions
  );

  // Apply the assignments
  console.log("Applying hand-to-session assignments...");
  Object.entries(assignments).forEach(([handIndex, sessionIndex]) => {
    const hand = matchedData[handIndex];
    const session = sortedSessions[sessionIndex];

    // Update session counts
    session.assignedHands++;
    sessionStats[sessionIndex].matchedHands++;

    // Store session data in the hand record
    hand.sessionData = {
      bigBlind: session.bigBlind,
      stakes: session.stakes,
      gameType: session.gameType,
    };

    // Update stake distribution statistics
    const stakesKey = session.stakes || "Unknown";
    if (!stakeDistribution[stakesKey]) {
      stakeDistribution[stakesKey] = {
        count: 0,
        bigBlind: session.bigBlind,
        totalAmount: 0,
      };
    }

    stakeDistribution[stakesKey].count++;
    if (hand.data && hand.data.amount !== undefined) {
      const handAmount =
        parseInt(hand.label) === 1
          ? hand.data.amount
          : hand.data.amount -
            matchedData[parseInt(hand.label) - 2].data.amount;
      stakeDistribution[stakesKey].totalAmount += handAmount;
    }
  });

  // Calculate BB results and BB/100 for stake distribution
  Object.values(stakeDistribution).forEach((stake) => {
    stake.bbResult = stake.totalAmount / stake.bigBlind;
    stake.bbPer100 = (stake.bbResult / stake.count) * 100;
  });

  // Convert stake distribution to array format for return value
  const stakeDistributionArray = Object.entries(stakeDistribution).map(
    ([stakes, info]) => ({
      stakes,
      hands: info.count,
      bigBlind: info.bigBlind,
      winloss: info.totalAmount,
      bbResult: info.bbResult,
      bbPer100: info.bbPer100,
      percentage: ((info.count / matchedData.length) * 100).toFixed(1) + "%",
    })
  );

  // Check if the total hands assigned equals the total hands we have
  const totalHandsAssigned = sortedSessions.reduce(
    (sum, session) => sum + session.assignedHands,
    0
  );
  if (totalHandsAssigned !== matchedData.length) {
    console.error("=== SESSION ASSIGNMENT ERROR ===");
    console.error(
      `Expected to assign all ${matchedData.length} hands, but only assigned ${totalHandsAssigned}`
    );
    throw new Error(
      `ERROR: Failed to assign all hands. ${
        matchedData.length - totalHandsAssigned
      } hands were not assigned to any session.`
    );
  }

  return {
    matchedData,
    sessionStats,
    stakeDistribution: stakeDistributionArray,
    unmatchedHandsCount: 0, // Always 0 since we throw errors for unmatched hands
  };
}

/**
 * Ford-Fulkerson algorithm implementation for bipartite matching
 * Uses: findAugmentingPath
 */
function findMaximumBipartiteMatching(handSessionCompatibility, sessions) {
  console.log("Running Ford-Fulkerson maximum bipartite matching algorithm...");

  // Create a more direct approach to bipartite matching that's easier to debug
  const numHands = handSessionCompatibility.length;
  const numSessions = sessions.length;

  // Keep track of which hand is assigned to which session
  const handToSession = {};
  // Keep track of how many hands are assigned to each session
  const sessionHandCounts = Array(numSessions).fill(0);
  // Track which hands have been processed in DFS
  const visited = new Set();

  // Log compatibility for debugging
  console.log(`${numHands} hands, ${numSessions} sessions`);
  const sessionsNeeded = sessions.reduce((sum, s) => sum + s.hands, 0);
  console.log(`Total session capacity: ${sessionsNeeded} hands`);

  // Create a map from sessions to compatible hands for faster lookup
  const sessionToHandsMap = Array(numSessions)
    .fill()
    .map(() => []);

  handSessionCompatibility.forEach(({ handIndex, compatibleSessions }) => {
    compatibleSessions.forEach((sessionIndex) => {
      sessionToHandsMap[sessionIndex].push(handIndex);
    });
  });

  // Sort hands by number of compatible sessions (fewest options first)
  handSessionCompatibility.sort(
    (a, b) => a.compatibleSessions.length - b.compatibleSessions.length
  );

  // Modified Ford-Fulkerson approach for session capacity constraints
  let assignedHandsCount = 0;

  // First, try to assign hands with the most limited options
  for (const { handIndex, compatibleSessions } of handSessionCompatibility) {
    if (handToSession[handIndex] !== undefined) continue; // Already assigned

    // First try sessions that still need more hands
    let assigned = false;
    for (const sessionIndex of compatibleSessions) {
      if (sessionHandCounts[sessionIndex] < sessions[sessionIndex].hands) {
        handToSession[handIndex] = sessionIndex;
        sessionHandCounts[sessionIndex]++;
        assignedHandsCount++;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      // If we couldn't directly assign, try to find an augmenting path
      visited.clear();
      if (
        findAugmentingPath(
          handIndex,
          compatibleSessions,
          handToSession,
          sessionHandCounts,
          sessions,
          visited,
          sessionToHandsMap
        )
      ) {
        assignedHandsCount++;
      }
    }
  }

  return handToSession;
}

/**
 * Helper function to find an augmenting path for Ford-Fulkerson algorithm
 * Uses: none
 */
function findAugmentingPath(
  handIndex,
  compatibleSessions,
  handToSession,
  sessionHandCounts,
  sessions,
  visited,
  sessionToHandsMap
) {
  if (visited.has(handIndex)) return false;
  visited.add(handIndex);

  // Try each compatible session
  for (const sessionIndex of compatibleSessions) {
    // If the session has room, assign directly
    if (sessionHandCounts[sessionIndex] < sessions[sessionIndex].hands) {
      handToSession[handIndex] = sessionIndex;
      sessionHandCounts[sessionIndex]++;
      return true;
    }

    // If the session is full, try to reassign one of its hands
    const handsInSession = sessionToHandsMap[sessionIndex].filter(
      (hIdx) => handToSession[hIdx] === sessionIndex
    );

    // Try to reassign any hand from this session
    for (const otherHandIndex of handsInSession) {
      // Find other sessions this hand could go to
      const otherHandCompat = sessionToHandsMap
        .map((hands, sIdx) => (hands.includes(otherHandIndex) ? sIdx : -1))
        .filter((sIdx) => sIdx !== -1 && sIdx !== sessionIndex);

      // Try to reassign the other hand
      if (
        findAugmentingPath(
          otherHandIndex,
          otherHandCompat,
          handToSession,
          sessionHandCounts,
          sessions,
          visited,
          sessionToHandsMap
        )
      ) {
        // If successful, assign this hand to the now-available slot
        handToSession[handIndex] = sessionIndex;
        sessionHandCounts[sessionIndex]++;
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculates rake-adjusted data based on original data and rake parameters
 * Uses: none
 */
function calculateRakeAdjustedData(originalData, rakePercentage, rakeCap_BB) {
  const adjustedData = JSON.parse(JSON.stringify(originalData));
  const handResults = [];

  // Extract individual hand results
  for (let i = 0; i < adjustedData.length; i++) {
    if (i === 0) {
      handResults.push({
        amount: adjustedData[i].data.amount,
        ev: adjustedData[i].data.ev,
        handHistoryId: adjustedData[i].data.handHistoryId,
        timestamp: adjustedData[i].data.timestamp,
        label: adjustedData[i].label,
        sessionData: adjustedData[i].sessionData,
      });
    } else {
      const amountDiff =
        adjustedData[i].data.amount - adjustedData[i - 1].data.amount;
      const evDiff = adjustedData[i].data.ev - adjustedData[i - 1].data.ev;
      handResults.push({
        amount: amountDiff,
        ev: evDiff,
        handHistoryId: adjustedData[i].data.handHistoryId,
        timestamp: adjustedData[i].data.timestamp,
        label: adjustedData[i].label,
        sessionData: adjustedData[i].sessionData,
      });
    }
  }

  // Apply rake adjustments
  const adjustedHandResults = handResults.map((hand) => {
    if (hand.amount > 0) {
      const bigBlindSize = hand.sessionData.bigBlind;
      const rakeCap = rakeCap_BB * bigBlindSize;
      const estimatedPotSize = hand.amount * 2; // Assuming the pot is twice our win
      const rake = Math.min(estimatedPotSize * rakePercentage, rakeCap);

      // Calculate EV adjustment
      let adjustedEv = hand.ev;

      if (hand.ev > 0) {
        // Calculate our equity in the pot
        // For a winning hand, our investment is approximately half the pot
        // Our equity can be estimated by adding our profit to our investment and dividing by the pot
        const ourInvestment = estimatedPotSize / 2; // This is an estimate
        const ourEquity = (ourInvestment + hand.ev) / estimatedPotSize;

        // Our share of the rake based on our equity
        const ourRakeShare = rake * ourEquity;

        // Adjust EV by subtracting our share of the rake
        adjustedEv = hand.ev - ourRakeShare;
      }

      return {
        ...hand,
        amount: hand.amount - rake, // Rake-adjusted winnings
        ev: adjustedEv, // Rake-adjusted EV
        appliedRake: rake,
        bigBlindSize: bigBlindSize,
      };
    }

    return {
      ...hand,
      appliedRake: 0,
      bigBlindSize: hand.sessionData.bigBlind,
    };
  });

  // Calculate cumulative totals (rest of the function continues as before)
  let cumulativeAmount = 0;
  let cumulativeEv = 0;
  let totalRake = 0;
  let totalRakeInBB = 0;
  let cumulativeBBResult = 0;

  for (let i = 0; i < adjustedData.length; i++) {
    const bigBlindSize = adjustedHandResults[i].bigBlindSize;
    if (i === 0) {
      cumulativeAmount = adjustedHandResults[i].amount;
      cumulativeEv = adjustedHandResults[i].ev;
      totalRake = adjustedHandResults[i].appliedRake || 0;
      totalRakeInBB = (adjustedHandResults[i].appliedRake || 0) / bigBlindSize;
      cumulativeBBResult = cumulativeAmount / bigBlindSize;
    } else {
      cumulativeAmount += adjustedHandResults[i].amount;
      cumulativeEv += adjustedHandResults[i].ev;
      totalRake += adjustedHandResults[i].appliedRake || 0;
      totalRakeInBB += (adjustedHandResults[i].appliedRake || 0) / bigBlindSize;
      cumulativeBBResult += adjustedHandResults[i].amount / bigBlindSize;
    }

    adjustedData[i].data.amount = cumulativeAmount;
    adjustedData[i].data.ev = cumulativeEv;
    adjustedData[i].data.totalRake = totalRake;
    adjustedData[i].data.totalRakeInBB = totalRakeInBB;
    adjustedData[i].data.bbResult = cumulativeBBResult;
    adjustedData[i].y = cumulativeAmount;
    adjustedData[i].sessionData = adjustedHandResults[i].sessionData;
    adjustedData[i].bigBlindSize = adjustedHandResults[i].bigBlindSize;
  }
  return adjustedData;
}

/**
 * Create and display a rake-adjusted chart with winloss and EV
 * Uses: getContainerStyle, getBadgeStyle, getBrandTextStyle, getSectionStyle, getTableStyle
 */
function displayComparisonChart(
  originalData,
  rakeAdjustedData,
  stakeDistribution
) {
  function ensureCanvasJS(callback) {
    if (typeof CanvasJS !== "undefined") {
      callback();
      return;
    }
    if (window.CanvasJS) {
      callback();
      return;
    }
    let foundCanvasJS = false;
    document.querySelectorAll("canvas").forEach((canvas) => {
      const container = canvas.closest(".canvasjs-chart-container");
      if (container && !foundCanvasJS) {
        const chartObjects = Object.values(window).filter(
          (obj) =>
            obj &&
            typeof obj === "object" &&
            obj.render &&
            obj.options &&
            obj.options.data
        );

        if (chartObjects.length > 0) {
          window.CanvasJS = Object.getPrototypeOf(chartObjects[0]).constructor;
          foundCanvasJS = true;
          callback();
          return;
        }
      }
    });
    if (!foundCanvasJS) {
      const script = document.createElement("script");
      script.src = "https://cdn.canvasjs.com/canvasjs.min.js";
      script.onload = callback;
      document.head.appendChild(script);
    }
  }

  ensureCanvasJS(function () {
    // Create the new chart elements
    const container = document.createElement("div");
    container.id = "rake-adjusted-chart-container";
    container.style.width = "100%";
    container.style.height = "400px";
    container.style.marginTop = "20px";
    container.style.position = "relative";

    const targetElement = document.querySelector(
      "app-game-session-detail-ev-graph"
    );
    if (!targetElement) {
      console.error("Could not find target element to append the chart");
      return;
    }

    // Make sure this element exists before trying to access its properties
    if (!container) {
      console.error("Chart container was not created properly");
      return;
    }

    // Create wrapper with border matching enhanced button
    const wrapper = document.createElement("div");
    wrapper.className = "poker-craft-rake-adjusted-wrapper";
    wrapper.dataset.timestamp = Date.now();
    wrapper.dataset.parentComponentId =
      targetElement.id || "ev-graph-component";

    // Apply container styles
    const containerStyle = getContainerStyle();
    Object.keys(containerStyle).forEach((key) => {
      wrapper.style[key] = containerStyle[key];
    });

    // Add header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "center";
    header.style.marginBottom = "15px";
    header.style.position = "relative";

    // Create REVAMP.GG text styled like the enhanced button text
    const brandText = document.createElement("div");

    // Apply brand text styles
    const brandTextStyle = getBrandTextStyle(false);
    Object.keys(brandTextStyle).forEach((key) => {
      brandText.style[key] = brandTextStyle[key];
    });

    // Additional positioning for this specific use case
    brandText.style.position = "absolute";
    brandText.style.top = "0";
    brandText.style.right = "0";
    brandText.style.padding = "4px 8px";
    brandText.textContent = "REVAMP.GG";

    // Add brand text class
    brandText.classList.add("revamp-brand-text");

    const title = document.createElement("h3");
    title.textContent = "Rake-Adjusted Graph";
    title.style.textAlign = "center";
    title.style.margin = "0";
    title.style.padding = "8px 0";
    title.style.color = themeColors.textColor;
    title.style.fontFamily = themeTypography.fontFamily;
    title.style.fontWeight = "600";
    title.style.fontSize = themeTypography.titleSize;

    header.appendChild(title);
    header.appendChild(brandText);
    wrapper.appendChild(header);
    wrapper.appendChild(container);

    // First, add the new chart to the page
    targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);

    const originalFinal = originalData[originalData.length - 1].y;
    const adjustedFinal =
      rakeAdjustedData[rakeAdjustedData.length - 1].data.amount;
    const adjustedEvFinal =
      rakeAdjustedData[rakeAdjustedData.length - 1].data.ev;
    const difference = originalFinal - adjustedFinal;
    const percentDifference = (difference / Math.abs(originalFinal)) * 100;

    // Define colors for the graph
    const winlossColor = themeColors.positiveColor; // Green for winloss
    const evColor = "#FF9800"; // Orange for EV

    // Create the chart with axisY2 on the right-hand side.
    const chart = new CanvasJS.Chart(container.id, {
      backgroundColor: themeColors.darkBg,
      zoomEnabled: true,
      animationEnabled: true,
      theme: "dark2",
      axisX: {
        // title: "Hand number",
        titleFontColor: themeColors.textColor,
        titleFontSize: parseInt(themeTypography.subtitleSize),
        labelFontColor: themeColors.textColor,
        lineColor: themeColors.borderColor,
        gridColor: themeColors.gridColor,
        tickLength: 0,
      },
      // Define the secondary Y axis which renders on the right.
      axisY2: {
        // title: "Amount ($)",
        labelFontColor: themeColors.textColor,
        lineColor: themeColors.borderColor,
        gridColor: themeColors.gridColor,
        valueFormatString: "$#,##0.##",
        tickLength: 0,
      },
      toolTip: {
        shared: true,
        borderColor: themeColors.borderColor,
        backgroundColor: themeColors.mediumBg,
        fontColor: themeColors.textColor,
        cornerRadius: themeBorders.radius,
        contentFormatter: function (e) {
          // Check if we have any entries
          if (e.entries && e.entries.length > 0) {
            // Get hand number from first entry
            const handLabel = e.entries[0].dataPoint.label;
            let content = `Hand: ${handLabel}<br/>`;

            // Add each entry with its colored value
            for (let i = 0; i < e.entries.length; i++) {
              const entry = e.entries[i];
              const color = entry.dataSeries.color;
              const name = entry.dataSeries.name;
              const value = entry.dataPoint.y.toFixed(2);

              content += `<span style="color: ${color};">${name}: $${value}</span><br/>`;
            }

            return content;
          }
          return "";
        },
      },
      legend: {
        cursor: "pointer",
        fontColor: themeColors.textColor,
        fontSize: parseInt(themeTypography.smallSize), // Reduced font size
        verticalAlign: "bottom",
        horizontalAlign: "center",
        itemclick: function (e) {
          if (
            typeof e.dataSeries.visible === "undefined" ||
            e.dataSeries.visible
          ) {
            e.dataSeries.visible = false;
          } else {
            e.dataSeries.visible = true;
          }
          chart.render();
        },
      },
      title: {
        text: "", // Remove the graph title
        fontColor: themeColors.textColor,
        fontSize: parseInt(themeTypography.titleSize),
        fontWeight: "normal",
        fontFamily: themeTypography.fontFamily,
        padding: 10,
      },
      creditText: "",
      data: [
        {
          type: "line",
          axisYType: "secondary",
          name: "All-in EV (Rake-Adjusted)",
          showInLegend: true,
          color: "#FF9800", // Orange for EV
          lineThickness: 2,
          markerSize: 0,
          dataPoints: rakeAdjustedData.map((point) => ({
            x: point.x,
            y: point.data.ev,
            label: point.label,
          })),
        },
        {
          type: "line",
          axisYType: "secondary",
          name: "Win/Loss (Rake-Adjusted)",
          showInLegend: true,
          color: themeColors.positiveColor,
          lineThickness: 2,
          markerSize: 0,
          dataPoints: rakeAdjustedData.map((point) => ({
            x: point.x,
            y: point.data.amount,
            label: point.label,
          })),
        },
      ],
    });

    chart.render();

    // Now that the new chart is in place, remove any old charts
    const currentTimestamp = wrapper.dataset.timestamp;
    const oldCharts = document.querySelectorAll(
      ".poker-craft-rake-adjusted-wrapper"
    );
    oldCharts.forEach((chart) => {
      if (chart.dataset.timestamp !== currentTimestamp) {
        chart.remove();
      }
    });

    const totalHands = originalData.length;

    // Calculate stats for All-in EV data
    const evStakeData = {};
    stakeDistribution.forEach((stake) => {
      evStakeData[stake.stakes] = {
        stakes: stake.stakes,
        hands: stake.hands,
        bigBlind: stake.bigBlind,
        percentage: stake.percentage,
        winloss: 0, // This will actually be EV
        bbResult: 0,
        bbPer100: 0,
      };
    });

    // Use the existing adjustedStakeData object for Win/Loss
    const adjustedStakeData = {};
    stakeDistribution.forEach((stake) => {
      adjustedStakeData[stake.stakes] = {
        stakes: stake.stakes,
        hands: stake.hands,
        bigBlind: stake.bigBlind,
        percentage: stake.percentage,
        winloss: 0,
        bbResult: 0,
        bbPer100: 0,
      };
    });

    // Calculate cumulative values by stake
    rakeAdjustedData.forEach((hand, index) => {
      const stakesKey = hand.sessionData.stakes;
      const bigBlind = hand.bigBlindSize;

      if (!stakesKey || !bigBlind) {
        console.error("Missing stakes or big blind size for hand", hand);
        return;
      }

      let adjustedAmount, adjustedEv;

      if (index === 0) {
        adjustedAmount = hand.data.amount;
        adjustedEv = hand.data.ev;
      } else {
        adjustedAmount =
          hand.data.amount - rakeAdjustedData[index - 1].data.amount;
        adjustedEv = hand.data.ev - rakeAdjustedData[index - 1].data.ev;
      }

      if (adjustedStakeData[stakesKey]) {
        adjustedStakeData[stakesKey].winloss += adjustedAmount;
        adjustedStakeData[stakesKey].bbResult += adjustedAmount / bigBlind;
      }

      if (evStakeData[stakesKey]) {
        evStakeData[stakesKey].winloss += adjustedEv;
        evStakeData[stakesKey].bbResult += adjustedEv / bigBlind;
      }
    });

    // Calculate BB/100 values
    Object.values(adjustedStakeData).forEach((stake) => {
      if (stake.hands > 0) {
        stake.bbPer100 = (stake.bbResult / stake.hands) * 100;
      }
    });

    Object.values(evStakeData).forEach((stake) => {
      if (stake.hands > 0) {
        stake.bbPer100 = (stake.bbResult / stake.hands) * 100;
      }
    });

    // Calculate totals
    const adjustedTotal = {
      hands: totalHands,
      winloss: adjustedFinal,
      bbResult: Object.values(adjustedStakeData).reduce(
        (sum, stake) => sum + stake.bbResult,
        0
      ),
      percentage: "100%",
    };
    adjustedTotal.bbPer100 =
      (adjustedTotal.bbResult / adjustedTotal.hands) * 100;

    const evTotal = {
      hands: totalHands,
      winloss: adjustedEvFinal,
      bbResult: Object.values(evStakeData).reduce(
        (sum, stake) => sum + stake.bbResult,
        0
      ),
      percentage: "100%",
    };
    evTotal.bbPer100 = (evTotal.bbResult / evTotal.hands) * 100;

    const rakeImpact = {
      amount: difference,
      bbAmount:
        rakeAdjustedData[rakeAdjustedData.length - 1].data.totalRakeInBB,
      bbPer100:
        (rakeAdjustedData[rakeAdjustedData.length - 1].data.totalRakeInBB /
          totalHands) *
        100,
    };

    // Create summary section with enhanced styling
    const resultsContainer = document.createElement("div");
    resultsContainer.style.marginTop = themeSpacing.large;

    // Create rake impact summary cards styled like the image
    const rakeImpactSummary = document.createElement("div");

    // Apply section styles
    const sectionStyle = getSectionStyle();
    Object.keys(sectionStyle).forEach((key) => {
      rakeImpactSummary.style[key] = sectionStyle[key];
    });
    rakeImpactSummary.style.textAlign = "center";

    const summaryTitle = document.createElement("div");
    summaryTitle.textContent = "Rake Summary";
    summaryTitle.style.marginBottom = themeSpacing.medium;
    summaryTitle.style.fontSize = themeTypography.titleSize;
    summaryTitle.style.fontWeight = "bold";
    summaryTitle.style.color = themeColors.textColor;

    const summaryCards = document.createElement("div");
    summaryCards.style.display = "flex";
    summaryCards.style.justifyContent = "space-around";
    summaryCards.style.flexWrap = "wrap";
    summaryCards.style.gap = "10px";

    // Create impact summary cards
    const createSummaryCard = (title, value) => {
      const card = document.createElement("div");
      card.style.flex = "1";
      card.style.minWidth = "150px";
      card.style.padding = themeSpacing.medium;
      card.style.backgroundColor = themeColors.lightBg;
      card.style.borderRadius = `${themeBorders.radius}px`;
      card.style.border = `1px solid ${themeColors.borderColor}`;

      const cardTitle = document.createElement("div");
      cardTitle.textContent = title;
      cardTitle.style.fontSize = themeTypography.smallSize;
      cardTitle.style.color = themeColors.mutedTextColor;
      cardTitle.style.marginBottom = themeSpacing.small;

      const cardValue = document.createElement("div");
      cardValue.innerHTML = value;
      cardValue.style.fontSize = "18px";
      cardValue.style.fontWeight = "bold";
      cardValue.style.color = themeColors.textColor;

      card.appendChild(cardTitle);
      card.appendChild(cardValue);

      return card;
    };

    const totalRakeCard = createSummaryCard(
      "Total Rake",
      `$${rakeImpact.amount.toFixed(2)}`
    );
    const bbRakeCard = createSummaryCard(
      "Total Rake in BB",
      `${rakeImpact.bbAmount.toFixed(2)} BB`
    );
    const bbPerHundredCard = createSummaryCard(
      "Rake in BB/100",
      `${rakeImpact.bbPer100.toFixed(2)}`
    );

    summaryCards.appendChild(totalRakeCard);
    summaryCards.appendChild(bbRakeCard);
    summaryCards.appendChild(bbPerHundredCard);

    rakeImpactSummary.appendChild(summaryTitle);
    rakeImpactSummary.appendChild(summaryCards);
    resultsContainer.appendChild(rakeImpactSummary);

    function createResultsTable(title, stakesData, totals, color) {
      const tableContainer = document.createElement("div");
      tableContainer.style.marginBottom = themeSpacing.large;

      // Apply section styles
      const tableSectionStyle = getSectionStyle();
      Object.keys(tableSectionStyle).forEach((key) => {
        tableContainer.style[key] = tableSectionStyle[key];
      });

      // Create table header
      const tableTitle = document.createElement("div");
      tableTitle.textContent = title;
      tableTitle.style.textAlign = "center";
      tableTitle.style.marginBottom = themeSpacing.medium;
      tableTitle.style.color = color;
      tableTitle.style.fontSize = themeTypography.titleSize;
      tableTitle.style.fontWeight = "bold";

      // Add a colored accent bar under the title
      const accentBar = document.createElement("div");
      accentBar.style.height = "3px";
      accentBar.style.width = "60px";
      accentBar.style.backgroundColor = color;
      accentBar.style.margin = `0 auto ${themeSpacing.medium} auto`;
      accentBar.style.borderRadius = `${themeBorders.radius}px`;

      tableContainer.appendChild(tableTitle);
      tableContainer.appendChild(accentBar);

      const table = document.createElement("table");
      // Apply table styles
      const tableStyle = getTableStyle();
      Object.keys(tableStyle).forEach((key) => {
        table.style[key] = tableStyle[key];
      });

      // Table header styling
      const headerBg = themeColors.lightBg;
      const cellPadding = "10px";

      let tableHTML = `
        <thead>
          <tr style="background-color: ${headerBg};">
            <th style="padding: ${cellPadding}; text-align: left; border-bottom: 1px solid ${themeColors.borderColor};">Stakes</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${themeColors.borderColor};">Hands</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${themeColors.borderColor};">Win/Loss</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${themeColors.borderColor};">BB Win/Loss</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${themeColors.borderColor};">BB/100</th>
          </tr>
        </thead>
        <tbody>
      `;

      const sortedStakes = Object.values(stakesData).sort(
        (a, b) => b.bigBlind - a.bigBlind
      );

      sortedStakes.forEach((stake) => {
        if (stake.hands === 0) return;

        const winLossColor =
          stake.winloss >= 0
            ? themeColors.positiveColor
            : themeColors.negativeColor;
        const bbPerColor =
          stake.bbPer100 >= 0
            ? themeColors.positiveColor
            : themeColors.negativeColor;

        tableHTML += `
          <tr>
            <td style="padding: ${cellPadding}; text-align: left; border-bottom: 1px solid ${
          themeColors.borderColor
        };">${stake.stakes}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          themeColors.borderColor
        };">${stake.hands}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          themeColors.borderColor
        }; color: ${winLossColor};">$${stake.winloss.toFixed(2)}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          themeColors.borderColor
        }; color: ${winLossColor};">${stake.bbResult.toFixed(2)}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          themeColors.borderColor
        }; color: ${bbPerColor};">${stake.bbPer100.toFixed(2)}</td>
          </tr>
        `;
      });

      // Total row
      const totalWinLossColor =
        totals.winloss >= 0
          ? themeColors.positiveColor
          : themeColors.negativeColor;
      const totalBbPerColor =
        totals.bbPer100 >= 0
          ? themeColors.positiveColor
          : themeColors.negativeColor;

      tableHTML += `
        <tr style="font-weight: bold; background-color: ${headerBg};">
          <td style="padding: ${cellPadding}; text-align: left; border-top: 1px solid ${
        themeColors.borderColor
      };">TOTAL</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        themeColors.borderColor
      };">${totals.hands}</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        themeColors.borderColor
      }; color: ${totalWinLossColor};">$${totals.winloss.toFixed(2)}</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        themeColors.borderColor
      }; color: ${totalWinLossColor};">${totals.bbResult.toFixed(2)}</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        themeColors.borderColor
      }; color: ${totalBbPerColor};">${totals.bbPer100.toFixed(2)}</td>
        </tr>
        </tbody>
      `;

      table.innerHTML = tableHTML;
      tableContainer.appendChild(table);

      return tableContainer;
    }

    const evTable = createResultsTable(
      "All-in EV Results (Rake-Adjusted)",
      evStakeData,
      evTotal,
      evColor
    );
    const adjustedTable = createResultsTable(
      "Win/Loss Results (Rake-Adjusted)",
      adjustedStakeData,
      adjustedTotal,
      winlossColor
    );

    const tablesContainer = document.createElement("div");
    tablesContainer.style.display = "flex";
    tablesContainer.style.flexWrap = "wrap";
    tablesContainer.style.gap = "20px";
    tablesContainer.style.justifyContent = "space-between";

    evTable.style.flex = "1 1 48%";
    adjustedTable.style.flex = "1 1 48%";
    evTable.style.minWidth = "320px";
    adjustedTable.style.minWidth = "320px";

    tablesContainer.appendChild(evTable);
    tablesContainer.appendChild(adjustedTable);

    resultsContainer.appendChild(tablesContainer);
    wrapper.appendChild(resultsContainer);

    // Create footer note
    const notesContainer = document.createElement("div");
    notesContainer.style.marginTop = themeSpacing.medium;
    notesContainer.style.padding = "12px";
    notesContainer.style.fontSize = themeTypography.smallSize;
    notesContainer.style.color = themeColors.mutedTextColor;
    notesContainer.style.textAlign = "center";

    // Apply section styles
    const noteSectionStyle = getSectionStyle();
    Object.keys(noteSectionStyle).forEach((key) => {
      notesContainer.style[key] = noteSectionStyle[key];
    });

    notesContainer.innerHTML = `
      <div style="margin-bottom: 5px;">Note: Rake calculation assumes 5% rake with a cap of 3 big blinds per pot.</div>
      <div>Each hand is matched to its session based on timestamp, using the correct big blind size for that session.</div>
      <div>All-in EV is adjusted based on the proportion of the pot that would be yours had there been no rake.</div>
      <div style="margin-top: 10px; font-weight: bold; color: ${themeColors.primary}; text-transform: uppercase; letter-spacing: 1px;" class="revamp-brand-text">Powered by REVAMP.GG</div>
    `;

    wrapper.appendChild(notesContainer);

    console.log("Rake-adjusted chart created successfully!");
    console.log(
      `Total rake impact: $${difference.toFixed(2)} over ${totalHands} hands`
    );
    console.log(`Rake impact in BB/100: ${rakeImpact.bbPer100.toFixed(2)}`);
  });
}

// =================================================================
// APP INITIALIZATION
// =================================================================

/**
 * Initialize the application with explicit control flow for all user interactions
 */
function initApp() {
  console.log("Initializing application with explicit control flow...");

  // --- SETUP URL CHANGE DETECTION ---
  // Create an observer to detect Angular route changes
  new MutationObserver(() => {
    // If URL has changed
    if (location.href !== lastUrl) {
      console.log("URL changed from", lastUrl, "to", location.href);
      lastUrl = location.href;

      // Reset any existing observers
      if (buttonObserver) {
        buttonObserver.disconnect();
      }

      // Re-establish all button handlers after a brief delay to let DOM load
      setTimeout(setupButtonHandlers, MS_BETWEEN_ATTEMPTS);
    }
  }).observe(document, { subtree: true, childList: true });

  // --- SETUP BUTTON HANDLERS ---
  // Set up initial button handlers and observers
  setupButtonHandlers();

  console.log("Application initialized successfully!");
}

/**
 * Set up observers to find and attach handlers to all buttons we care about
 */
function setupButtonHandlers() {
  console.log("Setting up button handlers...");

  // If there's an existing observer, disconnect it
  if (buttonObserver) {
    buttonObserver.disconnect();
  }

  // Create a new mutation observer to detect DOM changes
  buttonObserver = new MutationObserver(() => {
    // When DOM changes, check for all our target buttons
    findAndAttachButtonHandlers();
  });

  // Start observing the DOM for changes
  buttonObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });

  // Also run immediately to detect buttons that already exist
  findAndAttachButtonHandlers();
}

/**
 * Core function that finds all buttons and attaches appropriate handlers
 * This is the central control point for all button interactions
 */
function findAndAttachButtonHandlers() {
  console.log("Finding and attaching button handlers");
  // 1. EV Graph Button - Primary interaction point for creating rake graphs
  const evButton = document.querySelector(evButtonSelector);
  if (evButton && !evButton.hasAttribute("poker-craft-ext-initialized")) {
    console.log("✓ Found EV Graph button - attaching handler");
    // Mark as initialized
    evButton.setAttribute("poker-craft-ext-initialized", "true");
    // Add event listener
    evButton.addEventListener("click", handleEvButtonClick);
    // Apply styling
    enhanceButton(evButton, "EV Graph");
  }

  // 2. Rush & Cash Navigation Button - Apply styling only
  const rushAndCashButton = document.querySelector(rushAndCashSelector);
  if (rushAndCashButton && !rushAndCashButton.hasAttribute("revamp-enhanced")) {
    console.log("✓ Found Rush & Cash button - applying styling");
    enhanceButton(rushAndCashButton, "Rush & Cash");
  }

  // 3. Hold'em Navigation Button - Apply styling only
  const holdemButton = document.querySelector(holdemSelector);
  if (holdemButton && !holdemButton.hasAttribute("revamp-enhanced")) {
    console.log("✓ Found Hold'em button - applying styling");
    enhanceButton(holdemButton, "Hold'em");
  }

  // 4. PLO Navigation Button - Apply styling only
  const omahaButton = document.querySelector(omahaSelector);
  if (omahaButton && !omahaButton.hasAttribute("revamp-enhanced")) {
    console.log("✓ Found PLO button - applying styling");
    enhanceButton(omahaButton, "PLO");
  }

  // 5. Next Hands Button - Triggers cleanup and recreates charts
  const allLinks = document.querySelectorAll("a");
  for (const link of allLinks) {
    const span = link.querySelector("span");
    if (
      span &&
      span.textContent.includes("Next") &&
      !span.hasAttribute("poker-craft-ext-initialized")
    ) {
      console.log("✓ Found Next hands button:", span.textContent);
      span.setAttribute("poker-craft-ext-initialized", "true");
      link.addEventListener("click", handleNextHandsButtonClick);
    }
  }

  // 6. Cleanup Trigger Buttons - Various buttons that should trigger cleanup
  cleanupTriggerSelectors.forEach((selector) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      // Skip non-Next elements for span selector
      if (
        selector === "a.ng-star-inserted span" &&
        !element.textContent.includes("Next")
      ) {
        return;
      }

      // Check if already initialized
      if (!element.hasAttribute("cleanup-listener-attached")) {
        console.log(
          `✓ Found cleanup trigger: ${
            element.textContent || element.innerText || "element"
          }`
        );
        element.setAttribute("cleanup-listener-attached", "true");
        element.addEventListener("click", handleCleanupTriggerClick);
      }
    });
  });
}

// Initialize the application
initApp();
