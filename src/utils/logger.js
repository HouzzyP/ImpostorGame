const winston = require('winston');
const path = require('path');

// Formato personalizado para logs legibles
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        // Agregar metadata si existe
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }

        // Agregar stack trace si es un error
        if (stack) {
            log += `\n${stack}`;
        }

        return log;
    })
);

// Configuración según entorno
const isProduction = process.env.NODE_ENV === 'production';

// Transports (dónde se guardan los logs)
const transports = [
    // Consola (siempre activo)
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            customFormat
        )
    })
];

// En producción, guardar logs en archivos
if (isProduction) {
    transports.push(
        // Logs de error
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: customFormat
        }),
        // Logs combinados
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880,
            maxFiles: 5,
            format: customFormat
        })
    );
}

// Crear logger
const logger = winston.createLogger({
    level: isProduction ? 'info' : 'debug',
    format: customFormat,
    transports,
    // No salir en errores no capturados
    exitOnError: false
});

// Helpers para contextos específicos
logger.socket = (message, meta = {}) => {
    logger.info(message, { context: 'socket', ...meta });
};

logger.game = (message, meta = {}) => {
    logger.info(message, { context: 'game', ...meta });
};

logger.analytics = (message, meta = {}) => {
    logger.debug(message, { context: 'analytics', ...meta });
};

logger.security = (message, meta = {}) => {
    logger.warn(message, { context: 'security', ...meta });
};

// Capturar excepciones no manejadas
if (isProduction) {
    logger.exceptions.handle(
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/exceptions.log')
        })
    );

    logger.rejections.handle(
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/rejections.log')
        })
    );
}

module.exports = logger;
