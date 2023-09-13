import sgMail from '@sendgrid/mail'
import dotenv from 'dotenv'

dotenv.config()

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const mailer = process.env.MAILER_EMAIL

const sendMail = async (name, email, subject, message) => {
  const msg = {
    to: mailer,
    from: `${name} <${email}>`,
    subject: `${subject}`,
    text: `${message}\n\n`
  }

  const info = await sgMail.send(msg)
  return info
}

export default sendMail
