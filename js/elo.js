import { db, ref, update } from './firebase-config.js';

function calculateElo(playerRating, opponentRating, result) {
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return playerRating + K * (result - expectedScore);
}

async function updatePlayerData(playerName, newRating, isWinner) {
    const playerRef = ref(db, 'players/' + playerName);
    
    try {
        await update(playerRef, {
            rating: newRating,
            matches: (playerRatings[playerName]?.matches || 0) + 1,
            wins: (isWinner ? (playerRatings[playerName]?.wins || 0) + 1 : playerRatings[playerName]?.wins || 0),
            losses: (!isWinner ? (playerRatings[playerName]?.losses || 0) + 1 : playerRatings[playerName]?.losses || 0)
        });
    } catch (error) {
        console.error("Error updating player data:", error);
    }
}

export { calculateElo, updatePlayerData };
