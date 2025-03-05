// visualization.js
(function() {
  // Initialize namespace
  window.PokerCraftExt = window.PokerCraftExt || {};
  
  // Expose chart creation function
  window.PokerCraftExt.displayComparisonChart = function(originalData, rakeAdjustedData, sessionData) {
    console.log("Displaying comparison chart...");
    
    try {
      if (!originalData || !rakeAdjustedData) {
        console.error("Invalid data for chart display");
        return false;
      }
      
      // Create container for the comparison chart
      const container = createChartContainer();
      if (!container) {
        console.error("Could not create chart container");
        return false;
      }
      
      // Add heading
      addChartHeading(container);
      
      // Create chart canvas
      const canvas = createChartCanvas(container);
      
      // Calculate summary statistics
      const summary = calculateSummaryStats(originalData, rakeAdjustedData);
      
      // Add summary cards
      addSummaryCards(container, summary);
      
      // Add tables for each stake level
      addStakeTables(container, rakeAdjustedData, sessionData);
      
      // Create and render the chart
      const chart = createChart(canvas, originalData, rakeAdjustedData);
      
      // Add branding
      addBrandingFooter(container);
      
      return true;
    } catch (error) {
      console.error("Error displaying comparison chart:", error);
      return false;
    }
  };
  
  // Private helper functions
  function createChartContainer() {
    try {
      // Remove any existing comparison charts first
      const existingCharts = document.querySelectorAll(".rake-comparison-container");
      existingCharts.forEach(chart => chart.remove());
      
      // Find the container to append our chart to
      const mainContainer = document.querySelector(".player-chart");
      if (!mainContainer) {
        console.error("Main chart container not found");
        return null;
      }
      
      // Create new comparison container
      const container = document.createElement("div");
      container.className = "rake-comparison-container";
      
      // Get container styles from the helper function
      const containerStyles = window.PokerCraftExt.getContainerStyle();
      
      // Set styles for container
      Object.assign(container.style, containerStyles);
      
      // Additional styles specific to this container
      Object.assign(container.style, {
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      });
      
      // Append to main container
      mainContainer.appendChild(container);
      
      return container;
    } catch (error) {
      console.error("Error creating chart container:", error);
      return null;
    }
  }
  
  function addChartHeading(container) {
    const heading = document.createElement("h2");
    heading.textContent = "Rake-Adjusted Graph Comparison";
    
    Object.assign(heading.style, {
      margin: "0",
      padding: "0",
      fontSize: "16px", // Typography titleSize
      fontWeight: "600",
      color: "#9d4edd", // Primary purple
      textAlign: "center",
      marginBottom: "10px"
    });
    
    container.appendChild(heading);
  }
  
  function createChartCanvas(container) {
    const canvasContainer = document.createElement("div");
    Object.assign(canvasContainer.style, {
      width: "100%",
      height: "400px",
      position: "relative"
    });
    
    const canvas = document.createElement("canvas");
    canvasContainer.appendChild(canvas);
    container.appendChild(canvasContainer);
    
    return canvas;
  }
  
  function calculateSummaryStats(originalData, rakeAdjustedData) {
    const originalTotal = calculateTotal(originalData.data, "c");
    const rakeAdjTotal = calculateTotal(rakeAdjustedData.data, "c");
    const rakeAmount = rakeAdjTotal - originalTotal;
    const rakePercentage = (rakeAmount / Math.abs(rakeAdjTotal)) * 100;
    
    const originalEVTotal = calculateTotal(originalData.data, "ev");
    const rakeAdjEVTotal = calculateTotal(rakeAdjustedData.data, "ev");
    const rakeEVAmount = rakeAdjEVTotal - originalEVTotal;
    
    return {
      originalTotal: formatCurrency(originalTotal),
      rakeAdjTotal: formatCurrency(rakeAdjTotal),
      rakeAmount: formatCurrency(rakeAmount),
      rakePercentage: rakePercentage.toFixed(2) + "%",
      originalEVTotal: formatCurrency(originalEVTotal),
      rakeAdjEVTotal: formatCurrency(rakeAdjEVTotal),
      rakeEVAmount: formatCurrency(rakeEVAmount)
    };
  }
  
  function calculateTotal(data, property) {
    return data.reduce((total, point) => total + point[property], 0);
  }
  
  function formatCurrency(amount) {
    return "$" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  function addSummaryCards(container, summary) {
    const summaryContainer = document.createElement("div");
    Object.assign(summaryContainer.style, {
      display: "flex",
      gap: "15px",
      flexWrap: "wrap"
    });
    
    // Win/Loss summary
    const winLossCard = createSummaryCard(
      "Win/Loss",
      [
        { label: "Original", value: summary.originalTotal },
        { label: "Rake-Adjusted", value: summary.rakeAdjTotal },
        { label: "Difference", value: summary.rakeAmount }
      ]
    );
    
    // EV summary
    const evCard = createSummaryCard(
      "Expected Value",
      [
        { label: "Original EV", value: summary.originalEVTotal },
        { label: "Rake-Adjusted EV", value: summary.rakeAdjEVTotal },
        { label: "Difference", value: summary.rakeEVAmount }
      ]
    );
    
    summaryContainer.appendChild(winLossCard);
    summaryContainer.appendChild(evCard);
    container.appendChild(summaryContainer);
  }
  
  function createSummaryCard(title, items) {
    const card = document.createElement("div");
    
    // Get card styles from helper function
    const cardStyles = window.PokerCraftExt.getCardStyle();
    Object.assign(card.style, cardStyles);
    
    // Add additional styling specific to this card
    Object.assign(card.style, {
      flex: "1",
      minWidth: "220px"
    });
    
    // Card title
    const cardTitle = document.createElement("h3");
    cardTitle.textContent = title;
    Object.assign(cardTitle.style, {
      margin: "0 0 10px 0",
      fontSize: "16px",
      fontWeight: "500",
      color: "#9d4edd" // Primary purple
    });
    
    card.appendChild(cardTitle);
    
    // Card items
    items.forEach(item => {
      const row = document.createElement("div");
      Object.assign(row.style, {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "5px"
      });
      
      const label = document.createElement("span");
      label.textContent = item.label;
      Object.assign(label.style, {
        color: "#aaaaaa" // Muted text
      });
      
      const value = document.createElement("span");
      value.textContent = item.value;
      Object.assign(value.style, {
        fontWeight: "500",
        color: getValueColor(item.value)
      });
      
      row.appendChild(label);
      row.appendChild(value);
      card.appendChild(row);
    });
    
    return card;
  }
  
  // Helper to determine color based on if value is positive or negative
  function getValueColor(value) {
    if (!value) return "#f0f0f0"; // Default text color
    
    // If value starts with "+" or is a positive number shown with "$" 
    if (value.startsWith("+") || (value.includes("$") && !value.includes("-"))) {
      return "#16d609"; // Positive color - green
    } 
    // If value starts with "-" it's negative
    else if (value.startsWith("-")) {
      return "#FF0000"; // Negative color - red
    }
    
    return "#f0f0f0"; // Default text color
  }
  
  function addStakeTables(container, rakeAdjustedData, sessionData) {
    // Check if stake data is available
    if (!rakeAdjustedData.rakeMetadata || !rakeAdjustedData.rakeMetadata.stakeGroups || !sessionData) {
      return;
    }
    
    const stakeGroups = rakeAdjustedData.rakeMetadata.stakeGroups;
    const stakes = Object.keys(stakeGroups);
    
    if (stakes.length <= 1) {
      return; // No need for breakdown if only one stake
    }
    
    // Create stake results table
    const stakeResults = calculateStakeResults(stakeGroups, rakeAdjustedData.data, sessionData);
    const tableContainer = createResultsTable(stakeResults);
    
    container.appendChild(tableContainer);
  }
  
  function calculateStakeResults(stakeGroups, data, sessionData) {
    const results = [];
    
    Object.keys(stakeGroups).forEach(stake => {
      const handsInStake = stakeGroups[stake];
      
      let totalHands = handsInStake.length;
      let totalWinLoss = 0;
      let totalEV = 0;
      
      handsInStake.forEach(handIndex => {
        totalWinLoss += data[handIndex].c;
        totalEV += data[handIndex].ev;
      });
      
      results.push({
        stake,
        hands: totalHands,
        winLoss: totalWinLoss,
        ev: totalEV,
        winRateBB: calculateWinRateBB(totalWinLoss, totalHands, stake)
      });
    });
    
    // Sort by stake value
    return results.sort((a, b) => {
      const stakeA = parseStakeValue(a.stake);
      const stakeB = parseStakeValue(b.stake);
      return stakeB - stakeA; // Sort descending
    });
  }
  
  function parseStakeValue(stakeStr) {
    try {
      if (stakeStr.includes("/")) {
        return parseFloat(stakeStr.split("/")[1]); // Use big blind value
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  function calculateWinRateBB(winLoss, hands, stakeStr) {
    try {
      if (stakeStr.includes("/")) {
        const bigBlind = parseFloat(stakeStr.split("/")[1]);
        if (bigBlind && hands) {
          return (winLoss / bigBlind / hands) * 100;
        }
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }
  
  function createResultsTable(results) {
    const tableContainer = document.createElement("div");
    Object.assign(tableContainer.style, {
      overflow: "auto",
      width: "100%"
    });
    
    const table = document.createElement("table");
    
    // Get table styles from helper function
    const tableStyles = window.PokerCraftExt.getTableStyle();
    Object.assign(table.style, tableStyles);
    
    // Create header row
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    ["Stake", "Hands", "Win/Loss", "EV", "Win Rate (BB/100)"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      Object.assign(th.style, {
        padding: "8px 12px",
        textAlign: "left",
        borderBottom: "1px solid #333333", // Border color
        fontWeight: "600",
        color: "#9d4edd" // Primary purple
      });
      headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement("tbody");
    
    results.forEach(row => {
      const tr = document.createElement("tr");
      
      // Stake
      const tdStake = document.createElement("td");
      tdStake.textContent = row.stake;
      
      // Hands
      const tdHands = document.createElement("td");
      tdHands.textContent = row.hands;
      
      // Win/Loss
      const tdWinLoss = document.createElement("td");
      tdWinLoss.textContent = formatCurrency(row.winLoss);
      tdWinLoss.style.color = row.winLoss >= 0 ? "#16d609" : "#FF0000"; // Green or red
      
      // EV
      const tdEV = document.createElement("td");
      tdEV.textContent = formatCurrency(row.ev);
      tdEV.style.color = row.ev >= 0 ? "#16d609" : "#FF0000"; // Green or red
      
      // Win Rate
      const tdWinRate = document.createElement("td");
      tdWinRate.textContent = row.winRateBB.toFixed(2);
      tdWinRate.style.color = row.winRateBB >= 0 ? "#16d609" : "#FF0000"; // Green or red
      
      // Add all cells to row
      [tdStake, tdHands, tdWinLoss, tdEV, tdWinRate].forEach(td => {
        Object.assign(td.style, {
          padding: "8px 12px",
          borderBottom: "1px solid #333333" // Border color
        });
        tr.appendChild(td);
      });
      
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    
    return tableContainer;
  }
  
  function createChart(canvas, originalData, rakeAdjustedData) {
    // Check if chart.js is available
    if (!window.Chart) {
      console.error("Chart.js not available");
      
      // Display a message on the canvas
      const ctx = canvas.getContext("2d");
      ctx.font = "14px Arial";
      ctx.fillText("Chart.js not available. Rake-adjusted data is ready but cannot be visualized.", 10, 50);
      
      return null;
    }
    
    // Prepare datasets
    const labels = originalData.data.map(d => d.name);
    
    // Using RevampStyles colors
    const originalCashDataset = {
      label: originalData.labels?.c || "Cash Results",
      data: originalData.data.map(d => d.c),
      borderColor: "#64B5F6", // Original line color blue
      backgroundColor: "rgba(100, 181, 246, 0.1)",
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      tension: 0.1
    };
    
    const rakeAdjCashDataset = {
      label: rakeAdjustedData.labels?.c || "Rake-Adjusted Cash",
      data: rakeAdjustedData.data.map(d => d.c),
      borderColor: "#4CAF50", // Adjusted line color green
      backgroundColor: "rgba(76, 175, 80, 0.1)",
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      tension: 0.1
    };
    
    const originalEVDataset = {
      label: originalData.labels?.ev || "Expected Value",
      data: originalData.data.map(d => d.ev),
      borderColor: "#BA68C8", // Purple for EV
      backgroundColor: "rgba(186, 104, 200, 0.1)",
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      tension: 0.1,
      borderDash: [5, 5]
    };
    
    const rakeAdjEVDataset = {
      label: rakeAdjustedData.labels?.ev || "Rake-Adjusted EV",
      data: rakeAdjustedData.data.map(d => d.ev),
      borderColor: "#FF7043", // Orange for Rake-Adj EV
      backgroundColor: "rgba(255, 112, 67, 0.1)",
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      tension: 0.1,
      borderDash: [5, 5]
    };
    
    // Create chart config
    const config = {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          originalCashDataset,
          rakeAdjCashDataset,
          originalEVDataset,
          rakeAdjEVDataset
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Original vs. Rake-Adjusted Results"
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                label += formatCurrency(context.parsed.y);
                return label;
              }
            }
          },
          legend: {
            position: "top"
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Hand",
              color: "#f0f0f0" // Light text color
            },
            grid: {
              color: "rgba(64, 64, 64, 0.7)" // Darker grid lines
            },
            ticks: {
              color: "#aaaaaa" // Muted text
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: "Amount ($)",
              color: "#f0f0f0" // Light text color
            },
            grid: {
              color: "rgba(64, 64, 64, 0.7)" // Darker grid lines
            },
            ticks: {
              color: "#aaaaaa" // Muted text
            }
          }
        }
      }
    };
    
    // Create chart
    return new window.Chart(canvas, config);
  }
  
  // Add REVAMP.GG branded footer
  function addBrandingFooter(container) {
    // Create footer note
    const notesContainer = document.createElement("div");
    notesContainer.style.marginTop = "20px";
    notesContainer.style.padding = "12px";
    notesContainer.style.fontSize = "12px"; // Small text
    notesContainer.style.color = "#aaaaaa"; // Muted text
    notesContainer.style.textAlign = "center";
    
    // Apply section styles
    const sectionStyles = window.PokerCraftExt.getSectionStyle();
    Object.assign(notesContainer.style, sectionStyles);
    
    notesContainer.innerHTML = `
      <div style="margin-bottom: 5px;">Note: Rake calculation assumes 5% rake with a cap of 3 big blinds per pot.</div>
      <div>Each hand is matched to its session based on timestamp, using the correct big blind size for that session.</div>
      <div>All-in EV is adjusted based on the proportion of the pot that would be yours had there been no rake.</div>
      <div style="margin-top: 10px; font-weight: bold; color: #9d4edd; text-transform: uppercase; letter-spacing: 1px;" class="revamp-brand-text">Powered by REVAMP.GG</div>
    `;
    
    container.appendChild(notesContainer);
  }
})();