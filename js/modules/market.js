import { mfModal } from '../ui.js';

function searchCardmarketManual() { let setName = document.getElementById('market-set-name').value.trim(); if(!setName) return mfModal.show("Hold up", "Please enter a set name.", "warning"); let url = `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(setName)}`; window.open(url, '_blank') || window.location.assign(url); }
function searchQuickCardmarket() { let setSel = document.getElementById('market-quick-set').value; let typeSel = document.getElementById('market-quick-type').value; if(!setSel) return mfModal.show("Hold up", "Please select an expansion from the list.", "warning"); let query = `${setSel} ${typeSel}`.trim(); let url = `https://www.cardmarket.com/en/Magic/Products/Search?searchString=${encodeURIComponent(query)}`; window.open(url, '_blank') || window.location.assign(url); }
export function openMarketHub() { document.getElementById('mode-modal').classList.add('hidden'); document.getElementById('market-modal').classList.remove('hidden'); }
function closeMarketHub() { document.getElementById('market-modal').classList.add('hidden'); }

window.searchCardmarketManual = searchCardmarketManual;
window.searchQuickCardmarket = searchQuickCardmarket;
window.openMarketHub = openMarketHub;
window.closeMarketHub = closeMarketHub;