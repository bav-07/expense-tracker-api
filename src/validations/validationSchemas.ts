import Joi from "joi";
import messages from "./validationMessages";

export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required().messages({
    'date.base': messages['date.base'],
    'date.iso': messages['date.iso'],
    'any.required': messages['any.required']
  }),
  endDate: Joi.date().iso().required().messages({
    'date.base': messages['date.base'],
    'date.iso': messages['date.iso'],
    'any.required': messages['any.required']
  })
});