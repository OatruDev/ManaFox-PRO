// /js/modules/jumpstart.js
import { state, saveData } from '../state.js';
import { esc } from '../security.js';
import { mfModal, playTransition, switchScreen } from '../ui.js';
import { GIFS, winQuotes, triggerConfetti, generatePlayerID } from '../utils.js';

export function initJumpstart() {
    if(state.step === 7) { /* Screen is ready in HTML */ }
    else if(state.step === 8) renderJSSavedPlayers();
    else if(state.step === 9) renderJSSwiss();
}

export function handleJumpstartNext() {
    if(state.step === 7) goToJSPlayers();
    else if(state.step === 8) {
        state.tempPlayerNames = [];
        for(let i=0; i<state.js.count; i++) {
            let v = document.getElementById(`p-in-js-${i}`).value.trim();
            if(!v) return mfModal.show("Error", "Fill all names.", "error");
            state.tempPlayerNames.push(esc(v));
        }
        let nwP=false;
        state.tempPlayerNames.forEach(pN => {
            let exists = state.savedPlayers.find(p => p && p.name && p.name.toLowerCase() === pN.toLowerCase());
            if(!exists) {
                state.savedPlayers.push({ id: generatePlayerID(), name: pN, addedAt: Date.now() }); 
                nwP=true;
            }
        });
        if(nwP) saveData();
        generateJSSwiss();
        switchScreen(9);
    }
}

export function goBackJumpstart() {
    if(state.step === 8) switchScreen(7);
    if(state.step === 9) switchScreen(8);
}

function setJSPlayers(n) {
    state.js.count = n;
    [4, 8, 16].forEach(val => {
        let el = document.getElementById(`js-btn-${val}`);
        if(el) { el.classList.replace('border-app-js/50', 'border-white/5'); el.classList.remove('shadow-[0_0_20px_rgba(245,158,11,0.2)]'); }
    });
    let activeBtn = document.getElementById(`js-btn-${n}`);
    if(activeBtn) { activeBtn.classList.replace('border-white/5', 'border-app-js/50'); activeBtn.classList.add('shadow-[0_0_20px_rgba(245,158,11,0.2)]'); }
    saveData();
}

function goToJSPlayers() {
    const c = document.getElementById('js-player-inputs-container'); c.innerHTML = '';
    if(state.savedPlayers.length > 0) { document.getElementById('js-saved-players-section').classList.remove('hidden'); renderJSSavedPlayers(); }
    for(let i=0; i<state.js.count; i++) {
        c.innerHTML += `<div class="bg-app-surface p-3 rounded-xl border border-white/5 flex items-center gap-3"><div class="bg-app-js/20 size-8 rounded-lg text-app-js font-black flex items-center justify-center">${i+1}</div><input type="text" id="p-in-js-${i}" maxlength="20" oninput="state.tempPlayerNames[${i}]=esc(this.value); saveData();" class="setup-input w-full bg-transparent border-none text-white px-0" placeholder="Player Name" value="${esc(state.tempPlayerNames[i]||'')}"></div>`;
    }
    switchScreen(8);
}

function renderJSSavedPlayers() {
    const c = document.getElementById('js-saved-players-container');
    if(!c) return;
    c.innerHTML = state.savedPlayers.map((p,i)=> {
        let pName = typeof p === 'string' ? p : (p.name || 'Unknown');
        let initial = pName.length > 0 ? pName[0].toUpperCase() : '?';
        return `<div class="relative flex flex-col items-center shrink-0 mt-2 group"><button onclick="window.deleteSavedPlayer(${i})" class="absolute -top-1 -right-1 bg-app-surface text-slate-500 text-[9px] size-[18px] flex items-center justify-center rounded-full border border-white/10 hover:bg-red-600 hover:text-white transition-all shadow-sm z-10 opacity-70 hover:opacity-100">✕</button><div onclick="window.quickAddJS('${esc(pName)}')" class="setup-input size-12 rounded-full border border-app-js/40 bg-app-surface-light flex items-center justify-center font-bold text-white shadow-sm cursor-pointer hover:bg-app-js/20">${esc(initial)}</div><span class="text-[9px] truncate w-14 text-center mt-1 text-slate-400 uppercase font-bold">${esc(pName)}</span></div>`;
    }).join('');
}

function quickAddJS(n) {
    for(let i=0; i<state.js.count; i++){
        const inp = document.getElementById('p-in-js-'+i);
        if(inp && !inp.value){ inp.value = n; state.tempPlayerNames[i] = n; break; }
    }
    saveData();
}

function generateJSSwiss() {
    let names = [...state.tempPlayerNames].slice(0, state.js.count);
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    state.js.players = names.map(n => ({ name: n, points: 0, played: [], defeated: [] }));
    state.js.totalRounds = Math.log2(state.js.count); state.js.rounds = []; state.js.currentRound = 0; state.js.currentView = 'round';
    let r1 = []; for(let i=0; i<state.js.count; i+=2) { r1.push({ p1: state.js.players[i].name, p2: state.js.players[i+1].name, winner: null, ready1: false, ready2: false }); }
    state.js.rounds.push(r1); saveData(); renderJSSwiss();
}

function generateNextSwissRound() {
    let sorted = [...state.js.players].sort((a,b) => b.points - a.points);
    let nextR = []; let paired = new Set();
    for(let i=0; i<sorted.length; i++) {
        if(paired.has(sorted[i].name)) continue;
        let p1 = sorted[i]; let p2 = null;
        for(let j=i+1; j<sorted.length; j++) { if(!paired.has(sorted[j].name) && !p1.played.includes(sorted[j].name)) { p2 = sorted[j]; break; } }
        if(!p2) { for(let j=i+1; j<sorted.length; j++) { if(!paired.has(sorted[j].name)) { p2 = sorted[j]; break; } } }
        if(p2) { paired.add(p1.name); paired.add(p2.name); nextR.push({ p1: p1.name, p2: p2.name, winner: null, ready1: false, ready2: false }); }
    }
    state.js.rounds.push(nextR); state.js.currentRound++; state.js.currentView = 'round'; saveData(); renderJSSwiss();
}

function setJSView(view) { state.js.currentView = view; renderJSSwiss(); saveData(); }

function assignTieBreakers(sortedPlayers) {
    for(let i = 0; i < sortedPlayers.length; i++) {
        sortedPlayers[i].tieReason = null;
        let tiedWith = sortedPlayers.filter((p, idx) => idx !== i && p.points === sortedPlayers[i].points);
        if (tiedWith.length > 0) {
            let defeatedNames = tiedWith.filter(t => sortedPlayers[i].defeated && sortedPlayers[i].defeated.includes(t.name)).map(t => t.name);
            if (defeatedNames.length > 0) {
                sortedPlayers[i].tieReason = `Head-to-Head vs ${defeatedNames.join(', ')}`;
            }
        }
    }
}

function renderJSSwiss() {
    const tabs = document.getElementById('js-tabs'); const mCont = document.getElementById('js-matches');
    if(!tabs || !mCont) return;
    tabs.innerHTML = `<button onclick="window.setJSView('round')" class="flex-1 py-3 rounded-xl font-bold transition-all ${state.js.currentView==='round' ? 'bg-app-js text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-app-surface border border-white/10 text-slate-400'}">Round ${state.js.currentRound + 1}</button><button onclick="window.setJSView('standings')" class="flex-1 py-3 rounded-xl font-bold transition-all ${state.js.currentView==='standings' ? 'bg-app-js text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-app-surface border border-white/10 text-slate-400'}">Standings</button>`;
    if (state.js.currentView === 'standings') {
        let sorted = [...state.js.players].sort((a,b) => {
            if (b.points !== a.points) return b.points - a.points;
            let aDefeatedB = a.defeated && a.defeated.includes(b.name);
            let bDefeatedA = b.defeated && b.defeated.includes(a.name);
            if (aDefeatedB) return -1;
            if (bDefeatedA) return 1;
            return 0;
        });
        assignTieBreakers(sorted);
        mCont.innerHTML = sorted.map((p, i) => {
            let tieBadge = p.tieReason ? `<p class="text-[9px] text-app-js uppercase tracking-widest mt-1 font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">handshake</span> Tie-breaker: ${p.tieReason}</p>` : '';
            return `<div class="flex justify-between items-center bg-app-surface p-4 rounded-xl border border-white/5 mb-2"><div class="flex flex-col"><div class="flex items-center gap-3"><span class="font-black text-xl ${i===0 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-slate-500'}">#${i+1}</span><span class="font-bold text-white text-lg">${esc(p.name)}</span></div>${tieBadge}</div><span class="font-black text-app-js text-xl">${p.points} PTS</span></div>`;
        }).join(''); 
        return;
    }
    let currentMatches = state.js.rounds[state.js.currentRound]; let allFinished = true;
    mCont.innerHTML = currentMatches.map((match, mIdx) => {
        let isFinished = match.winner !== null; if (!isFinished) allFinished = false;
        let p1Class = match.winner === match.p1 ? "text-app-js font-black text-lg" : (isFinished ? "text-slate-600 line-through" : "text-white");
        let p2Class = match.winner === match.p2 ? "text-app-js font-black text-lg" : (isFinished ? "text-slate-600 line-through" : "text-white");
        let statusBadge = "";
        if(isFinished) statusBadge = `<div class="absolute top-0 right-0 bg-app-js text-black text-[8px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl uppercase">Done</div>`;
        else if(match.ready1 && match.ready2) statusBadge = `<div class="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl uppercase animate-pulse">Fight!</div>`;
        else statusBadge = `<div class="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-lg rounded-tr-xl uppercase">Draft Phase</div>`;
        return `<div onclick="${isFinished ? '' : `window.openJSMatchModal(${state.js.currentRound}, ${mIdx})`}" class="js-match-card relative bg-app-surface border border-white/5 rounded-2xl p-4 flex flex-col justify-center shadow-lg ${!isFinished ? 'cursor-pointer hover:border-app-js/50 hover:bg-app-surface-light transition-colors' : 'opacity-70'} mb-4">${statusBadge}<div class="flex justify-between items-center w-full"><span class="w-2/5 text-right truncate ${p1Class}">${esc(match.p1)}</span><div class="w-1/5 flex justify-center"><span class="text-[10px] font-black text-slate-500 bg-app-surface-light px-2 py-1 rounded-full border border-white/5">VS</span></div><span class="w-2/5 text-left truncate ${p2Class}">${esc(match.p2)}</span></div></div>`;
    }).join('');
    if (allFinished) {
        let isLastRound = state.js.currentRound === state.js.totalRounds - 1;
        let btnText = isLastRound ? "Crown Champion" : "Generate Next Round";
        let btnAction = isLastRound ? "window.finishSwiss()" : "window.generateNextSwissRound()";
        let btnColor = isLastRound ? "bg-yellow-500 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]" : "bg-app-js text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]";
        let icon = isLastRound ? "emoji_events" : "arrow_forward";
        mCont.innerHTML += `<button onclick="${btnAction}" class="w-full mt-4 py-4 rounded-xl font-black text-lg transition-transform active:scale-95 flex justify-center items-center gap-2 ${btnColor}">${btnText} <span class="material-symbols-outlined">${icon}</span></button>`;
    }
}

function openJSMatchModal(r, mIdx) { const match = state.js.rounds[r][mIdx]; const content = document.getElementById('js-modal-content'); if (!match.ready1 || !match.ready2) { content.innerHTML = `<h3 class="font-black text-2xl text-white tracking-widest uppercase mb-1 drop-shadow-md">Draft Phase</h3><p class="text-sm text-slate-300 mb-6">Grab 2 new packs and shuffle!<br>Both players must confirm.</p><div class="flex flex-col gap-4"><button onclick="window.toggleJSReady(${r}, ${mIdx}, 1)" class="w-full py-5 rounded-xl font-black text-xl transition-all shadow-lg border-2 ${match.ready1 ? 'bg-green-500 border-green-400 text-white' : 'bg-app-surface-light border-white/10 text-slate-400 hover:border-white/30'} flex justify-between items-center px-6"><span class="truncate w-3/4 text-left">${esc(match.p1)}</span><span class="material-symbols-outlined">${match.ready1 ? 'check_circle' : 'hourglass_empty'}</span></button><button onclick="window.toggleJSReady(${r}, ${mIdx}, 2)" class="w-full py-5 rounded-xl font-black text-xl transition-all shadow-lg border-2 ${match.ready2 ? 'bg-green-500 border-green-400 text-white' : 'bg-app-surface-light border-white/10 text-slate-400 hover:border-white/30'} flex justify-between items-center px-6"><span class="truncate w-3/4 text-left">${esc(match.p2)}</span><span class="material-symbols-outlined">${match.ready2 ? 'check_circle' : 'hourglass_empty'}</span></button></div>`; } else { content.innerHTML = `<h3 class="font-black text-2xl text-red-500 tracking-widest uppercase mb-1 drop-shadow-md animate-pulse">Declare Winner</h3><p class="text-sm text-slate-300 mb-6">Who survived the combat?</p><div class="flex gap-3"><button onclick="window.setJSWinner(${r}, ${mIdx}, '${esc(match.p1)}')" class="flex-1 py-6 bg-app-surface-light border border-app-js/30 rounded-xl hover:bg-app-js/20 hover:border-app-js transition-all flex flex-col items-center gap-2 active:scale-95 shadow-lg"><span class="material-symbols-outlined text-3xl text-app-js">military_tech</span><span class="font-black text-white truncate w-full px-2">${esc(match.p1)}</span></button><button onclick="window.setJSWinner(${r}, ${mIdx}, '${esc(match.p2)}')" class="flex-1 py-6 bg-app-surface-light border border-app-js/30 rounded-xl hover:bg-app-js/20 hover:border-app-js transition-all flex flex-col items-center gap-2 active:scale-95 shadow-lg"><span class="material-symbols-outlined text-3xl text-app-js">military_tech</span><span class="font-black text-white truncate w-full px-2">${esc(match.p2)}</span></button></div>`; } document.getElementById('js-match-modal').classList.remove('hidden'); }
function toggleJSReady(r, mI, pN) { if(pN===1) state.js.rounds[r][mI].ready1 = !state.js.rounds[r][mI].ready1; else state.js.rounds[r][mI].ready2 = !state.js.rounds[r][mI].ready2; saveData(); openJSMatchModal(r, mI); renderJSSwiss(); }
function closeJSModal() { document.getElementById('js-match-modal').classList.add('hidden'); }

function setJSWinner(r, m, winnerName) { 
    const match = state.js.rounds[r][m]; match.winner = winnerName; 
    let p1 = state.js.players.find(p => p.name === match.p1); let p2 = state.js.players.find(p => p.name === match.p2); 
    p1.played.push(p2.name); p2.played.push(p1.name); 
    let w = state.js.players.find(p => p.name === winnerName); 
    let loserName = match.p1 === winnerName ? match.p2 : match.p1;
    if(!w.defeated) w.defeated = [];
    w.defeated.push(loserName); w.points += 3; 
    saveData(); closeJSModal(); renderJSSwiss(); 
}

function revertJSSwissWinner() { 
    let matches = state.js.rounds[state.js.currentRound]; 
    let lastMatch = [...matches].reverse().find(m => m.winner !== null); 
    if (!lastMatch) return mfModal.show("Hold Up", "No matches to undo.", "warning"); 
    let w = state.js.players.find(p => p.name === lastMatch.winner); w.points -= 3; 
    let loserName = lastMatch.p1 === lastMatch.winner ? lastMatch.p2 : lastMatch.p1;
    if(w.defeated) { let idx = w.defeated.indexOf(loserName); if(idx > -1) w.defeated.splice(idx, 1); }
    let p1 = state.js.players.find(p => p.name === lastMatch.p1); let p2 = state.js.players.find(p => p.name === lastMatch.p2); 
    p1.played.pop(); p2.played.pop(); lastMatch.winner = null; 
    saveData(); renderJSSwiss(); 
}

function finishSwiss() { 
    let sorted = [...state.js.players].sort((a,b) => {
        if (b.points !== a.points) return b.points - a.points;
        let aDefeatedB = a.defeated && a.defeated.includes(b.name);
        let bDefeatedA = b.defeated && b.defeated.includes(a.name);
        if (aDefeatedB) return -1; if (bDefeatedA) return 1; return 0;
    });
    showJSUltimateWinner(sorted); 
}

function showJSUltimateWinner(sortedPlayers) {
    playTransition(GIFS.WINNER, 3200, () => {
        state.matchFinished=true; let w = sortedPlayers[0].name; triggerConfetti(null);
        let podiumLog = sortedPlayers.slice(0,3).map(p=>p.name);
        
        if (!state.history) state.history = [];
        state.history.unshift({ date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), pairings:[], winner:w, mode:'Jumpstart', podium: podiumLog });
        try { localStorage.setItem('manafox-offline-state', JSON.stringify(state)); } catch(e) {}
        
        assignTieBreakers(sortedPlayers);
        
        let rankingsHTML = sortedPlayers.map((p,i) => {
            let medal = i===0 ? '🏆' : (i===1 ? '🥈' : (i===2 ? '🥉' : ''));
            let color = i===0 ? 'text-yellow-400' : (i===1 ? 'text-slate-300' : (i===2 ? 'text-amber-600' : 'text-slate-500'));
            let tieBadge = p.tieReason ? `<span class="text-[8px] text-app-js uppercase font-bold tracking-widest block mt-0.5"><span class="material-symbols-outlined text-[8px] align-middle">handshake</span> ${p.tieReason}</span>` : '';
            return `<div class="flex justify-between items-center bg-app-surface-light border border-white/5 p-3 rounded-xl mb-2"><div class="flex flex-col"><span class="font-bold ${color}">${medal} #${i+1} ${esc(p.name)}</span>${tieBadge}</div><span class="text-xs font-black text-app-js">${p.points} PTS</span></div>`;
        }).join('');
        document.getElementById('screen-6').innerHTML = `<div class="flex flex-col items-center justify-center pt-8 text-center px-4 w-full"><div class="animate-bounce mb-4"><span class="material-symbols-outlined text-[70px] text-app-js drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]">emoji_events</span></div><h2 class="text-4xl font-black text-white uppercase tracking-widest mb-1">${esc(w)}</h2><h3 class="text-[10px] font-bold text-slate-400 mb-6 bg-app-js/20 px-3 py-1 rounded-full border border-app-js/50 uppercase text-app-js tracking-widest">Jumpstart Champion</h3><div class="w-full max-w-sm text-left mb-6"><h4 class="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">Final Standings</h4>${rankingsHTML}</div><button onclick="window.startOver()" class="w-full max-w-md bg-app-surface-light border border-white/10 text-white font-bold py-5 rounded-2xl text-lg shadow-lg active:scale-95 flex justify-center items-center gap-2"><span class="material-symbols-outlined">exit_to_app</span> Return Home</button></div>`;
        switchScreen(6);
    });
}

window.setJSPlayers = setJSPlayers;
window.setJSView = setJSView;
window.openJSMatchModal = openJSMatchModal;
window.toggleJSReady = toggleJSReady;
window.closeJSModal = closeJSModal;
window.setJSWinner = setJSWinner;
window.revertJSSwissWinner = revertJSSwissWinner;
window.finishSwiss = finishSwiss;
window.quickAddJS = quickAddJS;
window.generateNextSwissRound = generateNextSwissRound;