// /js/modules/market.js
import { mfModal } from '../ui.js';
import { esc } from '../security.js';

let videoStream = null;

// Estados Globales
window.scannedVariants = [];
window.currentVariantIdx = 0;
window.isFoilSelected = false;

export function openMarketHub() {
    const modal = document.getElementById('market-modal');
    document.getElementById('market-main-view').classList.remove('hidden');
    document.getElementById('scanner-view').classList.add('hidden');
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => modal.classList.remove('opacity-0'), 50);
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
// CÁMARA WEBRTC
// ==========================================

window.startScanner = async function() {
    const mainView = document.getElementById('market-main-view');
    const scannerView = document.getElementById('scanner-view');
    const video = document.getElementById('scanner-video');

    try {
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
            videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = videoStream;
            mainView.classList.add('hidden');
            scannerView.classList.remove('hidden');
            scannerView.classList.add('flex');
        } catch(fallbackErr) {
            mfModal.show("Camera Blocked", "Please allow camera access to scan cards.", "videocam_off");
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
// TESSERACT.JS OCR & FUZZY SEARCH
// ==========================================

window.processCardScan = async function() {
    const video = document.getElementById('scanner-video');
    const canvas = document.getElementById('scanner-canvas');
    
    if (!video || video.videoWidth === 0) {
        return mfModal.show("Camera Error", "Video feed is not ready.", "error");
    }

    // 1. RECORTE EXACTO: Capturamos solo el 30% central para no saturar el móvil.
    const cropH = video.videoHeight * 0.30;
    const cropY = (video.videoHeight - cropH) / 2;
    
    canvas.width = video.videoWidth;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    
    // Dibujamos el video en el canvas
    ctx.drawImage(video, 0, cropY, video.videoWidth, cropH, 0, 0, canvas.width, canvas.height);

    // Creamos una foto Base64 para mostrarla en caso de error (Debug Mode)
    const debugImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

    window.stopScanner();
    mfModal.show("AI Engine Active", "Reading text...\n(If this is the first time, downloading AI model takes a few seconds).", "document_scanner");
    
    try {
        const worker = await Tesseract.createWorker('eng');
        const ret = await worker.recognize(canvas);
        await worker.terminate();
        
        // Limpiamos la lectura y ordenamos por las líneas más largas
        let lines = ret.data.text.split('\n')
                        .map(l => l.replace(/[^a-zA-Z0-9 ',.-]/g, '').trim())
                        .filter(l => l.length > 4); 
                        
        // Asumimos que la línea más larga es el título de la carta
        lines.sort((a, b) => b.length - a.length);
        let extractedName = lines.length > 0 ? lines[0] : "";

        // Si falló leyendo o no encontró nada, disparamos el DEBUG UI.
        const failHtml = `
            <div class="flex flex-col items-center gap-2 mt-2 w-full">
                <p class="text-[10px] text-slate-400 uppercase tracking-widest mb-1">What the AI saw:</p>
                <img src="${debugImageBase64}" class="w-full rounded border border-red-500/50 shadow-md">
                <div class="w-full bg-white/5 p-3 rounded-lg border border-white/10 mt-2">
                    <p class="text-[10px] text-slate-500 uppercase font-bold">Extracted Text:</p>
                    <p class="text-sm font-black text-white mt-1">"${extractedName || 'None'}"</p>
                </div>
                <p class="text-xs text-slate-400 mt-2 italic text-center">Ensure good lighting and hold still.</p>
            </div>
        `;

        if (!extractedName) {
            return mfModal.show("Scan Failed", "", "warning", "custom", failHtml);
        }

        mfModal.show("Searching Scryfall...", `Query: "${extractedName}"`, "sync");

        // FIX: Búsqueda FUZZY. Quitamos el ! y las comillas exactas. 
        // Si Tesseract leyó "Strefan Maurer Frogenitor", Scryfall lo encontrará igual.
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(extractedName)}&unique=prints`);
        const scryfallData = await response.json();
        
        if (scryfallData.object === "error") {
            return mfModal.show("Not Found in Database", "", "search_off", "custom", failHtml);
        }

        window.scannedVariants = scryfallData.data;
        window.currentVariantIdx = 0;
        window.isFoilSelected = false;
        
        window.renderVariantModal();

    } catch (error) {
        console.error("OCR Error:", error);
        mfModal.show("Error", "The AI Engine crashed. Check your connection.", "error");
    }
}

// ==========================================
// CARRUSEL DE VARIANTES & FOIL TOGGLE
// ==========================================

window.renderVariantModal = function() {
    if(!window.scannedVariants || window.scannedVariants.length === 0) return;
    
    const card = window.scannedVariants[window.currentVariantIdx];
    const priceKey = window.isFoilSelected ? 'eur_foil' : 'eur';
    const fallbackKey = window.isFoilSelected ? 'usd_foil' : 'usd';
    
    let price = card.prices[priceKey];
    if(!price) price = card.prices[fallbackKey];
    const displayPrice = price ? `€${price}` : "N/A";
    
    const cmUrl = card.purchase_uris?.cardmarket || `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(card.name)}`;
    const imgLg = card.image_uris ? card.image_uris.normal : (card.card_faces ? card.card_faces[0].image_uris.normal : '');
    
    let thumbsHtml = '';
    if(window.scannedVariants.length > 1) {
        thumbsHtml = `
            <p class="text-[9px] text-slate-400 uppercase tracking-widest mt-4 mb-2">Swipe to select edition</p>
            <div class="flex gap-2 overflow-x-auto no-scrollbar w-full py-2 snap-x">
                ${window.scannedVariants.map((c, i) => {
                    const thumb = c.image_uris ? c.image_uris.small : (c.card_faces ? c.card_faces[0].image_uris.small : '');
                    const isActive = i === window.currentVariantIdx;
                    return `<img src="${thumb}" onclick="window.selectVariant(${i})" class="w-16 rounded-md shadow-md cursor-pointer snap-center transition-all ${isActive ? 'border-2 border-app-market scale-110 opacity-100' : 'border-2 border-transparent opacity-50 hover:opacity-100'}">`;
                }).join('')}
            </div>
        `;
    }

    const html = `
        <div class="flex flex-col items-center w-full mt-2">
            <h4 class="font-black text-white text-lg mb-0.5 text-center">${esc(card.name)}</h4>
            <span class="text-[10px] text-app-market font-bold uppercase tracking-widest mb-4 text-center">${esc(card.set_name)} (${card.collector_number})</span>
            
            <img src="${imgLg}" class="w-48 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.8)] border border-white/20 mb-4 transition-all">
            
            <div class="flex bg-black p-1 rounded-lg border border-white/10 w-full max-w-[200px] mb-4">
                <button onclick="window.toggleFoil(false)" class="flex-1 text-xs py-1.5 rounded-md font-bold transition-colors ${!window.isFoilSelected ? 'bg-app-surface-light text-white' : 'text-slate-500'}">Normal</button>
                <button onclick="window.toggleFoil(true)" class="flex-1 text-xs py-1.5 rounded-md font-bold transition-colors ${window.isFoilSelected ? 'bg-gradient-to-r from-purple-500 to-app-market text-white' : 'text-slate-500'}">Foil ✦</button>
            </div>

            <div class="text-center w-full bg-white/5 p-3 rounded-xl border border-white/10">
                <span class="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Market Trend</span>
                <span class="text-3xl font-black ${window.isFoilSelected ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400' : 'text-white'}">${displayPrice}</span>
            </div>
            
            ${thumbsHtml}

            <a href="${cmUrl}" target="_blank" rel="noopener noreferrer" class="w-full bg-[#1e83f5] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition mt-4 shadow-lg hover:bg-blue-400">
                <span class="material-symbols-outlined">shopping_cart</span> View on Cardmarket
            </a>
        </div>
    `;

    mfModal.show("Scanner Result", "", "check_circle", "custom", html);
    
    const modalIcon = document.getElementById('mf-modal-icon');
    if(modalIcon) modalIcon.style.display = 'none';
}

window.selectVariant = function(idx) {
    window.currentVariantIdx = idx;
    window.renderVariantModal();
}

window.toggleFoil = function(isFoil) {
    window.isFoilSelected = isFoil;
    window.renderVariantModal();
}

const originalHide = mfModal.hide;
mfModal.hide = function() {
    if(originalHide) originalHide();
    const modalIcon = document.getElementById('mf-modal-icon');
    if(modalIcon) modalIcon.style.display = 'block';
}

// ==========================================
// BÚSQUEDA MANUAL & BROWSE
// ==========================================

window.searchMarketCard = async function() {
    const input = document.getElementById('market-search-input');
    const container = document.getElementById('market-results-container');
    const query = input.value.trim();
    if (!query) return;

    container.innerHTML = '<div class="text-center text-slate-500 py-8 animate-pulse"><span class="material-symbols-outlined text-4xl mb-2">sync</span><p class="text-xs uppercase tracking-widest font-bold">Searching Scryfall...</p></div>';

    try {
        const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data.object === "error") {
            container.innerHTML = `<p class="text-red-400 text-center text-sm font-bold mt-4">No cards found for "${esc(query)}".</p>`;
            return;
        }

        const cards = data.data.slice(0, 10);
        container.innerHTML = cards.map(card => {
            const price = card.prices.eur || card.prices.usd || "N/A";
            const cmUrl = card.purchase_uris?.cardmarket || `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(card.name)}`;
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