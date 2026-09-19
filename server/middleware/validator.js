const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }
  next();
};

const schemas = {
  registration: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().min(2).max(100).required(),
    bio: Joi.string().allow('', null),
    study_interests: Joi.string().allow('', null)
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  task: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow('', null),
    assigned_to: Joi.number().integer().allow(null),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    due_date: Joi.date().iso().allow(null),
    status: Joi.string().valid('pending', 'in-progress', 'completed').default('pending')
  }),
};

module.exports = { validate, schemas };
