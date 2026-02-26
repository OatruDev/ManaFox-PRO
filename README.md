# 🦊 ManaFox PRO: Zorro Corp Edition

![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)
![Architecture](https://img.shields.io/badge/architecture-ES6_Modules-orange.svg)
![UI](https://img.shields.io/badge/UI-TailwindCSS-06b6d4.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-success.svg)

**ManaFox PRO** es la aplicación *Companion* definitiva para **Magic: The Gathering**. Diseñada bajo la filosofía de "Zero Fluff, Pure Performance", está construida íntegramente en Vanilla JS (ES6) y Tailwind CSS. Funciona de manera 100% offline (PWA) y cuenta con motores lógicos avanzados para partidas de Commander y torneos Suizos.

---

## 🚀 Características Principales

### ⚔️ Commander FFA Engine (Free-for-All)
- **Soporte de 2 a 6 Jugadores:** Diseños adaptativos (`Grid` y `Cross Layout` para mesas cuadradas).
- **Hitboxes Matemáticos Absolutos:** Sin importar la rotación del jugador (0°, 90°, -90° o 180°), el área superior (+) siempre apunta al centro de la mesa y el área inferior (-) al jugador.
- **Daño de Comandante Individual:** Calculado de forma independiente por cada oponente. El sistema aplica la regla oficial WPN: la eliminación solo ocurre si *un único comandante* inflige 21+ daños.
- **Radial Menu (Lotus Style):** Un menú flotante de cristal que se despliega geométricamente usando `Math.cos()` y `Math.sin()` para no interrumpir el tablero de juego.
- **Undo Stack (Máquina del tiempo):** Memoria de estado en tiempo real. Un botón permite deshacer toques accidentales sin perder el ritmo de la partida.
- **Lanzamiento D20 Global:** Animación síncrona para decidir quién empieza, resaltando automáticamente la tirada ganadora.

### 🏆 Jumpstart Swiss Tourney
- **Algoritmo de Emparejamiento Suizo:** Soporte nativo para 4, 8 y 16 jugadores.
- **Motor de Desempates (Tie-Breakers):** Lógica avanzada que resuelve empates de puntos evaluando automáticamente el **Head-to-Head** (Duelo Directo) y generando un `Badge` visual explicativo en los Standings.
- **Fases de Draft Dinámicas:** Confirmación de dos pasos para abrir sobres antes de entrar al combate.

### 📚 Deck Library & Veto System
- **Reconocimiento de Arquetipos:** Análisis automático de identidad de color. Detecta al instante las 32 combinaciones de Magic (Golgari, Grixis, Jeskai, Ink-Treader, WUBRG, etc.).
- **Auto-Guardado Inteligente:** Los mazos se guardan en la `localStorage` al teclear, evitando pérdidas accidentales.
- **Drafting Competitivo:**
  - **Locks (Fijar Mazo):** Si el Jugador 1 bloquea un mazo, este se deshabilita para el resto indicando `(P1)`.
  - **Bans (Vetos):** Sistema de baneo dinámico que asegura matemáticamente que siempre queden al menos 2 mazos en el *pool* de asignación aleatoria.

### 🛒 Sealed Market Hub
- **Scryfall API v3 Sync:** Obtiene en tiempo real las expansiones físicas más recientes y los *Upcoming Sets*.
- **Cardmarket Quick Find:** Genera URLs de búsqueda exactas para cajas de Draft, Sobres de Coleccionista y Mazos Preconstruidos.

---

## 💎 UX/UI Pro Tier Standards

Esta aplicación implementa los más altos estándares de desarrollo móvil competitivo:
1. **True Black OLED (`#000000`):** Fondos optimizados para apagar los píxeles de las pantallas AMOLED, ahorrando hasta un 40% de batería durante partidas largas.
2. **Screen Wake Lock API:** Forzado a nivel de navegador. Mientras la pantalla de batalla (Battlefield) esté activa, el dispositivo **nunca se suspenderá ni se apagará**.
3. **Orientation Lock:** Manifiesto PWA configurado en `portrait` estricto para evitar rotaciones accidentales al pasar el móvil por encima del tapete.
4. **Fluid Mana Backgrounds:** Fondos líquidos animados por CSS que mezclan hasta 4 colores identificativos del mazo seleccionado.

---

## 🛠️ Arquitectura Técnica

El proyecto huye de los frameworks pesados (React, Vue) para garantizar una carga de 0 milisegundos y compatibilidad sin internet.

```text
ManaFox/
├── index.html           # SPA entry point
├── manifest.json        # PWA configuration
├── css/
│   └── styles.css       # Tailwind overrrides, animations, radial logic
└── js/
    ├── main.js          # App initialization & Routing
    ├── state.js         # LocalStorage Offline Memory Engine
    ├── ui.js            # Modals & Transitions
    ├── utils.js         # Archetype Dictionary, Confetti & GIF loaders
    └── modules/
        ├── commander.js # Commander Match logic & DOM injections
        ├── jumpstart.js # Swiss matchmaking algorithm
        └── market.js    # Scryfall API Fetcher
