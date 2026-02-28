// /js/state.js

const defaultState = {
    gameMode: 'commander',
    step: 1,
    players: 2,
    decks: 3,
    deckData: [],
    savedDecks: [],
    tempPlayerNames: [],
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
            state = { ...state, ...parsed };
            
            // FIX CRÍTICO: Migración a prueba de balas para datos antiguos
            if (Array.isArray(state.savedPlayers)) {
                state.savedPlayers = state.savedPlayers.map(p => {
                    // Si es un string viejo, lo convertimos en Objeto ID
                    if (typeof p === 'string') {
                        return { id: `FOX-${Math.random().toString(36).substr(2,5).toUpperCase()}`, name: p, addedAt: Date.now() };
                    }
                    // Si es un objeto sin ID, se lo asignamos
                    if (p && typeof p === 'object' && !p.id) {
                        p.id = `FOX-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
                    }
                    return p;
                }).filter(p => p && p.name); // Limpieza de errores nulos
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