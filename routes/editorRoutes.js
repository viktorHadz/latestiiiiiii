const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()

router.use(express.json())

// ==== Fetching ====
// 1. InvoiceBook fetch
router.get('/list/:clientId', (req, res) => {
  const clientId = req.params.clientId
  const page = parseInt(req.query.page) || 1
  const limit = 10
  const offset = (page - 1) * limit

  db.get('SELECT name, address FROM clients WHERE id = ?', [clientId], (err, clientDetails) => {
    if (err) {
      res.status(500).json({
        error: `Couldn't fetch client details for client ${clientId}. Status: ${err.message}`,
      })
      return
    }
    if (!clientDetails) {
      return res.status(404).json({ error: `Client ${clientId} not found.` })
    }

    db.all(
      `SELECT 
        invoices.*, 
        (SELECT json_group_array(json_object('id', copied_invoices.id, 'invoice_number', copied_invoices.invoice_number, 'status', copied_invoices.invoice_status)) 
         FROM copied_invoices WHERE copied_invoices.original_invoice_id = invoices.id) AS copiedInvoices 
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
          copiedInvoices: invoice.copiedInvoices ? JSON.parse(invoice.copiedInvoices) : [],
        }))

        res.json(listData)
      },
    )
  })
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

// Fetch copied invoice names for list
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
    `SELECT id, invoice_number, original_invoice_id FROM copied_invoices 
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
        acc[copy.original_invoice_id].push(copy)
        return acc
      }, {})

      res.json(groupedCopies)
    },
  )
})

// Fetch for individual copy invoice
router.get('/invoice/copy/:invoiceId', (req, res) => {
  const invoiceId = req.params.invoiceId
  const copyInvoiceData = {}

  // Fetch invoice
  db.get('SELECT * FROM copied_invoices WHERE id = ?', [invoiceId], (err, invoice) => {
    if (err) return res.status(500).json({ error: `Error fetching invoice: ${err.message}` })
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' })

    copyInvoiceData.invoice = invoice

    // Fetch all invoice items for this invoice
    db.all('SELECT * FROM copied_invoice_items WHERE invoice_id = ?', [invoiceId], (err, items) => {
      if (err) return res.status(500).json({ error: `Error fetching invoice items: ${err.message}` })

      copyInvoiceData.invoiceItems = items
      res.json(copyInvoiceData) // Returns single structured object
    })
  })
})

// ==== Deleting Invocies ==== //
// Delete
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
// Delete copied invoice and its items
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
// Overwrite
router.post('/invoice/save/overwrite', async (req, res) => {
  const {
    invoiceId,
    clientId,
    items,
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
  } = req.body

  try {
    // 1. Update invoice values
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE invoices SET 
          client_id = ?, discount_type = ?, discount_value = ?, discVal_ifPercent = ?, 
          vat_percent = ?, vat = ?, subtotal = ?, total = ?, deposit_type = ?, deposit_value = ?, 
          depoVal_ifPercent = ?, note = ?, total_pre_discount = ?, date = ? 
        WHERE id = ?`,
        [
          clientId,
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
          invoiceId,
        ],
        function (error) {
          if (error) reject(new Error(`Error updating invoice: ${error.message}`))
          resolve()
        },
      )
    })

    // 2. Replace all invoice items
    await new Promise((resolve, reject) => {
      db.run(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceId], function (error) {
        if (error) reject(new Error(`Error deleting old invoice items: ${error.message}`))
        resolve()
      })
    })

    const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',')
    const values = items.flatMap(item => [
      item.name,
      item.price,
      item.type,
      item.time,
      invoiceId,
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

    res.status(200).json({ message: 'Invoice updated successfully.' })
  } catch (error) {
    res.status(500).json({ error: `Error updating invoice: ${error.message}` })
  }
})
// Copy invoice
router.post('/invoice/save/copy', async (req, res) => {
  const {
    invoiceId,
    clientId,
    items,
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
  } = req.body

  try {
    // Generate a new invoice number (SAM-1 → SAM-1.1)
    const originalInvoice = await new Promise((resolve, reject) => {
      db.get(`SELECT invoice_number FROM invoices WHERE id = ?`, [invoiceId], (error, result) => {
        if (error) reject(new Error(`Error fetching original invoice: ${error.message}`))
        resolve(result)
      })
    })

    if (!originalInvoice) {
      return res.status(404).json({ error: 'Original invoice not found' })
    }

    let newInvoiceNumber = originalInvoice.invoice_number + '.1' // Example: SAM-1 → SAM-1.1
    const existingCopies = await new Promise((resolve, reject) => {
      db.all(
        `SELECT invoice_number FROM copied_invoices WHERE original_invoice_id = ?`,
        [invoiceId],
        (error, results) => {
          if (error) reject(new Error(`Error checking existing copies: ${error.message}`))
          resolve(results)
        },
      )
    })

    if (existingCopies.length > 0) {
      newInvoiceNumber = `${originalInvoice.invoice_number}.${existingCopies.length + 1}`
    }

    // 1. Insert new copied invoice
    const newInvoiceId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO copied_invoices (
          original_invoice_id, invoice_number, client_id, discount_type, discount_value, discVal_ifPercent, 
          vat_percent, vat, subtotal, total, deposit_type, deposit_value, depoVal_ifPercent, note, 
          total_pre_discount, date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          newInvoiceNumber,
          clientId,
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
        ],
        function (error) {
          if (error) reject(new Error(`Error creating copied invoice: ${error.message}`))
          resolve(this.lastID)
        },
      )
    })

    // 2. Insert copied invoice items (including custom ones)
    const placeholders = items.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(',')
    const values = items.flatMap(item => [
      item.name,
      item.price,
      item.type,
      item.type === 'sample' ? item.time : 0,
      newInvoiceId,
      item.quantity,
      item.price * item.quantity,
      item.origin_id, // Now handles custom items properly
    ])

    await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO copied_invoice_items (name, price, type, time, invoice_id, quantity, total_item_price, origin_id) 
        VALUES ${placeholders}`,
        values,
        function (error) {
          if (error) reject(new Error(`Error inserting copied invoice items: ${error.message}`))
          resolve()
        },
      )
    })

    return res.status(201).json({ message: 'Copied invoice created successfully.', newInvoiceId })
  } catch (error) {
    res.status(500).json({ error: `Error creating copied invoice: ${error.message}` })
  }
})
module.exports = router
