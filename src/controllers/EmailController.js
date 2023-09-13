import BaseController from './BaseController'
import EmailService from '../services/EmailService'
import * as statusCodes from '../constants/statusCodes'

const emailService = new EmailService('Email')

class EmailController extends BaseController {
  async send (req, res) {
    const { body: { data } } = req

    const info = await emailService.send(data)

    return res.status(statusCodes.OK).send({
      statusCode: statusCodes.OK,
      success: true,
      info
    })
  }
}

export default new EmailController(emailService)
