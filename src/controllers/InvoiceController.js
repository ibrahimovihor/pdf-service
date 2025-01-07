import puppeteer from 'puppeteer'
import dayjs from 'dayjs'
import sgMail from '@sendgrid/mail'
import BaseController from './BaseController'
import InvoiceService from '../services/InvoiceService'
import { invoiceTemplate } from '../utils/invoiceTemplate'
import * as statusCodes from '../constants/statusCodes'

const invoiceService = new InvoiceService('Invoice')

sgMail.setApiKey(String(process.env.SENDGRID_API_KEY))
function replaceTemplateVariables (download) {
  const replacedHtmlText = invoiceTemplate.replace(/\[(\w+(?:\.\w+)?)\]/g, (placeholder) => {
    const {
      shippingAddress,
      billingAddress,
      invoiceNumber,
      documentDate,
      dueDate,
      deliveryDate,
      orderNumber,
      costCenter,
      invoiceItems,
      totalNet,
      totalAmount,
      totalShipping,
      vat
    } = download

    switch (placeholder) {
      case '[shippingAddress.company]':
      case '[shippingAddress.name]':
      case '[shippingAddress.street]':
      case '[shippingAddress.city]':
      case '[shippingAddress.state]':
      case '[shippingAddress.zip]':
      case '[shippingAddress.country]':
        return shippingAddress?.[placeholder.match(/\[shippingAddress\.(\w+)\]/)[1]] || ''
      case '[billingAddress.company]':
      case '[billingAddress.name]':
      case '[billingAddress.street]':
      case '[billingAddress.city]':
      case '[billingAddress.state]':
      case '[billingAddress.zip]':
      case '[billingAddress.country]':
        return billingAddress?.[placeholder.match(/\[billingAddress\.(\w+)\]/)[1]] || ''
      case '[invoiceNumber]':
        return invoiceNumber || ''
      case '[documentDate]':
        return dayjs(documentDate).format('DD.MM.YYYY')
      case '[dueDate]':
        return dayjs(dueDate).format('DD.MM.YYYY')
      case '[deliveryDate]':
        return dayjs(deliveryDate).format('DD.MM.YYYY')
      case '[orderNumber]':
        return orderNumber || ''
      case '[costCenter]':
        return costCenter || ''
      case '[totalNet]':
        return (totalNet || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
      case '[totalAmount]':
        return (totalAmount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
      case '[totalShipping]':
        return (totalShipping || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
      case '[vat]':
        return (vat || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
      case '[invoiceItems]':
        if (!invoiceItems || invoiceItems.length === 0) return []

        return invoiceItems.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.quantity || 1}</td>
            <td>${item.articleNumber || ''}</td>
            <td>${item.articleName || ''}</td>
            <td>${(item.taxRate || 19).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
            <td>${(item.price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
            <td>${(item.total * item.quantity || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
        `).join('')
      default:
        return placeholder
    }
  })

  return replacedHtmlText
}

async function generatePDF (htmlContent) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox']
  })

  const page = await browser.newPage()

  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction('document.fonts.ready')
  await page.emulateMediaType('screen')

  const pdfBuffer = await page.pdf({
    format: 'A4',
    scale: 1,
    printBackground: true
  })

  await browser.close()

  return pdfBuffer
}

class InvoiceController extends BaseController {
  async downloadInvoice (req, res) {
    const {
      body: {
        download
      }
    } = req

    const replacedHtmlText = replaceTemplateVariables(download)

    const pdfBuffer = await generatePDF(replacedHtmlText)

    const filename = `Sales Invoice Document-${download.invoiceNumber}-${dayjs(download.dueDate).format('DD-MM-YYYY')}-big little things GmbH`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    return res.send(pdfBuffer)
  }

  async sendInvoiceEmail (req, res) {
    const {
      body: {
        download,
        email: { to, from }
      }
    } = req

    // Generate PDF (reusing existing logic)
    const replacedHtmlText = replaceTemplateVariables(download)
    const pdfBuffer = await generatePDF(replacedHtmlText)

    // Prepare email
    const msg = {
      to,
      from,
      subject: `Sales Invoice Document ${download.invoiceNumber}`,
      text: `Please find attached the sales invoice document ${download.invoiceNumber}.`,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: `Sales Invoice Document-${download.invoiceNumber}-${dayjs(download.dueDate).format('DD-MM-YYYY')}-big little things GmbH.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    }

    // Send email
    await sgMail.send(msg)

    return res.status(statusCodes.OK).send({
      statusCode: statusCodes.OK,
      success: true,
      greetingCard: {
        message: 'Invoice email sent successfully'
      }
    })
  }
}

export default new InvoiceController(invoiceService)
