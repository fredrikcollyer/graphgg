// calculations.js
(function() {
  // Initialize namespace
  window.PokerCraftExt = window.PokerCraftExt || {};
  
  // Expose rake calculation functions
  window.PokerCraftExt.calculateRakeAdjustedData = function(originalData, handsToSessions) {
    console.log("Calculating rake-adjusted data...");
    
    try {
      if (!originalData || !originalData.data || !handsToSessions) {
        console.error("Invalid data for rake calculations");
        return null;
      }
      
      // Set default rake configuration
      const rakeConfig = {
        percentage: 0.05, // 5% rake
        cap: 3.0 // $3 cap
      };
      
      // Clone original data to avoid modifying it
      const rakeAdjData = JSON.parse(JSON.stringify(originalData));
      
      // Group hands by stake level
      const stakeGroups = groupHandsByStakes(originalData.data, handsToSessions);
      
      // Calculate rake adjustments by stake
      let totalRakeAmount = 0;
      let totalRakeAdjustedAmount = 0;
      
      Object.keys(stakeGroups).forEach(stake => {
        const handsInStake = stakeGroups[stake];
        
        handsInStake.forEach(handIndex => {
          const dataPoint = rakeAdjData.data[handIndex];
          const session = handsToSessions[handIndex];
          
          if (!session) return;
          
          // Calculate rake based on big blind size
          const rakeAmount = calculateRakeAmount(dataPoint.bb, session.bigBlind, rakeConfig);
          totalRakeAmount += rakeAmount;
          
          // Adjust values by adding rake
          dataPoint.c += rakeAmount; // Adjust cash result
          dataPoint.ev += rakeAmount; // Adjust EV amount
          
          totalRakeAdjustedAmount += dataPoint.c;
        });
      });
      
      // Update labels to indicate rake-adjusted data
      rakeAdjData.labels = updateLabels(rakeAdjData.labels, rakeConfig);
      
      // Add metadata
      rakeAdjData.rakeMetadata = {
        totalRakeAmount,
        totalRakeAdjustedAmount,
        rakeConfig,
        stakeGroups
      };
      
      return rakeAdjData;
    } catch (error) {
      console.error("Error calculating rake-adjusted data:", error);
      return null;
    }
  };
  
  // Private helper functions
  function groupHandsByStakes(dataPoints, handsToSessions) {
    const stakeGroups = {};
    
    dataPoints.forEach((_, handIndex) => {
      const session = handsToSessions[handIndex];
      if (!session) return;
      
      const stakeKey = session.stakesStr;
      if (!stakeGroups[stakeKey]) {
        stakeGroups[stakeKey] = [];
      }
      
      stakeGroups[stakeKey].push(handIndex);
    });
    
    return stakeGroups;
  }
  
  function calculateRakeAmount(bbWon, bigBlindSize, rakeConfig) {
    // Calculate pot size based on big blinds won
    const potSize = Math.abs(bbWon) * bigBlindSize;
    
    // Calculate uncapped rake amount
    const uncappedRake = potSize * rakeConfig.percentage;
    
    // Apply rake cap
    const rakeAmount = Math.min(uncappedRake, rakeConfig.cap);
    
    // Rake is only taken from pots you win
    return bbWon > 0 ? rakeAmount : 0;
  }
  
  function updateLabels(labels, rakeConfig) {
    if (!labels) return {};
    
    const updatedLabels = { ...labels };
    
    // Update label for cash results
    if (updatedLabels.c) {
      updatedLabels.c += ` (Rake-Adj ${rakeConfig.percentage * 100}%)`;
    }
    
    // Update label for EV
    if (updatedLabels.ev) {
      updatedLabels.ev += ` (Rake-Adj ${rakeConfig.percentage * 100}%)`;
    }
    
    return updatedLabels;
  }
})();