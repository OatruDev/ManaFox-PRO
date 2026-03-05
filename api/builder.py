# /api/builder.py
import json
import logging
import re
import requests
from scipy.stats import hypergeom
from urllib.parse import quote
from http.server import BaseHTTPRequestHandler

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

COMMANDER_ARCHETYPES = {
    "aggro": ["haste", "attack", "trample", "damage", "bloodthirst"],
    "control": ["counter target", "return target", "destroy target", "exile"],
    "combo": ["infinite", "storm", "win the game"],
    "stax": ["can't attack", "costs more", "players can't"],
    "tempo": ["evasion", "flash", "return target"],
    "big_mana": ["add", "mana pool", "x"],
    "value": ["draw a card", "scry", "surveil", "investigate"],
    "+1_counters": ["+1/+1 counter", "proliferate"],
    "-1_counters": ["-1/-1 counter", "wither", "infect"],
    "artifacts": ["artifact", "equipment", "vehicle", "construct"],
    "enchantress": ["enchantment", "aura", "constellation"],
    "blink": ["exile target", "return it to the battlefield"],
    "reanimator": ["return target creature card from your graveyard"],
    "mill": ["put the top", "into their graveyard"],
    "tokens": ["create", "token", "populate"],
    "aristocrats": ["sacrifice a creature", "dies"],
    "spell_slinger": ["instant or sorcery", "magecraft", "cast a spell"],
    "voltron": ["equipped creature", "enchanted creature", "commander damage"]
}

RAMP_PACKAGES_DB = {
    "Basic Land Fetch": {"cards": ["Cultivate", "Kodama's Reach", "Rampant Growth", "Farseek"], "size": 4, "colors": ["G"], "weight": 1.0},
    # 🚨 Eliminados Jeweled Lotus y Mana Crypt por baneo
    "Fast Artifacts": {"cards": ["Sol Ring", "Mana Vault", "Chrome Mox", "Lotus Petal", "Grim Monolith"], "size": 5, "colors": ["C"], "weight": 2.0},
    "2-Drop Rocks": {"cards": ["Arcane Signet", "Fellwar Stone", "Thought Vessel", "Mind Stone"], "size": 4, "colors": ["C"], "weight": 1.1},
    "Treasure Engine": {"cards": ["Dockside Extortionist", "Smothering Tithe", "Pitiless Plunderer"], "size": 3, "colors": ["R", "B", "W"], "weight": 1.4},
    "1-Drop Dorks": {"cards": ["Birds of Paradise", "Llanowar Elves", "Elvish Mystic", "Arbor Elf"], "size": 4, "colors": ["G"], "weight": 1.5},
    "Rituals": {"cards": ["Dark Ritual", "Cabal Ritual", "Jeska's Will", "Seething Song"], "size": 4, "colors": ["B", "R"], "weight": 1.3}
}

def get_scryfall_top_cards(query):
    url = f"https://api.scryfall.com/cards/search?q={quote(query)}&order=edhrec"
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            return resp.json().get('data', [])
    except Exception as e:
        logger.error(f"Scryfall query failed: {e}")
    return []

def fetch_commander_data(scryfall_url: str):
    match = re.search(r'scryfall\.com/card/([^/]+)/([^/]+)', scryfall_url)
    if not match: 
        raise ValueError("Invalid Scryfall URL. Format expected: https://scryfall.com/card/set/number/...")
    
    set_code, collector_num = match.group(1), match.group(2)
    response = requests.get(f"https://api.scryfall.com/cards/{set_code}/{collector_num}")
    
    if response.status_code == 404:
        raise ValueError("Card not found in Scryfall database.")
    response.raise_for_status()
    data = response.json()
    
    if data.get("legalities", {}).get("commander", "illegal") != "legal": 
        raise ValueError(f"{data['name']} is not legal in Commander.")
        
    return {
        "name": data["name"],
        "mana_cost": data.get("mana_cost", ""),
        "cmc": data.get("cmc", 0.0),
        "colors": data.get("color_identity", []),
        "oracle_text": data.get("oracle_text", "").lower()
    }

def classify_archetype(oracle_text: str):
    text = oracle_text.lower()
    for arch, keywords in COMMANDER_ARCHETYPES.items():
        if any(kw in text for kw in keywords): return arch
    return "midrange"

def select_ramp_packages(colors, target_slots):
    available_pkgs = [{"name": n, **d} for n, d in RAMP_PACKAGES_DB.items() if any(c in colors for c in d["colors"]) or "C" in d["colors"]]
    available_pkgs.sort(key=lambda x: x["weight"], reverse=True)
    sel_cards = []
    
    for pkg in available_pkgs:
        if len(sel_cards) >= target_slots: break
        cards_to_add = pkg["cards"][:min(pkg["size"], target_slots - len(sel_cards))]
        sel_cards.extend(cards_to_add)
            
    return {"total_slots": len(sel_cards), "recommended_cards": sel_cards}

def karsten_adjusted_lands(ramp_cards, draw_count):
    rocks = sum(1 for c in ramp_cards if c in ["Sol Ring", "Mana Crypt", "Mana Vault", "Arcane Signet", "Fellwar Stone", "Mind Stone", "Thought Vessel"])
    dorks = sum(1 for c in ramp_cards if "Elves" in c or "Birds" in c or "Elf" in c)
    other = len(ramp_cards) - rocks - dorks
    cantrips = round(draw_count * 0.5)
    lands = 42.0 - (rocks / 3.0) - (cantrips / 3.5) - (dorks / 3.5) - (other / 3.0)
    return max(30, min(42, round(lands)))

def hypergeometric_sources(N, K, n, k): return 1 - hypergeom.cdf(k-1, N, K, n)

def required_colored_sources(symbols_needed, turn_target):
    if symbols_needed == 0: return 0
    n = 7 + (turn_target - 1) * 1.5
    for K in range(1, 60):
        if hypergeometric_sources(99, K, int(n), symbols_needed) >= 0.90: return K
    return 30

def build_full_deck(commander_url):
    cmd = fetch_commander_data(commander_url)
    archetype = classify_archetype(cmd["oracle_text"])
    
    ramp_slots = 8 if cmd["cmc"] <= 3 else (11 if cmd["cmc"] <= 5 else 14)
    # 🚨 Modificación clave: Forzar una base sólida de Criaturas y Planeswalkers
    skeleton = {"draw": 10, "removal": 10, "boardwipe": 3, "creatures": 22, "protection_and_planeswalkers": 5, "synergy": 0}
    if archetype == "spell_slinger": skeleton["creatures"] = 10 # Excepción
    
    ramp_engine = select_ramp_packages(cmd["colors"], ramp_slots)
    total_lands = karsten_adjusted_lands(ramp_engine["recommended_cards"], skeleton["draw"])
    skeleton["synergy"] = 99 - total_lands - ramp_engine["total_slots"] - sum(skeleton.values())
    
    ci_str = "".join(cmd["colors"]) if cmd["colors"] else "C"
    used_cards = set(ramp_engine["recommended_cards"])
    used_cards.add(cmd["name"])
    
    decklist = {k: [] for k in skeleton.keys()}
    decklist["utility_lands"] = []
    decklist["basic_lands"] = []
    
    staples = get_scryfall_top_cards(f"id<={ci_str} legal:commander -t:land -t:basic")
    kw_query = " OR ".join([f'o:"{kw}"' for kw in COMMANDER_ARCHETYPES.get(archetype, ["draw a card"])])
    synergies = get_scryfall_top_cards(f"id<={ci_str} legal:commander -t:land ({kw_query})")
    top_lands = get_scryfall_top_cards(f"id<={ci_str} legal:commander t:land -t:basic")

    # A. Tierras (Utility & Basics)
    multi_lands_target = round(total_lands * (0.65 if len(cmd["colors"]) > 1 else 0.15))
    for card in top_lands:
        if len(decklist["utility_lands"]) >= multi_lands_target: break
        if card['name'] not in used_cards:
            decklist["utility_lands"].append(card['name'])
            used_cards.add(card['name'])

    basic_target = total_lands - len(decklist["utility_lands"])
    colors_to_distribute = cmd["colors"] if cmd["colors"] else ["C"]
    for c in colors_to_distribute:
        count = max(1, basic_target // len(colors_to_distribute))
        decklist["basic_lands"].append({"type": f"Basic {c}", "count": count})

    # B. Llenar Criaturas primero desde la pool de Sinergia
    for card in synergies:
        name, t_line = card['name'], card.get('type_line', '')
        if name in used_cards: continue
        if 'Creature' in t_line and len(decklist["creatures"]) < skeleton["creatures"]:
            decklist["creatures"].append(name); used_cards.add(name)
        elif len(decklist["synergy"]) < skeleton["synergy"]:
            decklist["synergy"].append(name); used_cards.add(name)

    # C. Llenar Staples (Roba, Destruye, Planeswalkers, etc)
    for card in staples:
        txt, t_line = card.get('oracle_text', '').lower(), card.get('type_line', '')
        name = card['name']
        if name in used_cards: continue
        
        # Completar criaturas si la sinergia no llegó a 22
        if 'Creature' in t_line and len(decklist["creatures"]) < skeleton["creatures"]:
            decklist["creatures"].append(name); used_cards.add(name)
        elif len(decklist["draw"]) < skeleton["draw"] and ("draw" in txt or "scry" in txt):
            decklist["draw"].append(name); used_cards.add(name)
        elif len(decklist["removal"]) < skeleton["removal"] and ("destroy target" in txt or "exile target" in txt):
            decklist["removal"].append(name); used_cards.add(name)
        elif len(decklist["boardwipe"]) < skeleton["boardwipe"] and ("destroy all" in txt or "exile all" in txt or "damage to each" in txt):
            decklist["boardwipe"].append(name); used_cards.add(name)
        # Meter Planeswalkers y Protección
        elif len(decklist["protection_and_planeswalkers"]) < skeleton["protection_and_planeswalkers"] and ("Planeswalker" in t_line or "hexproof" in txt or "indestructible" in txt or "counter target" in txt):
            decklist["protection_and_planeswalkers"].append(name); used_cards.add(name)

    # D. Fallback de relleno por si quedan huecos
    for cat in ["draw", "removal", "boardwipe", "protection_and_planeswalkers", "synergy", "creatures"]:
        while len(decklist[cat]) < skeleton[cat]:
            found = False
            for card in staples:
                if card['name'] not in used_cards:
                    decklist[cat].append(card['name'])
                    used_cards.add(card['name'])
                    found = True; break
            if not found: break

    return {
        "metadata": {"commander": cmd["name"], "archetype": archetype, "total_lands": total_lands},
        "ramp": ramp_engine["recommended_cards"],
        "decklist": decklist
    }

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200); self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS'); self.send_header('Access-Control-Allow-Headers', 'Content-Type'); self.end_headers()

    def do_POST(self):
        self.send_response(200); self.send_header('Content-type', 'application/json'); self.send_header('Access-Control-Allow-Origin', '*'); self.end_headers()
        try:
            length = int(self.headers['Content-Length'])
            payload = json.loads(self.rfile.read(length).decode('utf-8'))
            url = payload.get('url', '')
            if not url: raise ValueError("Scryfall URL required.")
            result = build_full_deck(url)
            self.wfile.write(json.dumps({"status": "success", "data": result}).encode('utf-8'))
        except Exception as e:
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))