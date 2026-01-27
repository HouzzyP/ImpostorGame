<div align="center">

# 🎭 El Impostor

### Juego Multiplayer de Deducción Social en Tiempo Real

[![Node.js](https://img.shields.io/badge/Node.js-16%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](package.json)

[🎮 Demo en Vivo](https://tu-demo-url.com) • [📖 Documentación](docs/INDICE.md) • [🐛 Reportar Bug](https://github.com/tu-usuario/ImpostorGame/issues)

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
| 📊 **Estadísticas Finales** | Revelación de roles y resultados al finalizar |
| 🔁 **Continuar en Sala** | Juega múltiples rondas sin salir de la sala |
| 👻 **Modo Espectador** | Observa partidas en curso sin participar |

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

# El juego estará disponible en http://localhost:3000
```

### Configuración (Opcional)

```bash
# Cambiar el puerto (default: 3000)
PORT=8080 npm start

# Modo desarrollo con auto-reload
npm run dev:watch
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
├── 📄 server.js              # Punto de entrada principal
├── 📦 package.json           # Dependencias y scripts
├── 📁 src/                   # Código fuente del servidor
│   ├── handlers/
│   │   └── socket-handlers.js  # Manejo de eventos Socket.IO
│   ├── logic/
│   │   ├── game-logic.js       # Lógica del juego (votos, ganadores)
│   │   └── vote-processor.js   # Procesamiento de votaciones
│   ├── managers/
│   │   ├── player-manager.js   # Gestión de jugadores
│   │   └── room-manager.js     # Gestión de salas
│   ├── utils/
│   │   └── room-utils.js       # Utilidades auxiliares
│   └── data/
│       └── categories-data.js  # Base de datos de palabras
├── 📁 public/                # Cliente (Frontend)
│   ├── index.html            # Interfaz principal
│   ├── script.js             # Lógica del cliente
│   └── styles.css            # Estilos y temas
├── 📁 config/                # Configuración
│   └── game-config.js        # Parámetros del juego
├── 📁 tests/                 # Tests automatizados
│   └── voting_scenarios.js   # Escenarios de votación
└── 📁 docs/                  # Documentación completa
    ├── QUICK_START.md
    ├── REFACTORIZACIÓN.md
    └── ...
```

---

## 🔧 Stack Tecnológico

### Backend
- **Node.js** - Entorno de ejecución JavaScript
- **Express** - Framework web minimalista
- **Socket.IO** - Comunicación bidireccional en tiempo real

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con variables CSS y Grid/Flexbox
- **JavaScript (ES6+)** - Lógica del cliente sin frameworks

### Arquitectura
- **Patrón de módulos** - Separación clara de responsabilidades
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
- Manejo de desconexiones y reconexiones
- Limpieza automática de salas inactivas

---

## 📖 Documentación Completa

### Para Usuarios
- 📘 [Guía Visual](GUÍA_VISUAL.md) - Diagrama de flujo del proyecto

### Para Desarrolladores
- 🚀 [Quick Start](docs/QUICK_START.md) - Instalación paso a paso
- 🔧 [Refactorización](docs/REFACTORIZACIÓN.md) - Arquitectura técnica detallada
- 📂 [Estructura](ESTRUCTURA.md) - Organización de carpetas
- 📚 [Índice Maestro](docs/INDICE.md) - Navegación completa

### Para Managers/Product Owners
- 📈 [Antes/Después](docs/ANTES_DESPUES.md) - Mejoras implementadas
- 📋 [Resumen Ejecutivo](docs/RESUMEN_REFACTORIZACIÓN.md) - Visión general
- 📊 [Estadísticas](docs/ESTADÍSTICAS.md) - Métricas del proyecto

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

- [ ] Sistema de puntuación persistente
- [ ] Chat en vivo durante discusión
- [ ] Salas privadas con contraseña
- [ ] Personalización de avatares
- [ ] Estadísticas históricas de jugadores
- [ ] Modo torneo
- [ ] Integración con Discord

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

**Última actualización**: Enero 2026 | **Versión**: 2.0.0 | **Estado**: ✅ Producción

[⬆ Volver arriba](#-el-impostor)

</div>
