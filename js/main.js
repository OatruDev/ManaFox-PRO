// /js/main.js
import { state, loadLocalState, saveData, resetLocalState } from './state.js';
import { preloadGifs } from './utils.js';
import { mfModal, applyThemeColors, switchScreen } from './ui.js';

import { initCommander, handleCommanderNext, goBackCommander } from './modules/commander.js';
import { initJumpstart, handleJumpstartNext, goBackJumpstart } from './modules/jumpstart.js';
import './modules/market.js';

document.addEventListener("DOMContentLoaded", () => { 
    preloadGifs();
    loadLocalState();
    applyThemeColors();
    setupGlobalListeners();
    
    if (state.gameMode === 'commander') {
        initCommander();
    } else {
        initJumpstart();
    }
    switchScreen(state.step || (state.gameMode === 'commander' ? 1 : 7));
});

function setupGlobalListeners() {
    const mainBtn = document.getElementById('main-btn');
    if (mainBtn) {
        mainBtn.addEventListener('click', () => {
            if(state.gameMode === 'commander') handleCommanderNext();
            else handleJumpstartNext();
        });
    }

    const headerBtn = document.getElementById('btn-header-action');
    if (headerBtn) {
        headerBtn.addEventListener('click', () => {
            if(state.step === 1 || state.step === 7) {
                renderAndOpenModeHub();
            } else {
                if(state.gameMode === 'commander') goBackCommander();
                else goBackJumpstart();
            }
        });
    }

    const creditsBtn = document.getElementById('btn-show-credits');
    if (creditsBtn) {
        creditsBtn.addEventListener('click', () => {
            let msg = "MANAFOX\n" +
                      "Advanced MTG Companion • v1.4.0\n\n" +
                      "• Engine: Modular Vanilla ES6\n" +
                      "• Logic: WPN Official Swiss & Individual DMG\n" +
                      "• Sync: Scryfall API Database v3\n\n" +
                      "© 2026 Zorro Corp • Developed by OatruDev";

            let customHtml = `
                <div class="flex flex-col w-full gap-3 mt-2">
                    <div class="flex flex-col gap-1 p-3 bg-white/5 rounded-xl border border-white/10 text-left">
                        <span class="text-[8px] uppercase font-black text-slate-500 tracking-widest">System Health</span>
                        <div class="flex items-center gap-2 text-green-400 text-[10px] font-bold">
                            <span class="size-2 bg-green-500 rounded-full animate-pulse"></span>
                            Local Database Optimized
                        </div>
                    </div>
                    
                    <button id="btn-hard-reset" class="w-full bg-red-950/30 border border-red-500/50 text-red-400 py-3 rounded-xl font-black hover:bg-red-500 hover:text-white transition active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[16px]">warning</span> RESET
                    </button>
                    
                    <button onclick="document.getElementById('mf-modal').classList.add('opacity-0', 'pointer-events-none', 'scale-95');" class="w-full bg-app-surface border border-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/10 transition active:scale-95 text-xs uppercase tracking-widest">
                        CLOSE
                    </button>
                </div>`;

            mfModal.show("Application Status", msg, "settings_suggest", "custom", customHtml);

            setTimeout(() => {
                let resetBtn = document.getElementById('btn-hard-reset');
                if(resetBtn) {
                    resetBtn.addEventListener('click', async () => {
                        mfModal.hide();
                        setTimeout(async () => {
                            const confirm = await mfModal.show("Reset ManaFox", "Are you sure you want to reset everything?", "warning", "confirm");
                            if(confirm) resetLocalState();
                        }, 400);
                    });
                }
            }, 50);
        });
    }
}

function renderAndOpenModeHub() {
    const modal = document.getElementById('mode-modal');
    modal.innerHTML = `
    <div class="bg-app-surface border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
        <h3 class="font-black text-xl mb-6 text-center text-white tracking-widest uppercase">ManaFox Hub</h3>
        <div class="space-y-4">
            <button id="btn-mode-cmd" class="w-full bg-app-surface-light hover:bg-white/10 border border-app-primary/40 rounded-2xl p-4 flex items-center gap-4 transition active:scale-95 text-left">
                <div class="size-12 rounded-full bg-app-primary/20 text-app-primary flex items-center justify-center flex-none"><span class="material-symbols-outlined">swords</span></div>
                <div><h4 class="font-black text-white">Commander FFA</h4><p class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Free for all • Life Counter</p></div>
            </button>
            <button id="btn-mode-js" class="w-full bg-app-surface-light hover:bg-white/10 border border-app-js/40 rounded-2xl p-4 flex items-center gap-4 transition active:scale-95 text-left">
                <div class="size-12 rounded-full bg-app-js/20 text-app-js flex items-center justify-center flex-none"><span class="material-symbols-outlined">account_tree</span></div>
                <div><h4 class="font-black text-white">Jumpstart Tourney</h4><p class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Swiss Engine • Pack Drafts</p></div>
            </button>
            <button id="btn-mode-mkt" class="w-full bg-app-surface-light hover:bg-white/10 border border-app-market/40 rounded-2xl p-4 flex items-center gap-4 transition active:scale-95 text-left">
                <div class="size-12 rounded-full bg-app-market/20 text-app-market flex items-center justify-center flex-none"><span class="material-symbols-outlined">storefront</span></div>
                <div><h4 class="font-black text-white">Market Hub</h4><p class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Live Scryfall Sync</p></div>
            </button>
        </div>
        <button id="btn-close-hub" class="w-full mt-6 bg-transparent text-slate-500 hover:text-white transition py-3 font-bold uppercase tracking-widest">Cancel</button>
    </div>`;
    
    document.getElementById('btn-mode-cmd').addEventListener('click', () => changeMode('commander'));
    document.getElementById('btn-mode-js').addEventListener('click', () => changeMode('jumpstart'));
    document.getElementById('btn-mode-mkt').addEventListener('click', () => { window.openMarketHub(); });
    document.getElementById('btn-close-hub').addEventListener('click', () => {
        modal.classList.add('hidden'); modal.classList.remove('flex');
    });
    
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function changeMode(newMode) {
    state.gameMode = newMode;
    state.step = newMode === 'commander' ? 1 : 7;
    try { localStorage.setItem('manafox-offline-state', JSON.stringify(state)); } catch(e) {}
    
    applyThemeColors();
    document.getElementById('mode-modal').classList.add('hidden');
    document.getElementById('mode-modal').classList.remove('flex');
    
    switchScreen(state.step);
    if (newMode === 'commander') initCommander();
    else initJumpstart();
}