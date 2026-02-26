// /js/ui.js
import { state } from './state.js';

export const mfModal = {
    show: function(title, msg, icon, type = 'alert', customHtml = null) {
        return new Promise((resolve) => {
            document.getElementById('mf-modal-title').innerText = title;
            document.getElementById('mf-modal-msg').innerText = msg;
            document.getElementById('mf-modal-icon').innerText = icon;
            
            let color = state.gameMode === 'jumpstart' ? 'app-js' : 'app-primary';
            let rgb = state.gameMode === 'jumpstart' ? '245,158,11' : '139,92,246';
            let btns = document.getElementById('mf-modal-btns');

            if (customHtml) {
                btns.innerHTML = customHtml;
            } else if(type === 'confirm') {
                btns.innerHTML = `<button id="mf-btn-cancel" class="flex-1 bg-app-surface border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition active:scale-95">Cancel</button><button id="mf-btn-ok" class="flex-1 bg-${color} text-white py-4 rounded-xl font-bold hover:bg-${color}/80 transition shadow-[0_0_15px_rgba(${rgb},0.5)] active:scale-95">Confirm</button>`;
                document.getElementById('mf-btn-cancel').onclick = () => { mfModal.hide(); resolve(false); };
                document.getElementById('mf-btn-ok').onclick = () => { mfModal.hide(); resolve(true); };
            } else {
                btns.innerHTML = `<button id="mf-btn-ok" class="w-full bg-${color} text-white py-4 rounded-xl font-bold hover:bg-${color}/80 transition shadow-[0_0_15px_rgba(${rgb},0.5)] active:scale-95">Got it</button>`;
                document.getElementById('mf-btn-ok').onclick = () => { mfModal.hide(); resolve(true); };
            }
            document.getElementById('mf-modal').classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
        });
    },
    hide: function() { 
        document.getElementById('mf-modal').classList.add('opacity-0', 'pointer-events-none', 'scale-95'); 
    }
};

export function playTransition(gifUrl, duration, callback) {
    const overlay = document.getElementById('transition-overlay');
    const gif = document.getElementById('transition-gif');
    gif.src = ""; 
    requestAnimationFrame(() => {
        gif.src = gifUrl; 
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => { 
            overlay.classList.add('opacity-0', 'pointer-events-none');
            // FIX: Esperamos 350ms exactos a que termine el fade-out de CSS para soltar el confeti
            setTimeout(() => { callback(); }, 350); 
        }, duration);
    });
}

export function applyThemeColors() { 
    const logo = document.getElementById('header-logo-container'); 
    const title = document.getElementById('title-color'); 
    if(!logo || !title) return;
    if (state.gameMode === 'jumpstart') { 
        logo.className = 'size-8 flex items-center justify-center text-app-js group-hover:text-white transition-colors'; 
        title.className = 'text-app-js transition-colors'; 
    } else { 
        logo.className = 'size-8 flex items-center justify-center text-app-primary group-hover:text-white transition-colors'; 
        title.className = 'text-app-primary transition-colors'; 
    } 
    updateActionBar(); 
}

export function switchScreen(s) { 
    document.querySelectorAll('.screen').forEach(e=>e.classList.remove('active')); 
    const screenEl = document.getElementById('screen-'+s);
    if(screenEl) screenEl.classList.add('active'); 
    state.step = s; 
    
    const header = document.getElementById('main-header'); 
    const bar = document.getElementById('main-action-bar');
    
    if(header) header.style.display = (state.gameMode === 'commander' && s === 5) ? 'none' : 'flex';
    if(bar) bar.style.display = (s < 5 || s === 7 || s === 8) ? 'block' : 'none';
    
    const backIcon = document.getElementById('header-back-icon'); 
    const logoIcon = document.getElementById('header-logo-container');
    if(backIcon && logoIcon) {
        if(s === 1 || s === 7) { 
            backIcon.style.display = 'none'; 
            logoIcon.style.display = 'flex'; 
        } else { 
            backIcon.style.display = 'block'; 
            logoIcon.style.display = 'none'; 
        }
    }
    updateActionBar(); 
    window.scrollTo(0,0); 
}

export function updateActionBar() {
    const btn = document.getElementById('main-btn'); if (!btn) return;
    if (state.gameMode === 'commander') {
        btn.className = "w-full max-w-md mx-auto bg-app-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_4px_15px_rgba(139,92,246,0.4)]";
        btn.innerHTML = state.step === 3 ? 'Assign Decks' : (state.step === 4 ? 'Start Battlefield' : 'Next Step <span class="material-symbols-outlined">chevron_right</span>');
    } else {
        btn.className = "w-full max-w-md mx-auto bg-app-js text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_4px_15px_rgba(245,158,11,0.4)]";
        btn.innerHTML = state.step === 7 ? 'Define Contenders <span class="material-symbols-outlined">chevron_right</span>' : (state.step === 8 ? '<span class="material-symbols-outlined text-[18px]">account_tree</span> Generate Swiss Bracket' : 'Next Step');
    }
}