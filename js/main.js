import { state, loadLocalState, saveData, resetLocalState } from './state.js';
import { preloadGifs } from './utils.js';
import { mfModal, applyThemeColors, switchScreen } from './ui.js';

// Importamos los 3 módulos completos
import { initCommander, handleCommanderNext, goBackCommander } from './modules/commander.js';
import { initJumpstart, handleJumpstartNext, goBackJumpstart } from './modules/jumpstart.js';
import './modules/market.js'; // El market se inicializa solo al tocar el botón

document.addEventListener("DOMContentLoaded", () => { 
    preloadGifs();
    loadLocalState();
    applyThemeColors();
    setupGlobalListeners();
    
    // Arranque inicial basado en el modo
    if (state.gameMode === 'commander') {
        initCommander();
    } else {
        initJumpstart();
    }
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
        creditsBtn.addEventListener('click', async () => {
            let msg = "Versión: v1.3 Modular (Offline PWA)\n\n- Arquitectura: ES Modules.\n- Nuevo Motor Veto (Bans/Locks) activado.\n- Transiciones SPA Instantáneas.";
            let customHtml = `
                <div class="flex flex-col w-full">
                    <button id="btn-hard-reset" class="w-full mb-2 bg-red-900/20 border border-red-500/30 text-red-400 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-white transition active:scale-95 text-xs flex items-center justify-center gap-2"><span class="material-symbols-outlined text-[14px]">delete_forever</span> Borrar Memoria y Reiniciar App</button>
                    <button onclick="document.getElementById('mf-modal').classList.add('opacity-0', 'pointer-events-none', 'scale-95');" class="w-full bg-app-primary text-white py-3 rounded-xl font-bold hover:bg-app-primary/80 transition active:scale-95 text-xs">Cerrar</button>
                </div>`;
            await mfModal.show("ManaFox: Zorro Corp", msg, "help", "custom", customHtml);
            
            document.getElementById('btn-hard-reset').addEventListener('click', async () => {
                const confirm = await mfModal.show("Borrar todo", "¿Estás seguro? Esto borrará toda tu configuración.", "warning", "confirm");
                if(confirm) resetLocalState();
            });
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
                <div><h4 class="font-black text-white">Sealed Market</h4><p class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Live Scryfall Sync</p></div>
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