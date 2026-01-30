const Joi = require('joi');

const schemas = {
    // Join/Create Room
    joinRoom: Joi.object({
        username: Joi.string().trim().min(2).max(15)
            .pattern(/^(?=.*[a-zA-Z])[a-zA-Z0-9 ]+$/)
            .required()
            .messages({
                'string.pattern.base': 'El nombre debe tener al menos una letra'
            }),
        roomCode: Joi.string().trim().uppercase().length(4).required()
    }),

    createRoom: Joi.object({
        username: Joi.string().trim().min(2).max(15)
            .pattern(/^(?=.*[a-zA-Z])[a-zA-Z0-9 ]+$/)
            .required()
            .messages({
                'string.pattern.base': 'El nombre debe tener al menos una letra'
            })
    }),

    // Config Update
    updateConfig: Joi.object({
        roomCode: Joi.string().required(),
        config: Joi.object({
            category: Joi.string().optional(),
            impostorCount: Joi.number().integer().min(1).max(3).optional()
        }).required()
    }),

    // Chat
    chatMessage: Joi.object({
        roomCode: Joi.string().required(),
        message: Joi.string().trim().min(1).max(100).required()
    }),

    // Game Actions
    gameAction: Joi.object({
        roomCode: Joi.string().required()
    }),

    vote: Joi.object({
        roomCode: Joi.string().required(),
        votedFor: Joi.string().required()
    })
};

/**
 * Helper para validar datos de Socket
 * @param {Joi.Schema} schema 
 * @param {Object} data 
 * @returns {String|null} Mensaje de error o null si es válido
 */
function validateSocketInput(schema, data) {
    const { error } = schema.validate(data, { stripUnknown: true });
    if (error) {
        return error.details[0].message.replace(/"/g, '');
    }
    return null;
}

module.exports = { schemas, validateSocketInput };
