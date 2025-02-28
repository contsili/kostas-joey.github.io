import { db, ref, set, get, update } from './firebase-config.js';

const playerList = document.getElementById('player-list');
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerRatingInput = document.getElementById('player-rating');

let playerRatings = {};

async function init() {
    await fetchPlayersFromFirebase();
    updatePlayerList();
    playerForm.addEventListener('submit', handleAddPlayer);
}

async function handleAddPlayer(event) {
    event.preventDefault();
    const playerName = playerNameInput.value.trim();
    const playerRating = parseInt(playerRatingInput.value) || 1200;

    if (!playerName) {
        alert('Please enter a player name');
        return;
    }

    if (playerRatings[playerName]) {
        alert('Player already exists');
        return;
    }

    playerRatings[playerName] = { rating: playerRating, matches: 0, wins: 0, losses: 0 };

    try {
        await set(ref(db, 'players/' + playerName), playerRatings[playerName]);
        updatePlayerList();
        playerNameInput.value = '';
        playerRatingInput.value = '1200';
    } catch (error) {
        console.error('Failed to save player:', error);
        alert('Failed to add player');
    }
}

async function fetchPlayersFromFirebase() {
    try {
        const snapshot = await get(ref(db, 'players'));
        if (snapshot.exists()) {
            playerRatings = snapshot.val();
        }
    } catch (error) {
        console.error("Error fetching players:", error);
    }
}

function updatePlayerList() {
    playerList.innerHTML = '';
    const sortedPlayers = Object.entries(playerRatings).sort(([, a], [, b]) => b.rating - a.rating);
    sortedPlayers.forEach(([player, data], index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="name">${player}</span>
            <span class="elo">${Math.round(data.rating)}</span>
        `;
        playerList.appendChild(li);
    });
}

init();
