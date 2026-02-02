# 🔐 GUÍA DE SEGURIDAD - EL IMPOSTOR

## ⚠️ IMPORTANTE - ANTES DE SUBIR A GITHUB

### ✅ Checklist de Seguridad

Antes de hacer `git push`, verifica:

- [ ] El archivo `.env` NO está en Git (debe estar en `.gitignore`)
- [ ] `.env.example` solo tiene valores de ejemplo (sin credenciales reales)
- [ ] No hay contraseñas hardcodeadas en el código
- [ ] Variables de entorno se usan con `process.env`
- [ ] Credenciales de admin cambiadas de valores por defecto

---

## 🔒 Archivos Sensibles (NUNCA SUBIR)

### **`.env`** - Variables de Entorno
**Contiene:**
- `DATABASE_URL` → Credenciales de base de datos (PostgreSQL/Supabase)
- `ADMIN_USER` y `ADMIN_PASS` → Credenciales del panel admin

**Protección:**
- ✅ Está en `.gitignore`
- ✅ Solo existe en local y servidor de producción
- ✅ Configurar en variables de entorno del hosting (Render/Railway/Vercel)

---

## 🛡️ Configuración de Producción

### 1. **Variables de Entorno Requeridas**

```bash
# Servidor
PORT=3000
NODE_ENV=production

# Seguridad CORS
ALLOWED_ORIGINS=https://tu-dominio.com

# Base de Datos (opcional)
DATABASE_URL=postgresql://...

# Admin Panel
ADMIN_USER=tu_usuario_seguro
ADMIN_PASS=contraseña_muy_segura_min20caracteres
```

### 2. **Dónde Configurar en Hosting**

#### **Render.com**
1. Dashboard → Tu servicio → Environment
2. Agregar variables una por una
3. Guardar cambios → Auto-redeploy

#### **Railway.app**
1. Proyecto → Variables
2. Agregar en formato `KEY=VALUE`
3. Deploy automático

#### **Vercel**
1. Project Settings → Environment Variables
2. Agregar para Production/Preview/Development
3. Redeploy

#### **Heroku**
```bash
heroku config:set PORT=3000
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=postgresql://...
```

---

## 🔐 Mejores Prácticas Implementadas

### ✅ **1. Autenticación Basic Auth para Admin**
**Archivo:** `src/middleware/auth.js`

```javascript
const adminAuth = (req, res, next) => {
    const user = basicAuth(req);
    const USERNAME = process.env.ADMIN_USER || 'admin';
    const PASSWORD = process.env.ADMIN_PASS || 'admin123';
    
    if (!user || user.name !== USERNAME || user.pass !== PASSWORD) {
        res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
        return res.status(401).send('Acceso denegado');
    }
    next();
};
```

**Rutas protegidas:**
- `/admin` → Panel de administración
- `/api/stats` → Estadísticas globales

---

### ✅ **2. Rate Limiting**
**Archivo:** `server.js`

- **100 requests por IP** cada 15 minutos
- Protege contra ataques de fuerza bruta
- Headers estándar para informar límites

---

### ✅ **3. Helmet - Security Headers**
**Archivo:** `server.js`

Configura headers HTTP de seguridad:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- etc.

---

### ✅ **4. CORS Configurado**
**Archivo:** `config/config.js`

```javascript
SOCKET_IO: {
    cors: {
        origin: process.env.ALLOWED_ORIGINS || '*',
        credentials: true
    }
}
```

**⚠️ En producción:** Cambiar `*` por tu dominio específico

---

### ✅ **5. Validación de Inputs con Joi**
**Archivo:** `src/utils/validators.js`

Todos los eventos Socket.IO validan datos:
```javascript
schemas.createRoom = Joi.object({
    username: Joi.string().min(1).max(20).required()
});

schemas.joinRoom = Joi.object({
    roomCode: Joi.string().length(4).required(),
    username: Joi.string().min(1).max(20).required()
});
```

Previene:
- Inyección de código
- XSS en nombres de usuario
- Salas con códigos inválidos

---

## 🚨 Vulnerabilidades Conocidas y Mitigación

### 1. **DoS por Creación Masiva de Salas**
**Riesgo:** Un atacante podría crear miles de salas

**Mitigación Actual:**
- Rate limiting (100 req/15min)
- Códigos de 4 letras (456,976 combinaciones)

**Mejora Futura:**
- Limpieza automática de salas inactivas (>1 hora)
- Límite de salas por IP

---

### 2. **Suplantación de Identidad en Reconexión**
**Riesgo:** Alguien podría reconectarse con nombre de otro jugador

**Mitigación Actual:**
- Solo reconecta si jugador está marcado como `disconnected`
- Ventana de 60 segundos

**Mejora Futura:**
- Tokens de sesión únicos
- Verificación por socketId anterior

---

### 3. **XSS en Chat/Nombres**
**Riesgo:** Inyección de HTML/JavaScript en nombres

**Mitigación Actual:**
- Validación con Joi (máx 20 caracteres)
- Escape HTML en frontend (`escapeHtml()`)

**Código en cliente:**
```javascript
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
```

---

## 🔍 Auditoría de Código

### Comandos para Verificar Seguridad

```bash
# Buscar credenciales hardcodeadas
grep -r "password.*=" --exclude-dir=node_modules .
grep -r "api_key" --exclude-dir=node_modules .

# Buscar logs de consola que podrían filtrar info
grep -r "console" src/

# Verificar .gitignore
git status --ignored

# Ver archivos trackeados
git ls-files
```

---

## 📋 Checklist Pre-Deploy

### Desarrollo → Producción

- [ ] Cambiar `NODE_ENV=production`
- [ ] Configurar `ALLOWED_ORIGINS` con dominio real
- [ ] Generar contraseña segura para `ADMIN_PASS` (min 20 chars)
- [ ] Si usas BD, configurar `DATABASE_URL` en hosting
- [ ] Verificar que `.env` NO está en Git
- [ ] Configurar variables en el hosting (no en código)
- [ ] Habilitar HTTPS en el dominio
- [ ] Verificar logs del servidor después del deploy

---

## 🛠️ Mantenimiento de Seguridad

### Actualizar Dependencias

```bash
# Ver vulnerabilidades
npm audit

# Actualizar automáticamente (con cuidado)
npm audit fix

# Actualizar dependencias manualmente
npm update
```

### Monitoreo

- Revisar logs del servidor regularmente
- Monitorear requests al endpoint `/admin`
- Alertas si hay muchos 401/403
- Verificar uso de recursos (posible DoS)

---

## 📞 Reportar Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad:

1. **NO** la hagas pública en issues de GitHub
2. Envía un email privado al mantenedor
3. Proporciona:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de solución (opcional)

---

## 🔗 Recursos de Seguridad

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Socket.IO Security](https://socket.io/docs/v4/security/)

---

**Última actualización:** Febrero 2026  
**Versión del proyecto:** 2.2.0
