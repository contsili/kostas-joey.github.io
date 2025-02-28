import { calculateElo, updatePlayerData, loadPlayerData, savePlayerData } from './elo.js';

const playerList = document.getElementById('player-list');
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');
const playerRatingInput = document.getElementById('player-rating');
const teamMatchCheckbox = document.getElementById('team-match');
const logMatchButton = document.getElementById('log-match');

const scriptURL = "https://script.google.com/macros/s/AKfycbyuLTp1-S6CvjQDnB4UAUS7Y2lwL2kZUEME-3nx5MWzcaOurY1cMKfSeBZG0Jcu8HJt/exec"; // Replace with your Google Apps Script URL
let playerRatings = {};

async function init() {
    playerRatings = await fetchPlayersFromSheet();
    updatePlayerList();
    setupEventListeners();
    toggleTeamInputs();
    updatePlayersList();
}

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

    if (playerName in playerRatings) {
        alert('Player already exists');
        return;
    }

    playerRatings[playerName] = { rating: playerRating, matches: 0, wins: 0, losses: 0 };
    
    try {
        const response = await fetch(scriptURL, {
            method: "POST",
            body: JSON.stringify({
                action: "addPlayer",
                playerName: playerName,
                rating: playerRating
            }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        console.log("Server Response:", data);

        if (data.status === "success") {
            updatePlayerList();
            playerNameInput.value = '';
            playerRatingInput.value = '1200';
        } else {
            alert("Error: " + data.message);
        }
    } catch (error) {
        console.error('Failed to save player:', error);
        alert('Failed to add player');
    }
}

async function fetchPlayersFromSheet() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        let players = {};
        data.forEach(player => {
            players[player.playerName] = { rating: parseInt(player.rating), matches: player.matches, wins: player.wins, losses: player.losses };
        });
        return players;
    } catch (error) {
        console.error("Error fetching players:", error);
        return {};
    }
}

function updatePlayerList() {
    playerList.innerHTML = '';
    const sortedPlayers = Object.entries(playerRatings).sort(([, a], [, b]) => b.rating - a.rating);
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

function updatePlayersList() {
    const datalist = document.getElementById('players-list');
    datalist.innerHTML = '';
    Object.keys(playerRatings).forEach(playerName => {
        const option = document.createElement('option');
        option.value = playerName;
        datalist.appendChild(option);
    });
}

init();