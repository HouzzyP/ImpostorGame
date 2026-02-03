<div align="center">

# 🎭 El Impostor

### Juego Multiplayer de Deducción Social en Tiempo Real

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.6.0-brightgreen.svg)](package.json)
[![Joi](https://img.shields.io/badge/Validation-Joi-00A36C)](https://joi.dev/)

</div>

---

## 🌟 Descripción

**El Impostor** es un juego multijugador en tiempo real donde la estrategia y el engaño se encuentran. Un grupo de jugadores recibe una palabra secreta, pero los **impostores** no la conocen. A través de descripciones sutiles y votaciones estratégicas, los inocentes deben descubrir a los impostores antes de ser eliminados.

### ✨ Características Principales

| Característica | Descripción |
|----------------|-------------|
| 🎲 **4-8 Jugadores** | Partidas dinámicas con configuración flexible de impostores |
| 🔄 **Tiempo Real** | Sincronización instantánea con Socket.IO |
| 🗳️ **Sistema de Votación** | Votación por turnos con detección automática de empates |
| 📚 **16 Categorías** | Más de 700 palabras en categorías como Animales, Deportes, Comida, y más |
| 👥 **Panel en Vivo** | Seguimiento visual del estado de cada jugador (vivo, votado, eliminado) |
| 🎨 **Tema Claro/Oscuro** | Interfaz moderna con cambio de tema |
| 😄 **Reacciones en Vivo** | Sistema de emojis para interactuar durante la votación |
| 📊 **Estadísticas Avanzadas** | Win Rate automático, Partidas Jugadas, Votos Correctos y Victorias por rol |
| 🌍 **Estadísticas Globales** | Contador público de partidas jugadas en el footer |
| 👥 **Panel Global** | Seguimiento persistente de jugadores vivos sin parpadeos entre rondas |
| 🎨 **UI Optimizada** | Lobby "side-by-side", Votación en grilla y badges para gestión de turnos |
| � **Reconexión Inteligente** | Grace Period de 45s para conexiones inestables (móviles) |
| �️ **Seguridad (Joi)** | Validación estricta de datos para prevenir inyecciones y crashes |
| 🧩 **Frontend Modular** | Código organizado en módulos ES6 (game, ui, socket, utils) |
| 👻 **Modo Espectador** | Observa partidas en curso sin participar || 📈 **Analytics & Privacy** | Sistema de tracking GDPR-compliant con cookie consent |
| 🗄️ **Base de Datos** | PostgreSQL/Supabase para estadísticas y analytics persistentes |
| 🌐 **PWA** | Instalable como app nativa con service workers |
| ❤️ **Health Monitoring** | Endpoint /health para monitoring y auto-cleanup de salas |
---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 16.0 o superior
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/ImpostorGame.git
cd ImpostorGame

# Instalar dependencias
npm install

# Iniciar servidor
npm start

# El juego estará disponible en http://localhost:4000
```

### Configuración (Opcional)

Crea un archivo `.env` basado en `.env.example`:

```bash
# Servidor
PORT=4000
NODE_ENV=production

# Seguridad
ALLOWED_ORIGINS=https://tudominio.com

# Base de Datos (opcional - para analytics persistentes)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=verify-full

# Admin Panel
ADMIN_USER=admin
ADMIN_PASS=secreto
```

```bash
# Modo desarrollo con auto-reload
npm run dev
```

---

## 🎮 Cómo Jugar

### Para Jugadores

1. **Ingresa tu nombre** - Identifícate en la pantalla inicial
2. **Crea o únete a una sala** - Usa el código de 4 letras para conectarte
3. **Espera en el lobby** - El host configura la partida y inicia cuando hay 4+ jugadores
4. **Recibe tu rol** - Serás un **Inocente** (ves la palabra) o un **Impostor** (debes descubrirla)
5. **Describe la palabra** - Turnos aleatorios para describir sin ser obvio
6. **Vota estratégicamente** - Elimina jugadores sospechosos por turnos
7. **Gana tu objetivo**:
   - **Inocentes**: Eliminar todos los impostores
   - **Impostores**: Sobrevivir hasta igualar o superar a los inocentes

### Controles del Host

- ⚙️ **Configurar categoría** - Elige entre 16 categorías temáticas
- 👥 **Ajustar impostores** - 1-2 impostores según cantidad de jugadores
- ▶️ **Iniciar partida** - Comienza cuando hay mínimo 4 jugadores
- 🗳️ **Iniciar votación** - Activa la fase de votación cuando todos describieron
- 🔄 **Continuar o Reiniciar** - Al finalizar, vuelve al lobby o juega otra ronda

---

## 🏗️ Arquitectura del Proyecto

```
ImpostorGame/
├── 📄 server.js              # Punto de entrada del servidor
├── 📦 package.json           # Dependencias y scripts
├── 📁 src/                   # Backend (Node.js)
│   ├── handlers/
│   │   ├── socket-handlers.js  # Eventos Socket.IO + Reconexión
│   │   └── chat-handlers.js    # Chat con rate-limiting
│   ├── logic/
│   │   └── game-logic.js       # Votos, roles, ganadores
│   ├── managers/
│   │   └── room-manager.js     # Salas, jugadores, grace period
│   ├── utils/
│   │   ├── utils.js            # Helpers generales
│   │   └── validators.js       # Schemas Joi (seguridad)
│   └── data/
│       └── game-data.js        # 700+ palabras, 16 categorías
├── 📁 public/                # Frontend (ES6 Modules)
│   ├── index.html            # Interfaz principal (PWA)
│   ├── styles.css            # Estilos y temas
│   ├── js/
│   │   ├── main.js           # Entry point modular
│   │   └── modules/
│   │       ├── game.js       # Estado del juego (GameState)
│   │       ├── ui.js         # Renderizado y DOM
│   │       ├── socket.js     # Listeners de Socket.IO
│   │       └── utils.js      # Toast, clipboard, helpers
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service Worker (offline)
├── 📁 config/                # Configuración
│   └── config.js             # Puerto, CORS, Socket.IO
└── 📁 tests/                 # Testing
    └── chaos_simulation.js   # Stress test del servidor
```

---

## 🔧 Stack Tecnológico

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express** - Framework web minimalista
- **Socket.IO** - Comunicación bidireccional en tiempo real
- **Joi** - Validación de datos (seguridad)
- **Helmet + CORS** - Headers de seguridad HTTP

### Frontend
- **HTML5** - Estructura semántica (PWA ready)
- **CSS3** - Variables CSS, Grid/Flexbox, temas
- **JavaScript ES6 Modules** - Código modular nativo (sin bundler)

### Arquitectura
- **Módulos ES6** - `game.js`, `ui.js`, `socket.js` separados
- **Event-driven** - Comunicación asíncrona con eventos
- **State management** - Gestión centralizada del estado del juego

---

## 📊 Características Técnicas Destacadas

### 🎯 Sistema de Votación Avanzado
- Votación secuencial por turnos
- Detección automática de empates
- Actualización en tiempo real del estado de votantes
- Filtrado dinámico de jugadores eliminados

### 👥 Panel de Jugadores en Vivo
- Estados visuales: Vivo (●), Votado (✓), Eliminado (✗)
- Sincronización automática entre pantallas
- Persistencia del estado a través de rondas

### 🎨 Interfaz Responsiva
- Tema claro/oscuro con persistencia local
- Diseño adaptable a diferentes tamaños de pantalla
- Animaciones suaves y feedback visual

### 🔐 Gestión de Salas Robusta
- Códigos únicos de 4 letras
- Validación de permisos (host/jugador/espectador)
- **Grace Period de 45s** para reconexión (ideal para móviles)
- Validación de inputs con Joi (anti-inyección)

---

## �️ Seguridad

- **Joi Validation**: Todos los inputs de Socket.IO son validados contra schemas estrictos
- **Rate Limiting**: Límite de mensajes de chat (8 msgs/10s, bloqueo 5s)
- **Helmet**: Headers HTTP seguros
- **CORS configurado**: Solo orígenes permitidos
- **Reconexión segura**: Solo usuarios previamente conectados pueden reconectar

---

## 🧪 Testing

```bash
# Ejecutar tests de votación
npm test

# Tests con puerto personalizado
TEST_PORT=3001 node tests/voting_scenarios.js
```

Los tests incluyen:
- ✅ Escenarios de votación con múltiples jugadores
- ✅ Detección de empates
- ✅ Eliminación de jugadores
- ✅ Continuidad de rondas

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Para contribuir:

1. **Fork** el repositorio
2. Crea una **rama feature** (`git checkout -b feature/NuevaCaracteristica`)
3. **Commit** tus cambios (`git commit -m 'Agrega nueva característica'`)
4. **Push** a la rama (`git push origin feature/NuevaCaracteristica`)
5. Abre un **Pull Request**

### Guías de Contribución
- Mantén la separación de responsabilidades entre módulos
- Sigue el estilo de código existente
- Actualiza la documentación correspondiente
- Agrega tests para nuevas funcionalidades

---

## 🐛 Reportar Issues

¿Encontraste un bug? [Abre un issue](https://github.com/tu-usuario/ImpostorGame/issues) con:
- Descripción clara del problema
- Pasos para reproducirlo
- Comportamiento esperado vs. real
- Screenshots si aplica

---

## 📝 Roadmap

- [x] Sistema de puntuación persistente (Local Stats + Win Rate)
- [x] Chat en vivo durante discusión
- [x] Frontend modular (ES6 Modules)
- [x] Reconexión inteligente (Grace Period 45s)
- [x] Validación de seguridad (Joi)
- [x] PWA instalable
- [x] Base de datos PostgreSQL con analytics
- [x] Sistema de privacidad GDPR-compliant
- [x] Admin dashboard con métricas
- [x] Health check y auto-cleanup de salas
- [x] Logs estructurados con Winston
- [x] Compresión Gzip para responses
- [x] Estadísticas públicas sin autenticación
- [x] Contador global de partidas en footer
- [ ] Salas privadas con contraseña
- [ ] Personalización de avatares
- [ ] Redis para escalabilidad horizontal
- [ ] Integración con Discord/Telegram

---

## 🏗️ Arquitectura

```
ImpostorGame/
├── server.js              # Servidor Express + Socket.IO
├── config/                # Configuración centralizada
├── database/              # PostgreSQL connection pool
├── src/
│   ├── handlers/          # Socket.IO event handlers
│   ├── managers/          # Lógica de salas y jugadores
│   ├── game/              # Mecánicas del juego
│   ├── services/          # Analytics y estadísticas
│   └── utils/             # Validaciones y helpers
├── public/                # Frontend (HTML, CSS, JS)
│   ├── js/
│   │   └── modules/       # ES6 modules (socket, ui, game, analytics)
│   ├── styles.css         # Tema dark/light
│   └── manifest.json      # PWA config
├── private/               # Admin dashboard (auth protegido)
└── tests/                 # Tests de integración

```

### Stack Tecnológico

- **Backend**: Node.js 20+, Express 4.18, Socket.IO 4.6
- **Frontend**: Vanilla JavaScript (ES6 Modules), CSS Variables
- **Base de Datos**: PostgreSQL/Supabase
- **Logging**: Winston (structured logs, file rotation en producción)
- **Seguridad**: Helmet, CORS, Rate Limiting (HTTP + Socket), Joi validation
- **Analytics**: Custom event tracking con sessionStorage
- **Deploy**: Render (Web Service + PostgreSQL)

---

## 📜 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Juanpi**

---

## 🙏 Agradecimientos

- Gracias 412 por la idea, creditos totales a ellos
- Construido con ❤️ usando tecnologías open source

---

<div align="center">

**⭐ Si te gusta el proyecto, dale una estrella en GitHub ⭐**

**Última actualización**: Febrero 2026 | **Versión**: 2.6.0 | **Estado**: ✅ Producción | **Live**: [elimpostormp.com](https://elimpostormp.com)

[⬆ Volver arriba](#-el-impostor)

</div>
