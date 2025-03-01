import { db, ref, set, get, update } from './firebase-config.js';

// Elo rating calculation function
function calculateElo(playerRating, opponentRating, result) {
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return playerRating + K * (result - expectedScore);
}

// Updates a player's data in Firebase
async function updatePlayerData(playerName, newRating, isWinner) {
    try {
        const playerRef = ref(db, 'players/' + playerName);
        const snapshot = await get(playerRef);
        let playerData;
        if (snapshot.exists()) {
            playerData = snapshot.val();
        } else {
            // If the player does not exist, initialize their data
            playerData = { rating: 1200, matches: 0, wins: 0, losses: 0 };
        }
        const newMatches = playerData.matches + 1;
        const newWins = isWinner ? playerData.wins + 1 : playerData.wins;
        const newLosses = isWinner ? playerData.losses : playerData.losses + 1;

        await set(playerRef, {
            rating: newRating,
            matches: newMatches,
            wins: newWins,
            losses: newLosses
        }, { merge: true });
    } catch (error) {
        console.error('Error updating player data:', error);
    }
}

function averageTeamElo(player1Rating, player2Rating) {
    return (player1Rating + player2Rating) / 2;
}

// For Firebase, this function can be used to fetch all player ratings.
// Returns an object with player names as keys.
async function loadPlayerData() {
    try {
        const playersRef = ref(db, 'players');
        const snapshot = await get(playersRef);
        let data = {};
        snapshot.forEach(childSnapshot => {
            const key = childSnapshot.key;
            const val = childSnapshot.val();
            data[key] = val;
        });
        return data;
    } catch (error) {
        console.error('Error loading player data:', error);
        return {};
    }
}

// Saves a complete playerData object to Firebase.
async function savePlayerData(playerData) {
    try {
        const promises = Object.entries(playerData).map(([playerName, data]) =>
            set(ref(db, 'players/' + playerName), data, { merge: true })
        );
        await Promise.all(promises);
        return true;
    } catch (error) {
        console.error('Error saving player data:', error);
        return false;
    }
}

// This function is less useful with Firebase since you load data dynamically,
// but it is kept here as a placeholder.
function getPlayerRatings() {
    return {};
}

// Export all functions
export {
    calculateElo,
    updatePlayerData,
    averageTeamElo,
    getPlayerRatings,
    loadPlayerData,
    savePlayerData
};
