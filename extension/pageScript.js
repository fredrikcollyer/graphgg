// contentScript.js
console.log("PokerCraft extension loaded on " + window.location.href);
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
  const sessionRows = document.querySelectorAll("tr.mat-row.cdk-row");

  if (!sessionRows.length) {
    console.error("No session rows found in the table");
    return { sessions: [] };
  }

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

    let startTimestamp = null;
    if (startTime) {
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
      assignedHands: 0,
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
  const sessionStats = sessions.map((session) => ({
    startTime: session.startTime,
    expectedHands: session.hands,
    matchedHands: 0,
    bigBlind: session.bigBlind,
    stakes: session.stakes,
  }));

  const matchedData = JSON.parse(JSON.stringify(handData));
  const stakeDistribution = {};
  let unmatchedHandsCount = 0;
  const highestStakesSession = sessions.reduce(
    (highest, session) =>
      !highest || session.bigBlind > highest.bigBlind ? session : highest,
    null
  );

  matchedData.forEach((hand) => {
    const timestamp = hand.data.timestamp;
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
        matchedSession = highestStakesSession;
        isUnmatched = true;
        unmatchedHandsCount++;
        console.warn(
          `Hand ${hand.label} could not be matched to any session, using highest stakes session`
        );
      }
    } else if (possibleSessions.length === 1) {
      matchedSession = possibleSessions[0];
    } else {
      const uniqueStakes = new Set(possibleSessions.map((s) => s.bigBlind));
      if (uniqueStakes.size > 1) {
        matchedSession = possibleSessions.reduce(
          (highest, session) =>
            !highest || session.bigBlind > highest.bigBlind ? session : highest,
          null
        );
      } else {
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

    if (matchedSession) {
      matchedSession.assignedHands++;
      if (!isUnmatched) {
        const sessionIndex = sessions.indexOf(matchedSession);
        if (sessionIndex !== -1) {
          sessionStats[sessionIndex].matchedHands++;
        }
      }

      const stakesKey = matchedSession.stakes || "Unknown";
      if (!stakeDistribution[stakesKey]) {
        stakeDistribution[stakesKey] = {
          count: 0,
          bigBlind: matchedSession.bigBlind || 0,
          totalAmount: 0,
        };
      }
      stakeDistribution[stakesKey].count++;
      if (hand.data && hand.data.amount !== undefined) {
        const handAmount =
          hand.label === 1
            ? hand.data.amount
            : hand.data.amount - matchedData[hand.label - 2].data.amount;
        stakeDistribution[stakesKey].totalAmount += handAmount;
      }

      hand.sessionData = {
        bigBlind: matchedSession.bigBlind,
        stakes: matchedSession.stakes,
        gameType: matchedSession.gameType,
      };
    }
  });

  console.log(
    `Total hands that couldn't be matched to a session and were defaulted to highest stakes: ${unmatchedHandsCount}`
  );

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
  const adjustedData = JSON.parse(JSON.stringify(originalData));
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

  const adjustedHandResults = handResults.map((hand) => {
    if (hand.amount > 0) {
      const bigBlindSize = hand.sessionData?.bigBlind || 0.1;
      const rakeCap = rakeCap_BB * bigBlindSize;
      const estimatedPotSize = hand.amount * 2;
      const rake = Math.min(estimatedPotSize * rakePercentage, rakeCap);
      return {
        ...hand,
        amount: hand.amount - rake,
        ev: hand.ev - rake,
        appliedRake: rake,
        bigBlindSize: bigBlindSize,
      };
    }
    return {
      ...hand,
      appliedRake: 0,
      bigBlindSize: hand.sessionData?.bigBlind || 0.1,
    };
  });

  let cumulativeAmount = 0;
  let cumulativeEv = 0;
  let totalRake = 0;
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

    adjustedData[i].data.amount = cumulativeAmount;
    adjustedData[i].data.ev = cumulativeEv;
    adjustedData[i].data.totalRake = totalRake;
    adjustedData[i].data.bbResult = cumulativeBBResult;
    adjustedData[i].y = cumulativeAmount;
    adjustedData[i].sessionData = adjustedHandResults[i].sessionData;
    adjustedData[i].bigBlindSize = adjustedHandResults[i].bigBlindSize;
  }

  return adjustedData;
}

// Create and display a comparison chart with enhanced BB calculations
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

    const title = document.createElement("h3");
    title.textContent = "Rake-Adjusted vs. Original Results";
    title.style.textAlign = "center";
    title.style.marginBottom = "10px";
    title.style.color = "#fefefe";

    const legend = document.createElement("div");

    const targetElement = document.querySelector(
      "app-game-session-detail-ev-graph"
    );
    if (!targetElement) {
      console.error("Could not find target element to append the chart");
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "poker-craft-rake-adjusted-wrapper";
    wrapper.dataset.timestamp = Date.now(); // Add a timestamp to identify this as the newest chart
    wrapper.style.backgroundColor = "#212121";
    wrapper.style.padding = "20px";
    wrapper.style.borderRadius = "5px";
    wrapper.style.marginTop = "20px";
    wrapper.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";

    wrapper.appendChild(title);
    wrapper.appendChild(legend);
    wrapper.appendChild(container);

    // First, add the new chart to the page
    targetElement.parentNode.insertBefore(wrapper, targetElement.nextSibling);

    const originalFinal = originalData[originalData.length - 1].y;
    const adjustedFinal =
      rakeAdjustedData[rakeAdjustedData.length - 1].data.amount;
    const difference = originalFinal - adjustedFinal;
    const percentDifference = (difference / Math.abs(originalFinal)) * 100;

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

      if (originalStakeData[stakesKey]) {
        originalStakeData[stakesKey].winloss += originalAmount;
        originalStakeData[stakesKey].bbResult += originalAmount / bigBlind;
      }

      if (adjustedStakeData[stakesKey]) {
        adjustedStakeData[stakesKey].winloss += adjustedAmount;
        adjustedStakeData[stakesKey].bbResult += adjustedAmount / bigBlind;
      }
    });

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

    const rakeImpact = {
      amount: difference,
      bbAmount: originalTotal.bbResult - adjustedTotal.bbResult,
      bbPer100: originalTotal.bbPer100 - adjustedTotal.bbPer100,
    };

    const resultsContainer = document.createElement("div");
    resultsContainer.style.marginTop = "20px";

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
                <strong>Rake in BB/100:</strong> ${rakeImpact.bbPer100.toFixed(
                  2
                )}
              </div>
            </div>
          `;

    resultsContainer.appendChild(rakeImpactSummary);

    function createResultsTable(title, stakesData, totals, isOriginal) {
      const tableContainer = document.createElement("div");
      tableContainer.style.marginBottom = "20px";

      const tableTitle = document.createElement("h4");
      tableTitle.textContent = title;
      tableTitle.style.margin = "0 0 10px 0";
      tableTitle.style.textAlign = "center";
      tableTitle.style.color = isOriginal ? "#64B5F6" : "#81C784";

      tableContainer.appendChild(tableTitle);

      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";
      table.style.color = "#f8f8f8";

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

      const sortedStakes = Object.values(stakesData).sort(
        (a, b) => b.bigBlind - a.bigBlind
      );

      sortedStakes.forEach((stake) => {
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

      tableHTML += `
              <tr style="font-weight: bold; background-color: #333;">
                <td style="padding: 8px; text-align: left;">TOTAL</td>
                <td style="padding: 8px; text-align: right;">${
                  totals.hands
                }</td>
                <td style="padding: 8px; text-align: right; color: ${
                  totals.winloss >= 0 ? "#81C784" : "#E57373"
                };">$${totals.winloss.toFixed(2)}</td>
                <td style="padding: 8px; text-align: right; color: ${
                  totals.winloss >= 0 ? "#81C784" : "#E57373"
                };">${totals.bbResult.toFixed(2)}</td>
                <td style="padding: 8px; text-align: right; color: ${
                  totals.bbPer100 >= 0 ? "#81C784" : "#E57373"
                };">${totals.bbPer100.toFixed(2)}</td>
                <td style="padding: 8px; text-align: right;">${
                  totals.percentage
                }</td>
              </tr>
              </tbody>
            `;

      table.innerHTML = tableHTML;
      tableContainer.appendChild(table);

      return tableContainer;
    }

    const originalTable = createResultsTable(
      "Original Results",
      originalStakeData,
      originalTotal,
      true
    );
    const adjustedTable = createResultsTable(
      "Rake-Adjusted Results",
      adjustedStakeData,
      adjustedTotal,
      false
    );

    const tablesContainer = document.createElement("div");
    tablesContainer.style.display = "flex";
    tablesContainer.style.flexWrap = "wrap";
    tablesContainer.style.gap = "20px";
    tablesContainer.style.justifyContent = "space-between";

    originalTable.style.flex = "1 1 48%";
    adjustedTable.style.flex = "1 1 48%";

    tablesContainer.appendChild(originalTable);
    tablesContainer.appendChild(adjustedTable);

    resultsContainer.appendChild(tablesContainer);
    wrapper.appendChild(resultsContainer);

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
// Observe the EV Graph button and launch our code when ready
function observeEvGraphButtonAndData() {
  const evButtonSelector = 'button[kind="EvGraph"]';
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

            // Create the new chart first (old charts still visible)
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

        // Enhance the button with revamp.gg styling
        enhanceButton(link, "Next Hands");
      }
    }
  }

  // Watch for EV Graph button and Next Hands button using MutationObserver
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

    checkForNextHandsButton();
  }

  // Watch for route changes in Angular application
  function watchForRouteChanges() {
    // We'll watch the URL for changes
    let lastUrl = location.href;

    // Create an observer to check when the URL changes
    new MutationObserver(() => {
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

  // Define border properties with thicker borders
  const borderWidth = "2px";
  const borderColor = "#9d4edd";
  const borderStyle = "solid";
  const glowEffect = "0 0 10px rgba(157, 78, 221, 0.7)";
  const hoverGlowEffect = "0 0 15px rgba(176, 102, 230, 0.9)";
  const hoverBorderColor = "#b066e6";

  // Apply border and glow to the button
  button.style.overflow = "visible";
  button.style.boxShadow = glowEffect;
  button.style.borderWidth = borderWidth;
  button.style.borderStyle = borderStyle;
  button.style.borderColor = borderColor;
  button.style.boxSizing = "border-box";

  // Create the badge container
  const badgeContainer = document.createElement("div");
  badgeContainer.className = "revamp-badge";
  badgeContainer.style.position = "absolute";
  badgeContainer.style.top = "0";
  badgeContainer.style.right = "0";
  badgeContainer.style.background = "transparent"; // Make background transparent

  // No borders on the badge, as requested
  // badgeContainer.style.borderBottomWidth = borderWidth;
  // badgeContainer.style.borderBottomStyle = borderStyle;
  // badgeContainer.style.borderBottomColor = borderColor;
  // badgeContainer.style.borderLeftWidth = borderWidth;
  // badgeContainer.style.borderLeftStyle = borderStyle;
  // badgeContainer.style.borderLeftColor = borderColor;

  badgeContainer.style.zIndex = "5";
  badgeContainer.style.boxSizing = "border-box";
  badgeContainer.style.display = "flex";
  badgeContainer.style.alignItems = "center";
  badgeContainer.style.justifyContent = "center";
  badgeContainer.style.pointerEvents = "none"; // Important: prevent separate hover on the badge

  // Add the text
  const revampText = document.createElement("span");
  revampText.textContent = "REVAMP.GG";
  revampText.style.display = "block";
  revampText.style.color = borderColor;
  revampText.style.fontFamily = "'Arial', sans-serif";
  revampText.style.fontWeight = "bold";
  revampText.style.letterSpacing = "0.5px";
  revampText.style.textShadow = "0 0 5px rgba(157, 78, 221, 0.7)";
  revampText.style.pointerEvents = "none";
  revampText.style.lineHeight = "1";
  revampText.style.textAlign = "center";

  // Set appropriate font size and increased padding based on button type
  if (buttonType === "EV Graph") {
    revampText.style.fontSize = "11px";
    badgeContainer.style.padding = "4px 8px 4px 8px";
  } else {
    revampText.style.fontSize = "8px";
    badgeContainer.style.padding = "3px 6px 3px 6px";
  }

  // Add the subtle animations
  if (!document.getElementById("revamp-glow-animations")) {
    const styleEl = document.createElement("style");
    styleEl.id = "revamp-glow-animations";
    styleEl.textContent = `
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
      
      /* Apply animations to button and text */
      button[revamp-enhanced="true"] {
        animation: borderGlow 3s infinite ease-in-out;
      }
      
      button[revamp-enhanced="true"] .revamp-badge span {
        animation: textPulse 3s infinite ease-in-out;
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Enhanced hover effect - only on the button but affects text color
  button.addEventListener("mouseover", function () {
    // Apply hover effect to button
    button.style.boxShadow = hoverGlowEffect;
    button.style.borderColor = hoverBorderColor;

    // Update text color
    revampText.style.color = hoverBorderColor;
    revampText.style.textShadow = "0 0 10px rgba(176, 102, 230, 0.9)";
  });

  button.addEventListener("mouseout", function () {
    // Reset button to default
    button.style.boxShadow = glowEffect;
    button.style.borderColor = borderColor;

    // Reset text color
    revampText.style.color = borderColor;
    revampText.style.textShadow = "0 0 5px rgba(157, 78, 221, 0.7)";

    // Restart animations
    button.style.animation = "none";
    revampText.style.animation = "none";

    setTimeout(() => {
      // Restore animations
      button.style.animation = "borderGlow 3s infinite ease-in-out";
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
