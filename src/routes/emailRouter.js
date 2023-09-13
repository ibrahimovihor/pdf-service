import express from 'express'
import { celebrate } from 'celebrate'
import validator from '../validators/validators'
import EmailController from '../controllers/EmailController'
import asyncHandler from '../middlewares/asyncHandler'
import methodNotAllowed from '../middlewares/methodNotAllowed'

const emailRoutes = () => {
  const emailRouter = express.Router()

  emailRouter.route('/send')
    .post(celebrate({
      body: validator.validateBody
    }, { abortEarly: false }), asyncHandler(EmailController.send))
    .all(methodNotAllowed)

  return emailRouter
}

export default emailRoutes
