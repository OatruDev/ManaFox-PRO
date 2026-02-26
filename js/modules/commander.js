// /js/modules/commander.js
import { state, saveData } from '../state.js';
import { esc } from '../security.js';
import { mfModal, playTransition, switchScreen } from '../ui.js';
import { GIFS, baseDecks, winQuotes, loseQuotes, triggerConfetti, getPlayerTheme, getArchetype } from '../utils.js';

export function initCommander() {
    if (state.step === 1) {
        document.getElementById('count-players').innerText = state.players;
        document.getElementById('count-decks').innerText = state.decks;
    } else if (state.step === 2) buildDeckDOM();
    else if (state.step === 3) goToPlayers();
    else if (state.step === 4) buildResultsDOM();
    else if (state.step === 5 && state.currentMatch.length > 0) renderBattlefield();
    else if (state.step === 6) goToScreen6Manual();
    
    if (state.step < 5) renderHistory();
}

function updateCount(t, v) { 
    state[t] = Math.min(t === 'players' ? 6 : 20, Math.max(2, state[t] + v)); 
    document.getElementById('count-' + t).innerText = state[t]; 
    saveData(); 
}

function applyDandLPreset() { 
    state.players = 2; state.decks = 7; 
    state.deckData = baseDecks.map(d => ({ ...d, colors: [...d.colors] })); 
    state.tempPlayerNames = ["Daniel", "Laura"]; 
    state.playerLocks = []; state.playerBans = [[], [4]]; 
    saveData(); goToDecks(); 
}
function applyDJLPreset() { 
    state.players = 3; state.decks = 7; 
    state.deckData = baseDecks.map(d => ({ ...d, colors: [...d.colors] })); 
    state.tempPlayerNames = ["Daniel", "Laura", "Julio"]; 
    state.playerLocks = []; state.playerBans = [[], [4], []]; 
    saveData(); goToDecks(); 
}

function goToDecks() { 
    if (state.deckData.length === 0) state.deckData = Array.from({ length: state.decks }, () => ({ name: '', colors: [] })); 
    buildDeckDOM(); 
    switchScreen(2); 
}

function buildDeckDOM() { 
    const c = document.getElementById('deck-inputs-container'); c.innerHTML = ''; 
    const lib = [...baseDecks, ...state.savedDecks]; 
    state.deckData.forEach((d, i) => { 
        const arch = getArchetype(d.colors);
        const colorsHTML = state.manaColors.map(m => `<button onclick="toggleColor(${i},'${m.id}')" class="size-10 rounded-full flex items-center justify-center mana-btn ${m.cls} ${d.colors.includes(m.id) ? 'active' : 'opacity-30'}">${m.icon}</button>`).join(''); 
        c.innerHTML += `
        <div class="bg-app-surface p-4 rounded-2xl border border-white/5 shadow-sm">
            <div class="flex justify-between items-center mb-2">
                <div class="flex flex-col">
                    <label class="text-[10px] font-bold text-app-primary uppercase">Deck #${i + 1}</label>
                    <span class="text-[9px] font-black text-slate-500 uppercase tracking-tighter">${arch}</span>
                </div>
                <div class="flex gap-2">
                    <select onchange="loadDeck(${i},this.value)" class="text-[10px] bg-app-surface text-white border-none p-0 w-24 uppercase"><option value="" disabled selected>Library</option>${lib.map((ld, idx) => `<option value="${idx}">${esc(ld.name)}</option>`).join('')}</select>
                    <button onclick="removeDeck(${i})" class="text-red-400"><span class="material-symbols-outlined text-[14px]">delete</span></button>
                </div>
            </div>
            <input type="text" maxlength="40" oninput="state.deckData[${i}].name=this.value; saveData();" class="w-full bg-app-surface-light border-none rounded-xl text-sm mb-3 focus:ring-1 focus:ring-app-primary text-white" value="${esc(d.name)}" placeholder="Name">
            <div class="flex gap-2">${colorsHTML}</div>
        </div>`; 
    }); 
}

function loadDeck(di, li) { const d = [...baseDecks, ...state.savedDecks][li]; state.deckData[di] = { name: d.name, colors: [...d.colors] }; buildDeckDOM(); saveData(); }
function toggleColor(di, mi) { const d = state.deckData[di]; d.colors = d.colors.includes(mi) ? d.colors.filter(c => c !== mi) : [...d.colors, mi]; buildDeckDOM(); saveData(); }
function removeDeck(i) { state.deckData.splice(i, 1); state.decks--; buildDeckDOM(); saveData(); }
function addExtraDeck() { state.decks++; state.deckData.push({ name: '', colors: [] }); buildDeckDOM(); saveData(); }

function openLibraryManager() { 
    const modal = document.getElementById('library-modal');
    if (!document.getElementById('library-list')) {
        modal.innerHTML = `
        <div class="bg-app-surface border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[80vh]">
            <button onclick="window.closeLibraryManager()" class="absolute top-4 right-4 text-slate-500 hover:text-white transition z-20"><span class="material-symbols-outlined">close</span></button>
            <h3 class="font-black text-xl mb-2 text-white tracking-widest uppercase flex items-center gap-2"><span class="material-symbols-outlined text-app-primary">library_books</span> Deck Library</h3>
            <p class="text-[10px] text-slate-400 mb-4 uppercase tracking-widest">Saved custom decks</p>
            <div id="library-list" class="space-y-3 overflow-y-auto no-scrollbar flex-1 pb-2"></div>
        </div>`;
    }
    const list = document.getElementById('library-list'); list.innerHTML = ''; 
    if (state.savedDecks.length === 0) list.innerHTML = '<p class="text-center text-slate-500 italic mt-8 font-medium">No custom decks saved yet.</p>'; 
    else state.savedDecks.forEach((d, i) => { const mH = d.colors.map(col => `<i class="ms ms-${col.toLowerCase()} text-[12px]"></i>`).join(' '); list.innerHTML += `<div class="bg-app-surface-light p-3 rounded-xl border border-white/5 shadow-sm flex items-center justify-between"><div class="flex flex-col overflow-hidden pr-2"><span class="font-bold text-sm text-white truncate">${esc(d.name)}</span><div class="flex gap-1 mt-1 text-slate-400">${mH}</div></div><button onclick="window.deleteSavedDeck(${i})" class="size-10 flex-none bg-red-900/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition active:scale-95 border border-red-500/20"><span class="material-symbols-outlined text-[18px]">delete</span></button></div>`; }); 
    modal.classList.remove('hidden'); 
}
function closeLibraryManager() { document.getElementById('library-modal').classList.add('hidden'); buildDeckDOM(); }
async function deleteSavedDeck(idx) { const c = await mfModal.show("Delete Deck?", `Permanently delete "${esc(state.savedDecks[idx].name)}"?`, "delete", "confirm"); if (c) { state.savedDecks.splice(idx, 1); saveData(); openLibraryManager(); } }

function savePlayerInputs() {
    for (let i = 0; i < state.players; i++) {
        let input = document.getElementById(`p-in-${i}`);
        if (input) state.tempPlayerNames[i] = esc(input.value);
    }
}

function setPlayerLock(pIdx, dIdx) {
    savePlayerInputs();
    state.playerLocks[pIdx] = dIdx;
    if (dIdx !== -1 && state.playerBans[pIdx] && state.playerBans[pIdx].includes(dIdx)) {
        state.playerBans[pIdx] = state.playerBans[pIdx].filter(id => id !== dIdx);
    }
    saveData(); goToPlayers();
}

function toggleBan(pIdx, dIdx) {
    savePlayerInputs();
    if (!state.playerBans[pIdx]) state.playerBans[pIdx] = [];
    if (state.playerLocks[pIdx] !== undefined && state.playerLocks[pIdx] !== -1) return;
    let validD = state.deckData.filter(d => d.name.trim() !== "");
    let maxBans = Math.max(0, validD.length - 2);
    let idx = state.playerBans[pIdx].indexOf(dIdx);
    if (idx > -1) {
        state.playerBans[pIdx].splice(idx, 1);
    } else {
        if (state.playerBans[pIdx].length >= maxBans) {
            mfModal.show("Limit Reached", "You must leave at least 2 decks available in the pool.", "warning");
            return;
        }
        state.playerBans[pIdx].push(dIdx);
    }
    saveData(); goToPlayers();
}

function goToPlayers() { 
    const c = document.getElementById('player-inputs-container'); c.innerHTML = ''; 
    if (state.savedPlayers.length > 0) { document.getElementById('saved-players-section').classList.remove('hidden'); renderSavedPlayers(); } 
    let validD = state.deckData.filter(d => d.name.trim() !== ""); 
    let maxBans = Math.max(0, validD.length - 2);
    if (!state.playerBans) state.playerBans = [];
    for (let i = 0; i < state.players; i++) { 
        if (!state.playerBans[i]) state.playerBans[i] = [];
        const def = state.tempPlayerNames[i] || ""; 
        let lockVal = state.playerLocks[i] !== undefined ? state.playerLocks[i] : -1;
        let hasLock = lockVal !== -1;
        let atBanLimit = state.playerBans[i].length >= maxBans;
        let deckOpts = `<option value="-1">🎲 Random Deck</option>` + validD.map((d, idx) => `<option value="${idx}" ${lockVal === idx ? 'selected' : ''}>${esc(d.name)}</option>`).join(''); 
        let bansHTML = validD.map((d, dIdx) => {
            const isBanned = state.playerBans[i].includes(dIdx);
            const isDisabled = hasLock || (!isBanned && atBanLimit);
            const titleMsg = hasLock ? "Cannot ban when a deck is locked." : (isDisabled ? `Max bans reached (${maxBans})` : "Ban this deck");
            return `<button onclick="toggleBan(${i}, ${dIdx})" title="${titleMsg}" class="shrink-0 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-colors ${isBanned ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-app-surface border-white/10 text-slate-400'} ${isDisabled ? 'opacity-30 pointer-events-none cursor-not-allowed' : 'hover:border-white/30'}">
                <span class="material-symbols-outlined text-[10px] align-middle mr-1">${isBanned ? 'block' : 'check_box_outline_blank'}</span> ${esc(d.name)}
            </button>`;
        }).join('');
        c.innerHTML += `<div class="bg-app-surface p-4 rounded-xl border border-white/5 relative"><button onclick="removePlayer(${i})" class="absolute right-3 top-2 text-red-400 hover:text-red-300 transition"><span class="material-symbols-outlined text-[14px]">delete</span></button><label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Player ${i + 1}</label><div class="flex flex-col gap-2"><div class="relative"><span class="material-symbols-outlined absolute left-3 top-3 text-app-primary">person</span><input type="text" id="p-in-${i}" maxlength="20" oninput="state.tempPlayerNames[${i}]=esc(this.value); saveData();" class="w-full bg-app-surface-light border-none rounded-xl py-3 pl-10 text-sm focus:ring-1 focus:ring-app-primary text-white" value="${esc(def)}" placeholder="Name"></div><div class="relative"><span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[18px]">lock</span><select id="p-lock-${i}" onchange="setPlayerLock(${i}, parseInt(this.value))" class="w-full bg-app-surface-light text-slate-300 border-none rounded-xl py-2 pl-10 text-xs appearance-none">${deckOpts}</select></div></div><div class="mt-4 pt-4 border-t border-white/5"><label class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between items-center"><span>Vetoes (Bans)</span><span class="text-slate-600 font-normal normal-case text-[8px] flex items-center gap-1">Swipe <span class="material-symbols-outlined text-[10px]">arrow_forward</span></span></label><div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">${bansHTML}</div></div></div>`; 
    } 
    switchScreen(3); 
}

function renderSavedPlayers() { document.getElementById('saved-players-container').innerHTML = state.savedPlayers.map((p, i) => `<div class="relative flex flex-col items-center shrink-0 mt-2 group"><button onclick="deleteSavedPlayer(${i})" class="absolute -top-1 -right-1 bg-app-surface text-slate-500 text-[9px] size-[18px] flex items-center justify-center rounded-full border border-white/10 hover:bg-red-600 hover:text-white transition-all shadow-sm z-10 opacity-70 hover:opacity-100">✕</button><div onclick="quickAdd('${esc(p)}')" class="setup-input size-12 rounded-full border border-app-primary bg-app-surface-light flex items-center justify-center font-bold text-white shadow-sm cursor-pointer hover:bg-app-primary/20 transition-colors">${esc(p[0].toUpperCase())}</div><span class="text-[9px] truncate w-14 text-center mt-1 text-slate-400 uppercase font-bold">${esc(p)}</span></div>`).join(''); }
function quickAdd(n) { for (let i = 0; i < state.players; i++) { const inp = document.getElementById('p-in-' + i); if (inp && !inp.value) { inp.value = n; state.tempPlayerNames[i] = n; break; } } saveData(); }
async function deleteSavedPlayer(i) { const c = await mfModal.show("Remove Player?", `Are you sure you want to remove "${esc(state.savedPlayers[i])}" from your Roster?`, "person_remove", "confirm"); if (c) { state.savedPlayers.splice(i, 1); saveData(); renderSavedPlayers(); if (state.savedPlayers.length === 0) document.getElementById('saved-players-section').classList.add('hidden'); } }
function removePlayer(i) { if (state.players <= 1) return; state.tempPlayerNames.splice(i, 1); state.playerLocks.splice(i, 1); state.playerBans.splice(i, 1); state.players--; goToPlayers(); saveData(); }
function addExtraPlayer() { state.players++; goToPlayers(); saveData(); }

function executeAssignment() { 
    let validD = state.deckData.filter(d => d.name.trim() !== ""); 
    let pool = validD.map((d, index) => ({ ...d, origIdx: index })); 
    state.currentMatch = []; 
    for (let i = 0; i < state.players; i++) { 
        let pref = state.playerLocks[i] !== undefined ? state.playerLocks[i] : -1; 
        if(pref >= validD.length || pref < 0) { pref = -1; state.playerLocks[i] = -1; }
        if (pref !== -1) { let idx = pool.findIndex(d => d.origIdx === pref); if (idx > -1) pool.splice(idx, 1); } 
    } 
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } 
    let unassignedPlayers = [];
    for (let i = 0; i < state.players; i++) {
        if (state.playerLocks[i] === undefined || state.playerLocks[i] === -1) {
            let safeBans = (state.playerBans[i] || []).filter(b => b >= 0 && b < validD.length);
            unassignedPlayers.push({ idx: i, bans: safeBans });
        }
    }
    unassignedPlayers.sort((a, b) => b.bans.length - a.bans.length);
    let tempMatch = [];
    for (let i = 0; i < state.players; i++) {
        let pref = state.playerLocks[i];
        if (pref !== undefined && pref !== -1 && validD[pref]) tempMatch[i] = { deck: validD[pref] };
    }
    for (let pObj of unassignedPlayers) {
        let validIdx = pool.findIndex(d => !pObj.bans.includes(d.origIdx));
        if (validIdx > -1) tempMatch[pObj.idx] = { deck: pool.splice(validIdx, 1)[0] };
        else if (pool.length > 0) tempMatch[pObj.idx] = { deck: pool.shift() };
        else tempMatch[pObj.idx] = { deck: null };
    }
    for (let i = 0; i < state.players; i++) { 
        let pN = state.tempPlayerNames[i] || `Player ${i+1}`; 
        let mDeck = tempMatch[i] ? tempMatch[i].deck : null;
        state.currentMatch.push({ player: pN, deck: mDeck, life: 40, cmdrDmg: {}, isDead: false, themeVars: getPlayerTheme(mDeck ? mDeck.colors : []), deathQuote: "" }); 
    } 
    state.remainingDecks = [...pool]; saveData(); buildResultsDOM(); switchScreen(4); 
}

function reassignDecks() { executeAssignment(); }

function buildResultsDOM() { 
    const c = document.getElementById('assignments-container'); c.innerHTML = ''; 
    state.currentMatch.forEach(m => { 
        const mH = m.deck ? m.deck.colors.map(col => `<div class="size-5 rounded-full flex items-center justify-center mana-btn ${state.manaColors.find(x => x.id === col).cls} active border border-black/30 shadow-sm">${state.manaColors.find(x => x.id === col).icon}</div>`).join('') : ''; 
        c.innerHTML += `<div class="bg-app-surface/90 backdrop-blur-sm p-4 rounded-2xl border border-white/5 flex justify-between items-center shadow-lg transition-colors"><div class="flex items-center gap-4"><div class="size-12 rounded-full bg-app-surface-light border border-white/10 flex items-center justify-center font-bold text-lg text-white">${esc(m.player[0].toUpperCase())}</div><div><h3 class="font-bold text-[15px] text-white">${esc(m.player)}</h3><p class="text-app-accent font-bold text-[10px] uppercase tracking-widest mt-1">Assigned to</p></div></div><div class="text-right max-w-[45%] flex flex-col items-end"><span class="text-app-primary font-bold text-sm truncate drop-shadow-md">${m.deck ? esc(m.deck.name) : 'Unknown'}</span><div class="flex gap-1 justify-end mt-1.5 min-h-[20px]">${mH}</div></div></div>`; 
    }); 
    const remSec = document.getElementById('rem-section'); 
    if (state.remainingDecks.length > 0) { 
        remSec.classList.remove('hidden'); 
        document.getElementById('remaining-container').innerHTML = state.remainingDecks.map(d => { const mH = d.colors.map(col => `<i class="ms ms-${col.toLowerCase()} text-[11px]"></i>`).join(' '); return `<div class="bg-app-surface-light border border-white/5 p-3 rounded-xl flex justify-between items-center shadow-sm"><span class="text-[11px] font-bold text-slate-400 truncate w-3/4">${esc(d.name)}</span><div class="flex gap-1">${mH}</div></div>`; }).join(''); 
    } else remSec.classList.add('hidden'); 
}

function initBattlefield() { playTransition(GIFS.BATTLE, 2600, () => { renderBattlefield(); switchScreen(5); }); }

let holdTimer = null; let holdInterval = null; let eliminationTimer = null;
function handleTapStart(e, idx, amt) {
    if (e && e.cancelable) e.preventDefault(); 
    if (state.currentMatch[idx].isDead) return;
    clearTimeout(holdTimer); clearInterval(holdInterval);
    changeLife(idx, amt);
    holdTimer = setTimeout(() => { holdInterval = setInterval(() => { changeLife(idx, amt * 5); }, 150); }, 400); 
}
function handleTapEnd(e) { if (e && e.cancelable) e.preventDefault(); clearTimeout(holdTimer); clearInterval(holdInterval); }

function changeLife(idx, amt) { 
    if (state.currentMatch[idx].isDead) return; 
    state.currentMatch[idx].life += amt; 
    const displayNode = document.getElementById(`life-display-${idx}`);
    if (displayNode) displayNode.innerText = state.currentMatch[idx].life;
    saveData(); 
    clearTimeout(eliminationTimer); eliminationTimer = setTimeout(() => checkEliminations(), 300); 
}

function renderBattlefield() { 
    const grid = document.getElementById('battlefield-grid'); const count = state.currentMatch.length; 
    grid.className = 'bf-grid'; 
    if (count === 2) grid.classList.add('bf-2p'); else if (count === 3) grid.classList.add('bf-3p'); else if (count === 4) grid.classList.add('bf-4p-grid'); else if (count === 5) grid.classList.add('bf-5p'); else grid.classList.add('bf-6p'); 
    if (count === 4 && state.layoutMode === 'cross') grid.classList.replace('bf-4p-grid', 'bf-4p-cross'); 
    if (count === 4) document.getElementById('layout-toggle-btn').classList.remove('hidden'); 
    grid.innerHTML = ''; 
    state.currentMatch.forEach((p, i) => { 
        let rotDeg = 0; let pos = ''; 
        if (count === 4 && state.layoutMode === 'cross') { 
            if (i === 0) { pos = 'cross-pos-0'; rotDeg = 180 } 
            if (i === 1) { pos = 'cross-pos-1'; rotDeg = 90 } 
            if (i === 2) { pos = 'cross-pos-2'; rotDeg = -90 } 
            if (i === 3) { pos = 'cross-pos-3'; rotDeg = 0 } 
        } else { 
            if (count === 2 && i === 0) rotDeg = 180; 
            if (count === 3 && i === 0) { rotDeg = 180; pos = 'bf-3p-top' } 
            if (count >= 4 && (i === 0 || i === 1)) rotDeg = 180; 
            if (count === 6 && i === 2) rotDeg = 180; 
        } 
        let flexDir = 'flex-col'; let hitbox1 = '1'; let hitbox2 = '-1'; 
        if (rotDeg === 180) { hitbox1 = '-1'; hitbox2 = '1'; } 
        else if (rotDeg === 90) { flexDir = 'flex-row'; hitbox1 = '-1'; hitbox2 = '1'; } 
        else if (rotDeg === -90) { flexDir = 'flex-row'; hitbox1 = '1'; hitbox2 = '-1'; } 
        let deadOverlay = p.isDead ? `<div class="absolute inset-0 bg-zinc-950/85 backdrop-grayscale z-30 flex flex-col items-center justify-center pointer-events-auto transition-all duration-500" style="transform: rotate(${rotDeg}deg)"><span class="material-symbols-outlined text-[24vmin] text-[#1e83f5] drop-shadow-[0_0_35px_rgba(30,131,245,0.8)]">skull</span><div class="mt-4 px-6 py-2 bg-[#1e83f5]/20 border border-[#1e83f5] text-white text-xs font-black tracking-widest uppercase rounded-full shadow-[0_0_15px_rgba(30,131,245,0.5)]">Eliminated</div><p class="text-slate-300 font-medium italic mt-4 text-center px-8 text-sm drop-shadow-md">"${esc(p.deathQuote)}"</p></div>` : ''; 
        let lifeUI = p.isDead ? '' : `<span id="life-display-${i}" class="text-[clamp(4rem,12vh,9rem)] font-black tracking-tighter leading-none text-white">${p.life}</span>`; 
        let uiWrapper = `<div class="absolute inset-0 z-20 pointer-events-none" style="transform: rotate(${rotDeg}deg);"><div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center transition-opacity ${p.isDead ? 'opacity-20' : ''}"><h3 class="text-2xl sm:text-3xl font-black uppercase tracking-widest text-white drop-shadow-md truncate">${esc(p.player)}</h3><p class="text-[12px] sm:text-sm font-bold text-white/90 truncate mb-1">${p.deck ? esc(p.deck.name) : ''}</p>${lifeUI}</div><div class="absolute bottom-4 left-0 w-full px-4 flex justify-between items-end ${p.isDead ? 'hidden' : ''}"><div class="flex gap-2 flex-wrap pointer-events-auto">${renderCmdrDamageIcons(p)}</div><button onclick="openCmdrModal(${i}, ${rotDeg})" class="size-10 sm:size-14 rounded-full bg-black/50 border border-white/20 flex items-center justify-center text-white pointer-events-auto shadow-lg active:scale-95 transition-transform backdrop-blur-sm"><span class="material-symbols-outlined text-[20px] sm:text-[28px]">swords</span></button></div></div>`;
        grid.innerHTML += `<div class="relative w-full h-full flex flex-col justify-center items-center ${pos} select-none overflow-hidden bg-texture liquid-bg" style="${p.themeVars}"><div class="absolute inset-0 flex ${flexDir} z-10 ${p.isDead ? 'hidden' : ''}"><div class="flex-1 w-full h-full cursor-pointer flex items-center justify-center group active:bg-white/10 transition-colors" onmousedown="handleTapStart(event, ${i}, ${hitbox1})" ontouchstart="handleTapStart(event, ${i}, ${hitbox1})" onmouseup="handleTapEnd(event)" onmouseleave="handleTapEnd(event)" ontouchend="handleTapEnd(event)" ontouchcancel="handleTapEnd(event)"><span class="text-white opacity-10 text-[10vmin] font-black select-none pointer-events-none">${hitbox1 === '1' ? '+' : '-'}</span></div><div class="flex-1 w-full h-full cursor-pointer flex items-center justify-center group active:bg-white/10 transition-colors" onmousedown="handleTapStart(event, ${i}, ${hitbox2})" ontouchstart="handleTapStart(event, ${i}, ${hitbox2})" onmouseup="handleTapEnd(event)" onmouseleave="handleTapEnd(event)" ontouchend="handleTapEnd(event)" ontouchcancel="handleTapEnd(event)"><span class="text-white opacity-10 text-[10vmin] font-black select-none pointer-events-none">${hitbox2 === '1' ? '+' : '-'}</span></div></div>${uiWrapper}${deadOverlay}</div>`; 
    }); 
}

function renderCmdrDamageIcons(player) { 
    let html = ''; 
    for (let attackerIdx in player.cmdrDmg) { 
        let dmg = player.cmdrDmg[attackerIdx]; 
        // FIX: El daño se muestra de forma individual por carta
        if (dmg > 0 && state.currentMatch[attackerIdx] && !state.currentMatch[attackerIdx].isDead) { 
            html += `<div class="size-10 rounded-full bg-red-900/90 border border-red-500/50 flex items-center justify-center flex-col shadow-lg"><span class="text-[9px] font-bold text-red-200 leading-none">${esc(state.currentMatch[attackerIdx].player[0].toUpperCase())}</span><span class="text-[14px] font-black text-white leading-none">${dmg}</span></div>`; 
        } 
    } 
    return html; 
}
function toggleLayout() { state.layoutMode = state.layoutMode === 'grid' ? 'cross' : 'grid'; renderBattlefield(); toggleCenterMenu(); saveData(); }

let currentCmdrTarget = -1;
function openCmdrModal(idx, rotDeg) { currentCmdrTarget = idx; const t = state.currentMatch[idx]; document.getElementById('cmdr-target-name').innerText = t.player; document.getElementById('cmdr-options').innerHTML = state.currentMatch.map((a, i) => i !== idx && !a.isDead ? `<div class="flex justify-between items-center bg-app-surface-light p-3 rounded-xl border border-white/5"><span class="font-bold text-sm truncate w-24">${esc(a.player)}</span><div class="flex items-center gap-4"><button onclick="changeCmdrDmg(${idx},${i},-1)" class="size-10 bg-white/5 rounded-lg flex items-center justify-center text-2xl font-bold active:scale-95">-</button><span class="text-2xl font-black w-8 text-center text-red-400">${t.cmdrDmg[i] || 0}</span><button onclick="changeCmdrDmg(${idx},${i},1)" class="size-10 bg-white/5 rounded-lg flex items-center justify-center text-2xl font-bold active:scale-95">+</button></div></div>` : '').join(''); const box = document.getElementById('cmdr-modal-box'); box.style.transform = `rotate(${rotDeg}deg)`; document.getElementById('cmdr-modal').classList.remove('hidden'); }

function changeCmdrDmg(tI, aI, v) { 
    let t = state.currentMatch[tI]; 
    let oldVal = t.cmdrDmg[aI] || 0; 
    let newVal = Math.max(0, oldVal + v); 
    t.cmdrDmg[aI] = newVal; 
    // FIX: El daño de comandante resta vida 1 a 1
    t.life -= (newVal - oldVal); 
    saveData(); 
    openCmdrModal(tI, document.getElementById('cmdr-modal-box').style.transform.replace(/[^0-9\-]/g, '') || 0); 
    renderBattlefield(); 
    setTimeout(() => checkEliminations(), 20); 
}

function closeCmdrModal() { document.getElementById('cmdr-modal').classList.add('hidden'); }

let isCheckingDeath = false;
async function checkEliminations() { 
    if (isCheckingDeath) return; 
    isCheckingDeath = true; 
    for (let i = 0; i < state.currentMatch.length; i++) { 
        let p = state.currentMatch[i]; 
        if (!p.isDead) { 
            let cmdrDeath = false; 
            if (p.cmdrDmg) { 
                // FIX: Solo muere si un ÚNICO comandante llega a 21
                cmdrDeath = Object.values(p.cmdrDmg).some(d => d >= 21); 
            } 
            if (p.life <= 0 || cmdrDeath) { 
                let reason = cmdrDeath ? "21 Commander Damage (Single Source)" : "0 Life"; 
                let isEliminated = await mfModal.show("Confirm Elimination", `${esc(p.player)} reached ${reason}.`, "skull", "confirm"); 
                if (isEliminated) { 
                    p.isDead = true; 
                    p.deathQuote = loseQuotes[Math.floor(Math.random() * loseQuotes.length)]; 
                    if (currentCmdrTarget === i) closeCmdrModal(); 
                } else { 
                    if (cmdrDeath) { 
                        for (let k in p.cmdrDmg) if (p.cmdrDmg[k] >= 21) p.cmdrDmg[k] = 20; 
                    } else if (p.life <= 0) { p.life = 1; } 
                } 
                saveData(); 
                renderBattlefield(); 
            } 
        } 
    } 
    let alive = state.currentMatch.filter(p => !p.isDead); 
    if (alive.length === 1 && state.currentMatch.length > 1) { 
        setTimeout(() => { showUltimateWinner(state.currentMatch.findIndex(p => !p.isDead)); }, 1200); 
    } 
    isCheckingDeath = false; 
}

let menuOpen = false;
function toggleCenterMenu() { menuOpen = !menuOpen; const opts = document.getElementById('center-menu-options'); const btn = document.getElementById('center-menu-btn'); if (menuOpen) { opts.classList.remove('opacity-0', 'pointer-events-none'); opts.classList.add('pointer-events-auto'); btn.innerHTML = '<span class="material-symbols-outlined text-3xl">close</span>'; } else { opts.classList.add('opacity-0', 'pointer-events-none'); opts.classList.remove('pointer-events-auto'); btn.innerHTML = '<span class="material-symbols-outlined text-3xl text-white">apps</span>'; } }
async function resetLife() { toggleCenterMenu(); const confirmReset = await mfModal.show("Reset Match", "All players will go back to 40 life.", "refresh", "confirm"); if (confirmReset) { state.currentMatch.forEach(m => { m.life = 40; m.cmdrDmg = {}; m.isDead = false; }); saveData(); renderBattlefield(); } }
function toggleFullScreen() { toggleCenterMenu(); if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => { console.warn("Fullscreen error"); }); } else { if (document.exitFullscreen) { document.exitFullscreen(); } } }
function rollD20All() { toggleCenterMenu(); document.getElementById('dice-modal').classList.remove('hidden'); let html = ''; state.currentMatch.forEach((p, i) => { if (!p.isDead) html += `<div id="dice-row-${i}" class="flex justify-between items-center bg-app-surface-light p-4 rounded-2xl border border-white/5 shadow-md w-full"><span class="font-bold text-xl text-slate-300">${esc(p.player)}</span><span id="dice-p-${i}" class="text-4xl font-black text-white animate-pulse">0</span></div>`; }); document.getElementById('dice-container').innerHTML = html; let count = 0; let final = {}; let int = setInterval(() => { state.currentMatch.forEach((p, i) => { if (!p.isDead) { let el = document.getElementById(`dice-p-${i}`); if (el) el.innerText = Math.floor(Math.random() * 20) + 1; } }); count++; if (count > 20) { clearInterval(int); let max = -1; state.currentMatch.forEach((p, i) => { if (!p.isDead) { let r = Math.floor(Math.random() * 20) + 1; final[i] = r; if (r > max) max = r; let el = document.getElementById(`dice-p-${i}`); if (el) { el.innerText = r; el.classList.remove('animate-pulse'); } } }); state.currentMatch.forEach((p, i) => { if (!p.isDead && final[i] === max) { document.getElementById(`dice-p-${i}`).classList.add('text-green-400', 'scale-125', 'transition-transform'); document.getElementById(`dice-row-${i}`).classList.add('border-green-400', 'bg-green-900/20'); } }); setTimeout(() => { document.getElementById('dice-modal').classList.add('hidden'); }, 3500); } }, 50); }

function endMatchManual() { toggleCenterMenu(); goToScreen6Manual(); }
function goToScreen6Manual() { state.matchFinished = false; document.getElementById('screen-6').innerHTML = `<div class="text-center mb-8"><h2 class="text-3xl font-black text-white uppercase tracking-tight">End Match</h2><p class="text-sm text-slate-400 mt-2">Select the winner manually.</p></div><div id="declare-winner-container" class="grid grid-cols-2 gap-4 w-full"></div>`; document.getElementById('declare-winner-container').innerHTML = state.currentMatch.map((m, i) => `<div onclick="showUltimateWinner(${i})" class="bg-app-surface p-5 rounded-3xl border-2 border-white/5 relative cursor-pointer hover:border-white/30 shadow-md ${m.isDead ? 'opacity-50 grayscale' : ''}"><div class="flex flex-col items-center text-center relative z-10"><div class="size-14 rounded-full bg-app-surface-light border-2 border-app-primary flex items-center justify-center font-black text-xl text-white mb-2 uppercase">${esc(m.player[0])}</div><h3 class="font-black text-lg truncate w-full">${esc(m.player)}</h3><p class="text-slate-500 text-[10px] uppercase font-bold">${m.isDead ? 'Eliminated' : 'Declare Winner'}</p></div></div>`).join(''); switchScreen(6); }

function showUltimateWinner(idx) { 
    playTransition(GIFS.WINNER, 3200, () => { 
        state.matchFinished = true; const w = state.currentMatch[idx]; const quote = winQuotes[Math.floor(Math.random() * winQuotes.length)];
        triggerConfetti(w.deck ? w.deck.colors : []);
        state.history.unshift({ date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), pairings: state.currentMatch, winner: w.player, mode: 'Commander' }); 
        saveData(); renderHistory();
        document.getElementById('screen-6').innerHTML = `<div class="flex flex-col items-center justify-center pt-8 text-center px-4 w-full"><div class="animate-bounce mb-4"><span class="material-symbols-outlined text-[100px] text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)]">emoji_events</span></div><h2 class="text-5xl font-black text-white uppercase tracking-widest mb-2">${esc(w.player)}</h2><h3 class="text-xl font-bold text-slate-300 mb-8 bg-white/5 px-4 py-1 rounded-full border border-white/10 uppercase">${w.deck ? esc(w.deck.name) : ''}</h3><div class="bg-app-surface p-6 rounded-2xl border border-white/5 shadow-lg mb-10 w-full max-w-sm"><p class="text-slate-200 italic text-lg leading-relaxed">"${quote}"</p></div><button onclick="window.startOver()" class="w-full max-w-md bg-app-surface-light border border-white/10 text-white font-bold py-5 rounded-2xl text-lg shadow-lg active:scale-95 flex justify-center items-center gap-2"><span class="material-symbols-outlined">exit_to_app</span> Return Home</button></div>`; 
        switchScreen(6); 
    }); 
}

function startOver() { 
    state.tempPlayerNames = []; state.matchFinished = false; state.currentMatch = []; state.js.rounds = []; state.js.currentRound = 0; 
    state.step = state.gameMode === 'commander' ? 1 : 7;
    saveData(); 
    switchScreen(state.step); 
    if(state.gameMode === 'commander') renderHistory();
}

function renderHistory() { 
    const c = document.getElementById('history-container'); 
    if(!c) return;
    if (state.history.length > 0) document.getElementById('history-section').classList.remove('hidden'); 
    else document.getElementById('history-section').classList.add('hidden');
    c.innerHTML = state.history.slice(0, 5).map((m, i) => `<div class="bg-app-surface p-3 rounded-xl border border-white/5 text-[11px] shadow-sm relative group"><button onclick="deleteHistoryEntry(${i})" class="absolute top-2 right-2 text-slate-600 hover:text-red-500 opacity-100 transition-all"><span class="material-symbols-outlined text-[16px]">delete</span></button><div class="flex justify-between mb-2 text-slate-500 uppercase font-bold tracking-tighter pr-8"><span>${m.date}</span><span class="text-yellow-400">🏆 ${esc(m.winner)} <span class="text-[8px] text-slate-600 ml-1">(${m.mode || 'Commander'})</span></span></div>${(m.mode === 'Jumpstart' && m.podium) ? `<div class="mt-2 text-[9px] text-slate-400 border-t border-white/5 pt-1">Podium: 🥇${esc(m.podium[0])} 🥈${esc(m.podium[1] || '--')} 🥉${esc(m.podium[2] || '--')}</div>` : (m.pairings ? m.pairings.map(p => `<div class="flex justify-between py-0.5"><span class="text-slate-300">${esc(p.player)}</span><span class="text-slate-400 font-medium">${p.deck ? esc(p.deck.name) : ''}</span></div>`).join('') : '')}</div>`).join(''); 
}
async function deleteHistoryEntry(idx) { const isConfirmed = await mfModal.show("Delete Match?", "This action will remove the match from the history.", "delete", "confirm"); if (isConfirmed) { state.history.splice(idx, 1); saveData(); renderHistory(); } }

window.updateCount = updateCount;
window.applyDandLPreset = applyDandLPreset;
window.applyDJLPreset = applyDJLPreset;
window.openLibraryManager = openLibraryManager;
window.closeLibraryManager = closeLibraryManager;
window.deleteSavedDeck = deleteSavedDeck;
window.addExtraDeck = addExtraDeck;
window.loadDeck = loadDeck;
window.toggleColor = toggleColor;
window.removeDeck = removeDeck;
window.addExtraPlayer = addExtraPlayer;
window.removePlayer = removePlayer;
window.quickAdd = quickAdd;
window.deleteSavedPlayer = deleteSavedPlayer;
window.setPlayerLock = setPlayerLock;
window.toggleBan = toggleBan;
window.reassignDecks = reassignDecks;
window.toggleCenterMenu = toggleCenterMenu;
window.rollD20All = rollD20All;
window.resetLife = resetLife;
window.endMatchManual = endMatchManual;
window.toggleFullScreen = toggleFullScreen;
window.toggleLayout = toggleLayout;
window.openCmdrModal = openCmdrModal;
window.closeCmdrModal = closeCmdrModal;
window.changeCmdrDmg = changeCmdrDmg;
window.handleTapStart = handleTapStart;
window.handleTapEnd = handleTapEnd;
window.showUltimateWinner = showUltimateWinner;
window.deleteHistoryEntry = deleteHistoryEntry;
window.startOver = startOver;

export function handleCommanderNext() {
    if (state.step === 1) goToDecks(); 
    else if (state.step === 2) { 
        if (!state.deckData.some(d => d.name.trim() !== "")) return; 
        let allE = [...baseDecks, ...state.savedDecks]; let nw = false; 
        state.deckData.forEach(d => { if (d.name.trim() !== "" && !allE.some(ex => ex.name.toLowerCase() === d.name.trim().toLowerCase())) { state.savedDecks.push({ name: esc(d.name.trim()), colors: [...d.colors] }); nw = true; } }); 
        if (nw) saveData(); goToPlayers(); 
    } 
    else if (state.step === 3) { 
        if (state.deckData.filter(d => d.name.trim() !== "").length < state.players) return mfModal.show("Warning", `Need more physical decks!`, "warning"); 
        savePlayerInputs(); let nwP = false; 
        for (let i = 0; i < state.players; i++) { 
            let v = state.tempPlayerNames[i] || 'Player ' + (i + 1); state.tempPlayerNames[i] = v; 
            if (v && v !== 'Player ' + (i + 1) && !state.savedPlayers.some(p => p.toLowerCase() === v.toLowerCase())) { state.savedPlayers.push(v); nwP = true; } 
        } 
        if (nwP) saveData(); executeAssignment(); 
    } 
    else if (state.step === 4) initBattlefield();
}

export function goBackCommander() {
    if (state.step === 2) switchScreen(1); 
    if (state.step === 3) switchScreen(2); 
    if (state.step === 4) switchScreen(3); 
    if (state.step === 6 && !state.matchFinished) switchScreen(5);
}