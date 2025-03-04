// Simplified chart data extractor for the EV graph
function extractEVGraphData() {
  // Get the EV graph component
  const evGraphComponent = document.querySelector(
    "app-game-session-detail-ev-graph"
  );
  if (!evGraphComponent) {
    console.error("EV Graph component not found");
    return null;
  }

  // Navigate through the Angular context to find the chart data
  try {
    // Find the __ngContext__ property
    const contextKey = Object.keys(evGraphComponent).find((key) =>
      key.startsWith("__ngContext__")
    );
    if (!contextKey) throw new Error("Angular context not found");

    // Navigate to the chart builder
    const context = evGraphComponent[contextKey];
    // Use bracket notation properly for numeric indices
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

// Extract and download the data
function downloadEVData() {
  const data = extractEVGraphData();
  if (!data) return;

  // Create download link
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportLink = document.createElement("a");
  exportLink.setAttribute("href", dataUri);
  exportLink.setAttribute("download", "ev_data.json");
  exportLink.textContent = "Download EV Data";
  exportLink.style.position = "fixed";
  exportLink.style.top = "10px";
  exportLink.style.right = "10px";
  exportLink.style.zIndex = "9999";
  exportLink.style.padding = "10px";
  exportLink.style.background = "#4CAF50";
  exportLink.style.color = "white";
  exportLink.style.textDecoration = "none";
  exportLink.style.borderRadius = "4px";
  document.body.appendChild(exportLink);
}

// Run the extraction
downloadEVData();
