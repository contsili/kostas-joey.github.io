// Import Firebase SDK (if using modules)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';

// Firebase configuration (replace with your actual Firebase config)
const firebaseConfig = {
  apiKey: "AIzaSyD1nnM8PbImTnRPdr6O2Nkcsm_6k22XHBo",
  authDomain: "foosball-elo-53e01.firebaseapp.com",
  projectId: "foosball-elo-53e01",
  storageBucket: "foosball-elo-53e01.firebasestorage.app",
  messagingSenderId: "520975826180",
  appId: "1:520975826180:web:58daa9f0fc6327a0036451"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const playerList = document.getElementById('player-list');
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerRatingInput = document.getElementById('player-rating');
const teamMatchCheckbox = document.getElementById('team-match');
const logMatchButton = document.getElementById('log-match');

let playerRatings = {};

// Load initial player data
async function init() {
    playerRatings = await loadPlayerData() || {};
    updatePlayerList();
    setupEventListeners();
    toggleTeamInputs(); // Add this line
    updatePlayersList();
}

function setupEventListeners() {
    // Add player form submission
    playerForm.addEventListener('submit', handleAddPlayer);
    
    // Team match toggle
    teamMatchCheckbox.addEventListener('change', toggleTeamInputs);
    
    // Log match button
    logMatchButton.addEventListener('click', handleLogMatch);
}

async function handleAddPlayer(event) {
    event.preventDefault();
    
    const playerName = playerNameInput.value.trim();
    const playerRating = parseInt(playerRatingInput.value) || 1200;

    if (!playerName) {
        alert('Please enter a player name');
        return;
    }

    // Check if player already exists in Firebase
    const playersRef = collection(db, 'players');
    const playerSnapshot = await getDocs(playersRef);
    const existingPlayer = playerSnapshot.docs.find(doc => doc.data().name === playerName);
    
    if (existingPlayer) {
        alert('Player already exists');
        return;
    }

    // Add new player to Firebase
    try {
        await setDoc(doc(db, 'players', playerName), {
            name: playerName,
            rating: playerRating,
            matches: 0,
            wins: 0,
            losses: 0
        });
        // Refresh both the ranking list and the datalist for match inputs
        updatePlayerList();
        updatePlayersList();
        
        // Clear form
        playerNameInput.value = '';
        playerRatingInput.value = '1200';
    } catch (error) {
        console.error('Failed to save player:', error);
        alert('Failed to add player');
    }
}

function handleLogMatch() {
    const isTeamMatch = teamMatchCheckbox.checked;
    const winner = document.querySelector('input[name="winner"]:checked')?.value;
    
    if (!winner) {
        alert('Please select a winner');
        return;
    }

    const player1 = document.getElementById('player1').value.trim();
    const player2 = document.getElementById('player2').value.trim();
    const player3 = document.getElementById('player3').value.trim();
    const player4 = document.getElementById('player4').value.trim();

    if (isTeamMatch) {
        if (!player1 || !player2 || !player3 || !player4) {
            alert('Please fill in all player fields');
            return;
        }
        updateTeamMatch(player1, player2, player3, player4, winner === 'team1');
    } else {
        if (!player1 || !player3) {
            alert('Please fill in player 1 and player 2');
            return;
        }
        updateSingleMatch(player1, player3, winner === 'team1');
    }

    updatePlayerList();
}

function updateTeamMatch(player1, player2, player3, player4, team1Wins) {
    const team1Elo = (getPlayerRating(player1) + getPlayerRating(player2)) / 2;
    const team2Elo = (getPlayerRating(player3) + getPlayerRating(player4)) / 2;

    const newTeam1Elo = calculateElo(team1Elo, team2Elo, team1Wins ? 1 : 0);
    const newTeam2Elo = calculateElo(team2Elo, team1Elo, team1Wins ? 0 : 1);

    updatePlayerData(player1, newTeam1Elo, team1Wins);
    updatePlayerData(player2, newTeam1Elo, team1Wins);
    updatePlayerData(player3, newTeam2Elo, !team1Wins);
    updatePlayerData(player4, newTeam2Elo, !team1Wins);

    savePlayerData();
}

function updateSingleMatch(player1, player2, player1Wins) {
    const player1Elo = getPlayerRating(player1);
    const player2Elo = getPlayerRating(player2);

    const newPlayer1Elo = calculateElo(player1Elo, player2Elo, player1Wins ? 1 : 0);
    const newPlayer2Elo = calculateElo(player2Elo, player1Elo, player1Wins ? 0 : 1);

    updatePlayerData(player1, newPlayer1Elo, player1Wins);
    updatePlayerData(player2, newPlayer2Elo, !player1Wins);

    savePlayerData();
}

function getPlayerRating(playerName) {
    return playerRatings[playerName]?.rating || 1200;
}

function updatePlayerData(playerName, newRating, isWin) {
    const playerRef = doc(db, 'players', playerName);
    getDoc(playerRef).then(playerSnapshot => {
        const playerData = playerSnapshot.data();

        const newMatches = playerData.matches + 1;
        const newWins = isWin ? playerData.wins + 1 : playerData.wins;
        const newLosses = isWin ? playerData.losses : playerData.losses + 1;

        setDoc(playerRef, {
            rating: newRating,
            matches: newMatches,
            wins: newWins,
            losses: newLosses
        }, { merge: true });

        updatePlayerList();
    });
}

function toggleTeamInputs() {
    const teamPlayers = document.querySelectorAll('.team-player');
    const matchTypeLabel = document.querySelector('.match-type-label');
    const isTeamMatch = teamMatchCheckbox.checked;
    
    teamPlayers.forEach(input => {
        input.style.display = isTeamMatch ? 'block' : 'none';
        input.querySelector('input').required = isTeamMatch;
    });
    
    matchTypeLabel.textContent = isTeamMatch ? '2v2 Match' : '1v1 Match';
}

async function updatePlayerList() {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';

    const playersRef = collection(db, 'players');
    const playerSnapshot = await getDocs(playersRef);
    const players = playerSnapshot.docs.map(doc => doc.data());
    
    const sortedPlayers = players.sort((a, b) => b.rating - a.rating);

    sortedPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        const winRate = player.matches > 0 ? 
            ((player.wins / player.matches) * 100).toFixed(1) : 0;
        
        li.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="name">${player.name}</span>
            <span class="elo">${Math.round(player.rating)}</span>
            <span class="stats">${player.wins}W - ${player.losses}L</span>
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

function updatePlayersList() {
    const datalist = document.getElementById('players-list');
    datalist.innerHTML = '';
    
    getDocs(collection(db, 'players')).then(snapshot => {
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.data().name;
            datalist.appendChild(option);
        });
    });
}

// Initialize the application
init();
