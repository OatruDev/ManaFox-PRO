// /js/modules/market.js
import { mfModal } from '../ui.js';
import { esc } from '../security.js';

async function fetchScryfallSets() {
    const setSelect = document.getElementById('market-quick-set');
    if(!setSelect) return;
    try {
        const res = await fetch('https://api.scryfall.com/sets');
        const data = await res.json();
        
        const validTypes = ['expansion', 'core', 'masters', 'draft_innovation'];
        const blockList = ['alchemy', 'arena', 'online', 'mtgo', 'promo', 'token', 'art series', 'minigame', 'treasure', 'omenpaths', 'the big score'];
        const upcoming = [
            { name: "Teenage Mutant Ninja Turtles", short: "TMNT", date: "06/26" },
            { name: "Secrets of Strixhaven", short: "Strixhaven", date: "03/26" },
            { name: "Marvel's Super Heroes", short: "Marvel", date: "11/26" },
            { name: "Lorwyn Eclipsed", short: "Lorwyn", date: "09/26" }
        ];
        
        const physicalSets = data.data.filter(s => {
            if(s.digital === true) return false;
            if(!validTypes.includes(s.set_type)) return false;
            let n = s.name.toLowerCase();
            if(blockList.some(b => n.includes(b))) return false;
            return true;
        }).sort((a,b) => new Date(b.released_at) - new Date(a.released_at)).slice(0, 40);
        
        let optionsHTML = '<option value="" disabled selected>Select an expansion...</option><optgroup label="Upcoming / Announced (2026)">';
        upcoming.forEach(u => { optionsHTML += `<option value="${u.name}">${u.short} (${u.date})</option>`; });
        optionsHTML += `</optgroup><optgroup label="Released Sets">`;
        physicalSets.forEach(s => { 
            let d = new Date(s.released_at);
            let dStr = `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`;
            optionsHTML += `<option value="${esc(s.name)}">${esc(s.name.substring(0,22))} (${dStr})</option>`; 
        });
        optionsHTML += `</optgroup>`;
        setSelect.innerHTML = optionsHTML;
    } catch(e) { setSelect.innerHTML = '<option value="" disabled selected>Error loading Scryfall DB.</option>'; }
}

export function openMarketHub() { 
    const modal = document.getElementById('market-modal');
    
    if (modal.innerHTML.trim() === '') {
        modal.innerHTML = `
        <div class="bg-app-surface border border-app-market/30 rounded-3xl w-full max-w-sm mx-auto flex flex-col overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] mt-20">
            <div class="p-6 border-b border-white/5 flex justify-between items-center bg-app-surface-light/50">
                <div>
                    <h3 class="font-black text-2xl text-app-market tracking-widest uppercase flex items-center gap-2"><span class="material-symbols-outlined">storefront</span> Market</h3>
                    <p class="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Live from Scryfall API</p>
                </div>
                <button onclick="window.closeMarketHub()" class="text-slate-500 hover:text-white transition bg-white/5 size-10 rounded-full flex items-center justify-center"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div class="p-6 space-y-6">
                <div>
                    <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Manual Search</label>
                    <div class="flex gap-2">
                        <input type="text" id="market-set-name" class="w-full bg-app-surface-light border border-white/10 rounded-xl py-3 px-4 text-white focus:border-app-market focus:ring-1 focus:ring-app-market transition shadow-inner" placeholder="Any set name...">
                        <button onclick="window.searchCardmarketManual()" class="bg-app-market text-black font-black px-4 rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center"><span class="material-symbols-outlined">search</span></button>
                    </div>
                </div>
                <hr class="border-white/5">
                <div>
                    <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Quick Find (Official Sets)</label>
                    <div class="space-y-3">
                        <select id="market-quick-set" class="w-full bg-app-surface-light border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:border-app-market transition appearance-none"><option value="" disabled selected>Loading sets from Scryfall...</option></select>
                        <select id="market-quick-type" class="w-full bg-app-surface-light border border-white/10 rounded-xl py-4 px-4 text-sm text-white focus:border-app-market transition appearance-none">
                            <option value="Booster Box">Play / Draft Booster Box</option>
                            <option value="Collector Box">Collector Booster Box</option>
                            <option value="Bundle">Bundle / Fat Pack</option>
                            <option value="Jumpstart Box">Jumpstart Box</option>
                            <option value="Commander Deck">Commander Deck</option>
                        </select>
                    </div>
                    <button onclick="window.searchQuickCardmarket()" class="w-full mt-4 bg-app-market text-black font-black py-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 transition flex items-center justify-center gap-2">Find Product <span class="material-symbols-outlined text-lg">open_in_new</span></button>
                </div>
            </div>
        </div>`;
        fetchScryfallSets();
    }
    
    document.getElementById('mode-modal').classList.add('hidden'); 
    modal.classList.remove('hidden'); 
}

function searchCardmarketManual() { let setName = document.getElementById('market-set-name').value.trim(); if(!setName) return mfModal.show("Hold up", "Please enter a set name.", "warning"); let url = `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(setName)}`; window.open(url, '_blank'); }
function searchQuickCardmarket() { let setSel = document.getElementById('market-quick-set').value; let typeSel = document.getElementById('market-quick-type').value; if(!setSel) return mfModal.show("Hold up", "Please select an expansion from the list.", "warning"); let query = `${setSel} ${typeSel}`.trim(); let url = `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(query)}`; window.open(url, '_blank'); }
function closeMarketHub() { document.getElementById('market-modal').classList.add('hidden'); }

window.searchCardmarketManual = searchCardmarketManual;
window.searchQuickCardmarket = searchQuickCardmarket;
window.openMarketHub = openMarketHub;
window.closeMarketHub = closeMarketHub;