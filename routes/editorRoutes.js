const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()
// ALL ROUTERS NEED CLIENT ID ENSURE THEY HAVE IT
function gettingData(body) {
  const requiredFields = [
    'clientId',
    'items',
    'discountType',
    'discountValue',
    'discVal_ifPercent',
    'vatPercent',
    'vat',
    'subtotal',
    'total',
    'depositType',
    'depositValue',
    'depoVal_ifPercent',
    'note',
    'totalPreDiscount',
    'date',
    'due_by_date',
    'remaining_balance',
    'invoice_id',
    'original_invoice_id',
    'invoice_number',
  ]
  // console.log('Received body in gettingData:', body)
  // Check for missing fields
  const missingFields = requiredFields.filter(field => body[field] === undefined)
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields: ${missingFields.map(field => `${field} (value: ${body[field]})`).join(', ')}`,
    )
  }

  // Validate data types
  if (typeof body.clientId !== 'number') throw new Error('clientId must be a number.')
  if (!Array.isArray(body.items) || body.items.length === 0) throw new Error('items must be a non-empty array.')
  if (typeof body.discountValue !== 'number') throw new Error('discountValue must be a number.')
  if (typeof body.total !== 'number') throw new Error('total must be a number.')
  if (typeof body.invoice_id !== 'number') throw new Error('invoiceId must be a number.')
  if (typeof body.date !== 'string') throw new Error('date must be a string.')
  if (typeof body.due_by_date !== 'string') throw new Error('due_by_date must be a string.')

  return {
    clientId: body.clientId,
    items: body.items,
    discountType: body.discountType,
    discountValue: body.discountValue,
    discVal_ifPercent: body.discVal_ifPercent,
    vatPercent: body.vatPercent,
    vat: body.vat,
    subtotal: body.subtotal,
    total: body.total,
    depositType: body.depositType,
    depositValue: body.depositValue,
    depoVal_ifPercent: body.depoVal_ifPercent,
    note: body.note,
    totalPreDiscount: body.totalPreDiscount,
    date: body.date,
    due_by_date: body.due_by_date,
    remaining_balance: body.remaining_balance,
    invoice_id: body.invoice_id, // Use only invoice_id
    original_invoice_id: body.original_invoice_id,
    invoice_number: body.invoice_number,
  }
}

router.use(express.json())

// 1. InvoiceBook fetch
router.get('/list/:clientId', (req, res) => {
  const clientId = req.params.clientId
  const page = parseInt(req.query.page) || 1
  const limit = 10
  const offset = (page - 1) * limit

  db.get('SELECT name, address FROM clients WHERE id = ?', [clientId], (err, clientDetails) => {
    if (err) {
      res.status(500).json({ error: `Couldn't fetch client details for client ${clientId}. Status: ${err.message}` })
      return
    }
    if (!clientDetails) {
      return res.status(404).json({ error: `Client ${clientId} not found.` })
    }

    // First, count total invoices:
    db.get('SELECT COUNT(*) AS count FROM invoices WHERE client_id = ?', [clientId], (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: `Couldn't fetch invoice count: ${err.message}` })
      }
      const totalCount = countResult.count
      const totalPages = Math.ceil(totalCount / limit)

      // Now fetch the invoices for the current page:
      db.all(
        `SELECT 
          invoices.*, 
          (SELECT json_group_array(json_object('id', copied_invoices.id, 'invoice_number', copied_invoices.invoice_number, 'status', copied_invoices.invoice_status)) 
           FROM copied_invoices WHERE copied_invoices.original_invoice_id = invoices.id) AS copies 
         FROM invoices 
         WHERE client_id = ? 
         ORDER BY date DESC, id DESC 
         LIMIT ? OFFSET ?`,
        [clientId, limit, offset],
        (err, invoiceDetails) => {
          if (err) {
            return res.status(500).json({ error: `Couldn't fetch invoices. ${err.message}` })
          }

          const listData = invoiceDetails.map(invoice => ({
            ...invoice,
            client_name: clientDetails.name,
          }))

          res.json({ data: listData, totalPages: totalPages })
        },
      )
    })
  })
})
// Fetch copied invoice names for invoiceBook list
router.get('/invoice/copy/names', (req, res) => {
  const invoiceIds = req.query.invoiceIds
    ?.split(',')
    .map(id => parseInt(id))
    .filter(Boolean)

  if (!invoiceIds || invoiceIds.length === 0) {
    return res.status(400).json({ error: 'No invoice IDs provided' })
  }

  const placeholders = invoiceIds.map(() => '?').join(',')

  db.all(
    `SELECT id, invoice_number, original_invoice_id, invoice_status FROM copied_invoices 
     WHERE original_invoice_id IN (${placeholders}) 
     ORDER BY CAST(SUBSTR(invoice_number, INSTR(invoice_number, '.') + 1) AS INTEGER) ASC`,
    invoiceIds,
    (err, copiedInvoices) => {
      if (err) {
        return res.status(500).json({ error: `Error fetching copied invoices: ${err.message}` })
      }

      // Group copied invoices by their original invoice ID
      const groupedCopies = copiedInvoices.reduce((acc, copy) => {
        if (!acc[copy.original_invoice_id]) {
          acc[copy.original_invoice_id] = []
        }
        acc[copy.original_invoice_id].push({ ...copy, isCopy: true })
        return acc
      }, {})

      res.json(groupedCopies)
    },
  )
})
// 2. Individual Invoice Details
router.get('/invoice/:invoiceId', (req, res) => {
  const invoiceId = req.params.invoiceId
  const invoiceData = {}

  // Fetch invoice
  db.get('SELECT * FROM invoices WHERE id = ?', [invoiceId], (err, invoice) => {
    if (err) return res.status(500).json({ error: `Error fetching invoice: ${err.message}` })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    invoiceData.invoice = invoice

    // Fetch all invoice items for this invoice
    db.all('SELECT * FROM invoice_items WHERE invoice_id = ?', [invoiceId], (err, items) => {
      if (err) return res.status(500).json({ error: `Error fetching invoice items: ${err.message}` })

      invoiceData.invoiceItems = items
      res.json(invoiceData) // Returns single structured object
    })
  })
})
// 3. Items fetch
router.get('/existing/items/:clientId', (req, res) => {
  const clientId = req.params.clientId
  const itemsData = {}

  db.all('SELECT * FROM styles WHERE client_id = ?', [clientId], (err, styles) => {
    if (err) return res.status(500).json({ error: `Error fetching styles: ${err.message}` })

    itemsData.styles = styles

    db.all('SELECT * FROM samples WHERE client_id = ?', [clientId], (err, samples) => {
      if (err) return res.status(500).json({ error: `Error fetching samples: ${err.message}` })

      itemsData.samples = samples
      res.json(itemsData)
    })
  })
})
// Paid/Unpaid status
router.post('/invoice/:invoiceId/status', (req, res) => {
  const { invoiceId } = req.params

  // Fetch the current invoice status
  const getStatusQuery = 'SELECT invoice_status FROM invoices WHERE id = ?'

  db.get(getStatusQuery, [invoiceId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: `Error fetching invoice status: ${err.message}` })
    }
    if (!row) {
      return res.status(404).json({ error: `Invoice ${invoiceId} not found.` })
    }

    const statusMap = {
      unpaid: 'unpaid',
      partiallyPaid: 'paritally',
      paid: 'paid',
    }

    // Determine the new status based on current status
    const newStatus = statusMap[row.invoice_status]
    if (!newStatus) {
      return res.status(400).json({ error: `Invalid status type.` })
    }

    const updateQuery = 'UPDATE invoices SET invoice_status = ? WHERE id = ?'
    db.run(updateQuery, [newStatus, invoiceId], function (err) {
      if (err) {
        return res.status(500).json({ error: `Couldn't update invoice status: ${err.message}` })
      }
      res.json({ success: true, newStatus })
    })
  })
})

// Individual Copy Invoice Details (for display/editing)
router.get('/invoice/copy/:copyInvoiceId', (req, res) => {
  const copyInvoiceId = req.params.copyInvoiceId
  db.get('SELECT * FROM copied_invoices WHERE id = ?', [copyInvoiceId], (err, invoiceCopy) => {
    if (err) {
      return res.status(500).json({ error: `Error fetching invoice copy: ${err.message}` })
    }
    if (!invoiceCopy) {
      return res.status(404).json({ error: 'Invoice copy not found' })
    }
    db.all('SELECT * FROM copied_invoice_items WHERE invoice_id = ?', [copyInvoiceId], (err, items) => {
      if (err) {
        return res.status(500).json({ error: `Error fetching invoice copy items: ${err.message}` })
      }
      invoiceCopy.invoiceItems = items
      res.json({ invoice: invoiceCopy })
    })
  })
})

// ==== Deleting Invocies ==== //
// Delete regular invoice
router.delete('/invoice/delete/:invoiceId', (req, res) => {
  const { invoiceId } = req.params

  db.run('DELETE FROM invoices WHERE id = ?', [invoiceId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete invoice' })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    res.status(200).json({ message: 'Invoice deleted successfully' })
  })
})
// Deletes copied invoice and its items
router.delete('/invoice/copy/delete/:invoiceId', (req, res) => {
  const { invoiceId } = req.params

  db.run('DELETE FROM copied_invoices WHERE id = ?', [invoiceId], function (err) {
    if (err) {
      return res.status(500).json({ error: `Failed to delete copied invoice: ${err.message}` })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Copied invoice not found' })
    }

    res.status(200).json({ message: 'Copied invoice deleted successfully', invoiceId })
  })
})

// ==== Saving Invocies ==== //
// Overwrites existing invoice
router.post('/invoice/save/overwrite', async (req, res) => {
  const invoiceData = gettingData(req.body)
  const { items } = invoiceData

  try {
    // Build parameters in the correct order
    const params = [
      invoiceData.clientId, // client_id
      invoiceData.discountType, // discount_type
      invoiceData.discountValue, // discount_value
      invoiceData.discVal_ifPercent, // discVal_ifPercent
      invoiceData.vatPercent, // vat_percent
      invoiceData.vat, // vat
      invoiceData.subtotal, // subtotal
      invoiceData.total, // total
      invoiceData.depositType, // deposit_type
      invoiceData.depositValue, // deposit_value
      invoiceData.depoVal_ifPercent, // depoVal_ifPercent
      invoiceData.note, // note
      invoiceData.totalPreDiscount, // total_pre_discount
      invoiceData.date, // date
      invoiceData.due_by_date, // due_by_date
      invoiceData.remaining_balance, // remaining_balance
      invoiceData.invoice_id, // WHERE id = ?
    ]

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE invoices SET 
          client_id = ?, discount_type = ?, discount_value = ?, discVal_ifPercent = ?, 
          vat_percent = ?, vat = ?, subtotal = ?, total = ?, deposit_type = ?, deposit_value = ?, 
          depoVal_ifPercent = ?, note = ?, total_pre_discount = ?, date = ?, due_by_date = ?, remaining_balance = ? 
        WHERE id = ?`,
        params,
        function (error) {
          if (error) reject(new Error(`Error updating invoice: ${error.message}`))
          resolve()
        },
      )
    })

    // Continue with deleting and inserting invoice items (unchanged)
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceData.invoice_id], function (error) {
        if (error) reject(new Error(`Error deleting old invoice items: ${error.message}`))
        resolve()
      })
    })

    if (items.length > 0) {
      const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',')
      const values = items.flatMap(item => [
        item.name,
        item.price,
        item.type,
        item.time,
        invoiceData.invoice_id,
        item.quantity,
        item.total_item_price,
        item.origin_id,
      ])

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO invoice_items (name, price, type, time, invoice_id, quantity, total_item_price, origin_id) 
          VALUES ${placeholders}`,
          values,
          function (error) {
            if (error) reject(new Error(`Error inserting new invoice items: ${error.message}`))
            resolve()
          },
        )
      })
    }

    res.status(200).json({ message: 'Invoice updated successfully.' })
  } catch (error) {
    if (error.message.startsWith('Missing required fields') || error.message.includes('must be')) {
      res.status(400).json({ error: error.message }) // Validation error (bad request)
    } else {
      res.status(500).json({ error: `Error updating invoice: ${error.message}` }) // Server error
    }
  }
})
// Saves a copy invoice
router.post('/invoice/save/copy', async (req, res) => {
  try {
    const invoiceData = gettingData(req.body)
    console.log('Processed invoiceData:', invoiceData) // Debugging

    const { items, original_invoice_id, clientId, invoice_number, ...invoiceFields } = invoiceData

    if (!original_invoice_id) {
      throw new Error('Missing original invoice ID.')
    }

    console.log('Original Invoice ID Received:', original_invoice_id) // Debugging

    const db = getDb()

    // Count existing copies
    const existingCopies = await new Promise((resolve, reject) => {
      db.all(
        `SELECT invoice_number FROM copied_invoices WHERE original_invoice_id = ?`,
        [original_invoice_id],
        (err, rows) => {
          if (err) return reject(new Error(`Database error counting copies: ${err.message}`))
          resolve(rows.length)
        },
      )
    })

    const newInvoiceNumber = `${invoice_number}.${existingCopies + 1}`

    // Insert copied invoice
    const copiedInvoiceId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO copied_invoices (
          original_invoice_id, invoice_number, client_id, discount_type, discount_value,
          discVal_ifPercent, vat_percent, vat, subtotal, total, deposit_type, deposit_value,
          depoVal_ifPercent, note, total_pre_discount, date, due_by_date, remaining_balance
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          original_invoice_id, // <- Correctly using `original_invoice_id`
          newInvoiceNumber,
          clientId,
          invoiceFields.discountType,
          invoiceFields.discountValue,
          invoiceFields.discVal_ifPercent,
          invoiceFields.vatPercent,
          invoiceFields.vat,
          invoiceFields.subtotal,
          invoiceFields.total,
          invoiceFields.depositType,
          invoiceFields.depositValue,
          invoiceFields.depoVal_ifPercent,
          invoiceFields.note,
          invoiceFields.totalPreDiscount,
          invoiceFields.date,
          invoiceFields.due_by_date,
          invoiceFields.remaining_balance,
        ],
        function (err) {
          if (err) return reject(new Error(`Error inserting copied invoice: ${err.message}`))
          resolve(this.lastID)
        },
      )
    })

    if (!copiedInvoiceId) {
      throw new Error('Failed to retrieve copied invoice ID.')
    }

    // Insert copied invoice items
    if (items.length > 0) {
      const values = items.flatMap(({ name, price, type, time, quantity, origin_id }) => [
        name,
        price,
        type,
        type === 'sample' ? time : 0,
        quantity,
        price * quantity,
        copiedInvoiceId,
        origin_id,
      ])
      const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',')

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO copied_invoice_items (name, price, type, time, quantity, total_item_price, invoice_id, origin_id) 
          VALUES ${placeholders}`,
          values,
          function (err) {
            if (err) return reject(new Error(`Error inserting copied invoice items: ${err.message}`))
            resolve()
          },
        )
      })
    }

    res.status(201).json({ message: 'Copied invoice created successfully.' })
  } catch (error) {
    console.error('Error:', error.message) // Log for debugging
    res.status(error.message.includes('not found') ? 400 : 500).json({ error: error.message })
  }
})
// ==== Invoce Status ==== //
// Update a copied invoice with selected fields and recalc status
router.post('/invoice/copy/update/:invoiceId', (req, res) => {
  try {
    const {
      clientId,
      invoice_id,
      discountType,
      discountValue,
      discVal_ifPercent,
      vatPercent,
      vat,
      subtotal,
      total,
      depositType,
      depositValue,
      depoVal_ifPercent,
      note,
      totalPreDiscount,
      date,
      due_by_date,
      remaining_balance,
    } = req.body

    // Ensure the invoice_id in the URL and body match.
    if (parseInt(req.params.invoiceId, 10) !== invoice_id) {
      return res.status(400).json({ error: 'Invoice ID in URL and body do not match.' })
    }

    // Calculate new status based on remaining_balance and depositValue:
    let invoice_status
    if (remaining_balance === 0) {
      invoice_status = 'paid'
    } else if (depositValue !== 0) {
      invoice_status = 'partiallyPaid'
    } else {
      invoice_status = 'unpaid'
    }

    const sql = `
      UPDATE copied_invoices SET
        discount_type = ?,
        discount_value = ?,
        discVal_ifPercent = ?,
        vat_percent = ?,
        vat = ?,
        subtotal = ?,
        total = ?,
        deposit_type = ?,
        deposit_value = ?,
        depoVal_ifPercent = ?,
        note = ?,
        total_pre_discount = ?,
        date = ?,
        due_by_date = ?,
        remaining_balance = ?,
        invoice_status = ?
      WHERE id = ? AND client_id = ?
    `
    const params = [
      discountType,
      discountValue,
      discVal_ifPercent,
      vatPercent,
      vat,
      subtotal,
      total,
      depositType,
      depositValue,
      depoVal_ifPercent,
      note,
      totalPreDiscount,
      date,
      due_by_date,
      remaining_balance,
      invoice_status,
      invoice_id, // from req.body
      clientId, // from req.body
    ]

    db.run(sql, params, function (err) {
      if (err) return res.status(500).json({ error: err.message })
      res.json({ success: true, invoiceId: invoice_id })
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
