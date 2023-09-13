import Jspdf from 'jspdf'
import puppeteer from 'puppeteer'
import axios from 'axios'
import sgMail from '@sendgrid/mail'
import BaseController from './BaseController'
import GreetingCardService from '../services/GreetingCardService'
import * as statusCodes from '../constants/statusCodes'

sgMail.setApiKey(String(process.env.SENDGRID_API_KEY))

const greetingCardService = new GreetingCardService('GreetingCard')

class GreetingCardController extends BaseController {
  async printCard (req, res) {
    const {
      body: {
        print: {
          htmlText, imageUrl, placeholders, frontOrientation = 'portrait', backOrientation = 'portrait',
          email: { to, from, subject, text }, exportSides = 'both'
        }
      }
    } = req

    const compressPdf = true

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })

    const replacedHtmlText = htmlText.replace(/\[(\w+)\]/g, (placeholder) =>
      placeholders[placeholder.substring(1, placeholder.length - 1)]
    )

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--disable-gpu', '--no-sandbox'],
      executablePath: 'google-chrome'
    })
    const page = await browser.newPage()
    await page.setContent(replacedHtmlText, { waitUntil: 'domcontentloaded' })
    await page.emulateMediaType('screen')

    const pdfBufferBack = await page.pdf({
      format: 'A4',
      landscape: backOrientation === 'landscape',
      scale: 1.29,
      printBackground: true
    })

    await browser.close()

    const doc = new Jspdf(frontOrientation, 'px', 'a4', compressPdf)

    const width = doc.internal.pageSize.getWidth()
    const height = doc.internal.pageSize.getHeight()

    // Add the image to the PDF
    doc.addImage(response.data, 'JPEG', 0, 0, width, height, undefined, undefined)

    const pdfBufferFront = Buffer.from(doc.output('arraybuffer'))
    // Save the PDF as a file

    const pdfBase64Front = pdfBufferFront.toString('base64')
    const pdfBase64Back = pdfBufferBack.toString('base64')

    const frontSide = {
      filename: 'front.pdf',
      content: pdfBase64Front, // Read the PDF file
      type: 'application/pdf',
      disposition: 'attachment' // Set the disposition as an attachment
    }
    const backSide = {
      filename: 'back.pdf',
      content: pdfBase64Back, // Read the PDF file
      type: 'application/pdf',
      disposition: 'attachment' // Set the disposition as an attachment
    }

    const attachments = {
      front: [frontSide],
      back: [backSide],
      both: [frontSide, backSide]
    }

    const msg = {
      to,
      from,
      subject,
      text,
      attachments: attachments[exportSides]
    }
    await sgMail.send(msg)

    return res.status(statusCodes.OK).send({
      statusCode: statusCodes.OK,
      success: true,
      greetingCard: {
        message: 'Greeting card email sent successfully'
      }
    })
  }
}

export default new GreetingCardController(greetingCardService)
