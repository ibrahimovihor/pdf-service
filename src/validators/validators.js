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
      to: Joi.alternatives().try(
        Joi.string().email().required(),
        Joi.array().items(Joi.string().email())
      ),
      from: Joi.alternatives().try(
        Joi.string().email().required(),
        Joi.object({
          email: Joi.string().email().required(),
          name: Joi.string().required()
        }).required()
      ),
      cc: Joi.array().items(Joi.string().email()),
      bcc: Joi.array().items(Joi.string().email()),
      subject: Joi.string().required(),
      text: Joi.string().required()
    }).required(),
    exportSides: Joi.string().valid(...['front', 'back', 'both']),
    frontFilename: Joi.string().max(256),
    backFilename: Joi.string().max(256),
    barcodeValue: Joi.string().when('barcodeFormat', {
      switch: [
        { is: 'ean8', then: Joi.string().length(8).required() },
        { is: 'ean13', then: Joi.string().length(13).required() },
        { is: 'itf14', then: Joi.string().length(14).required() },
        { is: 'upc', then: Joi.string().length(12).required() },
        {
          is: 'upce',
          then: Joi.string().regex(/^\d{6}(\d{2})?$/).messages({
            'string.pattern.base': '{#label} length must be 6 or 8 characters long'
          }).required()
        }
      ],
      otherwise: Joi.string().allow(null)
    }),
    barcodeFormat: Joi.string().valid(...['itf14', 'ean13', 'ean8', 'upc', 'upce']).allow(null).optional()
  }).required()
})

const validateGreetingCardDownload = Joi.object({
  download: Joi.object({
    htmlText: Joi.string().when('exportSide', {
      is: 'back',
      then: Joi.required()
    }),
    imageUrl: Joi.string().uri().when('exportSide', {
      is: 'front',
      then: Joi.required()
    }),
    placeholders: Joi.object({
      salutation: Joi.string().allow('').required(),
      firstname: Joi.string().allow('').required(),
      lastname: Joi.string().allow('').required()
    }),
    frontOrientation: Joi.string().valid(...['portrait', 'landscape']),
    backOrientation: Joi.string().valid(...['portrait', 'landscape']),
    exportSide: Joi.string().valid(...['front', 'back']),
    frontFilename: Joi.string().max(256),
    backFilename: Joi.string().max(256),
    barcodeValue: Joi.string().when('barcodeFormat', {
      switch: [
        { is: 'ean8', then: Joi.string().length(8).required() },
        { is: 'ean13', then: Joi.string().length(13).required() },
        { is: 'itf14', then: Joi.string().length(14).required() },
        { is: 'upc', then: Joi.string().length(12).required() },
        {
          is: 'upce',
          then: Joi.string().regex(/^\d{6}(\d{2})?$/).messages({
            'string.pattern.base': '{#label} length must be 6 or 8 characters long'
          }).required()
        }
      ],
      otherwise: Joi.string().allow(null)
    }),
    barcodeFormat: Joi.string().valid(...['itf14', 'ean13', 'ean8', 'upc', 'upce']).allow(null).optional()
  }).required()
})

export default {
  validateBody,
  validateGreetingCardPrint,
  validateGreetingCardDownload
}
