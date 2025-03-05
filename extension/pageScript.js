// pageScript.js
console.log("PokerCraft extension loaded on " + window.location.href);

// =================================================================
// CONSTANTS AND STATE
// =================================================================

// Button selectors
const evButtonSelector = 'button[kind="EvGraph"]';
const rushAndCashSelector = 'a.nav-item[nav="rnc"]';
const holdemSelector = 'a.nav-item[nav="holdem"]';
const omahaSelector = 'a.nav-item[nav="omaha"]';
const gameHistorySelector = 'button[kind="Hands"]';
const holeCardsSelector = 'button[kind="HoleCards"]';
const positionSelector = 'button[kind="Position"]';

// Timing constants
const MAX_ATTEMPTS = 180;
const MS_BETWEEN_ATTEMPTS = 1000;

// App state variables
let isProcessing = false; // Flag to prevent multiple simultaneous executions

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
function handleNextHandsButtonClick() {
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
 * Handles Game History button click event
 * Uses: cleanupPreviousCharts
 */
function handleGameHistoryButtonClick() {
  console.log("Game History button clicked.");
  cleanupPreviousCharts();
}

/**
 * Handles Hole Cards button click event
 * Uses: cleanupPreviousCharts
 */
function handleHoleCardsButtonClick() {
  console.log("Hole Cards button clicked.");
  cleanupPreviousCharts();
}

/**
 * Handles Position button click event
 * Uses: cleanupPreviousCharts
 */
function handlePositionButtonClick() {
  console.log("Position button clicked.");
  cleanupPreviousCharts();
}

// =================================================================
// UTILITY FUNCTIONS
// =================================================================

/**
 * Function to remove any previously created charts
 * Uses: none
 */
function cleanupPreviousCharts() {
  console.log("Cleaning up previous charts");

  // Find all elements with our custom attribute
  const customElements = document.querySelectorAll(
    "[data-revamp-chart='true']"
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
 * Uses: isProcessing, extractEVGraphData, createRakeAdjustedGraph, enhanceButtons, MAX_ATTEMPTS, MS_BETWEEN_ATTEMPTS
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
 * Set up animation properties on an element
 * Note: Most animations are now handled by CSS
 */
function setupElementAnimation(element, animationType, duration = "3s") {
  // Animation is now handled by CSS classes
  if (!element) return;

  // Just add the appropriate class based on animation type
  if (animationType === "border") {
    // Border animation is applied via CSS
  } else if (animationType === "text") {
    // Text animation is applied via CSS
  }
}

/**
 * Enhance a button with revamp.gg styling using CSS classes
 */
function enhanceButton(button, buttonType) {
  // Check if button is already enhanced
  if (button.getAttribute("data-revamp-enhanced") === "true") {
    return; // Already enhanced
  }

  // Mark button as enhanced
  button.setAttribute("data-revamp-enhanced", "true");

  // Set position for absolute positioning if needed
  const originalPosition = window.getComputedStyle(button).position;
  if (originalPosition === "static") {
    // Add a class to handle position in CSS
    button.classList.add("revamp-relative-position");
  }

  const isSmallButton = buttonType !== "EV Graph";
  const isNavButton =
    buttonType === "Rush & Cash" ||
    buttonType === "Hold'em" ||
    buttonType === "PLO";

  // Add nav button data attribute if needed
  if (isNavButton) {
    button.setAttribute("data-revamp-nav-button", "true");
  }

  // Create the badge container
  const badgeContainer = document.createElement("div");
  badgeContainer.setAttribute("data-revamp-badge", "true");
  badgeContainer.classList.add("revamp-badge");

  if (isSmallButton) {
    badgeContainer.classList.add("revamp-badge-small");
  }

  // Add the text
  const revampText = document.createElement("span");
  revampText.textContent = "REVAMP.GG";
  revampText.setAttribute("data-revamp-text", "true");
  revampText.classList.add("revamp-brand-text");

  if (isSmallButton) {
    revampText.classList.add("revamp-brand-text-small");
  }

  // Assemble and append
  badgeContainer.appendChild(revampText);
  button.appendChild(badgeContainer);

  console.log(`Enhanced ${buttonType} button with revamp.gg styling`);
}

/**
 * Enhances all available buttons at once
 * Uses: enhanceButton
 */
function enhanceButtons() {
  // Enhance the EV Graph button if present
  const evButton = document.querySelector(evButtonSelector);
  if (evButton && evButton.getAttribute("data-revamp-enhanced") !== "true") {
    enhanceButton(evButton, "EV Graph");
  }

  // Enhance Rush & Cash navigation button if present
  const rushAndCashButton = document.querySelector(rushAndCashSelector);
  if (
    rushAndCashButton &&
    rushAndCashButton.getAttribute("data-revamp-enhanced") !== "true"
  ) {
    enhanceButton(rushAndCashButton, "Rush & Cash");
  }

  // Enhance Hold'em navigation button if present
  const holdemButton = document.querySelector(holdemSelector);
  if (
    holdemButton &&
    holdemButton.getAttribute("data-revamp-enhanced") !== "true"
  ) {
    enhanceButton(holdemButton, "Hold'em");
  }

  // Enhance PLO navigation button if present
  const omahaButton = document.querySelector(omahaSelector);
  if (
    omahaButton &&
    omahaButton.getAttribute("data-revamp-enhanced") !== "true"
  ) {
    enhanceButton(omahaButton, "PLO");
  }
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
    // Container styles are now in CSS

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
    wrapper.setAttribute("data-revamp-chart", "true");
    wrapper.setAttribute("data-timestamp", Date.now());
    wrapper.setAttribute(
      "data-parent-component-id",
      targetElement.id || "ev-graph-component"
    );
    wrapper.classList.add("revamp-container");

    // Add header
    const header = document.createElement("div");
    header.classList.add("revamp-chart-header");

    // Create REVAMP.GG text styled like the enhanced button text
    const brandText = document.createElement("div");
    brandText.setAttribute("data-revamp-brand-text", "true");
    brandText.classList.add("revamp-brand-text", "revamp-chart-badge");
    brandText.textContent = "REVAMP.GG";

    const title = document.createElement("h3");
    title.textContent = "Rake-Adjusted Graph";
    title.classList.add("revamp-chart-title");

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

    // Get CSS variables for chart styling
    const cssVars = getComputedStyle(document.documentElement);

    // Define colors for the graph
    const winlossColor = cssVars.getPropertyValue("--positive-color").trim();
    const evColor = "#FF9800"; // Orange for EV
    const darkBg = cssVars.getPropertyValue("--dark-bg").trim();
    const textColor = cssVars.getPropertyValue("--text-color").trim();
    const borderColor = cssVars.getPropertyValue("--border-color").trim();
    const gridColor = cssVars.getPropertyValue("--grid-color").trim();
    const mediumBg = cssVars.getPropertyValue("--medium-bg").trim();
    const borderRadius = parseInt(
      cssVars.getPropertyValue("--border-radius").trim()
    );
    const smallSize = parseInt(cssVars.getPropertyValue("--small-size").trim());
    const titleSize = parseInt(cssVars.getPropertyValue("--title-size").trim());
    const fontFamily = cssVars.getPropertyValue("--font-family").trim();
    const subtitleSize = parseInt(
      cssVars.getPropertyValue("--subtitle-size").trim()
    );

    // Create the chart with axisY2 on the right-hand side.
    const chart = new CanvasJS.Chart(container.id, {
      backgroundColor: darkBg,
      zoomEnabled: true,
      animationEnabled: true,
      theme: "dark2",
      axisX: {
        // title: "Hand number",
        titleFontColor: textColor,
        titleFontSize: subtitleSize,
        labelFontColor: textColor,
        lineColor: borderColor,
        gridColor: gridColor,
        tickLength: 0,
      },
      // Define the secondary Y axis which renders on the right.
      axisY2: {
        // title: "Amount ($)",
        labelFontColor: textColor,
        lineColor: borderColor,
        gridColor: gridColor,
        valueFormatString: "$#,##0.##",
        tickLength: 0,
      },
      toolTip: {
        shared: true,
        borderColor: borderColor,
        backgroundColor: mediumBg,
        fontColor: textColor,
        cornerRadius: borderRadius,
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

              content += `<span class="tooltip-value" style="color: ${color};">${name}: $${value}</span><br/>`;
            }

            return content;
          }
          return "";
        },
      },
      legend: {
        cursor: "pointer",
        fontColor: textColor,
        fontSize: smallSize,
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
        fontColor: textColor,
        fontSize: titleSize,
        fontWeight: "normal",
        fontFamily: fontFamily,
        padding: 10,
      },
      creditText: "",
      data: [
        {
          type: "line",
          axisYType: "secondary",
          name: "All-in EV (Rake-Adjusted)",
          showInLegend: true,
          color: evColor,
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
          color: winlossColor,
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
    const currentTimestamp = wrapper.getAttribute("data-timestamp");
    const oldCharts = document.querySelectorAll("[data-revamp-chart='true']");
    oldCharts.forEach((chart) => {
      if (chart.getAttribute("data-timestamp") !== currentTimestamp) {
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
    resultsContainer.classList.add("revamp-results-container");

    // Create rake impact summary cards
    const rakeImpactSummary = document.createElement("div");
    rakeImpactSummary.classList.add("revamp-section", "revamp-summary");

    const summaryTitle = document.createElement("div");
    summaryTitle.textContent = "Rake Summary";
    summaryTitle.classList.add("revamp-summary-title");

    const summaryCards = document.createElement("div");
    summaryCards.classList.add("revamp-summary-cards");

    // Create impact summary cards
    const createSummaryCard = (title, value) => {
      const card = document.createElement("div");
      card.classList.add("revamp-summary-card");

      const cardTitle = document.createElement("div");
      cardTitle.textContent = title;
      cardTitle.classList.add("revamp-card-title");

      const cardValue = document.createElement("div");
      cardValue.innerHTML = value;
      cardValue.classList.add("revamp-card-value");

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
      tableContainer.classList.add("revamp-section", "revamp-table-container");

      // Create table header
      const tableTitle = document.createElement("div");
      tableTitle.textContent = title;
      tableTitle.classList.add("revamp-table-title");

      // Use dynamic class for color
      if (color === "#FF9800") {
        tableTitle.classList.add("revamp-color-ev");
      } else {
        // Assuming this is positive color
        tableTitle.classList.add("revamp-positive");
      }

      // Add a colored accent bar under the title
      const accentBar = document.createElement("div");
      accentBar.classList.add("revamp-accent-bar");

      // Use dynamic class for background-color
      if (color === "#FF9800") {
        accentBar.classList.add("revamp-bg-ev");
      } else {
        // Assuming this is positive color
        accentBar.classList.add("revamp-positive");
      }

      tableContainer.appendChild(tableTitle);
      tableContainer.appendChild(accentBar);

      const table = document.createElement("table");
      table.classList.add("revamp-table");

      let tableHTML = `
        <thead>
          <tr>
            <th>Stakes</th>
            <th>Hands</th>
            <th>Win/Loss</th>
            <th>BB Win/Loss</th>
            <th>BB/100</th>
          </tr>
        </thead>
        <tbody>
      `;

      const sortedStakes = Object.values(stakesData).sort(
        (a, b) => b.bigBlind - a.bigBlind
      );

      sortedStakes.forEach((stake) => {
        if (stake.hands === 0) return;

        // Use CSS classes for positive/negative values
        const winLossClass =
          stake.winloss >= 0 ? "revamp-positive" : "revamp-negative";
        const bbPerClass =
          stake.bbPer100 >= 0 ? "revamp-positive" : "revamp-negative";

        tableHTML += `
          <tr>
            <td>${stake.stakes}</td>
            <td>${stake.hands}</td>
            <td class="${winLossClass}">$${stake.winloss.toFixed(2)}</td>
            <td class="${winLossClass}">${stake.bbResult.toFixed(2)}</td>
            <td class="${bbPerClass}">${stake.bbPer100.toFixed(2)}</td>
          </tr>
        `;
      });

      // Total row
      const totalWinLossClass =
        totals.winloss >= 0 ? "revamp-positive" : "revamp-negative";
      const totalBbPerClass =
        totals.bbPer100 >= 0 ? "revamp-positive" : "revamp-negative";

      tableHTML += `
        <tr class="revamp-total-row">
          <td>TOTAL</td>
          <td>${totals.hands}</td>
          <td class="${totalWinLossClass}">$${totals.winloss.toFixed(2)}</td>
          <td class="${totalWinLossClass}">${totals.bbResult.toFixed(2)}</td>
          <td class="${totalBbPerClass}">${totals.bbPer100.toFixed(2)}</td>
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
      "#FF9800" // Orange for EV
    );
    const adjustedTable = createResultsTable(
      "Win/Loss Results (Rake-Adjusted)",
      adjustedStakeData,
      adjustedTotal,
      "var(--positive-color)" // Green for win/loss
    );

    const tablesContainer = document.createElement("div");
    tablesContainer.classList.add("revamp-tables-container");

    tablesContainer.appendChild(evTable);
    tablesContainer.appendChild(adjustedTable);

    resultsContainer.appendChild(tablesContainer);
    wrapper.appendChild(resultsContainer);

    // Create footer note
    const notesContainer = document.createElement("div");
    notesContainer.classList.add("revamp-section", "revamp-notes-container");

    // Create and style the brand text in the footer
    const footerBrandText = document.createElement("div");
    footerBrandText.textContent = "Powered by REVAMP.GG";
    footerBrandText.classList.add("revamp-footer-brand");

    notesContainer.innerHTML = `
      <div class="revamp-note-line">Note: Rake calculation assumes 5% rake with a cap of 3 big blinds per pot.</div>
      <div class="revamp-note-line">Each hand is matched to its session based on timestamp, using the correct big blind size for that session.</div>
      <div class="revamp-note-line">All-in EV is adjusted based on the proportion of the pot that would be yours had there been no rake.</div>
    `;

    notesContainer.appendChild(footerBrandText);
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
  console.log("initApp() called");

  // Add centralized click event listener with inline handler for event delegation
  document.addEventListener("click", (event) => {
    // Find the actual target or its closest matching parent
    const target = event.target;

    // Check for EV Graph button
    const evButton = target.closest(evButtonSelector);
    if (evButton) {
      handleEvButtonClick();
      return;
    }

    const gameHistoryButton = target.closest(gameHistorySelector);
    if (gameHistoryButton) {
      handleGameHistoryButtonClick();
      return;
    }

    const holeCardsButton = target.closest(holeCardsSelector);
    if (holeCardsButton) {
      handleHoleCardsButtonClick();
      return;
    }

    const positionButton = target.closest(positionSelector);
    if (positionButton) {
      handlePositionButtonClick();
      return;
    }

    // Check for "Next X hands" link
    // These are special because they have a span with text inside
    const linkParent = target.closest("a.ng-star-inserted");
    if (linkParent) {
      const span = linkParent.querySelector("span");
      if (span && span.textContent && span.textContent.includes("Next")) {
        handleNextHandsButtonClick();
        return;
      }
    }
  });

  // Set up a MutationObserver to call enhanceButtons() on any DOM mutation.
  const observer = new MutationObserver(() => {
    console.log("DOM mutation detected. Calling enhanceButtons()");
    enhanceButtons();
  });

  // Start observing the document body for child node changes in the entire subtree.
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Initialize the application
initApp();
