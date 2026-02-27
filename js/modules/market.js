// /js/modules/market.js
import { mfModal } from '../ui.js';
import { esc } from '../security.js';

let videoStream = null;

export function openMarketHub() {
    const modal = document.getElementById('market-modal');
    document.getElementById('market-main-view').classList.remove('hidden');
    document.getElementById('scanner-view').classList.add('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 50); // Fade in
}

window.openMarketHub = openMarketHub;
window.closeMarketHub = function() {
    const modal = document.getElementById('market-modal');
    modal.classList.add('opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// ==========================================
// MÓDULO WEBRTC (CÁMARA REPARADA MÓVIL)
// ==========================================

window.startScanner = async function() {
    const mainView = document.getElementById('market-main-view');
    const scannerView = document.getElementById('scanner-view');
    const video = document.getElementById('scanner-video');

    try {
        // FIX: Usamos "ideal: environment" en lugar de constraints estrictos
        // Esto evita que iOS Safari tire un OverconstrainedError y bloquee la cámara.
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false
        });
        
        video.srcObject = videoStream;
        
        mainView.classList.add('hidden');
        scannerView.classList.remove('hidden');
        scannerView.classList.add('flex');
        
    } catch (err) {
        console.warn("Primary Camera Error, trying fallback...", err);
        try {
            // Plan B: Si falla la trasera, pedimos cualquier cámara disponible.
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = videoStream;
            mainView.classList.add('hidden');
            scannerView.classList.remove('hidden');
            scannerView.classList.add('flex');
        } catch(fallbackErr) {
            mfModal.show("Camera Blocked", "Please allow camera access in your browser settings to scan cards.", "videocam_off");
        }
    }
}

window.stopScanner = function() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    document.getElementById('scanner-view').classList.add('hidden');
    document.getElementById('scanner-view').classList.remove('flex');
    document.getElementById('market-main-view').classList.remove('hidden');
}

// ==========================================
// BÚSQUEDA MANUAL (FORMULARIO RESTAURADO)
// ==========================================

window.searchMarketCard = async function() {
    const input = document.getElementById('market-search-input');
    const container = document.getElementById('market-results-container');
    const query = input.value.trim();
    
    if (!query) return;

    // Loading State
    container.innerHTML = '<div class="text-center text-slate-500 py-8 animate-pulse"><span class="material-symbols-outlined text-4xl mb-2">sync</span><p class="text-xs uppercase tracking-widest font-bold">Searching Scryfall...</p></div>';

    try {
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.object === "error") {
            container.innerHTML = `<p class="text-red-400 text-center text-sm font-bold mt-4">No cards found for "${esc(query)}".</p>`;
            return;
        }

        const cards = data.data.slice(0, 10); // Mostrar top 10
        
        container.innerHTML = cards.map(card => {
            const price = card.prices.eur || card.prices.usd || "N/A";
            // Si la API no da link directo de cardmarket, generamos un enlace de búsqueda
            const cmUrl = card.purchase_uris?.cardmarket || `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(card.name)}`;
            
            // Las cartas dobles guardan la imagen en otro sitio del JSON
            const img = card.image_uris ? card.image_uris.normal : (card.card_faces && card.card_faces[0].image_uris ? card.card_faces[0].image_uris.normal : '');
            
            return `
                <div class="bg-app-surface-light border border-white/5 p-3 rounded-xl flex gap-4 items-center shadow-sm">
                    ${img ? `<img src="${img}" class="w-16 rounded-md shadow-md border border-white/10">` : '<div class="w-16 h-24 bg-white/5 rounded-md flex items-center justify-center"><span class="text-[8px] text-slate-500">NO IMG</span></div>'}
                    <div class="flex-1 flex flex-col">
                        <span class="font-black text-white text-sm leading-tight">${esc(card.name)}</span>
                        <span class="text-[10px] text-app-market font-bold uppercase tracking-widest mt-0.5">${esc(card.set_name)}</span>
                        <div class="flex justify-between items-center mt-3 border-t border-white/5 pt-2">
                            <span class="text-white font-black">€${price}</span>
                            <a href="${cmUrl}" target="_blank" rel="noopener noreferrer" class="bg-[#1e83f5] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform flex items-center gap-1 shadow-md hover:bg-blue-400">
                                <span class="material-symbols-outlined text-[12px]">shopping_cart</span> Buy
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        container.innerHTML = `<p class="text-red-400 text-center text-sm font-bold mt-4">API connection failed.</p>`;
    }
}

// ==========================================
// DUMMY BRIDGE: TENSORFLOW -> SCRYFALL
// ==========================================

window.simulateCardScan = async function() {
    const video = document.getElementById('scanner-video');
    const canvas = document.getElementById('scanner-canvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    window.stopScanner();
    mfModal.show("Processing", "Analyzing card frame using Optical Recognition...", "memory");
    
    setTimeout(async () => {
        try {
            const searchName = "Black Lotus"; 
            const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(searchName)}`);
            const cardData = await response.json();
            
            if (cardData.object === "card") {
                const price = cardData.prices.eur || cardData.prices.usd || "N/A";
                const cmUrl = cardData.purchase_uris?.cardmarket || "#";
                
                const resultHtml = `
                    <div class="flex flex-col items-center gap-4 mt-2">
                        <img src="${cardData.image_uris.normal}" class="w-48 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.8)] border border-white/20">
                        <div class="text-center w-full bg-white/5 p-4 rounded-xl border border-white/10">
                            <span class="text-[10px] font-black uppercase text-app-market tracking-widest block mb-1">Market Value</span>
                            <span class="text-3xl font-black text-white">€${price}</span>
                        </div>
                        <a href="${cmUrl}" target="_blank" rel="noopener noreferrer" class="w-full bg-[#1e83f5] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition mt-2 shadow-lg">
                            <span class="material-symbols-outlined">shopping_cart</span> Open in Cardmarket
                        </a>
                    </div>
                `;
                mfModal.show("Card Recognized!", `Found: ${cardData.name}`, "check_circle", "custom", resultHtml);
            }
        } catch (error) {
            mfModal.show("Error", "Could not connect to Scryfall API.", "error");
        }
    }, 1500);
}

// ==========================================
// BROWSE SETS (SCRYFALL API V3)
// ==========================================
window.fetchUpcomingSets = async function() {
    const container = document.getElementById('market-results-container');
    container.innerHTML = '<div class="text-center text-slate-500 py-8 animate-pulse"><span class="material-symbols-outlined text-4xl mb-2">sync</span><p class="text-xs uppercase tracking-widest font-bold">Fetching Scryfall...</p></div>';
    
    try {
        const res = await fetch('https://api.scryfall.com/sets');
        const data = await res.json();
        
        const validSets = data.data.filter(set => ['core', 'expansion', 'commander'].includes(set.set_type)).slice(0, 10);
        
        container.innerHTML = validSets.map(set => `
            <a href="https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(set.name)}" target="_blank" rel="noopener noreferrer" class="block bg-app-surface-light border border-white/5 p-4 rounded-xl hover:border-app-market/50 hover:bg-white/5 transition-all group shadow-sm">
                <div class="flex justify-between items-center">
                    <div class="flex flex-col">
                        <span class="font-black text-white text-sm group-hover:text-app-market transition-colors">${esc(set.name)}</span>
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">${set.code} • ${set.released_at}</span>
                    </div>
                    <span class="material-symbols-outlined text-slate-600 group-hover:text-app-market transition-colors">open_in_new</span>
                </div>
            </a>
        `).join('');
    } catch (e) {
        container.innerHTML = `<p class="text-red-400 text-center text-sm font-bold mt-4">Failed to load Market Data.</p>`;
    }
}