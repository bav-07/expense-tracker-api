import Joi from "joi";
import messages from "./validationMessages";

export const registerSchema = Joi.object({
  email: Joi.string().max(200).email().required().messages({
    'string.base': messages['string.base'],
    'string.max': 'Email should have a maximum length of {#limit}',
    'string.email': 'Email should be a valid email',
    'any.required': messages['any.required']
  }),
  password: Joi.string()
    .min(8)
    .max(200)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.base': messages['string.base'],
      'string.min': 'Password must be at least {#limit} characters long',
      'string.max': 'Password should have a maximum length of {#limit}',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
      'any.required': messages['any.required']
    }),
  name: Joi.string().min(3).max(100).required().messages({
    'string.base': messages['string.base'],
    'string.min': 'Name should have a minimum length of {#limit}',
    'string.max': 'Name should have a maximum length of {#limit}',
    'any.required': messages['any.required']
  }),
})

export const loginSchema = Joi.object({
  email: Joi.string().email().max(200).required().messages({
    'string.base': messages['string.base'],
    'string.max': 'Email should have a maximum length of {#limit}',
    'string.email': 'Email should be a valid email',
    'any.required': messages['any.required']
  }),
  password: Joi.string().max(200).required().messages({
    'string.base': messages['string.base'],
    'string.max': 'Password should have a maximum length of {#limit}',
    'any.required': messages['any.required']
  }),
})

export const updatePreferencesSchema = Joi.object({
  weekStart: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').optional().messages({
    'string.base': messages['string.base'],
    'any.only': messages['any.onlyDay'],
  }),
  monthStart: Joi.number().min(1).max(31).optional().messages({
    'number.base': messages['number.base'],
    'number.min': messages['number.min'],
    'number.max': messages['number.max'],
  }),
});