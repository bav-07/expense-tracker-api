import Joi from 'joi';
import messages from './validationMessages';

export const incomeSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': messages['number.base'],
    'number.positive': messages['number.positive'],
    'any.required': messages['any.required']
  }),
  source: Joi.string().min(3).max(100).required().messages({
    'string.base': messages['string.base'],
    'string.min': messages['string.min'],
    'string.max': messages['string.max'],
    'any.required': messages['any.required']
  }),
  date: Joi.date().iso().required().messages({
    'date.base': messages['date.base'],
    'date.iso': messages['date.iso'],
    'any.required': messages['any.required']
  }),
  frequency: Joi.string().valid('weekly', 'monthly').optional().messages({
    'string.base': messages['string.base'],
    'any.only': messages['any.onlyfrequency'],
  }),
});

export const updateIncomeSchema = Joi.object({
  amount: Joi.number().positive().optional().messages({
    'number.base': messages['number.base'],
    'number.positive': messages['number.positive'],
  }),
  source: Joi.string().min(3).max(100).optional().messages({
    'string.base': messages['string.base'],
    'string.min': messages['string.min'],
    'string.max': messages['string.max'],
  }),
  date: Joi.date().iso().optional().messages({
    'date.base': messages['date.base'],
    'date.iso': messages['date.iso'],
  }),
  frequency: Joi.string().valid('weekly', 'monthly').optional().messages({
    'string.base': messages['string.base'],
    'any.only': messages['any.onlyfrequency'],
  }),
});