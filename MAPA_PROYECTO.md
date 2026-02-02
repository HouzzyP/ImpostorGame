# 🗺️ MAPA DE REFERENCIA DEL PROYECTO - EL IMPOSTOR

**Versión:** 2.2.0  
**Fecha:** Enero 2026  
**Tipo:** Juego Multiplayer de Deducción Social en Tiempo Real

---

## 📋 RESUMEN EJECUTIVO

**El Impostor** es un juego web multiplayer donde 4-8 jugadores reciben roles:
- **Inocentes**: Conocen una palabra secreta y deben describir sin ser obvios
- **Impostores**: NO conocen la palabra y deben ocultarse mientras la descubren

**Objetivo:**
- Inocentes: Eliminar todos los impostores mediante votación
- Impostores: Sobrevivir hasta igualar o superar a los inocentes

**Stack:** Node.js + Express + Socket.IO + Vanilla JS (sin frameworks frontend)

---

## 📂 ESTRUCTURA DE CARPETAS Y ARCHIVOS CLAVE

```
ImpostorGame/
├── 📄 server.js                      # PUNTO DE ENTRADA - Servidor Express + Socket.IO
├── 📦 package.json                   # Dependencias y scripts npm
├── ⚙️ .env                            # ⚠️ VARIABLES DE ENTORNO (NO SUBIR A GIT)
├── ⚙️ .env.example                    # Ejemplo de configuración (SÍ subir)
├── 🚫 .gitignore                     # Exclusiones para Git
├── 📘 readme.md                      # Documentación principal del proyecto
├── 🔐 SECURITY.md                    # ⭐ GUÍA DE SEGURIDAD (credenciales, deploy)
│
├── 📁 config/                        # CONFIGURACIÓN GLOBAL
│   └── config.js                     # Configuración centralizada (puerto, timeouts, CORS)
│
├── 📁 src/                           # CÓDIGO DEL SERVIDOR (Backend)
│   ├── 📁 data/
│   │   └── game-data.js              # BASE DE DATOS de palabras (16 categorías, 700+ palabras)
│   │
│   ├── 📁 handlers/
│   │   ├── socket-handlers.js        # EVENTOS SOCKET.IO (crear sala, votar, etc.)
│   │   └── chat-handlers.js          # Eventos de chat (si está implementado)
│   │
│   ├── 📁 logic/
│   │   └── game-logic.js             # LÓGICA DEL JUEGO (asignar roles, procesar votos, ganadores)
│   │
│   ├── 📁 managers/
│   │   └── room-manager.js           # GESTIÓN DE SALAS (crear, agregar jugadores, resetear)
│   │
│   ├── 📁 middleware/
│   │   └── auth.js                   # Autenticación básica para admin
│   │
│   ├── 📁 services/
│   │   └── statsService.js           # SERVICIO DE ESTADÍSTICAS (guardar resultados, analytics)
│   │
│   └── 📁 utils/
│       ├── utils.js                  # Utilidades generales (generar códigos, palabras random)
│       └── validators.js             # VALIDACIÓN de datos con Joi
│
├── 📁 public/                        # CLIENTE (Frontend)
│   ├── index.html                    # INTERFAZ PRINCIPAL del juego
│   ├── styles.css                    # ESTILOS (tema claro/oscuro, responsive)
│   ├── manifest.json                 # Configuración PWA
│   ├── sw.js                         # Service Worker para PWA
│   ├── icon.webp                     # Icono del juego
│   ├── robots.txt / sitemap.xml      # SEO
│   │
│   ├── como-jugar.html               # Guía de cómo jugar
│   ├── reglas.html                   # Reglas del juego
│   ├── faq.html                      # Preguntas frecuentes
│   │
│   └── 📁 js/modules/                # MÓDULOS JAVASCRIPT (arquitectura modular)
│       ├── analytics.js              # Tracking de eventos (Google Analytics)
│       ├── game.js                   # Lógica principal del juego en cliente
│       ├── i18n.js                   # Internacionalización (multi-idioma)
│       ├── socket.js                 # Gestión de conexión Socket.IO
│       ├── ui.js                     # Manejo de UI (pantallas, animaciones)
│       └── utils.js                  # Utilidades del cliente
│
├── 📁 private/                       # PANEL ADMIN (protegido)
│   └── admin.html                    # Panel de administración (stats, salas activas)
│
├── 📁 tests/                         # TESTS AUTOMATIZADOS
│   ├── voting_scenarios.js           # Tests de escenarios de votación
│   ├── integration_test.js           # Tests de integración
│   └── chaos_simulation.js           # Simulación de caos (stress test)
│
└── 📁 database/                      # BASE DE DATOS (si aplica)
    └── schema.sql                    # Schema de PostgreSQL (para stats persistentes)
```

---

## 🎯 FLUJO DEL JUEGO (Arquitectura de Estados)

### 1️⃣ **LOBBY (waiting)**
**Archivos:** `socket-handlers.js` (eventos: createRoom, joinRoom, updateConfig)

- Host crea sala → Código de 4 letras
- Jugadores se unen con código
- Host configura:
  - Categoría (16 opciones)
  - Cantidad de impostores (1-2)
- Mínimo 4 jugadores para iniciar

**Estado del servidor:** `room.gameState = 'waiting'`

---

### 2️⃣ **ASIGNACIÓN DE ROLES**
**Archivos:** `game-logic.js` → `assignRoles()`, `assignWordAndCategory()`

Cuando host presiona "Iniciar Partida":
1. Se asignan roles aleatoriamente (1-2 impostores, resto inocentes)
2. Se elige palabra aleatoria de la categoría seleccionada
3. Cada jugador recibe evento `yourRole` con:
   - `isImpostor: true/false`
   - `word: "palabra"` (null para impostores)
   - `category: "nombre"`
   - `players: [...]` (para panel en vivo)

**Estado del servidor:** `room.gameState = 'playing'`

---

### 3️⃣ **FASE DE DESCRIPCIÓN (playing)**
**Archivos:** `index.html` → roleScreen, gameScreen

- Se genera orden ALEATORIO de descripción (`descriptionOrder`)
- Los jugadores describen la palabra por turnos
- NO hay timer automático (depende de los jugadores)
- Panel de jugadores en vivo muestra quién está vivo

**Elementos UI:**
- `roleCard` → Muestra si eres Inocente o Impostor
- `livePlayersPanel` → Lista de jugadores con estados
- `descriptionOrderDisplay` → Orden de descripción

---

### 4️⃣ **FASE DE VOTACIÓN (voting)**
**Archivos:** `socket-handlers.js` → startVoting, castVote

Cuando host presiona "Iniciar Votación":
1. Se usa el mismo orden de descripción
2. **Votación SECUENCIAL por turnos** (uno a la vez)
3. Cada jugador vota por quien eliminar
4. Sistema de emojis para reacciones en vivo

**Eventos clave:**
- `votingStarted` → Inicia votación
- `voteCast` → Alguien votó
- `playerEliminated` → Alguien fue eliminado

**Lógica especial (game-logic.js):**
- Detecta empates automáticamente
- Filtra jugadores eliminados del orden
- Calcula siguiente votante correctamente

---

### 5️⃣ **ELIMINACIÓN Y RESULTADO**
**Archivos:** `game-logic.js` → `processVotes()`, `checkGameWinner()`

Después de votar:
1. Se cuenta votos (`processVotes`)
2. Si hay empate → Nadie eliminado, continúa ronda
3. Si hay ganador → Jugador eliminado
4. Se verifica condición de victoria (`checkGameWinner`):
   - **Inocentes ganan:** Todos los impostores eliminados
   - **Impostores ganan:** Impostores ≥ Inocentes vivos

**Pantallas:**
- `eliminationScreen` → Feedback de eliminación
- `endScreen` → Victoria final + revelación de roles

---

### 6️⃣ **CONTINUAR O REINICIAR**
**Archivos:** `socket-handlers.js` → continueInRoom, resetGame

Host puede:
- **Continuar en sala:** Nueva partida sin salir (resetea juego)
- **Volver al lobby:** Vuelve a estado waiting

**Función clave:** `resetRoomForNewRound()` en `room-manager.js`

---

## 🔌 EVENTOS SOCKET.IO PRINCIPALES

### 📤 **Cliente → Servidor**

| Evento | Descripción | Archivo Handler | Validación |
|--------|-------------|----------------|------------|
| `createRoom` | Crear nueva sala | socket-handlers.js L42 | schemas.createRoom |
| `joinRoom` | Unirse a sala existente | socket-handlers.js L63 | schemas.joinRoom |
| `updateConfig` | Host cambia configuración | socket-handlers.js L146 | schemas.updateConfig |
| `startGame` | Host inicia partida | socket-handlers.js L158 | schemas.startGame |
| `startVoting` | Host inicia votación | socket-handlers.js L180 | - |
| `castVote` | Jugador emite voto | socket-handlers.js L208 | schemas.castVote |
| `finishVoting` | Host termina votación forzada | socket-handlers.js L325 | - |
| `sendReaction` | Enviar emoji | socket-handlers.js L394 | schemas.sendReaction |
| `disconnect` | Jugador se desconecta | socket-handlers.js L413 | - |

### 📥 **Servidor → Cliente**

| Evento | Cuándo se emite | Datos enviados |
|--------|-----------------|----------------|
| `roomCreated` | Al crear sala | roomCode, room, categories |
| `roomJoined` | Al unirse a sala | roomCode, room, categories, isSpectator |
| `playerListUpdate` | Alguien entra/sale | players[] |
| `configUpdate` | Host cambia config | config{category, impostorCount} |
| `yourRole` | Juego inicia | isImpostor, word, category, players[] |
| `gameStarted` | Juego comienza | category, descriptionOrder[] |
| `votingStarted` | Votación comienza | votingOrder[], currentVoterIndex |
| `voteCast` | Alguien votó | voterName, votedForName, votingOrder[], currentVoterIndex |
| `playerEliminated` | Jugador eliminado | playerName, wasImpostor, gameEnded, winner, word, players[] |
| `tieVoting` | Empate en votos | players[], message |
| `continueGame` | Siguiente ronda | alivePlayers[], roundNumber |
| `gameEnded` | Partida terminó | winner, players[], word |
| `gameResetToLobby` | Volver a lobby | categories |
| `gameInterrupted` | Interrupción | message, categories |
| `reactionReceived` | Emoji enviado | username, emoji |
| `error` | Error | mensaje |

---

## 🧩 MÓDULOS CLAVE Y SUS RESPONSABILIDADES

### 🎮 **game-logic.js** (Backend)
**Propósito:** Toda la lógica del juego

**Funciones principales:**
```javascript
assignRoles(players, impostorCount)           // Asigna roles aleatoriamente
assignWordAndCategory(players, category, db)  // Asigna palabra a inocentes
processVotes(room)                            // Cuenta votos y determina eliminado
checkGameWinner(room)                         // Verifica condiciones de victoria
```

**Ubicación:** `src/logic/game-logic.js`

---

### 🏠 **room-manager.js** (Backend)
**Propósito:** Gestión completa de salas y jugadores

**Funciones principales:**
```javascript
createRoom(roomCode, hostPlayer)              // Crea nueva sala
addPlayerToRoom(room, player)                 // Agrega jugador a sala
removePlayerFromRoom(room, socketId)          // Remueve jugador
getPlayerFromRoom(room, socketId)             // Busca jugador por ID
resetRoomForNewRound(room)                    // Resetea sala para nueva partida
reconnectPlayer(room, username, newSocketId)  // Reconecta jugador desconectado
```

**Ubicación:** `src/managers/room-manager.js`

---

### 📊 **statsService.js** (Backend)
**Propósito:** Estadísticas y analytics

**Funciones principales:**
```javascript
saveGameResult(gameData)                      // Guarda resultado de partida
getGlobalStats()                              // Obtiene stats globales
saveEvent(eventData)                          // Guarda evento de analytics
getAnalytics(timeRange)                       // Obtiene analytics
```

**Ubicación:** `src/services/statsService.js`

---

### 🎨 **ui.js** (Frontend)
**Propósito:** Manejo de interfaz (pantallas, transiciones, feedback)

**Funciones estimadas:**
```javascript
showScreen(screenId)                          // Cambia de pantalla
toast(message, type)                          // Notificación temporal
updateTheme(theme)                            // Cambia tema claro/oscuro
renderPlayerList(players)                     // Renderiza lista de jugadores
```

**Ubicación:** `public/js/modules/ui.js`

---

### 🔌 **socket.js** (Frontend)
**Propósito:** Gestión de conexión Socket.IO en cliente

**Funcionalidades:**
- Conectar/desconectar
- Emit de eventos
- Listeners de eventos del servidor
- Reconexión automática

**Ubicación:** `public/js/modules/socket.js`

---

### 🎯 **game.js** (Frontend)
**Propósito:** Lógica del juego en cliente (estado, acciones)

**Funcionalidades:**
- Manejo del estado del juego (`myRole`, `currentRoom`, `isHost`)
- Funciones de votación
- Panel de jugadores en vivo
- Timers y contadores

**Ubicación:** `public/js/modules/game.js`

---

## 🎨 FEATURES ESPECIALES IMPLEMENTADAS

### ✨ **Panel de Jugadores en Vivo**
**Archivos:** `index.html` (livePlayersPanel), `styles.css`, cliente JS

**Estados visuales:**
- `alive` → Jugador vivo (●)
- `voted` → Ya votó (✓)
- `eliminated` → Eliminado (✗)

**Se actualiza en:**
- `yourRole` → Inicializa panel
- `votingStarted` → Resetea votos
- `voteCast` → Marca votado
- `playerEliminated` → Marca eliminado
- `continueGame` → Reinitializa con vivos

**Ubicación visible:**
- `gameScreen` → Durante descripción
- `votingScreen` → Durante votación

---

### 🔄 **Sistema de Reconexión Inteligente**
**Archivos:** `socket-handlers.js` → joinRoom, `room-manager.js` → reconnectPlayer

**Cómo funciona:**
1. Jugador se desconecta → Se marca como `disconnected: true`
2. Timeout de 60 segundos antes de eliminar definitivamente
3. Si vuelve con mismo username → Reconecta con nuevo socketId
4. Recibe evento `reconnected` con estado actual del juego

**Variables globales:**
- `disconnectTimeouts` (Map) → Almacena timeouts de desconexión

---

### 🎭 **Sistema de Emojis/Reacciones**
**Archivos:** `index.html` → emoji-reactions, `socket-handlers.js` → sendReaction

**Emojis disponibles:**
- 💀 🤡 🔫 💩 🚩 📸

**Evento:** `reactionReceived` → Muestra emoji flotante en UI

---

### 🌐 **PWA (Progressive Web App)**
**Archivos:** `manifest.json`, `sw.js`

**Características:**
- Instalable en móvil/escritorio
- Funciona offline (limitado)
- Service Worker para cacheo
- Icono y splash screen configurados

---

### 🌍 **Internacionalización (i18n)**
**Archivos:** `public/js/modules/i18n.js`

**Idiomas soportados:** (si está implementado)
- Español (default)
- Inglés
- Portugués

---

### 📈 **Analytics y Tracking**
**Archivos:** `public/js/modules/analytics.js`, `src/services/statsService.js`

**Métricas rastreadas:**
- Partidas jugadas
- Victorias por rol
- Tiempo promedio de partida
- Categorías más usadas
- Jugadores activos

---

## 🔐 SEGURIDAD Y VALIDACIÓN

### **⚠️ ARCHIVOS SENSIBLES (NO SUBIR A GIT)**

**`.env`** - Contiene credenciales reales:
```env
DATABASE_URL=postgresql://user:password@host:port/database
ADMIN_USER=tu_usuario
ADMIN_PASS=tu_contraseña_segura
```

**Protección:**
- ✅ Incluido en `.gitignore`
- ✅ Usar `.env.example` como template (sin credenciales)
- ✅ Configurar en variables de entorno del hosting

**📖 Ver guía completa:** [SECURITY.md](SECURITY.md)

---

### **Validación de Datos (Joi)**
**Archivo:** `src/utils/validators.js`

Todos los eventos Socket.IO validan datos con schemas:
```javascript
schemas = {
    createRoom: Joi.object({ username: Joi.string().min(1).max(20) }),
    joinRoom: Joi.object({ roomCode: Joi.string().length(4), username: ... }),
    castVote: Joi.object({ roomCode: ..., votedFor: ... }),
    // etc.
}
```

### **Seguridad HTTP (Helmet, CORS, Rate Limiting)**
**Archivo:** `server.js`

- **Helmet:** Headers de seguridad
- **CORS:** Configurado según `.env`
- **Rate Limiting:** 100 requests/15 min por IP

### **Panel Admin Protegido**
**Archivo:** `src/middleware/auth.js`

- Basic Auth para `/admin`
- Credenciales en variables de entorno

---

## 🗄️ BASE DE DATOS

### **En Memoria (Map) - Default**
- Salas almacenadas en `Map()` → `rooms`
- Se pierden al reiniciar servidor
- Ideal para desarrollo y pequeña escala

### **PostgreSQL (Opcional) - Producción**
**Archivo:** `database/schema.sql`

Tablas:
- `games` → Historial de partidas
- `players_stats` → Estadísticas por jugador
- `events` → Eventos de analytics

**Conexión:** `src/services/statsService.js` (con pg)

---

## ⚙️ CONFIGURACIÓN (config/config.js)

```javascript
{
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    SOCKET_IO: {
        cors: { origin: "*" },  // Cambiar en producción
        pingTimeout: 60000,
        pingInterval: 25000
    },
    
    GAME: {
        MIN_PLAYERS: 4,
        MAX_PLAYERS: 8,
        VOTING_TIME: 30,        // segundos
        DISCUSSION_TIME: 30,
        DISCONNECT_TIMEOUT: 60  // segundos
    }
}
```

---

## 📊 DATOS DEL JUEGO

### **Categorías (16 total)**
**Archivo:** `src/data/game-data.js`

1. videojuegos (56 palabras)
2. famosos (56 palabras)
3. series (52 palabras)
4. anime (55 palabras)
5. peliculas (56 palabras)
6. deportes (52 palabras)
7. animales (56 palabras)
8. comida (56 palabras)
9. objetos (56 palabras)
10. profesiones (56 palabras)
11. paises (56 palabras)
12. marcas (56 palabras)
13. emociones (52 palabras)
14. lugares (56 palabras)
15. acciones (56 palabras)
16. random (mezcla todas)

**Total:** ~700+ palabras únicas

---

## 🧪 TESTING

### **Tests Automatizados**
**Carpeta:** `tests/`

1. **voting_scenarios.js**
   - Tests de votación con múltiples jugadores
   - Escenarios de empate
   - Continuidad de rondas

2. **integration_test.js**
   - Tests de integración completos
   - Flujo end-to-end

3. **chaos_simulation.js**
   - Stress test
   - Simulación de desconexiones
   - Múltiples salas simultáneas

**Ejecutar:**
```bash
node tests/voting_scenarios.js
TEST_PORT=3001 node tests/voting_scenarios.js
```

---

## 🐛 BUGS CONOCIDOS Y SOLUCIONES

### ✅ **Votación bloqueada en segunda ronda**
**Problema:** Jugador eliminado seguía en `descriptionOrder`  
**Solución:** Filtrar jugadores vivos en `startVoting` (línea 180-206 socket-handlers.js)

### ✅ **Índice de votante incorrecto**
**Problema:** Usaba `room.votes.length % alivePlayers.length`  
**Solución:** Buscar siguiente votante que no haya votado (línea 288-318)

### ✅ **Panel no se actualizaba**
**Problema:** No se enviaba `players` en `yourRole`  
**Solución:** Agregar `players` al payload (línea 152-161 socket-handlers.js)

---

## 🚀 DEPLOYMENT

### **Variables de Entorno Necesarias**
```env
PORT=3000
NODE_ENV=production
SOCKET_IO_CORS_ORIGIN=https://tu-dominio.com
DATABASE_URL=postgresql://...  (opcional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=contraseña-segura
```

### **Plataformas Soportadas**
- ✅ Render
- ✅ Railway
- ✅ Heroku
- ✅ Vercel (con limitaciones Socket.IO)
- ✅ VPS (Ubuntu/Debian con PM2)

### **Archivo Procfile (Heroku/Railway)**
```
web: node server.js
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- `readme.md` → Documentación principal para GitHub
- `ESTRUCTURA.md` → Detalles de estructura (si existe)
- `docs/REFACTORIZACIÓN.md` → Historial de refactorización

---

## 🎯 PRÓXIMAS FEATURES (Roadmap)

- [ ] Sistema de puntuación persistente
- [ ] Chat en vivo durante discusión
- [ ] Salas privadas con contraseña
- [ ] Personalización de avatares
- [ ] Estadísticas históricas de jugadores
- [ ] Modo torneo
- [ ] Integración con Discord

---

## 🔍 BÚSQUEDA RÁPIDA DE FUNCIONALIDADES

### "¿Dónde está...?"

| Funcionalidad | Archivo | Línea aprox. |
|---------------|---------|--------------|
| Crear sala | socket-handlers.js | L42 |
| Asignar roles | game-logic.js | L10-40 |
| Procesar votos | game-logic.js | L80-120 |
| Panel en vivo | index.html + cliente JS | L200-250 |
| Validar datos | validators.js | Todo |
| Reconexión | room-manager.js | L150-180 |
| Emojis | socket-handlers.js | L394 |
| Stats | statsService.js | Todo |
| Tema claro/oscuro | styles.css | :root variables |
| PWA config | manifest.json + sw.js | - |

---

## 🆘 GUÍA DE TROUBLESHOOTING

### "El juego no inicia"
→ Verificar que hay mínimo 4 jugadores  
→ Revisar console del navegador (F12)  
→ Verificar conexión Socket.IO

### "No puedo votar"
→ Verificar que es tu turno (`currentVoterIndex`)  
→ Revisar que no hayas votado ya  
→ Verificar que el jugador votado esté vivo

### "El panel en vivo no actualiza"
→ Verificar evento `yourRole` incluye `players`  
→ Revisar funciones `updateLivePlayersPanel()` en cliente  
→ Verificar IDs de elementos HTML

### "Servidor se cae al desconectar jugador"
→ Verificar manejo de `disconnect` (socket-handlers.js L413)  
→ Revisar que `removePlayerFromRoom` valide existencia

---

## 📞 CONTACTO Y CONTRIBUCIÓN

**Autor:** Juanpi  
**Licencia:** MIT  
**GitHub:** (tu-repo-aqui)

---

## 🔄 HISTORIAL DE CAMBIOS (CHANGELOG)

### **v2.2.0 - Febrero 2026**

**Seguridad:**
- ✅ Creado `SECURITY.md` con guía completa de seguridad
- ✅ Sanitizado `.env` - eliminadas credenciales personales hardcodeadas
- ✅ Actualizado `.env.example` con estructura completa
- ✅ Verificado `.gitignore` protege archivos sensibles
- ✅ Documentadas mejores prácticas de deployment
- ⚠️ **ACCIÓN REQUERIDA:** Cambiar `ADMIN_USER` y `ADMIN_PASS` en producción

**Features:**
- ✅ Panel de jugadores en vivo (estados: vivo, votado, eliminado)
- ✅ Sistema de votación por turnos mejorado
- ✅ Reconexión inteligente con grace period
- ✅ PWA completo (instalable, offline-ready)

**Bugs Corregidos:**
- ✅ Votación bloqueada en segunda ronda (filtrado de jugadores vivos)
- ✅ Índice de votante incorrecto (búsqueda secuencial)
- ✅ Panel no se actualizaba (faltaba `players` en `yourRole`)

---

**🗺️ FIN DEL MAPA DE REFERENCIA**

_Este documento es tu guía completa para navegar el proyecto. Actualízalo cuando agregues nuevas features._
