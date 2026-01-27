#  El Impostor - Juego Multiplayer

Juego de deducci�n social en tiempo real para 4-8 jugadores.

##  Caracter�sticas

-  Juego multiplayer en tiempo real con Socket.IO
-  2 roles: Impostor vs Civil
-  Votaci�n en vivo con detecci�n de empates
-  16 categor�as y 700+ palabras
-  Estad�sticas finales
-  Continuar en la misma sala

##  Inicio R�pido

\\\ash
# Instalar dependencias
npm install

# Ejecutar servidor
npm start

# Acceder a http://localhost:3000
\\\

##  Estructura del Proyecto

\\\
ImpostorGame/
 server.js           Punto de entrada
 src/                C�digo fuente
    handlers/       Manejadores Socket.IO
    logic/          L�gica del juego
    managers/       Gestores
    utils/          Utilidades
    data/           Base de datos
 config/             Configuraci�n
 public/             Cliente (Frontend)
 docs/               Documentaci�n completa
 package.json        Dependencias
\\\

##  Documentaci�n

### Para Usuarios
- [GU�A_VISUAL.md](GU�A_VISUAL.md) - Estructura visual del proyecto

### Para Desarrolladores
- [docs/QUICK_START.md](docs/QUICK_START.md) - Instalaci�n y ejecuci�n
- [docs/REFACTORIZACI�N.md](docs/REFACTORIZACI�N.md) - Detalles t�cnicos
- [ESTRUCTURA.md](ESTRUCTURA.md) - Estructura de carpetas
- [docs/INDICE.md](docs/INDICE.md) - �ndice maestro

### Para Managers
- [docs/ANTES_DESPUES.md](docs/ANTES_DESPUES.md) - Mejoras realizadas
- [docs/RESUMEN_REFACTORIZACI�N.md](docs/RESUMEN_REFACTORIZACI�N.md) - Resumen ejecutivo
- [docs/ESTAD�STICAS.md](docs/ESTAD�STICAS.md) - An�lisis cuantitativo

##  C�mo Jugar

1. Entra a http://localhost:3000
2. Escribe tu nombre
3. Crea una sala o �nete a una existente
4. El juego asignar� un rol (Impostor o Civil)
5. Discute con otros jugadores
6. Vota para eliminar sospechosos
7. �Gana si logras tu objetivo!

##  Tecnolog�a

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Base de datos**: En memoria (Map)

##  Proyecto Refactorizado

Versi�n 2.0 con arquitectura moderna:
-  6 m�dulos organizados
-  1140 l�neas de documentaci�n
-  95% testeable
-  Bajo acoplamiento

Ver: [docs/REFACTORIZACI�N.md](docs/REFACTORIZACI�N.md)

##  Contribuir

Para agregar features o reportar bugs:

1. Entiende la estructura: [ESTRUCTURA.md](ESTRUCTURA.md)
2. Modifica el m�dulo correspondiente
3. Mant�n responsabilidad �nica
4. Actualiza documentaci�n

##  Licencia

MIT

##  Autor

Juanpi

---

**�ltima actualizaci�n**: Enero 2026  
**Versi�n**: 2.0 (Refactorizado)  
**Estado**:  Listo para producci�n
