import puppeteer from 'puppeteer'
import dayjs from 'dayjs'
import BaseController from './BaseController'
import InvoiceService from '../services/InvoiceService'
import { invoiceTemplate } from '../utils/invoiceTemplate'

const invoiceService = new InvoiceService('Invoice')

class InvoiceController extends BaseController {
  async downloadInvoice (req, res) {
    const {
      body: {
        download
      }
    } = req

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
          return dayjs(documentDate).format('MM.DD.YYYY')
        case '[dueDate]':
          return dayjs(dueDate).format('MM.DD.YYYY')
        case '[deliveryDate]':
          return dayjs(deliveryDate).format('MM.DD.YYYY')
        case '[orderNumber]':
          return orderNumber || ''
        case '[costCenter]':
          return costCenter || ''
        case '[totalNet]':
          return (totalNet || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
        case '[totalAmount]':
          return (totalAmount || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
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
              <td>${(item.taxRate || 19).toFixed(2)}%</td>
              <td>${(item.price || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
              <td>${(item.total || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
          `).join('')
        default:
          return placeholder
      }
    })

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox']
    })

    const page = await browser.newPage()

    await page.setContent(replacedHtmlText, { waitUntil: 'domcontentloaded' })
    await page.waitForFunction('document.fonts.ready')
    await page.emulateMediaType('screen')

    const pdfBuffer = await page.pdf({
      format: 'A4',
      scale: 1,
      printBackground: true
    })

    await browser.close()

    const filename = `invoice-${download.invoiceNumber}`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    return res.send(pdfBuffer)
  }
}

export default new InvoiceController(invoiceService)
