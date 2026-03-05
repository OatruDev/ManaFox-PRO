// /js/modules/deckbuilder.js
import { mfModal } from '../ui.js';

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
        
        exportToMoxfield(jsonRes.data);
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

function exportToMoxfield(data) {
    let moxText = `// COMMANDER\n1 ${data.metadata.commander}\n\n`;
    
    moxText += `// RAMP ENGINE\n`;
    data.ramp.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// DRAW & ADVANTAGE\n`;
    data.decklist.draw.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// REMOVAL & INTERACTION\n`;
    data.decklist.removal.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// BOARD WIPES\n`;
    data.decklist.boardwipe.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// PROTECTION & FLEX\n`;
    data.decklist.protection.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// SYNERGY CORE (${data.metadata.archetype.toUpperCase()})\n`;
    data.decklist.synergy.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// MANA BASE (${data.metadata.total_lands} Lands - Karsten Optimized)\n`;
    data.decklist.utility_lands.forEach(c => moxText += `1 ${c}\n`);
    data.decklist.basic_lands.forEach(l => {
        moxText += `${l.count} ${mapBasicLands(l.type)}\n`;
    });

    navigator.clipboard.writeText(moxText).catch(err => console.error('Clipboard failed: ', err));

    // Dynamic Game Plan Analysis
    let topSynergy = data.decklist.synergy.slice(0, 3).join(", ");
    let topRamp = data.ramp.slice(0, 2).join(" and ");
    let topWipes = data.decklist.boardwipe.length > 0 ? `Don't panic if you fall behind, drop ${data.decklist.boardwipe[0]} to reset.` : "Aggressive board control.";

    let customHtml = `
        <div class="flex flex-col gap-4 text-left w-full mt-2">
            
            <div class="bg-app-primary/10 border border-app-primary/30 p-4 rounded-2xl shadow-inner">
                <h4 class="text-[10px] uppercase font-black text-app-primary tracking-[0.2em] mb-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">psychology</span> Deck Blueprint
                </h4>
                <p class="text-xs text-white leading-relaxed font-medium mb-2">
                    This <strong>${data.metadata.archetype.toUpperCase()}</strong> build relies heavily on early acceleration via ${topRamp}.
                </p>
                <p class="text-xs text-slate-300 leading-relaxed font-medium mb-2">
                    Your core synergy engine is powered by highly-played EDHREC staples for this strategy, including <strong>${topSynergy}</strong>. Protect them at all costs using your interaction package.
                </p>
                <p class="text-xs text-slate-400 italic">
                    💡 <strong>Pro Tip:</strong> You are running ${data.metadata.total_lands} optimized lands. ${topWipes}
                </p>
            </div>
            
            <div class="relative bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div class="bg-white/5 px-3 py-2 flex justify-between items-center border-b border-white/5">
                    <span class="text-[9px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">terminal</span> Moxfield Ready (99 Cards)
                    </span>
                    <span class="text-[9px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">check</span> Copied
                    </span>
                </div>
                <pre class="p-4 text-[10px] text-slate-300 h-48 overflow-y-auto no-scrollbar font-mono leading-relaxed"><code>${moxText}</code></pre>
            </div>
            
            <button onclick="document.getElementById('mf-modal').classList.add('opacity-0', 'pointer-events-none', 'scale-95');" class="w-full bg-app-surface-light border border-white/10 text-white py-4 rounded-xl font-black hover:bg-white/10 transition active:scale-95 text-xs uppercase tracking-[0.2em] mt-2 shadow-sm">
                To Moxfield!
            </button>
        </div>
    `;

    mfModal.show(
        "Full Deck Forged! ⚒️", 
        `100% playable 99-card deck generated.`, 
        "precision_manufacturing", 
        "custom", 
        customHtml
    );
}

window.generateDeckFromPython = generateDeckFromPython;