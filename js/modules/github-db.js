// /js/modules/github-db.js
import { state } from '../state.js';

export async function saveMatchToGitHub(matchRecord) {
    try {
        // Ahora empaquetamos la Base de Datos COMPLETA, no solo la partida
        const payload = {
            matches: state.history || [],
            decks: state.savedDecks || [],
            players: state.savedPlayers || []
        };
        
        // Lo mandamos al Bouncer de Vercel
        await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error("Cloud save failed:", e);
    }
}