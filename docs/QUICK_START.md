# 🚀 Guía de Inicio Rápido - El Impostor Refactorizado

## ✅ Requisitos

- Node.js 14+ 
- npm instalado
- Puerto 3000 disponible (o configurar PORT en .env)

---

## 📦 Instalación

### 1. Instalar dependencias
```bash
npm install
```

**Dependencias necesarias** (en package.json):
- express
- socket.io

### 2. Verificar estructura
```bash
ls -la
```

Deberías ver estos archivos:
```
✅ server.js              (35 líneas)
✅ socket-handlers.js     (303 líneas)
✅ game-logic.js          (144 líneas)
✅ room-manager.js        (140 líneas)
✅ game-data.js           (350+ líneas)
✅ utils.js               (45 líneas)
✅ public/
   ├── index.html
   ├── styles.css
   └── script.js
✅ package.json
```

---

## 🎮 Ejecutar Servidor

### Opción 1: Comando directo
```bash
node server.js
```

**Salida esperada**:
```
[HH:MM:SS] Servidor de El Impostor ejecutándose en puerto 3000
Accede a http://localhost:3000
```

### Opción 2: NPM Script (si está configurado)
```bash
npm start
```

### Opción 3: Con Nodemon (desarrollo)
```bash
npm install -D nodemon
nodemon server.js
```

---

## 🌐 Acceder al Juego

1. Abre navegador
2. Ve a `http://localhost:3000`
3. ¡Empieza a jugar!

---

## 🔍 Verificar que Funciona

### Test 1: Ver logs del servidor
```
[HH:MM:SS] Usuario conectado: [socketID]
[HH:MM:SS] Sala creada: ABCD
[HH:MM:SS] Juego iniciado en ABCD. Palabra: Mario (videojuegos)
```

### Test 2: Crear sala desde cliente
1. Ingresa tu nombre
2. Click "Crear Sala"
3. Deberías ver un código (4 caracteres)

### Test 3: Verificar empate en votación
1. Crea juego con 4+ jugadores
2. Vota de forma que haya empate (2-2, 1-1-1, etc.)
3. Deberías ver mensaje: "Empate! Nadie fue eliminado"

---

## 🐛 Solucionar Problemas

### Error: "Cannot find module"
```bash
# Solución: Reinstalar dependencias
rm -rf node_modules
npm install
```

### Error: "Port 3000 already in use"
```bash
# Opción 1: Usar otro puerto
PORT=3001 node server.js

# Opción 2: Matar proceso en puerto 3000
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Error: "Cannot GET /"
```bash
# Verificar que public/ existe
ls public/

# Asegurarse que index.html está en public/
```

### Socket.IO no conecta
```bash
# Verificar CORS en server.js está correcto:
cors: {
    origin: '*',
    methods: ['GET', 'POST']
}
```

---

## 📊 Monitoreo

### Ver conexiones activas
```javascript
// En socket-handlers.js línea ~35:
console.log(`[${new Date().toLocaleTimeString()}] Usuario conectado: ${socket.id}`);
```

### Ver salas activas
```javascript
// Agregar a server.js:
setInterval(() => {
    console.log(`Salas activas: ${rooms.size}`);
    rooms.forEach((room, code) => {
        console.log(`  ${code}: ${room.players.length} jugadores`);
    });
}, 10000);
```

### Ver eventos Socket
```javascript
// En socket-handlers.js, agregar al inicio:
socket.onAny((eventName, ...args) => {
    console.log(`Evento recibido: ${eventName}`);
});
```

---

## 🔧 Configuración

### Cambiar puerto
```bash
# Opción 1: Variable de entorno
PORT=8080 node server.js

# Opción 2: Crear archivo .env
# .env
PORT=8080

# Luego en server.js:
require('dotenv').config();
const PORT = process.env.PORT || 3000;
```

### Cambiar tiempo de votación
En [socket-handlers.js](socket-handlers.js#L100):
```javascript
room.config.votingTime = 30; // segundos
```

### Agregar categoría
En [game-data.js](game-data.js):
```javascript
tecnologia: [
    'Smartphone', 'Laptop', 'Tablet',
    // ... agregar aquí
]
```

---

## 📈 Performance

### Optimizaciones implementadas

1. **Map en vez de Object**
   ```javascript
   const rooms = new Map(); // Acceso O(1)
   ```

2. **Funciones puras**
   ```javascript
   // Sin estado global, fácil de paralelizar
   function processVotes(room) { ... }
   ```

3. **Bajo acoplamiento**
   ```javascript
   // Cada módulo independiente
   const { registerSocketHandlers } = require('./socket-handlers');
   ```

### Monitoreo de memoria
```bash
# Ver uso de memoria en tiempo real
node --max-old-space-size=4096 server.js

# Ver con inspector
node --inspect server.js
# Luego: chrome://inspect
```

---

## 🆘 Soporte

### Logs Útiles

**Ver todos los eventos**:
```javascript
// En server.js:
registerSocketHandlers(io, rooms, true); // true = modo debug
```

**Ver estado de una sala**:
```javascript
// En socket-handlers.js:
console.log(JSON.stringify(room, null, 2));
```

### Debug de Socket.IO
```javascript
// En server.js:
const io = socketIO(server, {
    cors: { origin: '*' },
    debug: true // Mostrar logs detallados
});
```

---

## 📚 Documentación

Lee los siguientes archivos para entender la arquitectura:

1. [ANTES_DESPUES.md](ANTES_DESPUES.md) - Comparación visual
2. [REFACTORIZACIÓN.md](REFACTORIZACIÓN.md) - Detalles técnicos
3. [RESUMEN_REFACTORIZACIÓN.md](RESUMEN_REFACTORIZACIÓN.md) - Resumen ejecutivo

### Módulos
- [server.js](server.js) - Punto de entrada
- [socket-handlers.js](socket-handlers.js) - Eventos en tiempo real
- [game-logic.js](game-logic.js) - Lógica del juego
- [room-manager.js](room-manager.js) - Gestión de salas
- [game-data.js](game-data.js) - Base de datos
- [utils.js](utils.js) - Utilidades

---

## ✨ Características Principales

✅ Crear salas privadas  
✅ Invitar amigos por código  
✅ Votación en tiempo real  
✅ Detección automática de empates  
✅ 16 categorías con 700+ palabras  
✅ Roles: Impostor vs Civil  
✅ Estadísticas finales  
✅ Continuar en la misma sala  

---

## 🎯 Próximos Pasos

- [ ] Agregar persistencia (MongoDB, PostgreSQL)
- [ ] Crear sistema de rankings
- [ ] Implementar chat integrado
- [ ] Agregar más roles (Mafia, Detective)
- [ ] Crear app móvil
- [ ] Implementar analytics

---

## 💡 Tips

- 💾 Los datos se guardan en memoria (se pierden al reiniciar)
- 🔒 No hay autenticación (cualquiera puede crear/unirse)
- 🌍 Abierto al público (CORS: \*)
- ⚡ Escalable hasta ~100 jugadores por servidor
- 🐛 Si hay error, revisar consola del navegador (F12)

---

**¡Listo para jugar! 🎮**

