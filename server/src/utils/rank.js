/**
 * Compute rank based on the number of wins.
 * @param {number} wins 
 * @returns {string} Rank ('Bronze', 'Silver', 'Gold')
 */
exports.computeRank = (wins) => {
  if (wins >= 15) return 'Gold';
  if (wins >= 5) return 'Silver';
  return 'Bronze';
};
