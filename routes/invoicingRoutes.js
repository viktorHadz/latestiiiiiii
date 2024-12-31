const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()
const PDFDocument = require('pdfkit')
const { resolve } = require('path')
const doc = require('pdfkit')

// Fetch all clients
router.get('/api/clients', (req, res) => {
  db.all('SELECT * FROM clients', [], (error, results) => {
    if (error) {
      return res.status(500).send({ error: 'Error fetching clients' })
    }
    res.json(results)
  })
})

// Fetch a client information by their ID
router.get('/api/clients/:id', (req, res) => {
  const clientId = req.params.id
  db.get('SELECT * FROM clients WHERE id = ?', [clientId], (error, result) => {
    if (error) {
      return res.status(500).send(error)
    }
    res.json(result)
  })
})

// Fetch styles for a specific client
router.get('/api/styles/client/:clientId', (req, res) => {
  const clientId = req.params.clientId
  db.all(
    'SELECT * FROM styles WHERE client_id = ?',
    [clientId],
    (error, results) => {
      if (error) {
        return res.status(500).send({ error: 'Error fetching styles' })
      }
      res.json(results)
    },
  )
})

// Fetch samples for a specific client
router.get('/api/samples/client/:clientId', (req, res) => {
  const clientId = req.params.clientId
  db.all(
    'SELECT * FROM samples WHERE client_id = ?',
    [clientId],
    (error, results) => {
      if (error) {
        return res.status(500).send({ error: 'Error fetching samples' })
      }
      res.json(results)
    },
  )
})

// Post a new stye into the styles table
router.post('/styles', (req, res) => {
  const { name, price, client_id } = req.body

  db.run(
    'INSERT INTO styles (name, price, client_id) VALUES (?, ?, ?)',
    [name, price, client_id],
    function (error) {
      if (error) {
        return res.status(500).send(error)
      }
      // Fetch the newly added style details
      db.get(
        'SELECT * FROM styles WHERE id = ?',
        [this.lastID],
        (error, newStyle) => {
          if (error) {
            return res.status(500).send(error)
          }
          if (newStyle) {
            res.status(201).json(newStyle)
          } else {
            res.status(404).json({ message: 'Newly added style not found.' })
          }
        },
      )
    },
  )
})

// Create new sample from Invoicing menu
router.post('/samples', (req, res) => {
  const { name, time, price, client_id } = req.body

  db.run(
    'INSERT INTO samples (name, time, price, client_id) VALUES (?, ?, ?, ?)',
    [name, time, price, client_id],
    function (error) {
      if (error) {
        return res.status(500).send(error)
      }
      // Fetch the newly added sample details
      db.get(
        'SELECT * FROM samples WHERE id = ?',
        [this.lastID],
        (error, newSample) => {
          if (error) {
            return res.status(500).send(error)
          }
          if (newSample) {
            res.status(201).json(newSample)
          } else {
            res.status(404).json({ message: 'Newly added sample not found.' })
          }
        },
      )
    },
  )
})

// Route to get the next invoice number
router.get('/api/getNextInvoiceNumber', (req, res) => {
  db.get(
    'SELECT MAX(invoice_number) AS maxInvoiceNumber FROM invoices',
    [],
    (error, result) => {
      if (error) {
        return res
          .status(500)
          .send({ error: 'Error fetching the max invoice number' })
      }
      const maxInvoiceNumber = result.maxInvoiceNumber
      const nextInvoiceNumber = maxInvoiceNumber
        ? `SAM${parseInt(maxInvoiceNumber.slice(3)) + 1}`
        : 'SAM1'
      res.json({ nextInvoiceNumber })
    },
  )
})
// deposit_flat, deposit_percent, discountPercentValue, depositPercentValue
// Object to insert items into invoices DB table
const insertInvoice = (
  clientId,
  discountPercent,
  discountFlat,
  vatPercent,
  subtotal,
  discount,
  discountPercentValue,
  vat,
  total,
  deposit,
  depositPercentValue,
  note,
  total_pre_discount,
  date,
  depositFlat,
  depositPercent,
) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO invoices (client_id, discount_percent, discount_flat, vat_percent, subtotal, discount, discount_percent_value, vat, total, deposit, deposit_percent_value, note, total_pre_discount, date, deposit_percent, deposit_flat) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        clientId,
        discountPercent,
        discountFlat,
        vatPercent,
        subtotal,
        discount,
        discountPercentValue,
        vat,
        total,
        deposit,
        depositPercentValue,
        note,
        total_pre_discount,
        date,
        depositFlat,
        depositPercent,
      ],
      function (error) {
        if (error) {
          return reject(
            new Error(
              'Error inserting invoice(Trigered from: insertInvoice): ' +
                error.message,
            ),
          )
        }

        const invoiceId = this.lastID
        const invoiceNumber = `SAM${invoiceId}`

        // Update the invoice with the generated invoice number
        db.run(
          'UPDATE invoices SET invoice_number = ? WHERE id = ?',
          [invoiceNumber, invoiceId],
          function (updateError) {
            if (updateError) {
              return reject(
                new Error(
                  'Error updating invoice number: ' + updateError.message,
                ),
              )
            }

            resolve(invoiceId)
          },
        )
      },
    )
  })
}
// Inserts into invoice_items
const insertItems = (invoiceId, items) => {
  return new Promise((resolve, reject) => {
    const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(',')
    const values = items.flatMap(item => [
      item.name,
      item.price,
      item.type,
      item.time,
      invoiceId,
      item.quantity,
      // calculates item_total_price price x qty
      (item.total_item_price = item.price * item.quantity),
    ])
    db.run(
      `INSERT INTO invoice_items (name, price, type, time, invoice_id, quantity, total_item_price) VALUES ${placeholders}`,
      values,
      function (error) {
        if (error) {
          return reject(
            new Error('Error inserting invoice items: ' + error.message),
          )
        }
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
    discountPercent,
    discountFlat,
    vatPercent,
    subtotal,
    discount,
    discountPercentValue,
    vat,
    total,
    deposit,
    depositPercentValue,
    note,
    totalPreDiscount,
    date,
    depositPercent,
    depositFlat,
  } = req.body

  try {
    const invoiceId = await insertInvoice(
      clientId,
      discountPercent,
      discountFlat,
      vatPercent,
      subtotal,
      discount,
      discountPercentValue,
      vat,
      total,
      deposit,
      depositPercentValue,
      note,
      totalPreDiscount,
      date,
      depositPercent,
      depositFlat,
    )
    await insertItems(invoiceId, items)

    const invoiceNumber = `SAM${invoiceId}`
    const newInvoice = {
      id: invoiceId,
      invoiceNumber,
      clientId,
      items,
      discountPercent,
      discountFlat,
      vatPercent,
      subtotal,
      discount,
      vat,
      total,
      deposit,
      note,
      totalPreDiscount,
      date,
      depositPercent,
      depositFlat,
    }
    res.status(201).json(newInvoice)
  } catch (error) {
    res.status(500).json({
      error: 'Error saving invoice /api/saveInvoice: ' + error.message,
    })
  }
})

// Generate PDF for an invoice
router.get('/api/invoices/:id/pdf', async (req, res) => {
  const invoiceId = req.params.id

  try {
    // Fetch the invoice from the database
    const invoice = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM invoices WHERE id = ?',
        [invoiceId],
        (error, invoice) => {
          if (error) {
            return reject(error)
          }
          resolve(invoice)
        },
      )
    })

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    // Get client information
    const client = await new Promise((resolve, reject) => {
      db.get(
        'SELECT company_name, name FROM clients WHERE id = ?',
        [invoice.client_id],
        (error, client) => {
          if (error) {
            return reject(error)
          }
          if (!client) {
            return reject(new Error('Client not found'))
          }
          resolve(client)
        },
      )
    })

    // Fetch items for the creation of the invoice
    const fetchItems = () => {
      return new Promise((resolve, reject) => {
        db.all(
          'SELECT * FROM invoice_items WHERE invoice_id = ?',
          [invoiceId],
          (error, items) => {
            if (error) {
              return reject(error)
            }
            resolve(items)
          },
        )
      })
    }

    const items = await fetchItems()
    const doc = new PDFDocument({ margin: 25 })
    doc.pipe(res)
    // header
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice-${invoice.invoice_number}.pdf`,
    )
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
    if (invoice.deposit !== 0) {
      doc.text(`Total Invoice Balance:    £${invoice.total}`, 25, 275, {
        align: 'left',
      })
      doc.text(`Deposit Payment Due:    £${invoice.deposit}`, 25, 295, {
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
    doc.text(
      'Quantity',
      startX + columnWidths[0] + columnWidths[1] + columnWidths[2],
      startY,
    )
    doc.text(
      'Item Total',
      startX +
        columnWidths[0] +
        columnWidths[1] +
        columnWidths[2] +
        columnWidths[2],
      startY,
    )

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
      doc.text(
        `£${item.price}`,
        startX + columnWidths[0] + columnWidths[1],
        startY,
      )
      doc.text(
        `x${item.quantity}`,
        startX + columnWidths[0] + columnWidths[1] + columnWidths[2],
        startY,
      )
      doc.text(
        `£${item.total_item_price}`,
        startX +
          columnWidths[0] +
          columnWidths[1] +
          columnWidths[2] +
          columnWidths[2],
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

    // show % if discount is percentage !TODO! - :D FIXIT
    if (
      invoice.discount_percent === 1 &&
      invoice.discount_flat === 0 &&
      invoice.discount > 0
    ) {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(
        `Discount: £${invoice.discount} (${invoice.discount_percent_value}%)`,
        startX,
        startY,
        {
          align: 'left',
        },
      )
    }

    // show £ if discount is flat
    if (
      invoice.discount_flat === 1 &&
      invoice.discount_percent === 0 &&
      invoice.discount > 0
    ) {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(`Discount: £${invoice.discount}`, startX, startY, {
        align: 'left',
      })
    }

    startY = checkPageSpace(doc, startY + 20)
    doc.text(`VAT: £${invoice.vat}`, startX, startY, { align: 'left' })

    if (invoice.discount !== 0) {
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

    if (invoice.deposit !== 0) {
      startY += 20
      startY = checkPageSpace(doc, startY)
      doc.text(
        `Deposit: £${invoice.deposit} (${invoice.deposit_percent_value}%)`,
        startX,
        startY,
        {
          align: 'left',
        },
      )
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
      `1. Full payment is due within one week of invoice date.`,
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
  db.all(
    'SELECT invoice_number, status FROM invoices',
    [],
    (error, results) => {
      if (error) {
        return res
          .status(500)
          .send({ error: 'Error fetching invoice statuses' })
      }
      res.json(results)
    },
  )
})

// Update invoice status
router.post('/api/invoices/:invoiceNumber/updateStatus', (req, res) => {
  const invoiceNumber = req.params.invoiceNumber
  const { status } = req.body
  if (!status) {
    // Added check to ensure status is provided
    return res.status(400).send({
      error:
        'Status is required, look at /api/invoices/:invoiceNumber/updateStatus in the routes for invoicing.',
    })
  }
  db.run(
    'UPDATE invoices SET status = ? WHERE invoice_number = ?',
    [status, invoiceNumber],
    function (error) {
      if (error) {
        return res.status(500).send({ error: 'Error updating invoice status' })
      }
      res.json({ message: `Status updated for invoice ${invoiceNumber}` })
    },
  )
})

module.exports = router
