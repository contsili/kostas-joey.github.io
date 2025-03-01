

import { savePlayersToLocal, loadPlayersFromLocal } from '../data/players.js';

const firebaseConfig = {
  apiKey: "AIzaSyD1nnM8PbImTnRPdr6O2Nkcsm_6k22XHBo",
  authDomain: "foosball-elo-53e01.firebaseapp.com",
  projectId: "foosball-elo-53e01",
  storageBucket: "foosball-elo-53e01.firebasestorage.app",
  messagingSenderId: "520975826180",
  appId: "1:520975826180:web:58daa9f0fc6327a0036451"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Select DOM elements
const playerList = document.getElementById('player-list');
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerRatingInput = document.getElementById('player-rating');

let players = {}; // Store player data

// Initialize app
async function init() {
    players = await loadPlayers();  // Load from Firebase & local file
    updatePlayerList();
}

// Load player data from Firebase & local `players.json`
async function loadPlayers() {
    let localPlayers = await loadPlayersFromLocal();
    let firebasePlayers = {};

    try {
        const snapshot = await db.collection("players").get();
        snapshot.docs.forEach(doc => {
            firebasePlayers[doc.id] = doc.data();
        });
    } catch (error) {
        console.error("Error fetching players from Firebase:", error);
    }

    return { ...localPlayers, ...firebasePlayers }; // Merge both sources
}

// Add a new player
async function addPlayer(event) {
    event.preventDefault();
    
    const playerName = playerNameInput.value.trim();
    const playerRating = parseInt(playerRatingInput.value) || 1200;

    if (!playerName || players[playerName]) {
        alert("Player already exists or invalid name.");
        return;
    }

    const newPlayer = {
        name: playerName,
        rating: playerRating,
        matches: 0,
        wins: 0,
        losses: 0
    };

    // Save locally
    players[playerName] = newPlayer;
    savePlayersToLocal(players);

    try {
        // Save to Firebase
        await db.collection("players").doc(playerName).set(newPlayer);
        console.log("Player saved to Firebase!");
    } catch (error) {
        console.error("Error saving to Firebase:", error);
    }

    playerNameInput.value = '';
    playerRatingInput.value = '1200';
    updatePlayerList();
}

// Update player rankings UI
function updatePlayerList() {
    playerList.innerHTML = '';

    const sortedPlayers = Object.entries(players).sort(([, a], [, b]) => b.rating - a.rating);

    sortedPlayers.forEach(([player, data], index) => {
        const li = document.createElement('li');
        const winRate = data.matches > 0 ? ((data.wins / data.matches) * 100).toFixed(1) : 0;

        li.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="name">${player}</span>
            <span class="elo">${Math.round(data.rating)}</span>
            <span class="stats">${data.wins}W - ${data.losses}L</span>
            <div class="ratio">
                <span>${winRate}%</span>
                <div class="win-rate-bar">
                    <div class="win-rate-fill" style="width: ${winRate}%"></div>
                </div>
            </div>
        `;
        playerList.appendChild(li);
    });
}

// Event Listeners
playerForm.addEventListener('submit', addPlayer);

// Initialize the app
init();
