// /js/state.js
import { baseDecks, generatePlayerID, generateDeckID } from './utils.js';

const defaultState = {
    gameMode: 'commander',
    step: 1,
    players: 2,
    decks: 3,
    deckData: [],
    savedDecks: [...baseDecks],
    tempPlayerNames: [],
    // FOX-00001 reservado para ti.
    savedPlayers: [
        { id: "FOX-00001", name: "Daniel", addedAt: Date.now() }
    ],
    playerLocks: [],
    playerBans: [],
    currentMatch: [],
    remainingDecks: [],
    undoStack: [],
    history: [],
    layoutMode: 'grid',
    
    // Variables de Tiempo
    matchStartTime: null,
    matchDurationSeconds: 0,
    matchFinished: false,

    js: { count: 4, players: [], rounds: [], currentRound: 0, currentView: 'round', totalRounds: 0 },
    manaColors: [
        { id: 'W', cls: 'mana-w', icon: '<i class="ms ms-w"></i>' },
        { id: 'U', cls: 'mana-u', icon: '<i class="ms ms-u"></i>' },
        { id: 'B', cls: 'mana-b', icon: '<i class="ms ms-b"></i>' },
        { id: 'R', cls: 'mana-r', icon: '<i class="ms ms-r"></i>' },
        { id: 'G', cls: 'mana-g', icon: '<i class="ms ms-g"></i>' }
    ]
};

export let state = JSON.parse(JSON.stringify(defaultState));

export function loadLocalState() {
    try {
        const local = localStorage.getItem('manafox-offline-state');
        if (local) {
            const parsed = JSON.parse(local);
            state = { ...defaultState, ...parsed };
            
            // --- LEGACY MIGRATION SHIELD ---
            // Migrar Jugadores Antiguos (Strings -> Objetos FOX)
            if(state.savedPlayers.length > 0 && typeof state.savedPlayers[0] === 'string') {
                console.log("Migrando jugadores legacy a IDs FOX...");
                state.savedPlayers = state.savedPlayers.map(name => ({ 
                    id: name.toLowerCase() === 'daniel' ? "FOX-00001" : generatePlayerID(), 
                    name: name, 
                    addedAt: Date.now() 
                }));
            }
            // Migrar Mazos Antiguos (Sin ID -> Con DCK ID)
            if (state.savedDecks.length > 0 && !state.savedDecks[0].id) {
                console.log("Migrando mazos legacy a IDs DCK...");
                state.savedDecks = state.savedDecks.map(deck => ({
                    ...deck,
                    id: deck.id || generateDeckID()
                }));
            }
        }
    } catch (e) { console.warn("Error loading state", e); }
}

export function saveData() {
    try { localStorage.setItem('manafox-offline-state', JSON.stringify(state)); }
    catch (e) { console.warn("Error saving state", e); }
}

export function resetLocalState() {
    localStorage.removeItem('manafox-offline-state');
    location.reload();
}