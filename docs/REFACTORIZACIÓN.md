# Refactorización de El Impostor - Estructura Modular

## 📋 Descripción

El servidor `server.js` original tenía **561 líneas** con toda la lógica mezclada. Se refactorizó en 5 módulos independientes para mejor mantenibilidad, legibilidad y testabilidad.

## 📁 Estructura de Archivos

```
ImpostorGame/
├── server.js                 # 35 líneas - Configuración principal
├── game-data.js              # 350+ líneas - Base de datos de palabras y categorías
├── utils.js                  # 45 líneas - Funciones auxiliares reutilizables
├── game-logic.js             # 144 líneas - Lógica del juego (roles, votación, ganador)
├── room-manager.js           # 140 líneas - Gestión de salas y jugadores
├── socket-handlers.js        # 303 líneas - Manejadores de eventos Socket.IO
└── public/
    ├── index.html
    ├── styles.css
    └── script.js
```

## 📚 Módulos

### 1. **server.js** (Servidor Principal)
- Configuración de Express, HTTP y Socket.IO
- Gestión del PORT
- Inicialización de CORS
- Registro de manejadores Socket.IO
- Inicio del servidor

**Responsabilidad**: Punto de entrada y configuración del servidor

---

### 2. **game-data.js** (Base de Datos)
Contiene:
- `wordDatabase` - 16 categorías con 40-50 palabras cada una
- `categoryNames` - Nombres legibles de las categorías

**Categorías**:
- Videojuegos, Famosos, Series, Anime, Películas
- Música, Deportes, Países, Comidas, Marcas
- Apps, Youtubers, Memes, Profesiones, Animales, Tecnología

**Responsabilidad**: Almacenamiento centralizado de datos de palabras

---

### 3. **utils.js** (Utilidades)
Funciones auxiliares:
- `generateRoomCode()` - Genera código único de sala (4 caracteres)
- `shuffleArray(array)` - Mezcla aleatoria (Fisher-Yates)
- `getRandomCategory(categoryNames)` - Selecciona categoría aleatoria
- `getRandomWord(words)` - Selecciona palabra aleatoria

**Responsabilidad**: Funciones reutilizables sin estado

---

### 4. **game-logic.js** (Lógica del Juego)
Funciones de lógica de juego:
- `assignRoles(players)` - Asigna rol (impostor/civil) a cada jugador
- `assignWordAndCategory(players, category, word)` - Asigna palabra/categoría
- `processVotes(room, io)` - Procesa votos y determina eliminado
  - **Nuevo**: Detecta empates y retorna `isTie: true` si hay varios jugadores con máximo de votos
  - **Nota**: En caso de empate, retorna `eliminated: null` (no se elimina nadie)
- `checkGameWinner(room)` - Verifica condición de victoria
- `getGameStats(room)` - Obtiene estadísticas finales

**Responsabilidad**: Reglas y mecánicas del juego

---

### 5. **room-manager.js** (Gestor de Salas)
Funciones de gestión:
- `createRoom(roomCode, player)` - Crea nueva sala
- `addPlayerToRoom(room, player)` - Agrega jugador a sala
- `removePlayerFromRoom(room, playerId)` - Remueve jugador
- `getPlayerFromRoom(room, playerId)` - Busca jugador por ID
- `getRoomHost(room)` - Obtiene anfitrión de la sala
- `resetRoomForNewRound(room)` - Reinicia configuración para nueva ronda
- `getRoomPublicInfo(room)` - Retorna info pública sin datos sensibles

**Responsabilidad**: CRUD de salas y jugadores

---

### 6. **socket-handlers.js** (Manejadores Socket.IO)
Registra todos los eventos Socket.IO:

**Eventos implementados**:
- `createRoom` - Crear nueva sala
- `joinRoom` - Unirse a sala existente
- `updateConfig` - Actualizar configuración (solo anfitrión)
- `randomCategory` - Seleccionar categoría aleatoria
- `startGame` - Iniciar partida
- `startVoting` - Iniciar fase de votación
- `castVote` - Emitir voto
- `finishVoting` - Finalizar votación
  - Detecta empates
  - Emite evento `tieVoting` si hay empate
  - Emite `playerEliminated` si hay claro ganador
  - Verifica condición de victoria
- `resetGame` - Reiniciar juego (volver a lobby)
- `continueInRoom` - Continuar en la misma sala después de terminar
- `disconnect` - Manejo de desconexión

**Responsabilidad**: Comunicación en tiempo real

---

## 🔄 Flujo de Datos

```
Cliente (WebSocket)
    ↓
socket-handlers.js (Recibe evento)
    ↓
room-manager.js (Busca/modifica sala)
    ↓
game-logic.js (Aplica reglas)
    ↓
socket-handlers.js (Emite respuesta)
    ↓
Cliente (recibe evento actualizado)
```

---

## 🎮 Eventos Principales

### 1. Crear Sala
```
Cliente → createRoom → socket-handlers → room-manager → Cliente
```

### 2. Iniciar Juego
```
socket-handlers.startGame()
  ├─ game-data (obtiene palabras)
  ├─ game-logic.assignRoles()
  ├─ game-logic.assignWordAndCategory()
  └─ Emite 'gameStarted' a todos
```

### 3. Votación
```
socket-handlers.castVote()
  ├─ Valida voto
  ├─ Registra en room.votes
  └─ Emite 'voteCast'

socket-handlers.finishVoting()
  ├─ game-logic.processVotes() → detecta empate
  ├─ Si empate: emite 'tieVoting'
  ├─ Si no empate: elimina jugador
  ├─ game-logic.checkGameWinner()
  ├─ Emite 'playerEliminated' o 'continueGame'
  └─ Si juego termina: emite 'gameEnded'
```

### 4. Continuar en Sala
```
socket-handlers.continueInRoom()
  ├─ room-manager.resetRoomForNewRound()
  ├─ game-logic.assignRoles()
  ├─ Emite 'gameStarted'
  └─ Nueva ronda con mismos jugadores
```

---

## 🆕 Cambios Recientes

### Bug Fix: Empate en Votación
**Antes**: Cuando había empate, se eliminaba jugador aleatorio
**Ahora**: Detecta empate y continúa sin eliminar a nadie
- `finishVoting` retorna `isTie: true`
- Emite `tieVoting` con info de jugadores empatados
- Juego continúa automáticamente después de 2 segundos

### Bug Fix: GameResetToLobby Error
**Antes**: `TypeError: Cannot convert undefined or null to object at Object.assign`
**Ahora**: Ruta correcta basada en flag `isHost`

---

## 🚀 Ventajas de la Refactorización

| Aspecto | Antes | Después |
|---------|-------|---------|
| Líneas por archivo | 561 | 35-350 |
| Responsabilidad | Mixta | Única |
| Testabilidad | Difícil | Fácil |
| Mantenibilidad | Baja | Alta |
| Reutilización | Nula | Alta |
| Escalabilidad | Limitada | Excelente |

---

## 📖 Cómo Usar

### Para agregar nueva categoría:
1. Abrir `game-data.js`
2. Agregar array a `wordDatabase`
3. Agregar entrada a `categoryNames`

### Para agregar nueva función auxiliar:
1. Abrir `utils.js`
2. Crear función
3. Exportar con `module.exports`

### Para cambiar lógica del juego:
1. Abrir `game-logic.js`
2. Modificar función correspondiente
3. No afecta resto del código

### Para agregar nuevo evento Socket:
1. Abrir `socket-handlers.js`
2. Crear nuevo `socket.on()` dentro de `registerSocketHandlers`
3. Usar módulos importados según sea necesario

---

## 🧪 Testing

Con la estructura modular es fácil testear cada módulo:

```javascript
// Testear game-logic sin necesidad de Socket.IO
const { assignRoles, processVotes } = require('./game-logic');

// Testear room-manager
const { createRoom, addPlayerToRoom } = require('./room-manager');

// Testear utils
const { generateRoomCode, shuffleArray } = require('./utils');
```

---

## 📝 Notas

- Cada módulo exporta solo lo necesario
- No hay dependencias circulares
- Fácil de debuggear (logs en cada módulo)
- Comentarios de JSDoc para documentación
- Nombres de funciones descriptivos

