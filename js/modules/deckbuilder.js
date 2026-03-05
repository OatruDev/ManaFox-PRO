// /js/modules/deckbuilder.js
import { mfModal, switchScreen } from '../ui.js';

export async function generateDeckFromPython() {
    const input = document.getElementById('scryfall-input');
    const scryfallUrl = input ? input.value.trim() : "";
    
    if(!scryfallUrl.includes("scryfall.com/card/")) {
        return mfModal.show("Invalid Input", "Please enter a valid Scryfall Card URL.", "warning");
    }

    try {
        mfModal.show("Forging Deck...", "Querying Scryfall Database & EDHREC rankings. Fleshing out full 99 cards...", "memory");
        
        const response = await fetch('/api/builder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: scryfallUrl })
        });
        
        const jsonRes = await response.json();
        if (jsonRes.status === "error") throw new Error(jsonRes.message);
        
        renderResultsScreen(jsonRes.data);
        if(input) input.value = ''; 
        
    } catch (error) {
        console.error("Deck Forge Error:", error);
        mfModal.show("Generation Failed", error.message, "error");
    }
}

function mapBasicLands(landName) {
    const basics = { "Basic W": "Plains", "Basic U": "Island", "Basic B": "Swamp", "Basic R": "Mountain", "Basic G": "Forest", "Basic C": "Wastes" };
    return basics[landName] || landName;
}

function renderResultsScreen(data) {
    // 1. Armar el texto para Moxfield
    let moxText = `// COMMANDER\n1 ${data.metadata.commander}\n\n`;
    moxText += `// RAMP ENGINE\n`; data.ramp.forEach(c => moxText += `1 ${c}\n`); moxText += `\n`;
    moxText += `// CREATURE CORE\n`; data.decklist.creatures.forEach(c => moxText += `1 ${c}\n`); moxText += `\n`;
    moxText += `// DRAW & ADVANTAGE\n`; data.decklist.draw.forEach(c => moxText += `1 ${c}\n`); moxText += `\n`;
    moxText += `// REMOVAL & INTERACTION\n`; data.decklist.removal.forEach(c => moxText += `1 ${c}\n`); moxText += `\n`;
    moxText += `// BOARD WIPES\n`; data.decklist.boardwipe.forEach(c => moxText += `1 ${c}\n`); moxText += `\n`;
    moxText += `// PLANESWALKERS & PROTECTION\n`; data.decklist.protection_and_planeswalkers.forEach(c => moxText += `1 ${c}\n`); moxText += `\n`;
    moxText += `// SYNERGY ARTIFACTS/ENCHANTMENTS (${data.metadata.archetype.toUpperCase()})\n`; data.decklist.synergy.forEach(c => moxText += `1 ${c}\n`); moxText += `\n`;
    moxText += `// MANA BASE (${data.metadata.total_lands} Lands - Karsten Optimized)\n`;
    data.decklist.utility_lands.forEach(c => moxText += `1 ${c}\n`);
    data.decklist.basic_lands.forEach(l => { moxText += `${l.count} ${mapBasicLands(l.type)}\n`; });

    // 2. Extraer datos para la guía dinámica
    let topSynergy = data.decklist.creatures.slice(0, 3).join(", ");
    let topRamp = data.ramp.slice(0, 2).join(" and ");

    // 3. Inyectar en el DOM de la Screen 12
    document.getElementById('forge-res-arch').innerText = data.metadata.archetype.toUpperCase();
    document.getElementById('forge-res-ramp').innerText = topRamp;
    document.getElementById('forge-res-syn').innerText = topSynergy;
    document.getElementById('forge-res-lands').innerText = data.metadata.total_lands;
    
    document.getElementById('generated-deck-code').innerText = moxText;

    // 4. Ocultar modal y cambiar a la Screen 12
    mfModal.hide();
    switchScreen(12);
}

// Nueva función exclusiva para el botón de Copiar
export function copyGeneratedDeck() {
    const text = document.getElementById('generated-deck-code').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy-deck');
        const originalHtml = btn.innerHTML;
        
        btn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Copied to Clipboard!`;
        btn.classList.add('bg-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.5)]');
        btn.classList.remove('bg-app-primary', 'shadow-[0_0_20px_rgba(139,92,246,0.3)]');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('bg-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.5)]');
            btn.classList.add('bg-app-primary', 'shadow-[0_0_20px_rgba(139,92,246,0.3)]');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Bindings Globales
window.generateDeckFromPython = generateDeckFromPython;
window.copyGeneratedDeck = copyGeneratedDeck;