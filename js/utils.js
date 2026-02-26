// /js/utils.js

export const GIFS = {
    BATTLE: 'https://media0.giphy.com/media/l41lZD0i4UU9PkDJe/giphy.gif',
    WINNER: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmpwanhpbDU2ZWlscHI4bDRvZ3psczkzMHR5bzlocTBmY3J3MWFiNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3vQZA3WY4C1iku6Q/giphy.gif'
};

export const baseDecks = [
    { name: "Jeskai Striker (Shiko)", colors: ['W', 'R', 'U'] }, 
    { name: "Endless Punishment (Valgavoth)", colors: ['B', 'R'] }, 
    { name: "Eldrazi Incursion (Ulalek)", colors: ['W', 'U', 'B', 'R', 'G'] }, 
    { name: "Dance of Elements (Ashling)", colors: ['W', 'U', 'B', 'R', 'G'] }, 
    { name: "Evangelion (Eva01)", colors: ['W', 'U'] }, 
    { name: "Death Toll (Winter)", colors: ['B', 'G'] }, 
    { name: "Sultai Arisen (Teval)", colors: ['B', 'G', 'U'] }
];

export const winQuotes = ["Your Spark burns brighter than ever! ⚡", "A flawless victory, Planeswalker. 🏆", "The Multiverse bows to your command. 🌌"];
export const loseQuotes = ["Mana flooded, or just outplayed? 💧", "Countered. Destroyed. Forgotten. 💀", "Your Spark fades into the blind eternities... 🌑"];

// Diccionario de Arquetipos de Magic
const archetypes = {
    '': 'Colorless',
    'W': 'Mono-White', 'U': 'Mono-Blue', 'B': 'Mono-Black', 'R': 'Mono-Red', 'G': 'Mono-Green',
    'WU': 'Azorius', 'UB': 'Dimir', 'BR': 'Rakdos', 'RG': 'Gruul', 'GW': 'Selesnya',
    'WB': 'Orzhov', 'UR': 'Izzet', 'BG': 'Golgari', 'RW': 'Boros', 'GU': 'Simic',
    'GWU': 'Bant', 'WUB': 'Esper', 'UBR': 'Grixis', 'BRG': 'Jund', 'RGW': 'Naya',
    'WBG': 'Abzan', 'URW': 'Jeskai', 'BGU': 'Sultai', 'RWB': 'Mardu', 'GUR': 'Temur',
    'UBRG': 'Glint-Eye', 'BRGW': 'Dune-Brood', 'RGWU': 'Ink-Treader', 'GWUB': 'Witch-Maw', 'WUBR': 'Yore-Tiller',
    'WUBRG': 'Pentacolor'
};

export function getArchetype(colors) {
    // Ordenar colores según WUBRG para coincidir con las llaves del diccionario
    const order = ['W', 'U', 'B', 'R', 'G'];
    const sorted = colors.sort((a, b) => order.indexOf(a) - order.indexOf(b)).join('');
    return archetypes[sorted] || 'Unknown';
}

export function preloadGifs() { 
    Object.values(GIFS).forEach(url => { const img = new Image(); img.src = url; }); 
}

export function triggerConfetti(c) {
    try { 
        if(typeof window.confetti !== 'function') return; 
        const m = {'W':'#facc15','U':'#3b82f6','B':'#8b5cf6','R':'#ef4444','G':'#22c55e'}; 
        let cols = (c && c.length) ? c.map(x=>m[x]) : ['#facc15','#3b82f6','#8b5cf6','#ef4444','#22c55e']; 
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100000, colors: cols };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;
        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    } catch (e) { console.warn("Confetti failed", e); } 
}

export function getPlayerTheme(c) { 
    const map = { 'W': 'rgba(250, 204, 21, 0.9)', 'U': 'rgba(59, 130, 246, 0.9)', 'B': 'rgba(124, 58, 237, 0.9)', 'R': 'rgba(225, 29, 72, 0.9)', 'G': 'rgba(16, 185, 129, 0.9)' }; 
    let c1 = 'rgba(71, 85, 105, 0.8)', c2 = 'rgba(51, 65, 85, 0.8)', c3 = 'rgba(30, 41, 59, 0.8)', c4 = 'rgba(15, 23, 42, 0.8)'; 
    if (c && c.length > 0) { 
        c1 = map[c[0]]; 
        if (c.length === 1) { c2 = map[c[0]]; c3 = 'rgba(0,0,0,0.5)'; c4 = map[c[0]]; } 
        else if (c.length === 2) { c2 = map[c[1]]; c3 = map[c[0]]; c4 = map[c[1]]; } 
        else { c2 = map[c[1]]; c3 = map[c[2]]; c4 = map[c[0]]; } 
    } 
    return `--c1: ${c1}; --c2: ${c2}; --c3: ${c3}; --c4: ${c4};`; 
}