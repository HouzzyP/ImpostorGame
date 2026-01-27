# 📚 Documentación - El Impostor

Bienvenido a la documentación completa del proyecto **El Impostor Refactorizado**.

## 📖 Guías Disponibles

### 🚀 Para Comenzar
- **[QUICK_START.md](QUICK_START.md)** - Instalación y ejecución
  - Requisitos
  - Instalación de dependencias
  - Ejecutar servidor
  - Acceder al juego
  - Solucionar problemas

### 📊 Para Entender las Mejoras
- **[ANTES_DESPUES.md](ANTES_DESPUES.md)** - Comparación visual
  - Arquitectura antes/después
  - Comparativa de código
  - Métricas de mejora
  - Beneficios principales

### 🔧 Para Conocer Detalles Técnicos
- **[REFACTORIZACIÓN.md](REFACTORIZACIÓN.md)** - Arquitectura técnica
  - Estructura de módulos
  - Responsabilidad de cada carpeta
  - Cómo funciona cada módulo
  - Flujo de datos

### 📝 Para Resumen Ejecutivo
- **[RESUMEN_REFACTORIZACIÓN.md](RESUMEN_REFACTORIZACIÓN.md)** - Resumen
  - Checklist completado
  - Bugs corregidos
  - Lecciones aprendidas

### 📑 Para Navegar
- **[INDICE.md](INDICE.md)** - Índice maestro
  - Guías por rol
  - Guías por tarea
  - Búsqueda rápida

### 📈 Para Estadísticas
- **[ESTADÍSTICAS.md](ESTADÍSTICAS.md)** - Análisis cuantitativo
  - Líneas de código
  - Métricas de calidad
  - Performance expectations

## 🗂️ Estructura del Proyecto

```
El Impostor/
├── 📁 src/                     Código fuente
│   ├── handlers/               Manejadores Socket.IO
│   ├── logic/                  Lógica del juego
│   ├── managers/               Gestores
│   ├── utils/                  Utilidades
│   └── data/                   Base de datos
│
├── 📁 public/                  Cliente (Frontend)
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
├── 📁 config/                  Configuración
│   └── config.js
│
├── 📁 docs/                    Documentación (AQUÍ)
│
├── 📁 node_modules/            Dependencias
│
└── server.js                   Punto de entrada
```

## ⚡ Quick Links

### Para Desarrolladores
- Correr servidor: `node server.js`
- Editar configuración: `config/config.js`
- Modificar lógica: `src/logic/`
- Agregar feature: Ver QUICK_START.md

### Para Usuarios
- Acceder juego: http://localhost:3000
- Crear sala: Click en botón
- Unirse: Ingresar código de 4 caracteres

### Para Managers
- ROI: Ver ANTES_DESPUES.md
- Resumen: RESUMEN_REFACTORIZACIÓN.md
- Estadísticas: ESTADÍSTICAS.md

## ✨ Características Principales

✅ Juego multiplayer en tiempo real  
✅ Sistema de votación con detección de empates  
✅ 16 categorías de palabras  
✅ 700+ palabras disponibles  
✅ Roles: Impostor vs Civil  
✅ Estadísticas finales  
✅ Continuar en misma sala  

## 🎯 Próximas Páginas

Comienza por:
1. **QUICK_START.md** si quieres ejecutar el servidor
2. **ANTES_DESPUES.md** si quieres ver qué mejoró
3. **REFACTORIZACIÓN.md** si quieres entender la arquitectura
4. **INDICE.md** si quieres navegar por tema

---

**¿Pregunta no respondida?** Busca en INDICE.md o ESTADÍSTICAS.md
