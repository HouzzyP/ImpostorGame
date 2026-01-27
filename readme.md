# 🎭 El Impostor - Juego Online

Juego multijugador en tiempo real del famoso "Impostor" con sistema de votación.

## 📋 Requisitos Previos

- Node.js instalado (versión 14 o superior)
- npm (viene con Node.js)

## 🚀 Instalación

### 1. Crear la estructura de carpetas

```bash
mkdir el-impostor-game
cd el-impostor-game
mkdir public
```

### 2. Colocar los archivos

- Guarda `package.json` en la carpeta raíz
- Guarda `server.js` en la carpeta raíz
- Guarda `index.html` en la carpeta `public/`

Tu estructura debe verse así:
```
el-impostor-game/
├── package.json
├── server.js
└── public/
    └── index.html
```

### 3. Instalar dependencias

```bash
npm install
```

## 🎮 Cómo Ejecutar

### Opción A: Jugar en red local (mismo WiFi)

1. **Inicia el servidor:**
```bash
npm start
```

2. **Encuentra tu IP local:**
   - Windows: Abre CMD y escribe `ipconfig`, busca "IPv4 Address"
   - Mac/Linux: Abre Terminal y escribe `ifconfig`, busca "inet"
   - Ejemplo de IP: `192.168.1.100`

3. **Conéctate desde tus dispositivos:**
   - En tu PC: `http://localhost:3000`
   - Desde otros dispositivos en tu WiFi: `http://TU_IP:3000`
   - Ejemplo: `http://192.168.1.100:3000`

### Opción B: Jugar desde internet (con ngrok)

1. **Instala ngrok:**
   - Descarga desde: https://ngrok.com/download
   - Crea una cuenta gratuita

2. **Inicia el servidor:**
```bash
npm start
```

3. **En otra terminal, inicia ngrok:**
```bash
ngrok http 3000
```

4. **Comparte la URL:**
   - ngrok te dará una URL pública (ej: `https://abc123.ngrok.io`)
   - Tus amigos pueden conectarse desde cualquier lugar usando esa URL

## 🎯 Cómo Jugar

### Creación de Sala

1. El **host** abre el juego y crea una sala
2. Se genera un **código de 6 caracteres**
3. El host configura:
   - Categoría (Videojuegos, Famosos, Series, etc.)
   - Número de impostores (1-6)

### Unirse a la Sala

1. Los jugadores ingresan el **código de sala**
2. Esperan a que el host inicie la partida

### Fase de Juego

1. Cada jugador ve su rol:
   - **Inocente:** Ve la palabra asignada
   - **Impostor:** Solo ve "IMPOSTOR"

2. Los jugadores describen la palabra por turnos sin ser literales

### Votación

1. El host inicia la votación
2. **Orden aleatorio** de votación cada ronda
3. Cada jugador vota de a uno en su turno
4. El más votado es **eliminado**
5. Se revela si era impostor o inocente

### Condiciones de Victoria

- **Inocentes ganan:** Eliminan a todos los impostores
- **Impostores ganan:** Quedan en mayoría (1v1, 2v2, etc.)

## 🎨 Categorías Disponibles

- 🎮 Videojuegos (38 palabras)
- ⭐ Famosos (38 palabras)
- 📺 Series (38 palabras)
- 🎨 Personajes Animados (39 palabras)
- ⚽ Deportes (38 palabras)
- 🌍 Países (42 palabras)
- 🎬 Películas (39 palabras)
- 📦 Objetos (39 palabras)

## ⚙️ Configuraciones

- **Jugadores:** 4 mínimo, 12 máximo
- **Impostores:** 1 a 6 (configurable)
- **Sin timer:** Juego por rondas de votación

## 🔧 Solución de Problemas

### El servidor no inicia

```bash
# Asegúrate de estar en la carpeta correcta
cd el-impostor-game

# Reinstala las dependencias
npm install
```

### No puedo conectarme desde otro dispositivo

1. Verifica que estén en la misma red WiFi
2. Desactiva el firewall temporalmente
3. Verifica la IP con `ipconfig` o `ifconfig`

### Error "EADDRINUSE"

El puerto 3000 está ocupado. Cambia el puerto en `server.js`:
```javascript
const PORT = 3001; // Cambia a otro puerto
```

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Móviles y tablets
- ✅ Múltiples dispositivos simultáneos

## 🛠️ Características Técnicas

- **Backend:** Node.js + Express + Socket.io
- **Frontend:** HTML + CSS + JavaScript vanilla
- **Comunicación:** WebSockets en tiempo real
- **Estado compartido:** Sincronización automática

## 📝 Notas Importantes

- El servidor debe estar corriendo mientras juegan
- Si usas ngrok, la URL cambia cada vez que lo reinicias
- Los jugadores pueden desconectarse y el juego continúa
- Si el host se desconecta, otro jugador se vuelve host automáticamente

## 🎉 ¡Listo para Jugar!

Ahora puedes disfrutar del juego con tus amigos. ¡Buena suerte descubriendo al impostor!

---

**Creado por Claude - Anthropic**
