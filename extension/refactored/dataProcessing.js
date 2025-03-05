// dataProcessing.js
(function() {
  // Initialize namespace
  window.PokerCraftExt = window.PokerCraftExt || {};
  
  // Expose function for matching hands to sessions
  window.PokerCraftExt.matchHandsToSessions = function(sessions, chartData) {
    console.log("Matching hands to sessions...");
    
    try {
      if (!sessions || !sessions.sessions || !chartData || !chartData.data) {
        console.error("Invalid data for matching hands to sessions");
        return null;
      }
      
      const { sessions: sessionList } = sessions;
      const dataPoints = chartData.data;
      
      // Create a bipartite graph
      const graph = createBipartiteGraph(sessionList, dataPoints);
      
      // Find maximum bipartite matching
      const matching = findMaximumBipartiteMatching(graph, dataPoints.length, sessionList.length);
      
      // Map each hand to its session using the matching
      const handsToSessions = mapHandsToSessions(matching, dataPoints, sessionList);
      
      // Get hands that could not be matched
      const unmatchedHands = findUnmatchedHands(matching, dataPoints);
      
      console.log(`Matched ${dataPoints.length - unmatchedHands.length} out of ${dataPoints.length} hands`);
      
      return {
        handsToSessions,
        unmatchedHands
      };
    } catch (error) {
      console.error("Error matching hands to sessions:", error);
      return null;
    }
  };
  
  // Private helper functions
  function createBipartiteGraph(sessions, dataPoints) {
    const graph = Array(dataPoints.length).fill().map(() => []);
    
    // For each data point (hand), find compatible sessions
    dataPoints.forEach((dataPoint, handIndex) => {
      const handDate = new Date(dataPoint.name);
      
      sessions.forEach((session, sessionIndex) => {
        // Check if this hand's timestamp falls within this session's time range
        if (handDate >= session.startTime && handDate <= session.endTime) {
          // Add an edge from this hand to this session
          graph[handIndex].push(sessionIndex);
        }
      });
    });
    
    return graph;
  }
  
  function mapHandsToSessions(matching, dataPoints, sessions) {
    const handsToSessions = {};
    
    for (let handIndex = 0; handIndex < dataPoints.length; handIndex++) {
      const sessionIndex = matching[handIndex];
      if (sessionIndex !== -1) {
        const handId = handIndex;
        const session = sessions[sessionIndex];
        handsToSessions[handId] = session;
      }
    }
    
    return handsToSessions;
  }
  
  function findUnmatchedHands(matching, dataPoints) {
    const unmatchedHands = [];
    
    for (let handIndex = 0; handIndex < dataPoints.length; handIndex++) {
      if (matching[handIndex] === -1) {
        unmatchedHands.push({
          index: handIndex,
          data: dataPoints[handIndex]
        });
      }
    }
    
    return unmatchedHands;
  }
  
  // Expose Ford-Fulkerson algorithm for maximum bipartite matching
  window.PokerCraftExt.findMaximumBipartiteMatching = function(graph, numHands, numSessions) {
    // Initialize matching array, -1 indicates no match
    const matching = Array(numHands).fill(-1);
    
    // Try to find augmenting path for each hand
    for (let hand = 0; hand < numHands; hand++) {
      // Initialize visited array
      const visited = Array(numSessions).fill(false);
      
      // Try to find an augmenting path
      findAugmentingPath(graph, hand, visited, matching);
    }
    
    return matching;
  };
  
  // Helper function to find augmenting path in bipartite graph
  function findAugmentingPath(graph, hand, visited, matching) {
    // Try all sessions this hand can be matched to
    for (const session of graph[hand]) {
      // If we haven't visited this session yet
      if (!visited[session]) {
        // Mark session as visited
        visited[session] = true;
        
        // If session is not matched or we can find an augmenting path for current match
        if (matching.indexOf(session) === -1 || 
            findAugmentingPath(graph, matching.indexOf(session), visited, matching)) {
          // Match this hand to this session
          matching[hand] = session;
          return true;
        }
      }
    }
    
    return false;
  }
})();