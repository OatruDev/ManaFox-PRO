// /js/main.js
import { state, loadLocalState, saveData, resetLocalState } from './state.js';
import { preloadGifs } from './utils.js';
import { mfModal, applyThemeColors, switchScreen } from './ui.js';

// Importaremos los módulos reales en la Fase 3
// import { initCommander, handleCommanderNext, goBackCommander } from './modules/commander.js';
// import { initJumpstart, handleJumpstartNext, goBackJumpstart } from './modules/jumpstart.js';
// import { initMarket } from './modules/market.js';

document.addEventListener("DOMContentLoaded", () => { 
    preloadGifs();
    loadLocalState();
    applyThemeColors();
    setupGlobalListeners();
    
    const lastStep = state.step || 1;
    switchScreen(lastStep);

    // ⚠️ ALERTA DE TRANSICIÓN (Fase 3 pendiente)
    const s1 = document.getElementById('screen-1');
    if(s1 && s1.innerHTML.trim() === '') {
        s1.innerHTML = `
            <div class="flex flex-col items-center justify-center h-[60svh] text-center px-4">
                <span class="material-symbols-outlined text-6xl text-app-primary animate-pulse mb-4">manufacturing</span>
                <h2 class="text-2xl font-black text-white uppercase tracking-widest mb-2">Motor listo</h2>
                <p class="text-slate-400 text-sm">El núcleo funciona perfecto. Solo falta inyectar los módulos de Commander, Jumpstart y Market (Fase 3).</p>
            </div>
        `;
    }
});

function setupGlobalListeners() {
    // Escuchar botón de "Next Step"
    const mainBtn = document.getElementById('main-btn');
    if (mainBtn) {
        mainBtn.addEventListener('click', () => {
            console.log("Siguiente paso clickeado. Esperando módulos de Fase 3...");
            // if(state.gameMode === 'commander') handleCommanderNext();
            // else handleJumpstartNext();
        });
    }

    // Escuchar botón del Menú Superior Izquierdo (Modos/Atrás)
    const headerBtn = document.getElementById('btn-header-action');
    if (headerBtn) {
        headerBtn.addEventListener('click', () => {
            if(state.step === 1 || state.step === 7) {
                renderAndOpenModeHub();
            } else {
                console.log("Go back pending - Fase 3");
                // if(state.gameMode === 'commander') goBackCommander();
                // else goBackJumpstart();
            }
        });
    }

    // Escuchar botón de Créditos/Reset
    const creditsBtn = document.getElementById('btn-show-credits');
    if (creditsBtn) {
        creditsBtn.addEventListener('click', async () => {
            let msg = "Versión: v1.3 Modular (Offline PWA)\n\n- Arquitectura: ES Modules.\n- Nuevo Motor Veto (Bans/Locks) activado.\n- Renderizado DOM Dinámico.";
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

// Renderizado Dinámico del Menú de Modos
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
    document.getElementById('btn-mode-mkt').addEventListener('click', () => { console.log("Market pending Fase 3"); });
    document.getElementById('btn-close-hub').addEventListener('click', () => {
        modal.classList.add('hidden'); modal.classList.remove('flex');
    });
    
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function changeMode(newMode) {
    state.gameMode = newMode;
    state.step = newMode === 'commander' ? 1 : 7;
    saveData();
    applyThemeColors();
    document.getElementById('mode-modal').classList.add('hidden');
    document.getElementById('mode-modal').classList.remove('flex');
    window.location.reload(); // Reinicia limpio en el nuevo modo
}