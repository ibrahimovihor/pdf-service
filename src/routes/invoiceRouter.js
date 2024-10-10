import express from 'express'
import { celebrate, Segments } from 'celebrate'
import validator from '../validators/validators'
import InvoiceController from '../controllers/InvoiceController'
import asyncHandler from '../middlewares/asyncHandler'
import methodNotAllowed from '../middlewares/methodNotAllowed'
import checkAuth from '../middlewares/checkAuth'

const invoiceRoutes = () => {
  const invoiceRouter = express.Router()

  invoiceRouter.route('/invoices/download')
    .post(asyncHandler(checkAuth), celebrate({
      [Segments.BODY]: validator.validateInvoiceDownload
    }), asyncHandler(InvoiceController.downloadInvoice))
    .all(methodNotAllowed)
  return invoiceRouter
}

export default invoiceRoutes
