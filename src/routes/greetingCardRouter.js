import express from 'express'
import { celebrate, Segments } from 'celebrate'
import validator from '../validators/validators'
import GreetingCardController from '../controllers/GreetingCardController'
import asyncHandler from '../middlewares/asyncHandler'
import methodNotAllowed from '../middlewares/methodNotAllowed'

const greetingCardRoutes = () => {
  const greetingCardRouter = express.Router()

  greetingCardRouter.route('/greeting-cards/print')
    .post(celebrate({
      [Segments.BODY]: validator.validateGreetingCardPrint
    }), asyncHandler(GreetingCardController.printCard))
    .all(methodNotAllowed)
  return greetingCardRouter
}

export default greetingCardRoutes
