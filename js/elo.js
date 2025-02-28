import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';

// Firebase configuration – replace with your actual config values
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

// Elo rating calculation function
function calculateElo(playerRating, opponentRating, result) {
  const K = 32;
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
  return playerRating + K * (result - expectedScore);
}

// Updates a player's data in Firebase Firestore
async function updatePlayerData(playerName, newRating, isWinner) {
  try {
    const playerRef = doc(db, 'players', playerName);
    const docSnap = await getDoc(playerRef);
    let playerData;
    if (docSnap.exists()) {
      playerData = docSnap.data();
    } else {
      // If the player does not exist, initialize their data
      playerData = { rating: 1200, matches: 0, wins: 0, losses: 0 };
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
    const playersRef = collection(db, 'players');
    const snapshot = await getDocs(playersRef);
    let data = {};
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    return data;
  } catch (error) {
    console.error('Error loading player data:', error);
    return {};
  }
}

// Saves a complete playerData object to Firestore.
// Note: In Firebase, we generally update individual documents rather than bulk saving,
// but this function is provided for completeness.
async function savePlayerData(playerData) {
  try {
    const promises = Object.entries(playerData).map(([playerName, data]) =>
      setDoc(doc(db, 'players', playerName), data, { merge: true })
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
