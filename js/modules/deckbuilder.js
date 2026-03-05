// /js/modules/deckbuilder.js
import { mfModal } from '../ui.js';

// ==========================================
// 1. DICCIONARIO "HOW TO PLAY" (LOW IQ FRIENDLY)
// ==========================================
const HOW_TO_PLAY_GUIDES = {
    "aggro": "⚔️ Pega rápido y fuerte. Baja criaturas pronto y ataca sin piedad antes de que tus oponentes armen sus defensas.",
    "control": "🛑 Di 'NO' a todo. Destruye o contrarresta lo que hagan tus oponentes hasta que se rindan o te supliquen.",
    "combo": "🧩 Arma el rompecabezas. Sobrevive como puedas hasta juntar las 2 o 3 cartas clave que te hacen ganar automáticamente.",
    "stax": "⛓️ Haz que te odien. Pon cartas que prohíban o encarezcan jugar a los demás. Gana por asfixia lenta.",
    "tempo": "⏱️ Mantén el ritmo. Juega amenazas baratas y retrasa al oponente rebotando a su mano todo lo que intente jugar.",
    "big_mana": "💰 Maná a lo bestia. Genera muchísima energía en los primeros turnos para bajar monstruos gigantes e imparables.",
    "value": "📚 Roba cartas sin parar. Aplasta a tus rivales simplemente teniendo más cartas y opciones que ellos en la mano.",
    "+1_counters": "💪 Pon a tus criaturas a hacer pesas. Hazlas más y más grandes cada turno poniéndoles dados encima.",
    "-1_counters": "☠️ Envenena y debilita. Pon contadores negativos para encoger a las criaturas enemigas hasta que mueran.",
    "aikido": "🥋 Usa su fuerza en su contra. Deja que te ataquen y desvía el daño hacia ellos o cópiales sus mejores cartas.",
    "artifacts": "⚙️ Construye la máquina. Tus cartas de artefacto se potencian entre sí hasta formar un ejército robótico imparable.",
    "enchantress": "✨ Magia protectora. Juega encantamientos (auras) para robar cartas, volverte intocable y asfixiar al rival.",
    "blink": "👻 Entra y sale. Haz que tus criaturas 'parpadeen' (exílialas y devuélvelas) para repetir sus efectos mágicos una y otra vez.",
    "chaos": "🎲 Que arda el mundo. Tira monedas, dados y cambia las reglas del juego al azar. Nadie sabe qué va a pasar.",
    "clones": "🪞 ¿Por qué usar tus cartas si puedes usar las suyas? Copia exactamente todo lo bueno que bajen tus oponentes.",
    "discard": "🗑️ Vacíales la mente. Haz que tus oponentes tiren sus cartas a la basura para que no puedan responderte.",
    "mill": "🧠 Ataca al mazo. Haz que tus oponentes tiren su mazo al cementerio; si se quedan sin cartas para robar, pierden.",
    "reanimator": "🧟 El cementerio es tu mano. Tira monstruos gigantes a la basura a propósito y usa hechizos baratos para revivirlos.",
    "land_destruction": "🌋 Destruye sus tierras. Déjalos sin maná para que no puedan jugar absolutamente nada en toda la partida.",
    "infect": "☣️ Solo necesitas 10 de daño. Pega con criaturas infecciosas; si les das 10 contadores de veneno a un jugador, está muerto.",
    "superfriends": "🦸‍♂️ Reúne a los Vengadores. Juega cartas de Planeswalkers y protégelos hasta que usen sus habilidades máximas.",
    "taxes": "💸 Cóbrales por respirar. Pon criaturas que hagan que cualquier cosa que intenten hacer tus oponentes cueste más maná.",
    "lands_matter": "🌍 La tierra es poder. Gana ventajas y crea monstruos simplemente por el hecho de bajar tierras al campo de batalla.",
    "tokens": "🐜 Crea un ejército de hormigas. Pon docenas de fichitas 1/1 en el campo y luego dales un bono gigante para aplastar a todos.",
    "goad": "🤬 El provocador. Obliga a las criaturas de tus oponentes a atacarse entre ellos mientras tú miras y comes palomitas.",
    "voltron": "🤖 Arma el Megazord. Ponle todas las armas y escudos a tu Comandante y pega un solo golpe mortal de 21 daños.",
    "pillowfort": "🏰 Escóndete en tu castillo. Pon cartas que hagan que sea imposible o carísimo que te ataquen.",
    "auras": "👕 Viste a tu campeón. Ponle auras mágicas a una sola criatura para hacerla gigante, voladora e indestructible.",
    "flying": "🦅 Domina los cielos. Ataca por el aire donde la inmensa mayoría de las criaturas terrestres no pueden bloquearte.",
    "snow": "❄️ El invierno se acerca. Usa tierras nevadas y cartas que se vuelven más fuertes gracias al frío para congelar al rival.",
    "x_spells": "✖️ Magia infinita. Genera cantidades absurdas de maná para lanzar un hechizo gigante con una X letal en su coste.",
    "aristocrats": "🩸 Sacrificios sangrientos. Mata a tus propias criaturas pequeñas a propósito para drenar la vida de tus oponentes.",
    "proliferate": "📈 Multiplica todo. Añade más contadores (de veneno, daño o fuerza) a todo lo que ya tenga un contador encima.",
    "artifact_tokens": "🪙 El banquero. Fabrica fichas de Tesoro, Comida o Pistas para generar ventaja o alimentar a tus otras criaturas.",
    "stompy": "🦖 Parque Jurásico. No pienses mucho, solo baja a las criaturas más grandes, gordas y pesadas que encuentres y ataca.",
    "spell_slinger": "🧙‍♂️ Ametralladora mágica. Juega muchísimos hechizos baratos (instantáneos/conjuros) rápidos para ganar beneficios continuos.",
    "mutate": "🧬 Quimera. Apila tus criaturas unas encima de otras para combinar sus habilidades en un super-mutante invencible.",
    "multi_win": "🏆 Gana de la nada. Sobrevive hasta jugar cartas que dicen textualmente 'Ganas la partida' si cumples una condición rara.",
    "midrange": "🛡️ Juega a lo seguro. Contrólate al principio y baja criaturas muy potentes en los turnos medios para dominar la mesa."
};

// ==========================================
// 2. CONEXIÓN API SERVERLESS
// ==========================================
export async function generateDeckFromPython() {
    const input = document.getElementById('scryfall-input');
    const scryfallUrl = input ? input.value.trim() : "";
    
    if(!scryfallUrl.includes("scryfall.com/card/")) {
        return mfModal.show("Invalid Input", "Please enter a valid Scryfall Card URL.", "warning");
    }

    try {
        mfModal.show("Forging Skeleton...", "Connecting to Python Serverless Engine. Applying Karsten Theory...", "memory");
        
        const response = await fetch('/api/builder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: scryfallUrl })
        });
        
        const jsonRes = await response.json();
        if (jsonRes.status === "error") throw new Error(jsonRes.message);
        
        exportToMoxfield(jsonRes.data);
        if(input) input.value = ''; // Limpiar input para la próxima vez
        
    } catch (error) {
        console.error("Deck Forge Error:", error);
        mfModal.show("Calculation Failed", error.message, "error");
    }
}

// ==========================================
// 3. EXPORTADOR Y RENDERIZADO VISUAL
// ==========================================
function mapBasicLands(landName) {
    const basics = {
        "Basic W": "Plains",
        "Basic U": "Island",
        "Basic B": "Swamp",
        "Basic R": "Mountain",
        "Basic G": "Forest"
    };
    return basics[landName] || landName;
}

function exportToMoxfield(data) {
    // 1. Crear el bloque de texto perfecto para Moxfield/Manabox
    let moxText = `// COMMANDER\n1 ${data.metadata.commander}\n\n`;
    
    moxText += `// RAMP ENGINE (${data.ramp_engine.total_slots} Slots)\n`;
    data.ramp_engine.recommended_cards.forEach(c => moxText += `1 ${c}\n`);
    moxText += `\n`;

    moxText += `// MANA BASE (${data.mana_base.total_lands} Lands - Karsten Optimized)\n`;
    data.mana_base.distribution.forEach(l => {
        let cleanName = mapBasicLands(l.type);
        // Si es la categoría de duals, la comentamos para que no rompa el importador
        if (cleanName === "Dual/Fetch/Triomes") {
            moxText += `// ${l.count} [DUAL/FETCH/SHOCK SLOTS]\n`;
        } else {
            moxText += `${l.count} ${cleanName}\n`;
        }
    });
    moxText += `\n`;

    moxText += `// SKELETON PLACEHOLDERS (Archetype: ${data.metadata.archetype.toUpperCase()})\n`;
    for (const [category, count] of Object.entries(data.deck_skeleton)) {
        if(category !== 'ramp') {
            moxText += `// ${count} [${category.toUpperCase()} SLOT]\n`;
        }
    }

    // 2. Copiar al portapapeles en silencio
    navigator.clipboard.writeText(moxText).catch(err => console.error('Clipboard failed: ', err));

    // 3. Obtener el resumen de "Cómo jugar" (Low IQ)
    let archKey = data.metadata.archetype.toLowerCase();
    let howToPlay = HOW_TO_PLAY_GUIDES[archKey] || HOW_TO_PLAY_GUIDES["midrange"];

    // 4. Crear el HTML personalizado para el Modal
    let customHtml = `
        <div class="flex flex-col gap-4 text-left w-full mt-2">
            
            <div class="bg-app-primary/10 border border-app-primary/30 p-4 rounded-2xl shadow-inner">
                <h4 class="text-[10px] uppercase font-black text-app-primary tracking-[0.2em] mb-2 flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">psychology</span> Cómo ganar
                </h4>
                <p class="text-xs text-white leading-relaxed font-medium">${howToPlay}</p>
            </div>
            
            <div class="relative bg-black border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div class="bg-white/5 px-3 py-2 flex justify-between items-center border-b border-white/5">
                    <span class="text-[9px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">terminal</span> Moxfield Format
                    </span>
                    <span class="text-[9px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <span class="material-symbols-outlined text-[12px]">check</span> Copied
                    </span>
                </div>
                <pre class="p-4 text-[10px] text-slate-300 h-48 overflow-y-auto no-scrollbar font-mono leading-relaxed"><code>${moxText}</code></pre>
            </div>
            
            <button onclick="document.getElementById('mf-modal').classList.add('opacity-0', 'pointer-events-none', 'scale-95');" class="w-full bg-app-surface-light border border-white/10 text-white py-4 rounded-xl font-black hover:bg-white/10 transition active:scale-95 text-xs uppercase tracking-[0.2em] mt-2 shadow-sm">
                Awesome!
            </button>
        </div>
    `;

    // 5. Mostrar el Modal avanzado
    mfModal.show(
        "Deck Forged! ⚒️", 
        `Archetype: ${data.metadata.archetype.toUpperCase()}\nYour skeleton is ready and copied to clipboard.`, 
        "precision_manufacturing", 
        "custom", 
        customHtml
    );
}

// Global Binding para llamarlo desde botones HTML
window.generateDeckFromPython = generateDeckFromPython;