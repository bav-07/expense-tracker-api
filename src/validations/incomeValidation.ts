import Joi from 'joi';

const incomeSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number.',
    'number.positive': 'Amount must be greater than 0.',
    'any.required': 'Amount is required.'
  }),
  source: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Source must be a string.',
    'string.min': 'Source must be at least 3 characters long.',
    'string.max': 'Source must be less than or equal to 100 characters long.',
    'any.required': 'Source is required'
  }),
  date: Joi.date().iso().required().messages({
    'date.base': 'Date must be a valid date',
    'date.iso': 'Date must be in ISO format',
    'any.required': 'Date is required'
  }),
  frequency: Joi.string().valid('weekly', 'monthly').required().messages({
    'string.base': 'Frequency must be a string',
    'any.only': 'Frequency must be either weekly or monthly',
    'any.required': 'Frequency is required'
  }),
});

export default incomeSchema;