// Main function to create a rake-adjusted EV graph with dynamic big blind sizing
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

  // Report on session matching results
  console.log("=== SESSION MATCHING RESULTS ===");
  console.table(sessionStats);

  // Display stake distribution
  console.log("=== STAKE DISTRIBUTION ===");
  console.table(stakeDistribution);

  // Log information about unmatched hands
  if (unmatchedHandsCount > 0) {
    console.warn(
      `Warning: ${unmatchedHandsCount} hands (${(
        (unmatchedHandsCount / originalData.length) *
        100
      ).toFixed(
        1
      )}%) couldn't be matched to any session and were assigned to the highest stakes session`
    );
  }

  // Issue warnings for any significant mismatches
  sessionStats.forEach((stat) => {
    const discrepancy = Math.abs(stat.matchedHands - stat.expectedHands);
    const discrepancyPercent = (discrepancy / stat.expectedHands) * 100;

    if (discrepancyPercent > 5 && discrepancy > 3) {
      console.warn(
        `Warning: Session starting at ${stat.startTime} has ${
          stat.matchedHands
        } matched hands but expected ${
          stat.expectedHands
        } (${discrepancyPercent.toFixed(1)}% difference)`
      );
    }
  });

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
  // Find all session rows in the table
  const sessionRows = document.querySelectorAll("tr.mat-row.cdk-row");

  if (!sessionRows.length) {
    console.error("No session rows found in the table");
    return { sessions: [] };
  }

  // Extract data from each row
  const sessions = Array.from(sessionRows).map((row, index) => {
    // Helper function to get text content from a cell by column class
    const getCellContent = (columnClass) => {
      const cell = row.querySelector(`.cdk-column-${columnClass}`);
      return cell ? cell.textContent.trim() : null;
    };

    // Get session start time - handle the nested spans
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
      const [hours, minutes, seconds] = durationStr.split(":").map(Number);
      durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    // Extract stake information
    const stakesStr = getCellContent("Stakes");
    let bigBlind = null;
    if (stakesStr) {
      const bbMatch = stakesStr.match(/\$(\d+\.\d+)$/);
      if (bbMatch) {
        bigBlind = parseFloat(bbMatch[1]);
      }
    }

    // Parse the session start time to timestamp (current year assumed)
    let startTimestamp = null;
    if (startTime) {
      // Format is like "Mar 04, 03:21"
      const currentYear = new Date().getFullYear();
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
          currentYear,
          monthNum,
          parseInt(day),
          parseInt(hour),
          parseInt(minute)
        );
        startTimestamp = dateObj.getTime();
      }
    }

    // Extract other session data
    const session = {
      index: index + 1,
      startTime: startTime,
      startTimestamp: startTimestamp,
      endTimestamp: startTimestamp ? startTimestamp + durationMs : null,
      duration: durationStr,
      durationMs: durationMs,
      gameType: getCellContent("Game"),
      stakes: getCellContent("Stakes"),
      hands: parseInt(getCellContent("Hands"), 10) || 0,
      bigBlind: bigBlind,
      winloss:
        parseFloat((getCellContent("Winloss") || "0").replace("$", "")) || 0,
      assignedHands: 0, // Track how many hands we've assigned to this session
    };

    return session;
  });

  // Sort sessions by start timestamp (newest first)
  sessions.sort((a, b) => (b.startTimestamp || 0) - (a.startTimestamp || 0));

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

    console.log(`Found ${dataPoints.length} data points`);
    return dataPoints;
  } catch (error) {
    console.error("Error extracting data:", error);
    return null;
  }
}

// Match hands to sessions based on timestamps with improved logic
function matchHandsToSessions(handData, sessions) {
  // Initialize counters for each session
  const sessionStats = sessions.map((session) => ({
    startTime: session.startTime,
    expectedHands: session.hands,
    matchedHands: 0,
    bigBlind: session.bigBlind,
    stakes: session.stakes,
  }));

  // Create a deep copy of hand data
  const matchedData = JSON.parse(JSON.stringify(handData));

  // Track stake distribution
  const stakeDistribution = {};

  // Track unmatched hands
  let unmatchedHandsCount = 0;

  // Find highest stake session for fallback
  const highestStakesSession = sessions.reduce(
    (highest, session) =>
      !highest || session.bigBlind > highest.bigBlind ? session : highest,
    null
  );

  // Match each hand to a session
  matchedData.forEach((hand) => {
    const timestamp = hand.data.timestamp;

    // Find all possible sessions this hand could belong to
    const possibleSessions = sessions.filter(
      (session) =>
        session.startTimestamp &&
        session.endTimestamp &&
        timestamp >= session.startTimestamp &&
        timestamp <= session.endTimestamp
    );

    let matchedSession = null;
    let isUnmatched = false;

    if (possibleSessions.length === 0) {
      // No matching session found, use the session closest in time
      const closestSession = sessions.reduce((closest, session) => {
        if (!session.startTimestamp) return closest;

        const distanceStart = Math.abs(timestamp - session.startTimestamp);
        const distanceEnd = Math.abs(timestamp - (session.endTimestamp || 0));
        const minDistance = Math.min(distanceStart, distanceEnd);

        if (!closest || minDistance < closest.distance) {
          return { session, distance: minDistance };
        }
        return closest;
      }, null);

      if (closestSession) {
        matchedSession = closestSession.session;
        console.warn(
          `Hand ${hand.label} outside any session timeframe, assigned to closest (${matchedSession.startTime})`
        );
      } else {
        // Default to highest stakes session
        matchedSession = highestStakesSession;
        isUnmatched = true;
        unmatchedHandsCount++;
        console.warn(
          `Hand ${hand.label} could not be matched to any session, using highest stakes session`
        );
      }
    } else if (possibleSessions.length === 1) {
      // Only one possible session, use it
      matchedSession = possibleSessions[0];
    } else {
      // Multiple possible sessions

      // Check if they have different stake levels
      const uniqueStakes = new Set(possibleSessions.map((s) => s.bigBlind));

      if (uniqueStakes.size > 1) {
        // Different stake levels - use the highest stake
        matchedSession = possibleSessions.reduce(
          (highest, session) =>
            !highest || session.bigBlind > highest.bigBlind ? session : highest,
          null
        );
      } else {
        // Same stake levels - find the one with most available space
        matchedSession = possibleSessions.reduce((mostSpace, session) => {
          const remainingSpace = session.hands - session.assignedHands;

          if (
            !mostSpace ||
            remainingSpace > mostSpace.hands - mostSpace.assignedHands
          ) {
            return session;
          }
          return mostSpace;
        }, null);
      }
    }

    // If we found a match, add session info to the hand data
    if (matchedSession) {
      // Increment assigned hands counter for the matched session
      matchedSession.assignedHands++;

      // Update session stats if not an unmatched hand
      if (!isUnmatched) {
        const sessionIndex = sessions.indexOf(matchedSession);
        if (sessionIndex !== -1) {
          sessionStats[sessionIndex].matchedHands++;
        }
      }

      // Track stake distribution
      const stakesKey = matchedSession.stakes || "Unknown";
      if (!stakeDistribution[stakesKey]) {
        stakeDistribution[stakesKey] = {
          count: 0,
          bigBlind: matchedSession.bigBlind || 0,
          totalAmount: 0,
        };
      }
      stakeDistribution[stakesKey].count++;

      // Track running total of amount at this stake level
      if (hand.data && hand.data.amount !== undefined) {
        const handAmount =
          hand.label === 1
            ? hand.data.amount
            : hand.data.amount - matchedData[hand.label - 2].data.amount;
        stakeDistribution[stakesKey].totalAmount += handAmount;
      }

      // Add session info to the hand data
      hand.sessionData = {
        bigBlind: matchedSession.bigBlind,
        stakes: matchedSession.stakes,
        gameType: matchedSession.gameType,
      };
    }
  });

  // Log the number of unmatched hands
  console.log(
    `Total hands that couldn't be matched to a session and were defaulted to highest stakes: ${unmatchedHandsCount}`
  );

  // Add BB/100 to stake distribution
  Object.keys(stakeDistribution).forEach((stakes) => {
    const info = stakeDistribution[stakes];
    if (info.count > 0 && info.bigBlind > 0) {
      info.bbPer100 = (info.totalAmount / info.bigBlind) * (100 / info.count);
      info.bbResult = info.totalAmount / info.bigBlind;
    } else {
      info.bbPer100 = 0;
      info.bbResult = 0;
    }
  });

  // Convert to array for display
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

  return {
    matchedData,
    sessionStats,
    stakeDistribution: stakeDistributionArray,
    unmatchedHandsCount,
  };
}

// Calculate rake-adjusted data with dynamic big blind sizes
function calculateRakeAdjustedData(originalData, rakePercentage, rakeCap_BB) {
  // Make a deep copy of the original data
  const adjustedData = JSON.parse(JSON.stringify(originalData));

  // Calculate hand-by-hand differences (non-cumulative)
  const handResults = [];
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

  // Apply rake adjustment to each individual hand result
  const adjustedHandResults = handResults.map((hand) => {
    // Only apply rake to winning hands
    if (hand.amount > 0) {
      // Get the big blind size for this hand - ensure we have a valid value
      const bigBlindSize = hand.sessionData?.bigBlind || 0.1;

      // Calculate rake cap based on the big blind size
      const rakeCap = rakeCap_BB * bigBlindSize;

      // Estimate pot size - winning amount is usually part of the pot
      const estimatedPotSize = hand.amount * 2; // Simple estimation of pot size

      // Calculate rake (5% of pot with cap at 3BB)
      const rake = Math.min(estimatedPotSize * rakePercentage, rakeCap);

      // Adjust the winning amount by subtracting rake
      return {
        ...hand,
        amount: hand.amount - rake,
        ev: hand.ev - rake, // Also adjust EV for consistency
        appliedRake: rake,
        bigBlindSize: bigBlindSize,
      };
    }

    // For losing hands, no rake adjustment
    return {
      ...hand,
      appliedRake: 0,
      bigBlindSize: hand.sessionData?.bigBlind || 0.1,
    };
  });

  // Convert back to cumulative results
  let cumulativeAmount = 0;
  let cumulativeEv = 0;
  let totalRake = 0;

  // Also track running BB results for more accurate BB/100 calculation
  let cumulativeBBResult = 0;

  for (let i = 0; i < adjustedData.length; i++) {
    const bigBlindSize = adjustedHandResults[i].bigBlindSize;

    if (i === 0) {
      cumulativeAmount = adjustedHandResults[i].amount;
      cumulativeEv = adjustedHandResults[i].ev;
      totalRake = adjustedHandResults[i].appliedRake || 0;
      cumulativeBBResult = cumulativeAmount / bigBlindSize;
    } else {
      cumulativeAmount += adjustedHandResults[i].amount;
      cumulativeEv += adjustedHandResults[i].ev;
      totalRake += adjustedHandResults[i].appliedRake || 0;
      cumulativeBBResult += adjustedHandResults[i].amount / bigBlindSize;
    }

    // Update the adjusted data point
    adjustedData[i].data.amount = cumulativeAmount;
    adjustedData[i].data.ev = cumulativeEv;
    adjustedData[i].data.totalRake = totalRake;
    adjustedData[i].data.bbResult = cumulativeBBResult;
    adjustedData[i].y = cumulativeAmount; // The y-coordinate is what's displayed on the chart
    adjustedData[i].sessionData = adjustedHandResults[i].sessionData;
    adjustedData[i].bigBlindSize = adjustedHandResults[i].bigBlindSize;
  }

  return adjustedData;
}

// Create and display a comparison chart with enhanced BB calculations
// Display comparison chart with improved tables
function displayComparisonChart(
  originalData,
  rakeAdjustedData,
  stakeDistribution
) {
  // Function to ensure CanvasJS is available
  function ensureCanvasJS(callback) {
    // Check if CanvasJS is directly available
    if (typeof CanvasJS !== "undefined") {
      callback();
      return;
    }

    // Try to find it in the window object
    if (window.CanvasJS) {
      callback();
      return;
    }

    // Look for any chart objects that might contain CanvasJS
    let foundCanvasJS = false;
    document.querySelectorAll("canvas").forEach((canvas) => {
      const container = canvas.closest(".canvasjs-chart-container");
      if (container && !foundCanvasJS) {
        // Check if we can find a chart instance
        const chartObjects = Object.values(window).filter(
          (obj) =>
            obj &&
            typeof obj === "object" &&
            obj.render &&
            obj.options &&
            obj.options.data
        );

        if (chartObjects.length > 0) {
          // We found a chart, use its constructor
          window.CanvasJS = Object.getPrototypeOf(chartObjects[0]).constructor;
          foundCanvasJS = true;
          callback();
          return;
        }
      }
    });

    // If all else fails, load from CDN
    if (!foundCanvasJS) {
      const script = document.createElement("script");
      script.src = "https://cdn.canvasjs.com/canvasjs.min.js";
      script.onload = callback;
      document.head.appendChild(script);
    }
  }

  // Ensure CanvasJS is available, then create the chart
  ensureCanvasJS(function () {
    // Create container for the new chart
    const container = document.createElement("div");
    container.id = "rake-adjusted-chart-container";
    container.style.width = "100%";
    container.style.height = "400px";
    container.style.marginTop = "20px";
    container.style.position = "relative";

    // Create title
    const title = document.createElement("h3");
    title.textContent = "Rake-Adjusted vs. Original Results";
    title.style.textAlign = "center";
    title.style.marginBottom = "10px";
    title.style.color = "#fefefe";

    // Create legend
    const legend = document.createElement("div");
    legend.style.padding = "5px";
    legend.style.marginBottom = "10px";
    legend.style.textAlign = "center";
    legend.innerHTML = `
      <span style="display: inline-block; margin-right: 15px;">
        <span style="display: inline-block; width: 15px; height: 15px; background-color: #64B5F6; margin-right: 5px;"></span>
        Original Results
      </span>
      <span style="display: inline-block;">
        <span style="display: inline-block; width: 15px; height: 15px; background-color: #81C784; margin-right: 5px;"></span>
        Rake-Adjusted Results
      </span>
    `;

    // Add the elements to the page
    const targetElement = document.querySelector(
      "app-game-session-detail-ev-graph"
    );
    if (!targetElement) {
      console.error("Could not find target element to append the chart");
      return;
    }

    // Create wrapper with background matching the original chart
    const wrapper = document.createElement("div");
    wrapper.style.backgroundColor = "#212121";
    wrapper.style.padding = "20px";
    wrapper.style.borderRadius = "5px";
    wrapper.style.marginTop = "20px";
    wrapper.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

    wrapper.appendChild(title);
    wrapper.appendChild(legend);
    wrapper.appendChild(container);

    // Insert after the original chart
    targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);

    // Calculate the difference at the end
    const originalFinal = originalData[originalData.length - 1].y;
    const adjustedFinal =
      rakeAdjustedData[rakeAdjustedData.length - 1].data.amount;
    const difference = originalFinal - adjustedFinal;
    const percentDifference = (difference / Math.abs(originalFinal)) * 100;

    // Format data for CanvasJS
    const chartData = [
      {
        type: "line",
        name: "Original",
        showInLegend: true,
        color: "#64B5F6",
        lineThickness: 2,
        markerSize: 0,
        dataPoints: originalData.map((point, i) => ({
          x: point.x,
          y: point.y,
          label: point.label,
          toolTipContent: `Hand ${point.label}<br/>Amount: $${point.y.toFixed(
            2
          )}<br/>Big Blind: $${(
            rakeAdjustedData[i].bigBlindSize || 0.1
          ).toFixed(2)}`,
        })),
      },
      {
        type: "line",
        name: "Rake-Adjusted",
        showInLegend: true,
        color: "#81C784",
        lineThickness: 2,
        markerSize: 0,
        dataPoints: rakeAdjustedData.map((point) => ({
          x: point.x,
          y: point.data.amount,
          label: point.label,
          toolTipContent: `Hand ${
            point.label
          }<br/>Rake-Adjusted: $${point.data.amount.toFixed(
            2
          )}<br/>Big Blind: $${point.bigBlindSize.toFixed(2)}`,
        })),
      },
    ];

    // Create the chart
    const chart = new CanvasJS.Chart(container.id, {
      backgroundColor: "#212121",
      zoomEnabled: true,
      animationEnabled: true,
      theme: "dark2",
      axisX: {
        title: "Hand Number",
        titleFontColor: "#fefefe",
        labelFontColor: "#fefefe",
        lineColor: "#444",
        gridColor: "#333",
      },
      axisY: {
        title: "Amount ($)",
        titleFontColor: "#fefefe",
        labelFontColor: "#fefefe",
        lineColor: "#444",
        gridColor: "#333",
      },
      toolTip: {
        shared: true,
        borderColor: "#444",
        backgroundColor: "#212121",
        fontColor: "#fff",
      },
      legend: {
        fontColor: "#fefefe",
      },
      title: {
        text: `Total Rake Impact: $${difference.toFixed(
          2
        )} (${percentDifference.toFixed(1)}%)`,
        fontColor: "#fefefe",
        fontSize: 16,
      },
      data: chartData,
    });

    chart.render();

    // Prepare data for results tables
    const totalHands = originalData.length;

    // Generate stake-level data for original results
    const originalStakeData = {};
    const adjustedStakeData = {};

    stakeDistribution.forEach((stake) => {
      originalStakeData[stake.stakes] = {
        stakes: stake.stakes,
        hands: stake.hands,
        bigBlind: stake.bigBlind,
        percentage: stake.percentage,
        winloss: 0,
        bbResult: 0,
        bbPer100: 0,
      };

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

    // Calculate results per stake level
    rakeAdjustedData.forEach((hand, index) => {
      const stakesKey = hand.sessionData.stakes;
      const bigBlind = hand.bigBlindSize;

      if (!stakesKey || !bigBlind) return;

      let originalAmount, adjustedAmount;

      if (index === 0) {
        originalAmount = originalData[index].y;
        adjustedAmount = hand.data.amount;
      } else {
        originalAmount = originalData[index].y - originalData[index - 1].y;
        adjustedAmount =
          hand.data.amount - rakeAdjustedData[index - 1].data.amount;
      }

      // Add to original stake data
      if (originalStakeData[stakesKey]) {
        originalStakeData[stakesKey].winloss += originalAmount;
        originalStakeData[stakesKey].bbResult += originalAmount / bigBlind;
      }

      // Add to adjusted stake data
      if (adjustedStakeData[stakesKey]) {
        adjustedStakeData[stakesKey].winloss += adjustedAmount;
        adjustedStakeData[stakesKey].bbResult += adjustedAmount / bigBlind;
      }
    });

    // Calculate BB/100 for each stake level
    Object.values(originalStakeData).forEach((stake) => {
      if (stake.hands > 0) {
        stake.bbPer100 = (stake.bbResult / stake.hands) * 100;
      }
    });

    Object.values(adjustedStakeData).forEach((stake) => {
      if (stake.hands > 0) {
        stake.bbPer100 = (stake.bbResult / stake.hands) * 100;
      }
    });

    // Calculate totals for original results
    const originalTotal = {
      hands: totalHands,
      winloss: originalFinal,
      bbResult: Object.values(originalStakeData).reduce(
        (sum, stake) => sum + stake.bbResult,
        0
      ),
      percentage: "100%",
    };
    originalTotal.bbPer100 =
      (originalTotal.bbResult / originalTotal.hands) * 100;

    // Calculate totals for adjusted results
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

    // Calculate rake impact totals
    const rakeImpact = {
      amount: difference,
      bbAmount: originalTotal.bbResult - adjustedTotal.bbResult,
      bbPer100: originalTotal.bbPer100 - adjustedTotal.bbPer100,
    };

    // Create results container
    const resultsContainer = document.createElement("div");
    resultsContainer.style.marginTop = "20px";

    // Create rake impact summary
    const rakeImpactSummary = document.createElement("div");
    rakeImpactSummary.style.padding = "10px";
    rakeImpactSummary.style.marginBottom = "15px";
    rakeImpactSummary.style.backgroundColor = "#333";
    rakeImpactSummary.style.borderRadius = "5px";
    rakeImpactSummary.style.textAlign = "center";

    rakeImpactSummary.innerHTML = `
      <h4 style="margin: 0 0 10px 0; color: #f8f8f8;">Rake Impact Summary</h4>
      <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
        <div style="padding: 5px 10px;">
          <strong>Total Rake:</strong> $${rakeImpact.amount.toFixed(2)}
        </div>
        <div style="padding: 5px 10px;">
          <strong>Total Rake in BB:</strong> ${rakeImpact.bbAmount.toFixed(
            2
          )} BB
        </div>
        <div style="padding: 5px 10px;">
          <strong>Rake in BB/100:</strong> ${rakeImpact.bbPer100.toFixed(2)}
        </div>
      </div>
    `;

    resultsContainer.appendChild(rakeImpactSummary);

    // Function to create a results table
    function createResultsTable(title, stakesData, totals, isOriginal) {
      const tableContainer = document.createElement("div");
      tableContainer.style.marginBottom = "20px";

      const tableTitle = document.createElement("h4");
      tableTitle.textContent = title;
      tableTitle.style.margin = "0 0 10px 0";
      tableTitle.style.textAlign = "center";
      tableTitle.style.color = isOriginal ? "#64B5F6" : "#81C784";

      tableContainer.appendChild(tableTitle);

      // Create table
      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.color = "#f8f8f8";

      // Table header
      let tableHTML = `
        <thead>
          <tr>
            <th style="padding: 8px; text-align: left; border-bottom: 1px solid #444;">Stakes</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #444;">Hands</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #444;">Win/Loss</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #444;">BB Win/Loss</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #444;">BB/100</th>
            <th style="padding: 8px; text-align: right; border-bottom: 1px solid #444;">Percentage</th>
          </tr>
        </thead>
        <tbody>
      `;

      // Sort stakes from highest to lowest
      const sortedStakes = Object.values(stakesData).sort(
        (a, b) => b.bigBlind - a.bigBlind
      );

      // Add stake rows
      sortedStakes.forEach((stake) => {
        // Skip stakes with 0 hands
        if (stake.hands === 0) return;

        const winLossColor = stake.winloss >= 0 ? "#81C784" : "#E57373";
        const bbPerColor = stake.bbPer100 >= 0 ? "#81C784" : "#E57373";

        tableHTML += `
          <tr>
            <td style="padding: 8px; text-align: left; border-bottom: 1px solid #333;">${
              stake.stakes
            }</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #333;">${
              stake.hands
            }</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #333; color: ${winLossColor};">$${stake.winloss.toFixed(
          2
        )}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #333; color: ${winLossColor};">${stake.bbResult.toFixed(
          2
        )}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #333; color: ${bbPerColor};">${stake.bbPer100.toFixed(
          2
        )}</td>
            <td style="padding: 8px; text-align: right; border-bottom: 1px solid #333;">${
              stake.percentage
            }</td>
          </tr>
        `;
      });

      // Add total row
      const totalWinLossColor = totals.winloss >= 0 ? "#81C784" : "#E57373";
      const totalBBPerColor = totals.bbPer100 >= 0 ? "#81C784" : "#E57373";

      tableHTML += `
        <tr style="font-weight: bold; background-color: #333;">
          <td style="padding: 8px; text-align: left;">TOTAL</td>
          <td style="padding: 8px; text-align: right;">${totals.hands}</td>
          <td style="padding: 8px; text-align: right; color: ${totalWinLossColor};">$${totals.winloss.toFixed(
        2
      )}</td>
          <td style="padding: 8px; text-align: right; color: ${totalWinLossColor};">${totals.bbResult.toFixed(
        2
      )}</td>
          <td style="padding: 8px; text-align: right; color: ${totalBBPerColor};">${totals.bbPer100.toFixed(
        2
      )}</td>
          <td style="padding: 8px; text-align: right;">${totals.percentage}</td>
        </tr>
        </tbody>
      `;

      table.innerHTML = tableHTML;
      tableContainer.appendChild(table);

      return tableContainer;
    }

    // Create original results table
    const originalTable = createResultsTable(
      "Original Results",
      originalStakeData,
      originalTotal,
      true
    );

    // Create adjusted results table
    const adjustedTable = createResultsTable(
      "Rake-Adjusted Results",
      adjustedStakeData,
      adjustedTotal,
      false
    );

    // Create tables container with 2-column layout
    const tablesContainer = document.createElement("div");
    tablesContainer.style.display = "flex";
    tablesContainer.style.flexWrap = "wrap";
    tablesContainer.style.gap = "20px";
    tablesContainer.style.justifyContent = "space-between";

    // Make each table container take up roughly half the space
    originalTable.style.flex = "1 1 48%";
    adjustedTable.style.flex = "1 1 48%";

    tablesContainer.appendChild(originalTable);
    tablesContainer.appendChild(adjustedTable);

    resultsContainer.appendChild(tablesContainer);
    wrapper.appendChild(resultsContainer);

    // Add notes section
    const notesContainer = document.createElement("div");
    notesContainer.style.marginTop = "15px";
    notesContainer.style.padding = "10px";
    notesContainer.style.fontSize = "12px";
    notesContainer.style.color = "#aaa";
    notesContainer.style.textAlign = "center";

    notesContainer.innerHTML = `
      <p>Note: Rake calculation assumes 5% rake with a cap of 3 big blinds per pot.</p>
      <p>Each hand is matched to its session based on timestamp, using the correct big blind size for that session.</p>
    `;

    wrapper.appendChild(notesContainer);

    console.log("Rake-adjusted chart created successfully!");
    console.log(
      `Total rake impact: $${difference.toFixed(2)} over ${totalHands} hands`
    );
    console.log(`Rake impact in BB/100: ${rakeImpact.bbPer100.toFixed(2)}`);
  });
}

// Run the main function
const graphData = createRakeAdjustedGraph();
console.log("Access the data via the graphData variable");
