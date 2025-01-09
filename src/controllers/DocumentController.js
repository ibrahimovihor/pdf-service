import puppeteer from 'puppeteer'
import dayjs from 'dayjs'
import sgMail from '@sendgrid/mail'
import BaseController from './BaseController'
import DocumentService from '../services/DocumentService'
import { invoiceTemplate, orderConfirmationTemplate, packingSlipTemplate } from '../utils/documentTemplates'
import * as statusCodes from '../constants/statusCodes'

const documentService = new DocumentService('Document')

sgMail.setApiKey(String(process.env.SENDGRID_API_KEY))

function replaceTemplateVariables (download, type) {
  const templateLookup = {
    invoice: invoiceTemplate,
    orderConfirmation: orderConfirmationTemplate,
    packingSlip: packingSlipTemplate
  }
  const template = templateLookup[type] || invoiceTemplate
  const replacedHtmlText = template.replace(/\[(\w+(?:\.\w+)?)\]/g, (placeholder) => {
    const {
      shippingAddress,
      billingAddress,
      documentNumber,
      documentDate,
      dueDate,
      deliveryDate,
      orderNumber,
      costCenter,
      documentItems,
      totalNet,
      totalAmount,
      totalShipping,
      vat,
      externalOrderNumber,
      externalProjectNumber,
      shippingId
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
      case '[documentNumber]':
        return documentNumber || ''
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
      case '[documentItems]':
        if (!documentItems || documentItems.length === 0) return []
        if (type === 'packingSlip') {
          return documentItems.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.quantity || 1}</td>
            <td>${item.articleNumber || ''}</td>
            <td>${item.articleName || ''}</td>
          </tr>
          `).join('')
        }
        return documentItems.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${item.quantity || 1}</td>
            <td>${item.articleNumber || ''}</td>
            <td>${item.articleName || ''}</td>
            <td>${(item.taxRate || 19).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</td>
            <td>${(item.price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
            <td>${(item.total || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
          </tr>
        `).join('')
      case '[externalOrderNumber]':
        return externalOrderNumber || ''
      case '[externalProjectNumber]':
        return externalProjectNumber || ''
      case '[shippingId]':
        return shippingId
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

class DocumentController extends BaseController {
  async downloadDocument (req, res) {
    const {
      body: {
        download,
        type
      }
    } = req

    const replacedHtmlText = replaceTemplateVariables(download, type)

    const pdfBuffer = await generatePDF(replacedHtmlText)

    const filenameLookup = {
      invoice: 'Sales Invoice Document',
      orderConfirmation: 'Order Confirmation Document',
      packingSlip: 'Packing Slip Document'
    }

    const filename = `${filenameLookup[type] || filenameLookup.invoice}-${download.documentNumber}-${dayjs(download.dueDate).format('DD-MM-YYYY')}-big little things GmbH`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    return res.send(pdfBuffer)
  }

  async sendDocumentEmail (req, res) {
    const {
      body: {
        download,
        email: { to, from },
        type
      }
    } = req

    // Generate PDF (reusing existing logic)
    const replacedHtmlText = replaceTemplateVariables(download, type)
    const pdfBuffer = await generatePDF(replacedHtmlText)

    const filenameLookup = {
      invoice: {
        filename: 'Sales Invoice Document',
        subject: 'Sales Invoice Document',
        text: 'sales invoice document'
      },
      orderConfirmation: {
        filename: 'Order Confirmation Document',
        subject: 'Order Confirmation Document',
        text: 'order confirmation document'
      },
      packingSlip: {
        filename: 'Packing Slip Document',
        subject: 'Packing Slip Document',
        text: 'packing slip document'
      }
    }

    const filename = `${filenameLookup[type]?.filename || filenameLookup.invoice.filename}-${download.documentNumber}-${dayjs(download.dueDate).format('DD-MM-YYYY')}-big little things GmbH`
    const subject = `${filenameLookup[type]?.subject || filenameLookup.invoice.subject}  ${download.documentNumber}`
    const text = `Please find attached the ${filenameLookup[type]?.text || filenameLookup.invoice.text}.`

    // Prepare email
    const msg = {
      to,
      from,
      subject,
      text,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename,
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
        message: 'Document email sent successfully'
      }
    })
  }
}

export default new DocumentController(documentService)
