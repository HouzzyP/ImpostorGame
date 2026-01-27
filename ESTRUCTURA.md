# 📁 Estructura del Proyecto - El Impostor

## Árbol Completo

```
El Impostor/
│
├── 📄 server.js                    Punto de entrada principal
├── 📄 package.json                 Dependencias del proyecto
├── 📄 .gitignore                   Archivos ignorados por git
├── 📄 .env.example                 Template de variables de entorno
│
├── 📁 src/                         CÓDIGO FUENTE (790 líneas distribuidas)
│   │
│   ├── 📁 handlers/                Manejadores de eventos Socket.IO
│   │   └── socket-handlers.js      Eventos en tiempo real (256 líneas)
│   │
│   ├── 📁 logic/                   Lógica pura del juego
│   │   └── game-logic.js           Votación, roles, ganador (128 líneas)
│   │
│   ├── 📁 managers/                Gestores de estado
│   │   └── room-manager.js         Gestión de salas y jugadores (137 líneas)
│   │
│   ├── 📁 utils/                   Funciones auxiliares
│   │   └── utils.js                Utilidades reutilizables (34 líneas)
│   │
│   └── 📁 data/                    Base de datos
│       └── game-data.js            Palabras y categorías (203 líneas)
│
├── 📁 config/                      CONFIGURACIÓN
│   └── config.js                   Variables de configuración centralizadas
│
├── 📁 public/                      CLIENTE (Frontend)
│   ├── index.html                  Estructura HTML (219 líneas)
│   ├── styles.css                  Estilos y temas (609 líneas)
│   └── script.js                   Lógica cliente (364 líneas)
│
├── 📁 docs/                        DOCUMENTACIÓN (1140 líneas)
│   ├── README.md                   Índice de documentación
│   ├── QUICK_START.md              Guía de instalación y ejecución
│   ├── ANTES_DESPUES.md            Comparación visual de mejoras
│   ├── REFACTORIZACIÓN.md          Detalles técnicos de arquitectura
│   ├── RESUMEN_REFACTORIZACIÓN.md  Resumen ejecutivo
│   ├── INDICE.md                   Índice maestro y búsqueda rápida
│   └── ESTADÍSTICAS.md             Análisis cuantitativo
│
├── 📁 node_modules/                Dependencias instaladas (git ignore)
│
└── 📄 readme.md                    README principal del proyecto
```

---

## 📊 Responsabilidad por Carpeta

### `/src` - Código Fuente (790 líneas)

**Propósito**: Toda la lógica del servidor dividida en módulos.

```
src/
├── handlers/          Eventos Socket.IO
│   └── socket-handlers.js
│       ├── createRoom
│       ├── joinRoom
│       ├── updateConfig
│       ├── startGame
│       ├── startVoting
│       ├── castVote
│       ├── finishVoting (detección de empates)
│       ├── resetGame
│       ├── continueInRoom
│       └── disconnect
│
├── logic/             Lógica pura del juego
│   └── game-logic.js
│       ├── assignRoles()
│       ├── assignWordAndCategory()
│       ├── processVotes()
│       ├── checkGameWinner()
│       └── getGameStats()
│
├── managers/          Gestión de estado
│   └── room-manager.js
│       ├── createRoom()
│       ├── addPlayerToRoom()
│       ├── removePlayerFromRoom()
│       ├── getPlayerFromRoom()
│       ├── getRoomHost()
│       ├── resetRoomForNewRound()
│       └── getRoomPublicInfo()
│
├── utils/             Funciones auxiliares
│   └── utils.js
│       ├── generateRoomCode()
│       ├── shuffleArray()
│       ├── getRandomCategory()
│       └── getRandomWord()
│
└── data/              Base de datos
    └── game-data.js
        ├── wordDatabase (16 categorías)
        │   ├── videojuegos (40+ palabras)
        │   ├── famosos
        │   ├── series
        │   ├── anime
        │   ├── películas
        │   ├── música
        │   ├── deportes
        │   ├── países
        │   ├── comidas
        │   ├── marcas
        │   ├── apps
        │   ├── youtubers
        │   ├── memes
        │   ├── profesiones
        │   ├── animales
        │   └── tecnología
        └── categoryNames (nombres legibles)
```

### `/config` - Configuración (1 archivo)

**Propósito**: Centralizar todas las configuraciones del servidor.

```
config/
└── config.js
    ├── PORT
    ├── SOCKET_IO (CORS, etc)
    ├── GAME_CONFIG (tiempos, límites)
    ├── LOGGING
    ├── NODE_ENV
    └── DEBUG
```

### `/public` - Cliente (3 archivos)

**Propósito**: Todo el código del cliente (sin cambios en refactorización).

```
public/
├── index.html         HTML con pantallas
├── styles.css         Estilos y animaciones
└── script.js          Lógica del cliente
```

### `/docs` - Documentación (7 archivos)

**Propósito**: Guías completas y análisis del proyecto.

```
docs/
├── README.md                        Índice principal
├── QUICK_START.md                   Instalación y ejecución
├── ANTES_DESPUES.md                 Comparación visual
├── REFACTORIZACIÓN.md               Detalles técnicos
├── RESUMEN_REFACTORIZACIÓN.md       Resumen
├── INDICE.md                        Búsqueda rápida
└── ESTADÍSTICAS.md                  Análisis cuantitativo
```

---

## 🔄 Flujo de Imports

### De server.js

```
server.js
├── require('./config/config')
│   └── Configuración centralizada
│
└── require('./src/handlers/socket-handlers')
    ├── require('../utils/utils')
    ├── require('../logic/game-logic')
    ├── require('../managers/room-manager')
    └── require('../data/game-data')
```

### De socket-handlers.js

```
socket-handlers.js
├── require('../utils/utils')
├── require('../logic/game-logic')
├── require('../managers/room-manager')
└── require('../data/game-data')
```

### De game-logic.js

```
game-logic.js
└── require('../utils/utils')
```

---

## 📝 Agregar Nuevo Archivo

Si quieres agregar un nuevo módulo:

```javascript
// 1. Crear archivo en carpeta apropiada:
src/logic/newModule.js

// 2. Exportar las funciones:
module.exports = { function1, function2 };

// 3. Importar en socket-handlers.js:
const { function1 } = require('../logic/newModule');

// 4. Usar en handlers
```

---

## 🗂️ Criterios de Carpetas

| Carpeta | Contiene | Ejemplo |
|---------|----------|---------|
| **handlers/** | Manejadores Socket.IO | socket-handlers.js |
| **logic/** | Lógica pura (sin estado) | game-logic.js |
| **managers/** | Gestión de estado | room-manager.js |
| **utils/** | Funciones auxiliares | utils.js |
| **data/** | Datos estáticos | game-data.js |
| **config/** | Configuración | config.js |
| **public/** | Frontend (HTML/CSS/JS) | index.html |
| **docs/** | Documentación | *.md |

---

## 💡 Convenciones

```javascript
// Imports: siempre usar rutas relativas desde el archivo actual
// ❌ MALO:
const { utils } = require('utils/utils');

// ✅ BIEN:
const { utils } = require('../utils/utils');

// Exportar: siempre al final del archivo
// ✅ BIEN:
module.exports = {
    function1,
    function2
};

// Nombres: carpetas en singular, archivos en minúscula
// ❌ MALO: handlers/socketHandlers.js
// ✅ BIEN: handlers/socket-handlers.js
```

---

## 📈 Tamaño de Archivos

```
Código:
  socket-handlers.js     256 líneas (32%)
  game-data.js           203 líneas (25%)
  room-manager.js        137 líneas (17%)
  game-logic.js          128 líneas (16%)
  config.js              45 líneas  (5%)
  utils.js               34 líneas  (4%)
  ────────────────
  TOTAL                  803 líneas

Documentación:
  ANTES_DESPUES.md       282 líneas
  INDICE.md              235 líneas
  QUICK_START.md         241 líneas
  REFACTORIZACIÓN.md     193 líneas
  RESUMEN_REFACTORIZACIÓN 189 líneas
  ESTADÍSTICAS.md        (variable)
  ────────────────
  TOTAL                  ~1140 líneas
```

---

## ✅ Checklist para Mantener Orden

- ✅ Código nuevo va a `/src`
- ✅ Configuración va a `/config`
- ✅ Documentación va a `/docs`
- ✅ HTML/CSS/JS cliente en `/public`
- ✅ Imports relativos entre carpetas
- ✅ Módulos pequeños y enfocados
- ✅ Documentar cambios en `/docs`

