// /js/state.js

export let state = { 
    gameMode: 'commander', step: 1, players: 2, decks: 7, 
    deckData: [], tempPlayerNames: [], playerLocks: [], playerBans: [], 
    savedPlayers: [], savedDecks: [], history: [], remainingDecks: [], currentMatch: [],
    manaColors: [
        {id:'W',cls:'mana-w',icon:`<i class="ms ms-w text-lg"></i>`},
        {id:'U',cls:'mana-u',icon:`<i class="ms ms-u text-lg"></i>`},
        {id:'B',cls:'mana-b',icon:`<i class="ms ms-b text-lg"></i>`},
        {id:'R',cls:'mana-r',icon:`<i class="ms ms-r text-lg"></i>`},
        {id:'G',cls:'mana-g',icon:`<i class="ms ms-g text-lg"></i>`}
    ], 
    matchFinished: false, startingLife: 40, layoutMode: 'cross', 
    js: { count: 8, players: [], rounds: [], currentRound: 0, currentView: 'round', totalRounds: 3 }
};

let saveTimeout;

export function saveData() { 
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            localStorage.setItem('manafox-offline-state', JSON.stringify(state));
        } catch(e) { console.warn("Local storage full or disabled."); }
    }, 150);
}

export function loadLocalState() {
    try {
        const stored = localStorage.getItem('manafox-offline-state');
        if (stored) {
            const parsed = JSON.parse(stored);
            state = { ...state, ...parsed }; 
            if (!state.playerBans) state.playerBans = [];
        }
    } catch(e) {}
}

export function resetLocalState() {
    localStorage.removeItem('manafox-offline-state');
    window.location.reload();
}