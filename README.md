# 🦊 ManaFox PRO: Zorro Corp Edition

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Architecture](https://img.shields.io/badge/architecture-ES6_Modules-orange.svg)
![Backend](https://img.shields.io/badge/Backend-Vercel_Serverless-black.svg)
![Database](https://img.shields.io/badge/Database-GitHub_API-181717.svg)
![UI](https://img.shields.io/badge/UI-TailwindCSS-06b6d4.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-success.svg)

**ManaFox** es la aplicación *Companion* definitiva para **Magic: The Gathering**. Diseñada bajo la filosofía de "Zero Fluff, Pure Performance", está construida en Vanilla JS (ES6) y Tailwind CSS. Funciona como una PWA nativa y cuenta con motores lógicos avanzados para Commander, torneos Suizos y una arquitectura de base de datos *Serverless* en tiempo real.

---

## 🚀 Características Principales

### ⚔️ Commander FFA Engine (Free-for-All)
- **Soporte de 2 a 6 Jugadores:** Diseños adaptativos (`Grid` y `Cross Layout` para mesas cuadradas).
- **Zonas Táctiles Inteligentes y Ráfagas:** Áreas apiladas verticalmente (Arriba suma, Abajo resta) que mantienen su lógica absoluta sin importar la rotación del jugador. Incluye **Pulsación Larga** para sumar/restar 5 vidas por ráfaga.
- **Undo Inteligente (Batching):** Un sistema de "Debounce" de 2.5 segundos que agrupa múltiples toques rápidos en un solo evento. Un solo click en UNDO revierte todo el bloque de daño.
- **Daño de Comandante Aislado:** Calculado de forma independiente por cada oponente con evaluación inmediata.
- **Live Seat Rotation:** Un botón dedicado en el menú radial permite rotar instantáneamente las posiciones de los jugadores en la pantalla para adecuarse a la mesa real sin perder el estado de la partida.
- **Radial Menu (Lotus Style):** Un menú flotante que se despliega geométricamente usando `Math.cos()` y `Math.sin()` para acceder a herramientas (D20, Undo, Restart) sin interrumpir el tablero.

### ☁️ Serverless Cloud Database & Sync
- **GitHub como Base de Datos:** Las partidas finalizadas se inyectan directamente en un archivo `db.json` en el repositorio mediante la API de GitHub, proporcionando un historial infinito, gratuito y con control de versiones.
- **Vercel Bouncer (BFF):** Utiliza *Serverless Functions* (`/api/save.js`) para gestionar de forma segura los tokens y el Payload de escritura.
- **Historial Inmortal (Denormalización):** El motor de guardado genera un *Snapshot* inmutable del estado del jugador y del mazo. Si en el futuro se elimina un mazo de la biblioteca, las partidas pasadas no pierden su integridad.
- **True Pull Sync:** Sincronización bidireccional bajo demanda que omite la caché del servidor estático para recuperar siempre la última versión de la DB.

### 📚 Deck Library, Vetoes & UX Validations
- **Reconocimiento de Arquetipos:** Detecta al instante las 32 combinaciones de Magic (Golgari, Grixis, Jeskai, Ink-Treader, WUBRG, etc.).
- **Validación Estricta "Shake":** Interfaz reactiva mediante Web Animations API. Si se intenta avanzar con campos vacíos, los inputs bloquean el paso, se enfocan y vibran visualmente en rojo.
- **Drafting Competitivo:**
  - **Locks (Fijar Mazo):** Si el Jugador 1 bloquea un mazo, este se deshabilita para el resto indicando `(P1)`.
  - **Bans (Vetos):** Sistema dinámico que asegura matemáticamente que siempre queden al menos 2 mazos en el *pool* de asignación aleatoria.

### 🏆 Jumpstart Swiss Tourney
- **Algoritmo de Emparejamiento Suizo:** Soporte nativo para 4, 8 y 16 jugadores.
- **Motor de Desempates (Tie-Breakers):** Lógica avanzada que resuelve empates de puntos evaluando automáticamente el **Head-to-Head** (Duelo Directo) y generando un `Badge` visual explicativo.

---

## 💎 UX/UI Pro Tier Standards

Esta aplicación implementa los más altos estándares de desarrollo móvil competitivo:
1. **Optimización Extrema de Batería:** El renderizado del DOM y la escritura en disco (`localStorage`) están desacoplados. La memoria física solo se sobrescribe cuando la cola de eventos de vida (Batch) se cierra, reduciendo la carga del procesador drásticamente en partidas de 3+ horas.
2. **True Black OLED (`#000000`):** Fondos optimizados para apagar los píxeles de las pantallas AMOLED.
3. **Screen Wake Lock API:** Forzado nativo. Mientras el *Battlefield* esté activo, el dispositivo **nunca se suspenderá ni apagará**.
4. **PWA Nativa:** Manifiesto configurado en `portrait` estricto con set completo de íconos de alta resolución e integraciones SVG para un comportamiento 100% *App-like* en iOS y Android.

---

## 🛠️ Arquitectura Técnica

El proyecto huye de los frameworks pesados (React, Vue) para garantizar una carga de 0 milisegundos, delegando el backend a microservicios.

```text
ManaFox-PRO/
├── api/
│   └── save.js          # Vercel Serverless Function (GitHub API pusher)
├── db.json              # Repositorio maestro de la DB (Partidas, Decks, Jugadores)
├── icons/               # SVG y PNGs de alta resolución para PWA (iOS/Android)
├── index.html           # SPA entry point
├── manifest.json        # PWA configuration
├── css/
│   └── styles.css       # Tailwind overrides, fluid animations, drop-shadows
└── js/
    ├── main.js          # App initialization & Routing
    ├── state.js         # LocalStorage Offline Memory Engine
    ├── ui.js            # Modals & Transitions
    ├── utils.js         # Archetype Dictionary, Confetti & Loaders
    └── modules/
        ├── commander.js # Commander Engine, Life Batching & Smart Undo
        ├── jumpstart.js # Swiss matchmaking algorithm
        ├── market.js    # Scryfall API Fetcher
        └── github-db.js # DB Payload Builder & Sync module 