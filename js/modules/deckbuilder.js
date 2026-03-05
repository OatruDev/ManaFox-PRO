// /js/modules/deckbuilder.js
import { mfModal } from '../ui.js';

export async function generateDeckFromPython() {
    const input = document.getElementById('scryfall-input');
    const scryfallUrl = input ? input.value.trim() : "";
    
    if(!scryfallUrl.includes("scryfall.com/card/")) {
        return mfModal.show("Invalid Input", "Please enter a valid Scryfall Card URL.", "warning");
    }

    try {
        mfModal.show("Analyzing...", "Connecting to Vercel Python Engine. Applying Karsten Theory...", "memory");
        
        const response = await fetch('/api/builder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: scryfallUrl })
        });
        
        const jsonRes = await response.json();
        if (jsonRes.status === "error") throw new Error(jsonRes.message);
        
        exportToMoxfield(jsonRes.data);
        if(input) input.value = ''; // Limpiar input
        
    } catch (error) {
        console.error(error);
        mfModal.show("Calculation Failed", error.message, "error");
    }
}

function exportToMoxfield(data) {
    let moxText = `// COMMANDER\n1 ${data.metadata.commander}\n\n`;
    
    moxText += `// RAMP ENGINE (${data.ramp_engine.total_slots} Slots)\n`;
    data.ramp_engine.recommended_cards.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// MANA BASE (${data.mana_base.total_lands} Lands - Karsten Optimized)\n`;
    data.mana_base.distribution.forEach(l => moxText += `${l.count} ${l.type}\n`);
    moxText += `\n`;

    moxText += `// SKELETON PLACEHOLDERS (Archetype: ${data.metadata.archetype.toUpperCase()})\n`;
    for (const [category, count] of Object.entries(data.deck_skeleton)) {
        if(category !== 'ramp') {
            moxText += `${count} [${category.toUpperCase()} SLOT]\n`;
        }
    }

    navigator.clipboard.writeText(moxText).then(() => {
        mfModal.show(
            "Moxfield Ready! 📋", 
            `Archetype: ${data.metadata.archetype.toUpperCase()}\nLands: ${data.mana_base.total_lands}\n\nYour statistically perfect skeleton has been copied to your clipboard. Paste it in Moxfield.`, 
            "content_paste"
        );
    }).catch(err => {
        mfModal.show("Export Failed", "Could not copy to clipboard.", "error");
    });
}

window.generateDeckFromPython = generateDeckFromPython;