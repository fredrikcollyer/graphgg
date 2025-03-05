// contentScript.js
console.log("PokerCraft extension loaded on " + window.location.href);
const debugIsTrue = false;
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

  // Report on session matching results
  //   console.log("=== SESSION MATCHING RESULTS ===");
  //   console.table(sessionStats);

  // Display stake distribution
  //   console.log("=== STAKE DISTRIBUTION ===");
  //   console.table(stakeDistribution);

  // Log information about unmatched hands
  //   if (unmatchedHandsCount > 0) {
  //     console.warn(
  //       `Warning: ${unmatchedHandsCount} hands (${(
  //         (unmatchedHandsCount / originalData.length) *
  //         100
  //       ).toFixed(
  //         1
  //       )}%) couldn't be matched to any session and were assigned to the highest stakes session`
  //     );
  //   }

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

// Extract poker session data from the HTML table
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

// Extract EV graph data from the Angular component
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

// Match hands to sessions based on timestamps using a network flow algorithm
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

  // Log session assignments for debugging
  //   console.log("=== SESSION ASSIGNMENTS ===");
  //   sortedSessions.forEach((session, idx) => {
  //     console.log(
  //       `Session ${idx + 1} (${session.startTime}): ${session.assignedHands}/${
  //         session.hands
  //       } hands assigned`
  //     );
  //   });

  // Verify that all hands are assigned (not necessarily that all sessions are filled)
  //   console.log("=== SESSION ASSIGNMENTS ===");
  //   sortedSessions.forEach((session, idx) => {
  //     console.log(
  //       `Session ${idx + 1} (${session.startTime}): ${session.assignedHands}/${
  //         session.hands
  //       } hands assigned`
  //     );
  //   });

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

  // Just log a warning for sessions that aren't fully filled
  //   const incompleteSessions = sortedSessions.filter(
  //     (session) => session.assignedHands !== session.hands
  //   );
  //   if (incompleteSessions.length > 0) {
  //     console.warn("=== SESSION ASSIGNMENT WARNING ===");
  //     console.warn(
  //       `${incompleteSessions.length} sessions do not have the exact number of hands expected:`
  //     );

  //     incompleteSessions.forEach((session) => {
  //       const sessionIndex = sortedSessions.indexOf(session);
  //       console.warn(
  //         `Session ${sessionIndex + 1} (${session.startTime}): ${
  //           session.assignedHands
  //         }/${session.hands} hands assigned`
  //       );
  //     });

  //     // Just a warning, not an error
  //     console.warn(
  //       "This is normal if you have more session capacity than hands to assign."
  //     );
  //   }

  return {
    matchedData,
    sessionStats,
    stakeDistribution: stakeDistributionArray,
    unmatchedHandsCount: 0, // Always 0 since we throw errors for unmatched hands
  };
}

// Ford-Fulkerson algorithm implementation for bipartite matching
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

// Helper function to find an augmenting path
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

// Create and display a rake-adjusted chart with winloss and EV
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

    // Use shared style variables
    const styles = window.RevampStyles;

    // Create wrapper with border matching enhanced button
    const wrapper = document.createElement("div");
    wrapper.className = "poker-craft-rake-adjusted-wrapper";
    wrapper.dataset.timestamp = Date.now();
    wrapper.dataset.parentComponentId =
      targetElement.id || "ev-graph-component";

    // Apply container styles
    const containerStyle = styles.ui.getContainerStyle();
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
    const brandTextStyle = styles.ui.getBrandTextStyle(false);
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
    title.style.color = styles.colors.textColor;
    title.style.fontFamily = styles.typography.fontFamily;
    title.style.fontWeight = "600";
    title.style.fontSize = styles.typography.titleSize;

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
    const winlossColor = styles.colors.positiveColor; // Green for winloss
    const evColor = "#FF9800"; // Orange for EV

    // Create the chart with axisY2 on the right-hand side.
    const chart = new CanvasJS.Chart(container.id, {
      backgroundColor: styles.colors.darkBg,
      zoomEnabled: true,
      animationEnabled: true,
      theme: "dark2",
      axisX: {
        // title: "Hand number",
        titleFontColor: styles.colors.textColor,
        titleFontSize: parseInt(styles.typography.subtitleSize),
        labelFontColor: styles.colors.textColor,
        lineColor: styles.colors.borderColor,
        gridColor: styles.colors.gridColor,
        tickLength: 0,
      },
      // Define the secondary Y axis which renders on the right.
      axisY2: {
        // title: "Amount ($)",
        labelFontColor: styles.colors.textColor,
        lineColor: styles.colors.borderColor,
        gridColor: styles.colors.gridColor,
        valueFormatString: "$#,##0.##",
        tickLength: 0,
      },
      toolTip: {
        shared: true,
        borderColor: styles.colors.borderColor,
        backgroundColor: styles.colors.mediumBg,
        fontColor: styles.colors.textColor,
        cornerRadius: styles.borders.radius,
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
        fontColor: styles.colors.textColor,
        fontSize: parseInt(styles.typography.smallSize), // Reduced font size
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
        fontColor: styles.colors.textColor,
        fontSize: parseInt(styles.typography.titleSize),
        fontWeight: "normal",
        fontFamily: styles.typography.fontFamily,
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
          color: styles.colors.positiveColor,
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
    resultsContainer.style.marginTop = styles.spacing.large;

    // Create rake impact summary cards styled like the image
    const rakeImpactSummary = document.createElement("div");

    // Apply section styles
    const sectionStyle = styles.ui.getSectionStyle();
    Object.keys(sectionStyle).forEach((key) => {
      rakeImpactSummary.style[key] = sectionStyle[key];
    });
    rakeImpactSummary.style.textAlign = "center";

    const summaryTitle = document.createElement("div");
    summaryTitle.textContent = "Rake Summary";
    summaryTitle.style.marginBottom = styles.spacing.medium;
    summaryTitle.style.fontSize = styles.typography.titleSize;
    summaryTitle.style.fontWeight = "bold";
    summaryTitle.style.color = styles.colors.textColor;

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
      card.style.padding = styles.spacing.medium;
      card.style.backgroundColor = styles.colors.lightBg;
      card.style.borderRadius = `${styles.borders.radius}px`;
      card.style.border = `1px solid ${styles.colors.borderColor}`;

      const cardTitle = document.createElement("div");
      cardTitle.textContent = title;
      cardTitle.style.fontSize = styles.typography.smallSize;
      cardTitle.style.color = styles.colors.mutedTextColor;
      cardTitle.style.marginBottom = styles.spacing.small;

      const cardValue = document.createElement("div");
      cardValue.innerHTML = value;
      cardValue.style.fontSize = "18px";
      cardValue.style.fontWeight = "bold";
      cardValue.style.color = styles.colors.textColor;

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
      tableContainer.style.marginBottom = styles.spacing.large;

      // Apply section styles
      const tableSectionStyle = styles.ui.getSectionStyle();
      Object.keys(tableSectionStyle).forEach((key) => {
        tableContainer.style[key] = tableSectionStyle[key];
      });

      // Create table header
      const tableTitle = document.createElement("div");
      tableTitle.textContent = title;
      tableTitle.style.textAlign = "center";
      tableTitle.style.marginBottom = styles.spacing.medium;
      tableTitle.style.color = color;
      tableTitle.style.fontSize = styles.typography.titleSize;
      tableTitle.style.fontWeight = "bold";

      // Add a colored accent bar under the title
      const accentBar = document.createElement("div");
      accentBar.style.height = "3px";
      accentBar.style.width = "60px";
      accentBar.style.backgroundColor = color;
      accentBar.style.margin = `0 auto ${styles.spacing.medium} auto`;
      accentBar.style.borderRadius = `${styles.borders.radius}px`;

      tableContainer.appendChild(tableTitle);
      tableContainer.appendChild(accentBar);

      const table = document.createElement("table");
      // Apply table styles
      const tableStyle = styles.ui.getTableStyle();
      Object.keys(tableStyle).forEach((key) => {
        table.style[key] = tableStyle[key];
      });

      // Table header styling
      const headerBg = styles.colors.lightBg;
      const cellPadding = "10px";

      let tableHTML = `
        <thead>
          <tr style="background-color: ${headerBg};">
            <th style="padding: ${cellPadding}; text-align: left; border-bottom: 1px solid ${styles.colors.borderColor};">Stakes</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${styles.colors.borderColor};">Hands</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${styles.colors.borderColor};">Win/Loss</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${styles.colors.borderColor};">BB Win/Loss</th>
            <th style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${styles.colors.borderColor};">BB/100</th>
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
            ? styles.colors.positiveColor
            : styles.colors.negativeColor;
        const bbPerColor =
          stake.bbPer100 >= 0
            ? styles.colors.positiveColor
            : styles.colors.negativeColor;

        tableHTML += `
          <tr>
            <td style="padding: ${cellPadding}; text-align: left; border-bottom: 1px solid ${
          styles.colors.borderColor
        };">${stake.stakes}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          styles.colors.borderColor
        };">${stake.hands}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          styles.colors.borderColor
        }; color: ${winLossColor};">$${stake.winloss.toFixed(2)}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          styles.colors.borderColor
        }; color: ${winLossColor};">${stake.bbResult.toFixed(2)}</td>
            <td style="padding: ${cellPadding}; text-align: right; border-bottom: 1px solid ${
          styles.colors.borderColor
        }; color: ${bbPerColor};">${stake.bbPer100.toFixed(2)}</td>
          </tr>
        `;
      });

      // Total row
      const totalWinLossColor =
        totals.winloss >= 0
          ? styles.colors.positiveColor
          : styles.colors.negativeColor;
      const totalBbPerColor =
        totals.bbPer100 >= 0
          ? styles.colors.positiveColor
          : styles.colors.negativeColor;

      tableHTML += `
        <tr style="font-weight: bold; background-color: ${headerBg};">
          <td style="padding: ${cellPadding}; text-align: left; border-top: 1px solid ${
        styles.colors.borderColor
      };">TOTAL</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        styles.colors.borderColor
      };">${totals.hands}</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        styles.colors.borderColor
      }; color: ${totalWinLossColor};">$${totals.winloss.toFixed(2)}</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        styles.colors.borderColor
      }; color: ${totalWinLossColor};">${totals.bbResult.toFixed(2)}</td>
          <td style="padding: ${cellPadding}; text-align: right; border-top: 1px solid ${
        styles.colors.borderColor
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
    notesContainer.style.marginTop = styles.spacing.medium;
    notesContainer.style.padding = "12px";
    notesContainer.style.fontSize = styles.typography.smallSize;
    notesContainer.style.color = styles.colors.mutedTextColor;
    notesContainer.style.textAlign = "center";

    // Apply section styles
    const noteSectionStyle = styles.ui.getSectionStyle();
    Object.keys(noteSectionStyle).forEach((key) => {
      notesContainer.style[key] = noteSectionStyle[key];
    });

    notesContainer.innerHTML = `
      <div style="margin-bottom: 5px;">Note: Rake calculation assumes 5% rake with a cap of 3 big blinds per pot.</div>
      <div>Each hand is matched to its session based on timestamp, using the correct big blind size for that session.</div>
      <div>All-in EV is adjusted based on the proportion of the pot that would be yours had there been no rake.</div>
      <div style="margin-top: 10px; font-weight: bold; color: ${styles.colors.primary}; text-transform: uppercase; letter-spacing: 1px;" class="revamp-brand-text">Powered by REVAMP.GG</div>
    `;

    wrapper.appendChild(notesContainer);

    console.log("Rake-adjusted chart created successfully!");
    console.log(
      `Total rake impact: $${difference.toFixed(2)} over ${totalHands} hands`
    );
    console.log(`Rake impact in BB/100: ${rakeImpact.bbPer100.toFixed(2)}`);
  });
}

// Function to observe EV Graph button and launch our code when ready
function observeEvGraphButtonAndData() {
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

  let isProcessing = false; // Flag to prevent multiple simultaneous executions
  let buttonObserver = null;

  // Increased timeouts and renamed for clarity
  const maxAttempts = 180;
  const msBetweenAttempts = 1000;

  // Function to remove any previously created charts
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

  // Function to check for chart data and create graph
  function pollForChartDataAndCreate() {
    if (isProcessing) {
      console.log("Already processing a chart request, ignoring");
      return;
    }

    // Remove cleanup call from here - we only want to clean up when specific buttons are clicked
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

            // After creating the graph, look for the "Next X hands" button
            setTimeout(checkForNextHandsButton, msBetweenAttempts);

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
      if (attempts >= maxAttempts) {
        console.error(
          "Chart data still not available after " + maxAttempts + " attempts."
        );
        clearInterval(pollInterval);
        isProcessing = false;
      }
    }, msBetweenAttempts);
  }

  // Function to handle EV button clicks
  function handleEvButtonClick() {
    console.log("EV Graph button clicked.");
    pollForChartDataAndCreate();
  }

  // Function to handle Next Hands button clicks
  function handleNextHandsButtonClick(e) {
    console.log("Next hands button clicked.");

    // Call cleanup here since this is one of the specified buttons
    cleanupPreviousCharts();

    // Make extra sure we're not processing anything else
    if (isProcessing) {
      console.log("Already processing, aborting current process");
      isProcessing = false;
    }

    // Wait for the original chart to update
    setTimeout(() => {
      pollForChartDataAndCreate();
    }, msBetweenAttempts);
  }

  // Function to detect and add listener to the Next X hands button
  function checkForNextHandsButton() {
    // We need a special selector since the standard :contains selector isn't natively supported
    // Find all <a> elements with spans containing "Next"
    const allLinks = document.querySelectorAll("a");

    for (const link of allLinks) {
      const span = link.querySelector("span");
      if (
        span &&
        span.textContent.includes("Next") &&
        !span.hasAttribute("poker-craft-ext-initialized")
      ) {
        console.log("Next hands button found:", span.textContent);
        span.setAttribute("poker-craft-ext-initialized", "true");
        link.addEventListener("click", handleNextHandsButtonClick);
      }
    }
  }

  // Function to add cleanup event listener to specific buttons
  function attachCleanupListeners() {
    cleanupTriggerSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        // For the "Next X hands" button, we need to check the text content
        if (
          selector === "a.ng-star-inserted span" &&
          !element.textContent.includes("Next")
        ) {
          return;
        }

        // Check if we've already attached listener to this element
        if (!element.hasAttribute("cleanup-listener-attached")) {
          element.setAttribute("cleanup-listener-attached", "true");

          // Attach the click event listener
          element.addEventListener("click", () => {
            console.log(
              `Cleanup trigger clicked: ${
                element.textContent || element.innerText
              }`
            );
            cleanupPreviousCharts();
          });

          console.log(
            `Attached cleanup listener to: ${
              element.textContent || element.innerText || selector
            }`
          );
        }
      });
    });
  }

  // Watch for EV Graph button and cleanup trigger buttons using MutationObserver
  function setupButtonObserver() {
    if (buttonObserver) {
      buttonObserver.disconnect();
    }

    buttonObserver = new MutationObserver((mutations) => {
      // Check for EV Graph button
      const evButton = document.querySelector(evButtonSelector);
      if (evButton && !evButton.hasAttribute("poker-craft-ext-initialized")) {
        console.log("EV Graph button found. Attaching click listener.");
        evButton.setAttribute("poker-craft-ext-initialized", "true");
        evButton.addEventListener("click", handleEvButtonClick);

        // Enhance the button with revamp.gg styling
        enhanceButton(evButton, "EV Graph");
      }

      // Check for Rush & Cash button
      const rushAndCashButton = document.querySelector(rushAndCashSelector);
      if (
        rushAndCashButton &&
        !rushAndCashButton.hasAttribute("revamp-enhanced")
      ) {
        console.log("Rush & Cash button found. Applying styling.");
        enhanceButton(rushAndCashButton, "Rush & Cash");
      }

      // Check for Hold'em button
      const holdemButton = document.querySelector(holdemSelector);
      if (holdemButton && !holdemButton.hasAttribute("revamp-enhanced")) {
        console.log("Hold'em button found. Applying styling.");
        enhanceButton(holdemButton, "Hold'em");
      }

      // Check for PLO button
      const omahaButton = document.querySelector(omahaSelector);
      if (omahaButton && !omahaButton.hasAttribute("revamp-enhanced")) {
        console.log("PLO button found. Applying styling.");
        enhanceButton(omahaButton, "PLO");
      }

      // Check for buttons that should trigger cleanup
      attachCleanupListeners();

      // Check for Next Hands button
      checkForNextHandsButton();
    });

    // Start observing the document with the configured parameters
    buttonObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false,
    });

    // Also check immediately in case the buttons already exist
    const evButton = document.querySelector(evButtonSelector);
    if (evButton && !evButton.hasAttribute("poker-craft-ext-initialized")) {
      console.log(
        "EV Graph button found immediately. Attaching click listener."
      );
      evButton.setAttribute("poker-craft-ext-initialized", "true");
      evButton.addEventListener("click", handleEvButtonClick);

      // Enhance the button with revamp.gg styling
      enhanceButton(evButton, "EV Graph");
    }

    // Check for Rush & Cash button immediately
    const rushAndCashButton = document.querySelector(rushAndCashSelector);
    if (
      rushAndCashButton &&
      !rushAndCashButton.hasAttribute("revamp-enhanced")
    ) {
      console.log("Rush & Cash button found immediately. Applying styling.");
      enhanceButton(rushAndCashButton, "Rush & Cash");
    }

    // Check for Hold'em button immediately
    const holdemButton = document.querySelector(holdemSelector);
    if (holdemButton && !holdemButton.hasAttribute("revamp-enhanced")) {
      console.log("Hold'em button found immediately. Applying styling.");
      enhanceButton(holdemButton, "Hold'em");
    }

    // Check for PLO button immediately
    const omahaButton = document.querySelector(omahaSelector);
    if (omahaButton && !omahaButton.hasAttribute("revamp-enhanced")) {
      console.log("PLO button found immediately. Applying styling.");
      enhanceButton(omahaButton, "PLO");
    }

    // Check for cleanup trigger buttons immediately
    attachCleanupListeners();

    checkForNextHandsButton();
  }

  // Watch for route changes in Angular application
  function watchForRouteChanges() {
    // We'll watch the URL for changes
    let lastUrl = location.href;

    // Create an observer to check when the URL changes
    new MutationObserver(() => {
      // Check if URL changed
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log("URL changed to", lastUrl);

        // Reset and re-setup our observers
        if (buttonObserver) {
          buttonObserver.disconnect();
        }

        // Wait a bit for the new page to load its components
        setTimeout(() => {
          setupButtonObserver();
        }, msBetweenAttempts);
      }
    }).observe(document, { subtree: true, childList: true });
  }

  // Start the observers
  setupButtonObserver();
  watchForRouteChanges();
}

// ---
// Enhance a button with revamp.gg styling
// ---
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

  // Use our shared style variables
  const styles = window.RevampStyles;
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
    button.style.boxShadow = styles.effects.glow;
    button.style.borderWidth = styles.borders.width;
    button.style.borderStyle = styles.borders.style;
    button.style.borderColor = styles.colors.primary;
    button.style.boxSizing = "border-box";
    button.style.borderRadius = `${styles.borders.radius}px`;
  }

  // Create the badge container
  const badgeContainer = document.createElement("div");
  badgeContainer.className = "revamp-badge";

  // Apply badge styles
  const badgeStyle = styles.ui.getBadgeStyle(isSmallButton);
  Object.keys(badgeStyle).forEach((key) => {
    badgeContainer.style[key] = badgeStyle[key];
  });

  // Keep badge in top right for all buttons

  // Add the text
  const revampText = document.createElement("span");
  revampText.textContent = "REVAMP.GG";

  // Apply brand text styles
  const textStyle = styles.ui.getBrandTextStyle(isSmallButton);
  Object.keys(textStyle).forEach((key) => {
    revampText.style[key] = textStyle[key];
  });

  // Enhanced hover effect - only on the button but affects text color
  button.addEventListener("mouseover", function () {
    if (isNavButton) {
      // No border hover effect for nav buttons
    } else {
      // Apply hover effect to regular buttons
      button.style.boxShadow = styles.effects.hoverGlow;
      button.style.borderColor = styles.colors.primaryLight;
    }

    // Update text color
    revampText.style.color = styles.colors.primaryLight;
    revampText.style.textShadow = styles.effects.hoverTextShadow;
  });

  button.addEventListener("mouseout", function () {
    if (isNavButton) {
      // No border reset for nav buttons
    } else {
      // Reset regular buttons to default
      button.style.boxShadow = styles.effects.glow;
      button.style.borderColor = styles.colors.primary;
    }

    // Reset text color
    revampText.style.color = styles.colors.primary;
    revampText.style.textShadow = styles.effects.textShadow;

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
}

// Start the observer for the EV graph button
observeEvGraphButtonAndData();
