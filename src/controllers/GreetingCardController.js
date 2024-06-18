import Jspdf from 'jspdf'
import puppeteer from 'puppeteer'
import axios from 'axios'
import sgMail from '@sendgrid/mail'
import sharp from 'sharp'
import JsBarcode from 'jsbarcode'
import { DOMImplementation, XMLSerializer } from 'xmldom'
import BaseController from './BaseController'
import GreetingCardService from '../services/GreetingCardService'
import * as statusCodes from '../constants/statusCodes'

sgMail.setApiKey(String(process.env.SENDGRID_API_KEY))
const styleSheetUrl = 'https://endeavor-b285f.ew.r.appspot.com/styles/index.css'

const greetingCardService = new GreetingCardService('GreetingCard')

class GreetingCardController extends BaseController {
  async printCard (req, res) {
    const {
      body: {
        print: {
          htmlText, imageUrl, placeholders, frontOrientation = 'portrait', backOrientation = 'portrait',
          email: { to, from, subject, text, cc, bcc }, exportSides = 'both',
          frontFilename = 'greeting-card-front',
          backFilename = 'greeting-card-back',
          barcodeValue,
          barcodeFormat
        }
      }
    } = req

    const compressPdf = true

    const imageResponseFront = await axios.get(imageUrl, { responseType: 'arraybuffer' })

    const compressedImageBuffer = await sharp(imageResponseFront.data)
      .rotate()
      .jpeg({ quality: 80 }) // Adjust the quality (0-100) as needed
      .toBuffer()

    const replacedHtmlText = htmlText.replace(/\[(\w+)\]/g, (placeholder) =>
      placeholders[placeholder.substring(1, placeholder.length - 1)]
    )

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    })

    const xmlSerializer = new XMLSerializer()
    const document = new DOMImplementation().createDocument('http://www.w3.org/1999/xhtml', 'html', null)
    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svgNode.setAttribute('width', '200px')
    svgNode.setAttribute('height', '20px')

    const barcodeHeight = 16

    if (barcodeValue) {
      try {
        JsBarcode(svgNode, barcodeValue, {
          xmlDocument: document,
          format: barcodeFormat || undefined,
          displayValue: false,
          margin: 0,
          height: barcodeHeight,
          flat: true
        })
      } catch (error) {
        console.log(error)
      }
    }
    const svgText = xmlSerializer.serializeToString(svgNode)

    const page = await browser.newPage()
    const styleSheet = `<link href=${styleSheetUrl} rel='stylesheet' crossorigin='anonymous'>`
    let htmlContent = `
      ${styleSheet}
      <div class="ql-editor">${replacedHtmlText}</div>
    `

    if (barcodeValue) {
      htmlContent += `<div style="position: absolute; bottom: 16px; left: 16px;">${svgText}</div>`
    }

    await page.setContent(styleSheet)
    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction('document.fonts.ready')
    await page.emulateMediaType('screen')

    const pdfBufferBack = await page.pdf({
      format: 'A4',
      landscape: backOrientation === 'landscape',
      scale: 1,
      printBackground: true
    })

    await browser.close()

    const pdfFront = new Jspdf(frontOrientation, 'px', 'a4', compressPdf)

    const width = pdfFront.internal.pageSize.getWidth()
    const height = pdfFront.internal.pageSize.getHeight()

    // Add the image to the PDF
    pdfFront.addImage(compressedImageBuffer, 'JPEG', 0, 0, width, height, undefined, undefined, 0)

    const pdfBufferFront = Buffer.from(pdfFront.output('arraybuffer'))

    const pdfBase64Front = pdfBufferFront.toString('base64')
    const pdfBase64Back = pdfBufferBack.toString('base64')

    const frontSide = {
      filename: `${frontFilename}.pdf`,
      content: pdfBase64Front, // Read the PDF file
      type: 'application/pdf',
      disposition: 'attachment' // Set the disposition as an attachment
    }
    const backSide = {
      filename: `${backFilename}.pdf`,
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
      cc,
      bcc,
      subject,
      text,
      html: text,
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
