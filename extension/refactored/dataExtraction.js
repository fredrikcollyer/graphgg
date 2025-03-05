// dataExtraction.js
(function() {
  // Initialize namespace
  window.PokerCraftExt = window.PokerCraftExt || {};
  
  // Expose functions for extracting data from the page
  window.PokerCraftExt.extractPokerSessionData = function() {
    console.log("Extracting poker session data...");
    
    try {
      // Find the session table
      const tableElement = document.querySelector("table.mat-table");
      if (!tableElement) {
        console.error("Session table not found");
        return null;
      }
      
      // Extract sessions from table rows
      const rows = Array.from(tableElement.querySelectorAll("tbody tr"));
      if (!rows || rows.length === 0) {
        console.error("No session rows found in table");
        return null;
      }
      
      const sessions = rows.map(row => {
        // Extract cells from the row
        const cells = Array.from(row.querySelectorAll("td"));
        if (cells.length < 8) return null;
        
        // Extract session data from cells
        const dateTimeStr = cells[0].textContent.trim();
        const durationStr = cells[1].textContent.trim();
        const stakesStr = cells[2].textContent.trim().replace("BB", "").trim();
        const handsStr = cells[3].textContent.trim().replace(",", "");
        const rawCashOrTourneyStr = cells[4].textContent.trim();
        const rawResStr = cells[7].textContent.trim().replace(",", "");
        
        // Check if this is a cash game or tournament
        const isTourney = rawCashOrTourneyStr === "Tournament";
        
        // Skip tournament entries
        if (isTourney) return null;
        
        // Parse values
        const datetime = new Date(dateTimeStr);
        const date = datetime.toISOString().split("T")[0];
        
        const durationMinutes = parseDuration(durationStr);
        const endTime = new Date(datetime);
        endTime.setMinutes(endTime.getMinutes() + durationMinutes);
        
        // Parse stakes format (e.g., "0.25/0.50")
        let smallBlind = 0, bigBlind = 0;
        if (stakesStr.includes("/")) {
          const parts = stakesStr.split("/");
          smallBlind = parseFloat(parts[0]);
          bigBlind = parseFloat(parts[1]);
        }
        
        const hands = parseInt(handsStr, 10);
        const result = parseFloat(rawResStr.replace("$", ""));
        
        return {
          date,
          startTime: datetime,
          endTime,
          durationMinutes,
          stakesStr,
          smallBlind,
          bigBlind,
          hands,
          result
        };
      }).filter(session => session !== null);
      
      return { sessions };
    } catch (error) {
      console.error("Error extracting poker session data:", error);
      return null;
    }
  };
  
  window.PokerCraftExt.extractEVGraphData = function() {
    console.log("Extracting EV graph data...");
    
    try {
      // Try different selectors to find the chart element
      const selectors = [
        "mat-mdc-tooltip-trigger.chart-info",
        "app-game-session-detail-ev-graph",
        ".chart-info"
      ];
      
      let chartElement = null;
      let angularContext = null;
      
      // Try each selector
      for (const selector of selectors) {
        chartElement = document.querySelector(selector);
        if (chartElement) {
          console.log(`Chart element found with selector: ${selector}`);
          
          // Look for angular context in various properties
          const contextPropertyNames = Object.getOwnPropertyNames(chartElement)
            .filter(name => name.includes('__ngContext__'));
          
          for (const propName of contextPropertyNames) {
            angularContext = chartElement[propName];
            if (angularContext) {
              console.log(`Found Angular context in property: ${propName}`);
              break;
            }
          }
          
          if (angularContext) break;
        }
      }
      
      if (!chartElement) {
        console.error("Chart element not found with any selector");
        return null;
      }
      
      if (!angularContext) {
        console.error("Angular context not found in chart element");
        return null;
      }
      
      // Find the component with chart data
      const chartComponent = findAngularComponentWithProperty(angularContext, "chartData");
      if (!chartComponent || !chartComponent.chartData) {
        console.error("Chart data not found in angular context");
        return null;
      }
      
      // Log detailed info about the chart data
      console.log(`Found chart data with ${chartComponent.chartData.data.length} data points`);
      
      return chartComponent.chartData;
    } catch (error) {
      console.error("Error extracting EV graph data:", error);
      return null;
    }
  };
  
  // Private helper functions
  function parseDuration(durationStr) {
    try {
      // Parse "Xh Ym" format
      let totalMinutes = 0;
      
      // Extract hours
      const hoursMatch = durationStr.match(/(\d+)h/);
      if (hoursMatch) {
        totalMinutes += parseInt(hoursMatch[1], 10) * 60;
      }
      
      // Extract minutes
      const minutesMatch = durationStr.match(/(\d+)m/);
      if (minutesMatch) {
        totalMinutes += parseInt(minutesMatch[1], 10);
      }
      
      return totalMinutes;
    } catch (error) {
      console.error("Error parsing duration:", error);
      return 0;
    }
  }
  
  function findAngularComponentWithProperty(context, propertyName) {
    if (!Array.isArray(context)) return null;
    
    for (const item of context) {
      // Skip null or non-object items
      if (!item || typeof item !== "object") continue;
      
      // Check if the item has the property
      if (propertyName in item) return item;
      
      // Recursively search in nested objects
      for (const key in item) {
        if (item[key] && typeof item[key] === "object") {
          const result = findComponentInObject(item[key], propertyName);
          if (result) return result;
        }
      }
    }
    
    return null;
  }
  
  function findComponentInObject(obj, propertyName) {
    if (!obj || typeof obj !== "object") return null;
    
    // Check if the object has the property
    if (propertyName in obj) return obj;
    
    // Recursively search in nested objects
    for (const key in obj) {
      if (obj[key] && typeof obj[key] === "object" && key !== "__proto__") {
        const result = findComponentInObject(obj[key], propertyName);
        if (result) return result;
      }
    }
    
    return null;
  }
})();