const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()
const PDFDocument = require('pdfkit')
const { resolve } = require('path')
const doc = require('pdfkit')

// Route to get the next invoice number
router.get('/api/getNextInvoiceNumber', (req, res) => {
  db.get('SELECT MAX(invoice_number) AS maxInvoiceNumber FROM invoices', [], (error, result) => {
    if (error) {
      return res.status(500).send({ error: 'Error fetching the max invoice number' })
    }
    const maxInvoiceNumber = result.maxInvoiceNumber
    const nextInvoiceNumber = maxInvoiceNumber ? `SAM${parseInt(maxInvoiceNumber.slice(3)) + 1}` : 'SAM1'
    res.json({ nextInvoiceNumber })
  })
})
// deposit_flat, deposit_percent, discountPercentValue, depositPercentValue

const insertItems = (invoiceId, items) => {
  return new Promise((resolve, reject) => {
    if (!items || items.length === 0) return resolve() // Prevent inserting empty data

    // Ensure each item has `origin_id` set from `id`
    for (const item of items) {
      if (!item.id) {
        return reject(new Error(`Missing item.id, which is required for origin_id: ${JSON.stringify(item)}`))
      }
      item.origin_id = item.id // Assign item.id as origin_id
    }

    // Prepare SQL placeholders and values
    const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',')
    const values = items.flatMap(item => [
      item.name,
      item.price,
      item.type,
      item.type === 'sample' ? item.time : 0,
      invoiceId,
      item.quantity,
      item.price * item.quantity,
      item.origin_id, // Now correctly set
    ])

    // Insert items into `invoice_items`
    db.run(
      `INSERT INTO invoice_items (
        name, price, type, time, invoice_id, quantity, total_item_price, origin_id
      ) VALUES ${placeholders}`,
      values,
      function (error) {
        if (error) return reject(new Error(`Error inserting invoice items: ${error.message}`))
        resolve()
      },
    )
  })
}

// Posts information to the invoice db by getting it from the frontend from generateInvoice.
router.post('/api/saveInvoice', async (req, res) => {
  const {
    clientId,
    items,
    discountType,
    discountValue,
    discValIfPercent,
    vatPercent,
    vat,
    subtotal,
    total,
    depositType,
    depositValue,
    depoValIfPercent,
    note,
    totalPreDiscount,
    date,
    remaining_balance,
    due_by_date,
  } = req.body
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cannot create an invoice without items.' })
  }
  try {
    // Insert invoice into the database
    const invoiceId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO invoices (
          client_id, discount_type, discount_value, discVal_ifPercent, vat_percent, vat, subtotal, total, deposit_type, deposit_value, depoVal_ifPercent, note, total_pre_discount, date, remaining_balance, due_by_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientId,
          discountType,
          discountValue,
          discValIfPercent,
          vatPercent,
          vat,
          subtotal,
          total,
          depositType,
          depositValue,
          depoValIfPercent,
          note,
          totalPreDiscount,
          date,
          remaining_balance,
          due_by_date,
        ],
        function (error) {
          if (error) {
            return reject(new Error(`Error inserting invoice: ${error.message}`))
          }
          resolve(this.lastID)
        },
      )
    })

    // Insert items using the helper function
    await insertItems(invoiceId, items)

    // Generate invoice number and update it
    const invoiceNumber = `SAM${invoiceId}`
    await new Promise((resolve, reject) => {
      db.run('UPDATE invoices SET invoice_number = ? WHERE id = ?', [invoiceNumber, invoiceId], function (error) {
        if (error) {
          return reject(new Error(`Error updating invoice number: ${error.message}`))
        }
        resolve()
      })
    })

    res.status(201).json({ id: invoiceId, invoiceNumber })
  } catch (error) {
    res.status(500).json({ error: `Error saving invoice: ${error.message}` })
  }
})

// Generate PDF for an invoice
router.get('/api/invoices/:id/pdf', async (req, res) => {
  const invoiceId = req.params.id

  try {
    // Fetch the invoice from the database
    const invoice = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId], (error, invoice) => {
        if (error) {
          return reject(error)
        }
        resolve(invoice)
      })
    })

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // Get client information
    const client = await new Promise((resolve, reject) => {
      db.get('SELECT company_name, name FROM clients WHERE id = ?', [invoice.client_id], (error, client) => {
        if (error) {
          return reject(error)
        }
        if (!client) {
          return reject(new Error('Client not found'))
        }
        resolve(client)
      })
    })

    // Fetch items for the creation of the invoice
    const fetchItems = () => {
      return new Promise((resolve, reject) => {
        db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId], (error, items) => {
          if (error) {
            return reject(error)
          }
          resolve(items)
        })
      })
    }

    const items = await fetchItems()
    const doc = new PDFDocument({ margin: 25 })
    doc.pipe(res)
    // header
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoice_number}.pdf`)
    doc
      .image('./public/images/samlogonew.png', 25, 25, {
        width: 150,
        align: 'left',
      })
      .fontSize(12)
      .text('S.A.M. Creations', 120, 35, { align: 'right' })
      .text('174 Hither Green Lane', 120, 50, { align: 'right' })
      .text('London', 120, 65, { align: 'right' })
      .text('SE13 6QB', 120, 80, { align: 'right' })

    doc.text(`Invoice Number: ${invoice.invoice_number}`, 25, 150, {
      align: 'left',
    })
    // client details and own bank details
    doc.fontSize(17).text(`Invoice:`, 25, 180, { align: 'left' })
    // line
    doc.moveTo(25, 200).lineTo(585, 200).stroke()
    // endline
    doc
      .fontSize(12)
      .text(`Company Name:    ${client.company_name}`, 25, 215, {
        align: 'left',
      })
      .text(`Client Name:    ${client.name}`, 25, 235, { align: 'left' })
      .text(`Invoice Date:    ${invoice.date}`, 25, 255, { align: 'left' })

    // If deposit is present
    if (invoice.deposit_value !== 0) {
      doc.text(`Total Invoice Balance:    £${invoice.total}`, 25, 275, {
        align: 'left',
      })
      doc.text(`Deposit Payment Due:   ${invoice.deposit_value}%(£${invoice.depoVal_ifPercent})`, 25, 295, {
        align: 'left',
      })
    } else {
      doc.text(`Balance Due:    £${invoice.total}`, 25, 275, { align: 'left' })
    }

    // Bank details
    doc
      .text(`Name:    XXXXXXXXXXXXX`, 120, 215, { align: 'right' })
      .text(`VAT Number:    XXXXXXXX`, 120, 235, { align: 'right' })
      .text(`Bank:    Barclays`, 120, 255, { align: 'right' })
      .text(`Account Number:    XXXXXXXX`, 120, 275, { align: 'right' })
      .text(`Sort Code:    XX-XX-XX`, 120, 295, { align: 'right' })

    // line
    doc.moveTo(25, 315).lineTo(585, 315).stroke()
    // endline

    // Define start coordinates and column widths for the table
    const startX = 25
    let startY = 340
    const columnWidths = [250, 80, 80, 50]

    // Function to check space and add a new page if necessary
    function checkPageSpace(doc, startY, lineHeight = 20) {
      const pageHeight = doc.page.height // Total height of the page
      const bottomMargin = 50 // Margin at the bottom of the page
      if (startY + lineHeight > pageHeight - bottomMargin) {
        doc.addPage()
        return 50 // Reset startY for the new page, accounting for the top margin
      }
      return startY
    }

    // Draw table headers
    doc.fontSize(12)
    startY = checkPageSpace(doc, startY)
    doc.text('Name', startX, startY)
    doc.text('Type', startX + columnWidths[0], startY)
    doc.text('Price', startX + columnWidths[0] + columnWidths[1], startY)
    doc.text('Quantity', startX + columnWidths[0] + columnWidths[1] + columnWidths[2], startY)
    doc.text('Item Total', startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[2], startY)

    // Draw a line under the headers
    doc
      .moveTo(startX, startY + 15)
      .lineTo(585, startY + 15)
      .stroke()

    startY += 25
    // Items here
    items.forEach(item => {
      const itemType = item.type === 'sample' ? 'Sample' : 'Style'
      startY = checkPageSpace(doc, startY)
      doc.text(item.name, startX, startY)
      doc.text(itemType, startX + columnWidths[0], startY)
      doc.text(`£${item.price}`, startX + columnWidths[0] + columnWidths[1], startY)
      doc.text(`x${item.quantity}`, startX + columnWidths[0] + columnWidths[1] + columnWidths[2], startY)
      doc.text(
        `£${item.total_item_price}`,
        startX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[2],
        startY,
      )
      startY += 20
    })

    startY += 20

    // Totals here
    startY = checkPageSpace(doc, startY)
    doc.text(`Subtotal: £${invoice.subtotal}`, startX, startY, {
      align: 'left',
    })

    // Show % if discount type is percentage
    if (invoice.discount_type === 1 && invoice.discount_value > 0) {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(`Discount: £${invoice.discVal_ifPercent} (${invoice.discount_value}%)`, startX, startY, {
        align: 'left',
      })
    }

    // Show £ if discount type is flat
    if (invoice.discount_type === 0 && invoice.discount_value > 0) {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(`Discount: £${invoice.discount_value}`, startX, startY, {
        align: 'left',
      })
    }

    startY = checkPageSpace(doc, startY + 20)
    doc.text(`VAT: £${invoice.vat}`, startX, startY, { align: 'left' })

    if (invoice.discount_value !== 0) {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(`Total: £${invoice.total} `, startX, startY, {
        align: 'left',
        continued: true,
      })
      doc.text(`£${invoice.total_pre_discount}`, startX, startY, {
        align: 'left',
        strike: true,
      })
    } else {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(`Total: £${invoice.total}`, startX, startY, { align: 'left' })
    }

    if (invoice.deposit_value !== 0) {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(`Deposit: ${invoice.deposit_value}% (£${invoice.depoVal_ifPercent})`, startX, startY, {
        align: 'left',
      })
    }

    if (invoice.note !== '') {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(`Client note: ${invoice.note}`, startX, startY, {
        align: 'left',
      })
    }

    startY += 60
    startY = checkPageSpace(doc, startY)
    doc.fontSize(17)
    doc.text(`Terms and conditions: `, startX, startY, { align: 'left' })
    startY += 10
    // line
    doc
      .moveTo(25, startY + 15)
      .lineTo(585, startY + 15)
      .stroke()
    // endline
    doc.fontSize(12)
    startY += 10

    const terms = [
      `1. Full payment is due within two weeks of invoice date.`,
      `2. A deposit of 50% is required at the start of production, unless otherwise agreed.`,
      `3. Late Payments: A 1% daily fee will be applied to outstanding balances after two weeks.`,
      `4. Late deliveries and delays on the client's end will result in adjusted payment deadlines.`,
      `5. Non-Payment: Legal action may be taken or the outstanding balance handed to a debt collection agency, if the client does not make payment within the above specified time frame.`,
      `6. Returns: Unsatisfactory goods must be returned within one week of receiving the items.`,
      `7. Renegotiation: Post-agreement renegotiations are not accepted.`,
      `8. Shipping: The company is not liable for goods damaged or lost during delivery.`,
    ]

    terms.forEach(term => {
      if (term.includes('Returns: Unsatisfactory goods must be returned')) {
        startY += 20
      }
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(term, startX, startY, { align: 'left' })
    })

    doc.end()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Getting the invoice statuses
router.get('/api/invoices/statuses', (req, res) => {
  db.all('SELECT invoice_number, status FROM invoices', [], (error, results) => {
    if (error) {
      return res.status(500).send({ error: 'Error fetching invoice statuses' })
    }
    res.json(results)
  })
})

// Update invoice status
router.post('/api/invoices/:invoiceNumber/updateStatus', (req, res) => {
  const invoiceNumber = req.params.invoiceNumber
  const { status } = req.body
  if (!status) {
    // Added check to ensure status is provided
    return res.status(400).send({
      error: 'Status is required: /api/invoices/:invoiceNumber/updateStatus',
    })
  }
  db.run('UPDATE invoices SET status = ? WHERE invoice_number = ?', [status, invoiceNumber], function (error) {
    if (error) {
      return res.status(500).send({ error: 'Error updating invoice status' })
    }
    res.json({ message: `Status updated for invoice ${invoiceNumber}` })
  })
})

module.exports = router
