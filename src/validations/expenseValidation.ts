import Joi from 'joi';
import messages from './validationMessages';

const expenseSchema = Joi.object({
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

export default expenseSchema;