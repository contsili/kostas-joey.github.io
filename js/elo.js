// Initialize player ratings dictionary
let playerRatings = {};

// Elo rating calculation function
function calculateElo(playerRating, opponentRating, result) {
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return playerRating + K * (result - expectedScore);
}

function updatePlayerData(playerRatings, playerName, newRating, isWinner) {
    if (!playerRatings[playerName]) {
        playerRatings[playerName] = {
            rating: 1200,
            matches: 0,
            wins: 0,
            losses: 0
        };
    }
    
    playerRatings[playerName].rating = newRating;
    playerRatings[playerName].matches += 1;
    
    if (isWinner) {
        playerRatings[playerName].wins += 1;
    } else {
        playerRatings[playerName].losses += 1;
    }
}

function averageTeamElo(player1Rating, player2Rating) {
    return (player1Rating + player2Rating) / 2;
}

function getPlayerRatings() {
    return playerRatings;
}

// Fetch player data from Google Sheets
async function fetchPlayerDataFromSheet() {
    const scriptURL = "https://script.google.com/macros/s/AKfycbyuLTp1-S6CvjQDnB4UAUS7Y2lwL2kZUEME-3nx5MWzcaOurY1cMKfSeBZG0Jcu8HJt/exec"; // Replace with your Google Apps Script URL
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        let players = {};
        data.forEach(player => {
            players[player.playerName] = { rating: parseInt(player.rating), matches: player.matches, wins: player.wins, losses: player.losses };
        });
        return players;
    } catch (error) {
        console.error('Error fetching player data:', error);
        return {};
    }
}

// Update player data in Google Sheets
async function savePlayerDataToSheet(playerData) {
    const scriptURL = "https://script.google.com/macros/s/AKfycbyuLTp1-S6CvjQDnB4UAUS7Y2lwL2kZUEME-3nx5MWzcaOurY1cMKfSeBZG0Jcu8HJt/exec"; // Replace with your Google Apps Script URL
    try {
        await fetch(scriptURL, {
            method: "POST",
            body: JSON.stringify({
                action: "updatePlayer",  // This should match the action in your Google Apps Script
                playerData: playerData
            }),
            headers: { "Content-Type": "application/json" }
        });
    } catch (error) {
        console.error('Error saving player data to sheet:', error);
    }
}

// Export all functions
export {
    calculateElo,
    updatePlayerData,
    averageTeamElo,
    getPlayerRatings,
    fetchPlayerDataFromSheet,
    savePlayerDataToSheet
};
