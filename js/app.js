
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

// Set up real-time listener for players
function listenToPlayers() {
    const playersRef = collection(db, 'players');
    onSnapshot(playersRef, (snapshot) => {
        const players = snapshot.docs.map(doc => doc.data());
        renderPlayerList(players);
        updatePlayersList(players);
    });
}

// Render the player list in the UI
function renderPlayerList(players) {
    playerList.innerHTML = '';
    const sortedPlayers = players.sort((a, b) => b.rating - a.rating);
    
    sortedPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        const winRate = player.matches > 0 ? ((player.wins / player.matches) * 100).toFixed(1) : 0;
        
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

// Update datalist for match inputs
function updatePlayersList(players) {
    const datalist = document.getElementById('players-list');
    datalist.innerHTML = '';
    players.forEach(player => {
        const option = document.createElement('option');
        option.value = player.name;
        datalist.appendChild(option);
    });
}

// Set up event listeners
function setupEventListeners() {
    playerForm.addEventListener('submit', handleAddPlayer);
    teamMatchCheckbox.addEventListener('change', toggleTeamInputs);
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
        // Clear form inputs
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
}

// Update team match results and player ratings
function updateTeamMatch(player1, player2, player3, player4, team1Wins) {
    const team1Elo = (getPlayerRating(player1) + getPlayerRating(player2)) / 2;
    const team2Elo = (getPlayerRating(player3) + getPlayerRating(player4)) / 2;

    const newTeam1Elo = calculateElo(team1Elo, team2Elo, team1Wins ? 1 : 0);
    const newTeam2Elo = calculateElo(team2Elo, team1Elo, team1Wins ? 0 : 1);

    updatePlayerData(player1, newTeam1Elo, team1Wins);
    updatePlayerData(player2, newTeam1Elo, team1Wins);
    updatePlayerData(player3, newTeam2Elo, !team1Wins);
    updatePlayerData(player4, newTeam2Elo, !team1Wins);
}

// Update single match results and player ratings
function updateSingleMatch(player1, player2, player1Wins) {
    const player1Elo = getPlayerRating(player1);
    const player2Elo = getPlayerRating(player2);

    const newPlayer1Elo = calculateElo(player1Elo, player2Elo, player1Wins ? 1 : 0);
    const newPlayer2Elo = calculateElo(player2Elo, player1Elo, player1Wins ? 0 : 1);

    updatePlayerData(player1, newPlayer1Elo, player1Wins);
    updatePlayerData(player2, newPlayer2Elo, !player1Wins);
}

// Retrieve a player's rating from Firestore (fallback to 1200 if not found)
function getPlayerRating(playerName) {
    // Note: This is a synchronous helper used only for calculations.
    // For realtime values, we rely on the onSnapshot listener.
    // Here, you might want to store local cache or query synchronously.
    // For simplicity, we assume 1200 if data is not available.
    return 1200;
}

// Update a player's data in Firestore
async function updatePlayerData(playerName, newRating, isWinner) {
    const playerRef = doc(db, 'players', playerName);
    const docSnap = await getDoc(playerRef);
    let playerData = { rating: 1200, matches: 0, wins: 0, losses: 0 };
    if (docSnap.exists()) {
        playerData = docSnap.data();
    }
    
    const newMatches = playerData.matches + 1;
    const newWins = isWinner ? playerData.wins + 1 : playerData.wins;
    const newLosses = isWinner ? playerData.losses : playerData.losses + 1;
    
    await setDoc(playerRef, {
        rating: newRating,
        matches: newMatches,
        wins: newWins,
        losses: newLosses
    }, { merge: true });
}

// Elo rating calculation function
function calculateElo(playerRating, opponentRating, result) {
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return playerRating + K * (result - expectedScore);
}

// Toggle display of team match inputs
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

// Initialize the application
function init() {
    setupEventListeners();
    listenToPlayers();
}

init();
