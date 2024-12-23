import express from 'express'
import { celebrate, Segments } from 'celebrate'
import validator from '../validators/validators'
import DocumentController from '../controllers/DocumentController'
import asyncHandler from '../middlewares/asyncHandler'
import methodNotAllowed from '../middlewares/methodNotAllowed'
import checkAuth from '../middlewares/checkAuth'

const documentRoutes = () => {
  const documentRouter = express.Router()

  documentRouter.route('/documents/download')
    .post(asyncHandler(checkAuth), celebrate({
      [Segments.BODY]: validator.validateDocumentEmail
    }), asyncHandler(DocumentController.downloadDocument))
    .all(methodNotAllowed)

  documentRouter.route('/documents/email')
    .post(celebrate({
      [Segments.BODY]: validator.validateDocumentEmail
    }), asyncHandler(DocumentController.sendDocumentEmail))
    .all(methodNotAllowed)

  return documentRouter
}

export default documentRoutes
