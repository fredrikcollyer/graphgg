// pageScript.js
console.log("PokerCraft extension loaded on " + window.location.href);

// "Import" all needed functions at the top
const { extractPokerSessionData, extractEVGraphData } = window.PokerCraftExt;

const { matchHandsToSessions, findMaximumBipartiteMatching } =
  window.PokerCraftExt;

const { calculateRakeAdjustedData } = window.PokerCraftExt;

const { displayComparisonChart } = window.PokerCraftExt;

const { 
  enhanceButton, 
  cleanupPreviousCharts, 
  injectGlobalStyles
} = window.PokerCraftExt;

const { setupDomObserver, cleanupOnRouteChange } = window.PokerCraftExt;

// Main function defining rake-adjusted graph creation flow
function createRakeAdjustedGraph() {
  console.log("Starting rake-adjusted graph creation...");

  try {
    // Step 1: Extract session data from the table
    console.log("Step 1: Extracting session data");
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

    // Step 2: Extract chart data
    console.log("Step 2: Extracting chart data");
    const originalData = extractEVGraphData();
    if (!originalData || !originalData.data || originalData.data.length === 0) {
      console.error("Could not extract EV graph data");
      return;
    }
    console.log(`Found ${originalData.data.length} data points in chart`);

    // Step 3: Match hands to sessions
    console.log("Step 3: Matching hands to sessions");
    const matchingResult = matchHandsToSessions(sessionData, originalData);
    if (!matchingResult || !matchingResult.handsToSessions) {
      console.error("Could not match hands to sessions");
      return;
    }
    console.log("Successfully matched hands to sessions");

    // Step 4: Calculate rake-adjusted data
    console.log("Step 4: Calculating rake-adjusted data");
    const rakeAdjustedData = calculateRakeAdjustedData(
      originalData,
      matchingResult.handsToSessions
    );
    if (!rakeAdjustedData) {
      console.error("Could not calculate rake-adjusted data");
      return;
    }
    console.log("Successfully calculated rake-adjusted data");

    // Step 5: Display comparison chart
    console.log("Step 5: Displaying comparison chart");
    const displayResult = displayComparisonChart(
      originalData,
      rakeAdjustedData,
      sessionData
    );
    if (!displayResult) {
      console.error("Could not display comparison chart");
      return;
    }

    console.log("Rake-adjusted graph created successfully!");
  } catch (error) {
    console.error("Error in createRakeAdjustedGraph:", error);
  }
}

// Event handlers
function handleEvButtonClick() {
  console.log("EV Graph button clicked");
  createRakeAdjustedGraph();
}

function handleNextHandsButtonClick() {
  console.log("Next Hands button clicked");
  cleanupPreviousCharts();
  setTimeout(createRakeAdjustedGraph, 1000);
}

function handleRouteChange() {
  console.log("Route changed, cleaning up");
  cleanupOnRouteChange();
}

// Initialize by setting up observers that call back to this controller
function init() {
  // Inject global styles first (includes animations now)
  injectGlobalStyles();

  console.log("Setting up button observers with RevampStyles theming");

  // Setup observers with callbacks
  setupDomObserver({
    onEvButtonFound: (button) => {
      console.log("EV Button found");
      enhanceButton(button, "EV Graph");
      button.addEventListener("click", handleEvButtonClick);
    },
    onNextHandsButtonFound: (button) => {
      console.log("Next Hands Button found");
      button.addEventListener("click", handleNextHandsButtonClick);
    },
    onRushCashButtonFound: (button) => {
      console.log("Rush & Cash button found");
      enhanceButton(button, "Rush & Cash");
    },
    onHoldemButtonFound: (button) => {
      console.log("Hold'em button found");
      enhanceButton(button, "Hold'em");
    },
    onOmahaButtonFound: (button) => {
      console.log("PLO button found");
      enhanceButton(button, "PLO");
    },
    onRouteChange: handleRouteChange,
  });
}

// Start the application
init();
