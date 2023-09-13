import { Joi } from 'celebrate'

const validateBody = Joi.object({
  data: Joi.object({
    name: Joi.string().required().max(64),
    email: Joi.string().email().lowercase().required().max(64),
    subject: Joi.string().required().max(64),
    message: Joi.string().required().max(256)
  }).required()
})

const validateGreetingCardPrint = Joi.object({
  print: Joi.object({
    htmlText: Joi.string().allow('').allow(null),
    imageUrl: Joi.string().uri(),
    placeholders: Joi.object({
      salutation: Joi.string().allow('').allow(null),
      firstname: Joi.string().allow('').allow(null),
      lastname: Joi.string().allow('').allow(null)
    }),
    frontOrientation: Joi.string().valid(...['portrait', 'landscape']),
    backOrientation: Joi.string().valid(...['portrait', 'landscape']),
    email: Joi.object({
      to: Joi.string().email().required(),
      from: Joi.string().email().required(),
      subject: Joi.string().required(),
      text: Joi.string().required()
    }).required(),
    exportSides: Joi.string().valid(...['front', 'back', 'both'])
  }).required()
})

export default {
  validateBody,
  validateGreetingCardPrint
}
