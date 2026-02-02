const basicAuth = require('basic-auth');

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

module.exports = adminAuth;
