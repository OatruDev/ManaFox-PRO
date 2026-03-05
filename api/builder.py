# /api/builder.py
import json
import logging
import re
import requests
from scipy.stats import hypergeom
from urllib.parse import parse_qs, urlparse
from http.server import BaseHTTPRequestHandler

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

COMMANDER_ARCHETYPES = {
    "aggro": ["haste", "attack", "trample", "damage", "bloodthirst", "battalion"],
    "control": ["counter", "bounce", "removal", "control", "detain"],
    "combo": ["infinite", "combo", "storm", "win the game"],
    "stax": ["stax", "prison", "lock", "tax", "slow", "can't attack", "costs more"],
    "tempo": ["tempo", "evasion", "disrupt", "flash"],
    "big_mana": ["ramp", "mana", "exponential", "x in cost"],
    "value": ["goodstuff", "draw", "scry", "surveil", "investigate"],
    "+1_counters": ["+1/+1", "counter", "grow", "outlast", "modular"],
    "-1_counters": ["-1/-1", "wither", "infect"],
    "aikido": ["copy", "steal", "opponent", "redirect"],
    "artifacts": ["artifact", "construct", "golem", "equipment", "vehicle"],
    "enchantress": ["enchantment", "aura", "saga", "constellation"],
    "blink": ["blink", "flicker", "enter the battlefield", "leaves the battlefield"],
    "chaos": ["chaos", "random", "coin", "roll"],
    "clones": ["clone", "duplicate", "token copy"],
    "discard": ["discard", "wheel", "hand disruption", "madness"],
    "mill": ["mill", "self-mill", "put into graveyard from library"],
    "reanimator": ["reanimate", "graveyard", "return target creature"],
    "land_destruction": ["destroy target land", "land destruction"],
    "infect": ["infect", "poison", "toxic", "proliferate"],
    "superfriends": ["planeswalker", "loyalty"],
    "taxes": ["hatebears", "tax", "pay"],
    "lands_matter": ["landfall", "lands matter", "play an additional land"],
    "tokens": ["token", "go-wide", "saproling", "create", "populate"],
    "goad": ["goad", "attacks each combat"],
    "voltron": ["voltron", "combat damage", "commander damage", "equipped", "enchanted"],
    "pillowfort": ["pillowfort", "defend", "can't attack you"],
    "auras": ["aura", "totem armor"],
    "flying": ["flying", "bird", "angel", "dragon"],
    "snow": ["snow"],
    "x_spells": ["x in cost", "x spell"],
    "landfall": ["landfall"],
    "aristocrats": ["sacrifice", "aristocrats", "dies"],
    "proliferate": ["proliferate"],
    "artifact_tokens": ["treasure", "food", "clue", "blood"],
    "stompy": ["stompy", "creature", "heavy creatures", "power 4 or greater"],
    "spell_slinger": ["spell", "cast spell", "instant", "sorcery", "magecraft"],
    "mutate": ["mutate"],
    "multi_win": ["thassa's oracle", "alternate win", "win the game"]
}

RAMP_PACKAGES_DB = {
    "Basic Land Fetch Ramp": {"cards": ["Cultivate", "Kodama's Reach", "Rampant Growth", "Migration Path"], "size": 4, "colors": ["G"], "tags": ["midrange", "value", "landfall"], "weight": 1.0, "type": "base"},
    "Untapped Dual Fetch Ramp": {"cards": ["Nature's Lore", "Three Visits", "Farseek", "Skyshroud Claim"], "size": 4, "colors": ["G"], "tags": ["optimized", "combo", "aggro"], "weight": 1.2, "type": "base"},
    "Landfall Ramp": {"cards": ["Roiling Regrowth", "Harrow", "Springbloom Druid"], "size": 3, "colors": ["G"], "tags": ["landfall", "lands_matter"], "weight": 1.5, "type": "synergy"},
    "Extra Land Drop": {"cards": ["Exploration", "Azusa, Lost but Seeking", "Burgeoning", "Dryad of the Ilysian Grove"], "size": 4, "colors": ["G"], "tags": ["lands_matter", "big_mana"], "weight": 1.3, "type": "support"},
    "Fast Mana Package": {"cards": ["Sol Ring", "Mana Crypt", "Mana Vault", "Chrome Mox", "Jeweled Lotus"], "size": 5, "colors": ["C"], "tags": ["combo", "stax", "cedh"], "weight": 2.0, "type": "explosive"},
    "2-Mana Rock Package": {"cards": ["Arcane Signet", "Fellwar Stone", "Thought Vessel", "Mind Stone"], "size": 4, "colors": ["C"], "tags": ["control", "midrange", "spellslinger"], "weight": 1.1, "type": "base"},
    "Treasure Engine Package": {"cards": ["Dockside Extortionist", "Smothering Tithe", "Pitiless Plunderer", "Grim Hireling"], "size": 4, "colors": ["R", "B", "W"], "tags": ["artifact_tokens", "aristocrats"], "weight": 1.4, "type": "explosive"},
    "Cost Reducer Artifacts": {"cards": ["Cloud Key", "Helm of Awakening", "Semblance Anvil"], "size": 3, "colors": ["C"], "tags": ["artifacts", "storm", "spellslinger"], "weight": 1.2, "type": "support"},
    "1-CMC Mana Dorks": {"cards": ["Birds of Paradise", "Llanowar Elves", "Elvish Mystic", "Fyndhorn Elves", "Arbor Elf"], "size": 5, "colors": ["G"], "tags": ["aggro", "stompy", "elfball"], "weight": 1.5, "type": "base"},
    "Ritual Creatures": {"cards": ["Treasonous Ogre", "Runaway Steam-Kin", "Neheb, the Eternal"], "size": 3, "colors": ["R"], "tags": ["storm", "combo", "spellslinger"], "weight": 1.2, "type": "explosive"},
    "One-Shot Rituals": {"cards": ["Dark Ritual", "Cabal Ritual", "Culling the Weak", "Jeska's Will", "Seething Song"], "size": 5, "colors": ["B", "R"], "tags": ["storm", "combo", "reanimator"], "weight": 1.3, "type": "explosive"},
    "Land Aura Ramp": {"cards": ["Wild Growth", "Utopia Sprawl", "Fertile Ground", "Overgrowth"], "size": 4, "colors": ["G"], "tags": ["enchantress"], "weight": 1.4, "type": "base"},
    "Mana Doublers": {"cards": ["Zendikar Resurgent", "Mirari's Wake", "Mana Reflection", "Cabal Coffers"], "size": 4, "colors": ["G", "B"], "tags": ["big_mana", "x_spells"], "weight": 1.2, "type": "late_game"},
    "White Catch-up Ramp": {"cards": ["Land Tax", "Archaeomancer's Map", "Knight of the White Orchid", "Smuggler's Share"], "size": 4, "colors": ["W"], "tags": ["control", "midrange", "stax"], "weight": 1.1, "type": "base"}
}

def fetch_commander_data(scryfall_url: str):
    match = re.search(r'/([^/]+)$', scryfall_url)
    if not match: raise ValueError("Invalid Scryfall URL.")
    card_id = match.group(1)
    response = requests.get(f"https://api.scryfall.com/cards/{card_id}")
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

def select_ramp_packages(colors, archetype, target_slots):
    available_pkgs = []
    for name, data in RAMP_PACKAGES_DB.items():
        if any(c in colors for c in data["colors"]) or "C" in data["colors"]:
            wt = data["weight"] + (1.0 if archetype in data["tags"] else 0.0)
            available_pkgs.append({"name": name, "cards": data["cards"], "size": data["size"], "type": data["type"], "weight": wt})
            
    available_pkgs.sort(key=lambda x: x["weight"], reverse=True)
    sel_cards, sel_pkgs = [], []
    
    bases = [p for p in available_pkgs if p["type"] == "base"]
    if bases:
        best_base = bases[0]
        sel_pkgs.append(best_base["name"])
        sel_cards.extend(best_base["cards"][:best_base["size"]])
        available_pkgs.remove(best_base)
        
    for pkg in available_pkgs:
        if len(sel_cards) >= target_slots: break
        if len(sel_cards) + pkg["size"] <= target_slots + 1:
            sel_pkgs.append(pkg["name"])
            sel_cards.extend(pkg["cards"][:pkg["size"]])
            
    return {"total_slots": target_slots, "packages_used": sel_pkgs, "recommended_cards": sel_cards[:target_slots]}

def karsten_adjusted_lands(ramp_packages, draw_count):
    """
    Motor Karsten V2: Base 42 lands. 
    Reducciones por relevancia: Piedras > Cantrips > Dorks
    """
    rocks, dorks, other_ramp = 0, 0, 0
    
    for pkg_name in ramp_packages:
        size = RAMP_PACKAGES_DB[pkg_name]["size"]
        name_l = pkg_name.lower()
        if "rock" in name_l or "fast mana" in name_l or "treasure" in name_l or "artifact" in name_l:
            rocks += size
        elif "dork" in name_l or "creature" in name_l:
            dorks += size
        else:
            other_ramp += size
            
    # Estimamos conservadoramente que ~50% de los slots de Draw son Cantrips (Coste 1-2)
    cantrips = round(draw_count * 0.5)
    
    lands = 42.0
    lands -= (rocks / 3.0)        # 1 por cada 3 piedras
    lands -= (cantrips / 3.5)     # 1 por cada 3-4 cantrips (avg 3.5)
    lands -= (dorks / 3.5)        # 1 por cada 3-4 dorks
    lands -= (other_ramp / 3.0)   # Compensación para Cultivate/Harrow
    
    return max(30, min(42, round(lands)))

def hypergeometric_sources(N, K, n, k): return 1 - hypergeom.cdf(k-1, N, K, n)

def required_colored_sources(symbols_needed, turn_target, desired_prob=0.90):
    if symbols_needed == 0: return 0
    n = 7 + (turn_target - 1) * 1.5
    for K in range(1, 60):
        if hypergeometric_sources(99, K, int(n), symbols_needed) >= desired_prob: return K
    return 30

def parse_color_symbols(mana_cost):
    count = {}
    for match in re.finditer(r'\{([WUBGR])\}', mana_cost):
        c = match.group(1)
        count[c] = count.get(c, 0) + 1
    return count

def build_mana_base(colors, total_lands, color_reqs):
    if not colors: return [{"type": "colorless/utility", "count": total_lands}]
    total_req = sum(color_reqs.values())
    multi_lands = round(total_lands * (0.65 if len(colors) > 1 else 0.0))
    basic_lands = total_lands - multi_lands
    
    mana_base = []
    for c in colors:
        req = color_reqs.get(c, 0)
        cnt = round((basic_lands * req / total_req) if total_req else basic_lands / len(colors))
        mana_base.append({"type": f"Basic {c}", "count": cnt})
    
    if multi_lands > 0: mana_base.append({"type": "Dual/Fetch/Triomes", "count": multi_lands})
    return mana_base

def build_commander_deck(commander_url):
    cmd = fetch_commander_data(commander_url)
    archetype = classify_archetype(cmd["oracle_text"])
    
    # 1. Base Skeleton
    ramp_slots = 8 if cmd["cmc"] <= 3 else (11 if cmd["cmc"] <= 5 else 14)
    skeleton = {"ramp": ramp_slots, "draw": 10, "removal": 10, "boardwipe": 3, "wincons": 3, "protection/flex": 6}
    if archetype == "stax": skeleton["removal"] += 3; skeleton["draw"] -= 2
    elif archetype == "spell_slinger": skeleton["draw"] += 4; skeleton["protection/flex"] -= 2
    
    # 2. Select Ramp
    ramp_engine = select_ramp_packages(cmd["colors"], archetype, ramp_slots)
    
    # 3. Karsten Theory V2 (42 Lands - Reductions)
    total_lands = karsten_adjusted_lands(ramp_engine["packages_used"], skeleton["draw"])
    
    # 4. Hypergeometric Color Requirements
    symbols = parse_color_symbols(cmd["mana_cost"])
    turn_target = max(1, int(cmd["cmc"]))
    color_reqs = {c: required_colored_sources(count, turn_target) for c, count in symbols.items()}
    mana_base = build_mana_base(cmd["colors"], total_lands, color_reqs)
    
    # 5. Final Synergy Fill
    skeleton["synergy_core"] = 99 - total_lands - sum(v for k, v in skeleton.items() if k != "synergy_core")

    return {
        "metadata": {"commander": cmd["name"], "cmc": cmd["cmc"], "color_identity": "".join(cmd["colors"]) if cmd["colors"] else "Colorless", "archetype": archetype},
        "mana_base": {"total_lands": total_lands, "distribution": mana_base},
        "ramp_engine": ramp_engine,
        "deck_skeleton": skeleton
    }

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data.decode('utf-8'))
            scryfall_url = payload.get('url', '')
            if not scryfall_url: raise ValueError("URL de Scryfall requerida.")
                
            result = build_commander_deck(scryfall_url)
            self.wfile.write(json.dumps({"status": "success", "data": result}).encode('utf-8'))
        except Exception as e:
            logger.error(str(e))
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))