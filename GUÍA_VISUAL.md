# 🎯 Guía Visual - Nueva Estructura Organizada

## Antes vs Después

### ❌ ANTES (Monolito)
```
ImpostorGame/
├── server.js              ← 35 líneas
├── socket-handlers.js     ← 256 líneas (MEZCLADO)
├── game-logic.js          ← 128 líneas (MEZCLADO)
├── room-manager.js        ← 137 líneas (MEZCLADO)
├── game-data.js           ← 203 líneas (MEZCLADO)
├── utils.js               ← 34 líneas (MEZCLADO)
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── package.json
└── Documentación (archivos sueltos)
```

**Problemas**:
- 😕 Archivos revueltos en carpeta raíz
- 😕 Difícil navegar
- 😕 Desorganizado

---

### ✅ DESPUÉS (Organizado)
```
ImpostorGame/
│
├── server.js              ← PUNTO DE ENTRADA (limpio y simple)
│
├── 📁 src/                ← TODO EL CÓDIGO FUENTE ORGANIZADO
│   ├── 📁 handlers/       ← Manejadores Socket
│   │   └── socket-handlers.js
│   ├── 📁 logic/          ← Lógica del juego
│   │   └── game-logic.js
│   ├── 📁 managers/       ← Gestores
│   │   └── room-manager.js
│   ├── 📁 utils/          ← Utilidades
│   │   └── utils.js
│   └── 📁 data/           ← Datos
│       └── game-data.js
│
├── 📁 config/             ← CONFIGURACIÓN CENTRALIZADA
│   └── config.js
│
├── 📁 public/             ← CLIENTE (sin cambios)
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
├── 📁 docs/               ← DOCUMENTACIÓN ORGANIZADA
│   ├── README.md
│   ├── QUICK_START.md
│   ├── ANTES_DESPUES.md
│   ├── REFACTORIZACIÓN.md
│   ├── RESUMEN_REFACTORIZACIÓN.md
│   ├── INDICE.md
│   └── ESTADÍSTICAS.md
│
├── .env.example           ← Variables de entorno
├── ESTRUCTURA.md          ← Este archivo
├── package.json
└── (resto de archivos)
```

**Ventajas**:
- ✅ Código separado en carpetas lógicas
- ✅ Fácil de navegar
- ✅ Profesional y escalable
- ✅ Documentación centralizada
- ✅ Configuración clara

---

## 🗺️ Mapa de Navegación

### Quiero modificar...

| Qué | Carpeta | Archivo |
|-----|---------|---------|
| **Palabra del juego** | `src/data/` | `game-data.js` |
| **Lógica de votación** | `src/logic/` | `game-logic.js` |
| **Evento Socket.IO** | `src/handlers/` | `socket-handlers.js` |
| **Gestión de salas** | `src/managers/` | `room-manager.js` |
| **Funciones auxiliares** | `src/utils/` | `utils.js` |
| **Puertos/configuración** | `config/` | `config.js` |
| **Interfaz de usuario** | `public/` | `index.html`, `styles.css`, `script.js` |
| **Documentación** | `docs/` | `*.md` |

---

## 🎓 Ejemplos de Uso

### Agregar nueva categoría de palabras

```javascript
// Archivo: src/data/game-data.js

const wordDatabase = {
    videojuegos: [...],
    famosos: [...],
    miNuevaCategoria: [    // ← AQUÍ
        'palabra1', 'palabra2', 'palabra3',
        // ...
    ]
};
```

### Cambiar tiempo de votación

```javascript
// Archivo: config/config.js

GAME_CONFIG: {
    votingTime: 30,  // ← CAMBIAR AQUÍ
    discussionTime: 30,
}
```

### Agregar nuevo evento Socket

```javascript
// Archivo: src/handlers/socket-handlers.js

socket.on('miNuevoEvento', (data) => {
    // ← Agregar aquí
});
```

### Modificar lógica de votación

```javascript
// Archivo: src/logic/game-logic.js

function processVotes(room, io) {
    // ← Modificar aquí
}
```

---

## 📊 Tamaño por Carpeta

```
src/            803 líneas (Código)
  ├── handlers/  256 líneas (32%)
  ├── data/      203 líneas (25%)
  ├── managers/  137 líneas (17%)
  ├── logic/     128 líneas (16%)
  ├── utils/      34 líneas (4%)
  └── config/     45 líneas (6%)

docs/           1140 líneas (Documentación)
  └── 7 archivos .md

public/         1192 líneas (Frontend)
  ├── script.js  364 líneas
  ├── styles.css 609 líneas
  └── index.html 219 líneas

TOTAL:          3135 líneas
```

---

## 🔗 Diagrama de Dependencias

```
                   server.js (35 líneas)
                        │
                        ├─> config/config.js
                        │
                        └─> src/handlers/socket-handlers.js
                                │
                                ├─> src/logic/game-logic.js
                                │        └─> src/utils/utils.js
                                │
                                ├─> src/managers/room-manager.js
                                │
                                ├─> src/data/game-data.js
                                │
                                └─> src/utils/utils.js

              public/
                ├─> index.html (HTML puro)
                ├─> styles.css (CSS puro)
                └─> script.js (Socket.IO cliente)
```

---

## ⚙️ Flujo de Datos

```
1. Cliente conecta
   └─> public/script.js
       └─> Socket.IO

2. Servidor recibe evento
   └─> src/handlers/socket-handlers.js
       └─> Valida y procesa

3. Lógica de juego
   └─> src/logic/game-logic.js
       └─> Calcula resultado

4. Actualiza salas
   └─> src/managers/room-manager.js
       └─> Guarda estado

5. Obtiene datos
   └─> src/data/game-data.js
       └─> Palabras/categorías

6. Funciones auxiliares
   └─> src/utils/utils.js
       └─> shuffleArray(), generateCode(), etc.

7. Envía respuesta al cliente
   └─> public/script.js
       └─> Actualiza interfaz
```

---

## 🚀 Para Empezar

```bash
# 1. Ver estructura
ls -R src/
ls -R config/
ls -R docs/

# 2. Instalar dependencias
npm install

# 3. Ejecutar servidor
npm start

# 4. Abrir navegador
http://localhost:3000

# 5. Leer documentación
cat docs/QUICK_START.md
```

---

## 📋 Checklist de Organización

- ✅ Código en `/src`
- ✅ Configuración en `/config`
- ✅ Documentación en `/docs`
- ✅ Frontend en `/public`
- ✅ Puntos de entrada claros
- ✅ Imports bien estructurados
- ✅ Responsabilidad única por módulo
- ✅ Fácil de escalar

---

## 💡 Tips de Navegación

### VSCode
```
Ctrl+P                  Buscar archivo
Ctrl+Shift+P           Abrir comando
Ctrl+H                 Buscar y reemplazar
Ctrl+L                 Ir a línea
Ctrl+/                 Comentar/descomentar
```

### Terminal
```bash
cd src/handlers/        Ir a carpeta
ls -la                  Listar archivos
node -c file.js         Validar sintaxis
npm start               Ejecutar servidor
```

---

## 🎯 Conclusión

La nueva estructura organizada permite:

✅ **Fácil navegación** - Archivos en lugares lógicos  
✅ **Escalabilidad** - Agregar features sin confusión  
✅ **Profesionalismo** - Estructura estándar de proyectos  
✅ **Documentación** - Centralizada y accesible  
✅ **Mantenimiento** - Cambios aislados y seguros  

**Resultado**: Un proyecto listo para producción. 🚀

