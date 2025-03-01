
// Import Firebase SDK (if using modules)
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, collection, doc, getDoc, setDoc, 
    getDocs, onSnapshot 
} from 'firebase/firestore';

// Firebase configuration – replace with your actual config values
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

import { players, savePlayersToLocal } from '../data/players.js';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Select DOM elements
const playerList = document.getElementById('player-list');
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerRatingInput = document.getElementById('player-rating');

// Initialize player data
async function init() {
    await fetchPlayers();
    updatePlayerList();
}

// Fetch players from Firebase and merge with local storage
async function fetchPlayers() {
    try {
        const snapshot = await db.collection("players").get();
        const firebasePlayers = {};
        
        snapshot.docs.forEach(doc => {
            firebasePlayers[doc.id] = doc.data();
        });

        // Merge local and Firebase data
        Object.assign(players, firebasePlayers);
        savePlayersToLocal(players);
        updatePlayerList();
    } catch (error) {
        console.error("Error fetching players:", error);
    }
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

// Update player rankings list in the UI
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
