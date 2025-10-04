import Joi from 'joi';
import messages from './validationMessages';

export const expenseSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': messages['number.base'],
    'number.positive': messages['number.positive'],
    'any.required': messages['any.required']
  }),
  date: Joi.date().iso().required().messages({
    'date.base': messages['date.base'],
    'date.iso': messages['date.iso'],
    'any.required': messages['any.required']
  }),
  category: Joi.string().min(3).max(100).required().messages({
    'string.base': messages['string.base'],
    'string.min': messages['string.min'],
    'string.max': messages['string.max'],
    'any.required': messages['any.required']
  })
});

export const updateExpenseSchema = Joi.object({
  amount: Joi.number().positive().optional().messages({
    'number.base': messages['number.base'],
    'number.positive': messages['number.positive'],
  }),
  date: Joi.date().iso().optional().messages({
    'date.base': messages['date.base'],
    'date.iso': messages['date.iso'],
  }),
  category: Joi.string().min(3).max(100).optional().messages({
    'string.base': messages['string.base'],
    'string.min': messages['string.min'],
    'string.max': messages['string.max'],
  }),
});