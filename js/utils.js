// /js/utils.js

export const GIFS = {
    BATTLE: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmpwanhpbDU2ZWlscHI4bDRvZ3psczkzMHR5bzlocTBmY3J3MWFiNSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l3vQZA3WY4C1iku6Q/giphy.gif',
    WINNER: 'https://media0.giphy.com/media/l41lZD0i4UU9PkDJe/giphy.gif'
};

export const baseDecks = [
    { id: "DCK-0000001", name: "Jeskai Striker (Shiko)", colors: ['W', 'R', 'U'] },
    { id: "DCK-0000002", name: "Sultai Arisen (Teval)", colors: ['B', 'G', 'U'] },
    { id: "DCK-0000003", name: "Endless Punishment (Valgavoth)", colors: ['B', 'R'] },
    { id: "DCK-0000004", name: "Death Toll (Winter)", colors: ['B', 'G'] },      
    { id: "DCK-0000005", name: "Evangelion (Eva01)", colors: ['W', 'U'] },        
    { id: "DCK-0000006", name: "Eldrazi Incursion (Ulalek)", colors: ['W', 'U', 'B', 'R', 'G'] },
    { id: "DCK-0000007", name: "Dance of the Elements (Ashling)", colors: ['W', 'U', 'B', 'R', 'G'] }
];

export const winQuotes = ["Your Spark burns brighter than ever! ✨", "A flawless victory, Planeswalker. 🏆", "The Multiverse bows to your command. 🌌"];
export const loseQuotes = ["Mana flooded, or just outplayed? 💀", "Countered. Destroyed. Forgotten. 🪦", "Your Spark fades into the blind eternities... 🌑"];      

const archetypes = {
    'W': 'White', 'U': 'Blue', 'B': 'Black', 'R': 'Red', 'G': 'Green',
    'UW': 'Azorius', 'BW': 'Orzhov', 'RW': 'Boros', 'GW': 'Selesnya', 'BU': 'Dimir',
    'RU': 'Izzet', 'GU': 'Simic', 'BR': 'Rakdos', 'BG': 'Golgari', 'GR': 'Gruul',
    'BUW': 'Esper', 'RUW': 'Jeskai', 'GUW': 'Bant', 'BRW': 'Mardu', 'BGW': 'Abzan',
    'GRW': 'Naya', 'BRU': 'Grixis', 'BGU': 'Sultai', 'GRU': 'Temur', 'BGR': 'Jund',
    'BRUW': 'Yore', 'BGUW': 'Witch', 'GRUW': 'Ink', 'BGRW': 'Dune', 'BGRU': 'Glint',
    'BGRUW': 'WUBRG'
};

export function getArchetype(selectedColors) {
    if (!selectedColors || selectedColors.length === 0) return 'Colorless';      
    const currentSelection = [...selectedColors].sort().join('');
    for (const [key, name] of Object.entries(archetypes)) {
        if (currentSelection === key.split('').sort().join('')) return name;      
    }
    return 'Unknown';
}

export function generatePlayerID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = 'FOX-';
    for(let i=0; i<5; i++) res += chars.charAt(Math.floor(Math.random()*chars.length));
    return res;
}

export function generateDeckID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let res = 'DCK-';
    for(let i=0; i<7; i++) res += chars.charAt(Math.floor(Math.random()*chars.length));
    return res;
}

export function formatTime(secs) {
    let h = Math.floor(secs / 3600); let m = Math.floor((secs % 3600) / 60); let s = secs % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    return `${m}m ${String(s).padStart(2, '0')}s`;
}

export function formatTimeISO(secs) {
    let h = Math.floor(secs / 3600); let m = Math.floor((secs % 3600) / 60); let s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatLiveClock(secs) {
    let totalM = Math.floor(secs / 60);
    let h = Math.floor(totalM / 60);
    let m = totalM % 60;
    let s = Math.floor(secs % 60);

    if (totalM >= 100) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else {
        return `${String(totalM).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

export function preloadGifs() { Object.values(GIFS).forEach(url => { const img = new Image(); img.src = url; }); }

export function triggerConfetti(c) {
    try {
        if(typeof window.confetti !== 'function') return;
        const m = {'W':'#facc15','U':'#3b82f6','B':'#8b5cf6','R':'#ef4444','G':'#22c55e'};
        let cols = (c && c.length) ? c.map(x=>m[x]) : ['#facc15','#3b82f6','#8b5cf6','#ef4444','#22c55e'];
        const duration = 3000; const animationEnd = Date.now() + duration;        
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100000, colors: cols };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;   
        const interval = setInterval(function() {
            if (animationEnd - Date.now() <= 0) return clearInterval(interval);  
            const particleCount = 50 * ((animationEnd - Date.now()) / duration); 
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            window.confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    } catch (e) {}
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