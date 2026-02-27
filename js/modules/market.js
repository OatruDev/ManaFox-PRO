// /js/modules/market.js
import { mfModal } from '../ui.js';

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
// MÓDULO WEBRTC (CÁMARA)
// ==========================================

window.startScanner = async function() {
    const mainView = document.getElementById('market-main-view');
    const scannerView = document.getElementById('scanner-view');
    const video = document.getElementById('scanner-video');

    try {
        // Pedimos permiso para la cámara trasera (environment)
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', focusMode: "continuous" },
            audio: false
        });
        
        video.srcObject = videoStream;
        
        // Transición de UI
        mainView.classList.add('hidden');
        scannerView.classList.remove('hidden');
        scannerView.classList.add('flex');
        
    } catch (err) {
        console.error("Camera Error:", err);
        mfModal.show("Camera Blocked", "Please allow camera access in your browser settings to scan cards.", "videocam_off");
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
// DUMMY BRIDGE: TENSORFLOW -> SCRYFALL
// ==========================================

window.simulateCardScan = async function() {
    const video = document.getElementById('scanner-video');
    const canvas = document.getElementById('scanner-canvas');
    
    // 1. Capturamos el frame de la cámara en el canvas oculto
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Aquí es donde irá la inyección de la imagen a TensorFlow/OpenCV
    // const frameBase64 = canvas.toDataURL('image/jpeg');
    
    window.stopScanner();
    mfModal.show("Processing", "Analyzing card frame using Optical Recognition...", "memory");
    
    // Simulamos un retraso de procesamiento de 1.5 segundos
    setTimeout(async () => {
        try {
            // 2. Dummy Query a Scryfall (Simulamos que el OCR detectó "Black Lotus")
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
        
        // Filtramos para obtener solo expansiones Core o Commander reales
        const validSets = data.data.filter(set => ['core', 'expansion', 'commander'].includes(set.set_type)).slice(0, 10);
        
        container.innerHTML = validSets.map(set => `
            <a href="https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(set.name)}" target="_blank" rel="noopener noreferrer" class="block bg-app-surface-light border border-white/5 p-4 rounded-xl hover:border-app-market/50 hover:bg-white/5 transition-all group">
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