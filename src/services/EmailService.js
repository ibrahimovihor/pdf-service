import BaseService from './BaseService'
import sendMail from '../utils/sendMail'

class EmailService extends BaseService {
  async send ({ name, email, subject, message }) {
    const info = await sendMail(name, email, subject, message)
    return info
  }
}

export default EmailService
