const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()
const { fetchInvoiceById, validateAndSave } = require('../services/invoiceValidation')

// ALL ROUTERS NEED CLIENT ID ENSURE THEY HAVE IT
router.use(express.json())
/**
 *
 *
 * INVOICE-BOOK
 * FETCHING
 * LOGIC
 *
 *
 */
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

/**
 *
 *
 * ITEMS_FETCH
 *
 *
 */
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
/**
 *
 *
 * INVOICE-BOOK
 * INVOICES
 * LOGIC
 *
 *
 */
// 2. Individual Invoice Details
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    const isCopy = req.query.isCopy === 'true'
    const invoice = await fetchInvoiceById(req.params.invoiceId, isCopy)
    res.json({ invoice })
  } catch (error) {
    res.status(500).json({ error: `Error retrieving invoice: ${error.message}` })
  }
})
// Individual Copy Invoice Details (for display/editing)
router.get('/invoice/copy/:copyInvoiceId', (req, res) => {
  const copyInvoiceId = req.params.copyInvoiceId
  db.get('SELECT * FROM copied_invoices WHERE id = ?', [copyInvoiceId], (err, invoiceCopy) => {
    if (err) return res.status(500).json({ error: `Error fetching invoice copy: ${err.message}` })
    if (!invoiceCopy) return res.status(404).json({ error: 'Invoice copy not found' })

    // Fetch invoice items
    db.all('SELECT * FROM copied_invoice_items WHERE invoice_id = ?', [copyInvoiceId], (err, items) => {
      if (err) return res.status(500).json({ error: `Error fetching copied invoice items: ${err.message}` })

      invoiceCopy.invoiceItems = items

      // Fetch deposits related to this copied invoice
      db.all(
        'SELECT id, key, amount FROM copied_deposits WHERE copied_invoice_id = ?',
        [copyInvoiceId],
        (err, deposits) => {
          if (err) return res.status(500).json({ error: `Error fetching copied deposits: ${err.message}` })

          invoiceCopy.deposits = deposits || []

          res.json({ invoice: invoiceCopy })
        },
      )
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

/**
 *
 *
 * SAVING
 * INVOICES
 * LOGIC
 *
 *
 */

// Overwrites existing invoice
router.post('/invoice/save', async (req, res) => {
  try {
    const message = await validateAndSave(req.body)
    res.status(200).json({ message })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// router.post('/invoice/save/overwrite', async (req, res) => {
//   try {
//     const invoiceData = gettingData(req.body)
//     const { items, totals, invoice_id } = invoiceData

//     const params = [
//       invoiceData.clientId,
//       totals.discount_type,
//       totals.discount_value,
//       totals.discVal_ifPercent,
//       totals.vat_percent,
//       totals.vat,
//       totals.subtotal,
//       totals.total,
//       totals.deposit_type,
//       totals.deposit_value,
//       totals.depoVal_ifPercent,
//       totals.note,
//       totals.totalPreDiscount,
//       totals.date,
//       totals.due_by_date,
//       totals.remaining_balance,
//       invoice_id,
//     ]

//     await new Promise((resolve, reject) => {
//       db.run(
//         `UPDATE invoices SET
//                 client_id = ?, discount_type = ?, discount_value = ?, discVal_ifPercent = ?,
//                 vat_percent = ?, vat = ?, subtotal = ?, total = ?, deposit_type = ?, deposit_value = ?,
//                 depoVal_ifPercent = ?, note = ?, total_pre_discount = ?, date = ?, due_by_date = ?, remaining_balance = ?
//               WHERE id = ?`,
//         params,
//         function (error) {
//           if (error) reject(new Error(`Error updating invoice: ${error.message}`))
//           resolve()
//         },
//       )
//     })

//     // Handles deposits
//     await new Promise((resolve, reject) => {
//       db.run('DELETE FROM deposits WHERE invoice_id = ?', [invoice_id], function (error) {
//         if (error) reject(new Error(`Error deleting old deposits: ${error.message}`))
//         resolve()
//       })
//     })

//     if (totals.deposits.length > 0) {
//       const placeholders = totals.deposits.map(() => '(?, ?, ?)').join(',')
//       const values = totals.deposits.flatMap(d => [invoice_id, d.key, d.amount])

//       await new Promise((resolve, reject) => {
//         db.run(`INSERT INTO deposits (invoice_id, key, amount) VALUES ${placeholders}`, values, function (error) {
//           if (error) reject(new Error(`Error inserting deposits: ${error.message}`))
//           resolve()
//         })
//       })
//     }

//     res.status(200).json({ message: 'Invoice updated successfully.' })
//   } catch (error) {
//     res.status(400).json({ error: error.message }) // Now returning clean validation errors
//   }
// })
// // Saves a copy invoice
// router.post('/invoice/save/copy', async (req, res) => {
//   try {
//     const invoiceData = gettingData(req.body)
//     const { items, deposits, original_invoice_id, clientId, invoice_number, ...invoiceFields } = invoiceData

//     if (!original_invoice_id) {
//       throw new Error('Missing original invoice ID.')
//     }

//     // Insert copied invoice
//     const copiedInvoiceId = await new Promise((resolve, reject) => {
//       db.run(
//         `INSERT INTO copied_invoices (
//             original_invoice_id, invoice_number, client_id, discount_type, discount_value,
//             discVal_ifPercent, vat_percent, vat, subtotal, total, deposit_type, deposit_value,
//             depoVal_ifPercent, note, total_pre_discount, date, due_by_date, remaining_balance
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           original_invoice_id,
//           invoice_number,
//           clientId,
//           invoiceFields.discountType,
//           invoiceFields.discountValue,
//           invoiceFields.discVal_ifPercent,
//           invoiceFields.vatPercent,
//           invoiceFields.vat,
//           invoiceFields.subtotal,
//           invoiceFields.total,
//           invoiceFields.depositType,
//           invoiceFields.depositValue,
//           invoiceFields.depoVal_ifPercent,
//           invoiceFields.note,
//           invoiceFields.totalPreDiscount,
//           invoiceFields.date,
//           invoiceFields.due_by_date,
//           invoiceFields.remaining_balance,
//         ],
//         function (err) {
//           if (err) return reject(new Error(`Error inserting copied invoice: ${err.message}`))
//           resolve(this.lastID)
//         },
//       )
//     })

//     // Insert deposits into copied_deposits
//     if (deposits.length > 0) {
//       const values = deposits.flatMap(d => [copiedInvoiceId, d.key, d.amount])
//       const placeholders = deposits.map(() => '(?, ?, ?)').join(',')

//       await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO copied_deposits (copied_invoice_id, key, amount) VALUES ${placeholders}`,
//           values,
//           function (err) {
//             if (err) return reject(new Error(`Error inserting copied deposits: ${err.message}`))
//             resolve()
//           },
//         )
//       })
//     }

//     res.status(201).json({ message: 'Copied invoice created successfully.' })
//   } catch (error) {
//     res.status(500).json({ error: error.message })
//   }
// })

// ==== Invoce Status ==== //
// Update a copied invoice with selected fields and recalc status
// router.post('/invoice/copy/update/:invoiceId', (req, res) => {
//   try {
//     const {
//       clientId,
//       invoice_id,
//       discountType,
//       discountValue,
//       discVal_ifPercent,
//       vatPercent,
//       vat,
//       subtotal,
//       total,
//       depositType,
//       depositValue,
//       depoVal_ifPercent,
//       note,
//       totalPreDiscount,
//       date,
//       due_by_date,
//       remaining_balance,
//     } = req.body

//     // Ensure the invoice_id in the URL and body match.
//     if (parseInt(req.params.invoiceId, 10) !== invoice_id) {
//       return res.status(400).json({ error: 'Invoice ID in URL and body do not match.' })
//     }

//     // Calculate new status based on remaining_balance and depositValue:
//     let invoice_status
//     if (remaining_balance === 0) {
//       invoice_status = 'paid'
//     } else if (depositValue !== 0) {
//       invoice_status = 'partiallyPaid'
//     } else {
//       invoice_status = 'unpaid'
//     }

//     const sql = `
//       UPDATE copied_invoices SET
//         discount_type = ?,
//         discount_value = ?,
//         discVal_ifPercent = ?,
//         vat_percent = ?,
//         vat = ?,
//         subtotal = ?,
//         total = ?,
//         deposit_type = ?,
//         deposit_value = ?,
//         depoVal_ifPercent = ?,
//         note = ?,
//         total_pre_discount = ?,
//         date = ?,
//         due_by_date = ?,
//         remaining_balance = ?,
//         invoice_status = ?
//       WHERE id = ? AND client_id = ?
//     `
//     const params = [
//       discountType,
//       discountValue,
//       discVal_ifPercent,
//       vatPercent,
//       vat,
//       subtotal,
//       total,
//       depositType,
//       depositValue,
//       depoVal_ifPercent,
//       note,
//       totalPreDiscount,
//       date,
//       due_by_date,
//       remaining_balance,
//       invoice_status,
//       invoice_id, // from req.body
//       clientId, // from req.body
//     ]

//     db.run(sql, params, function (err) {
//       if (err) return res.status(500).json({ error: err.message })
//       res.json({ success: true, invoiceId: invoice_id })
//     })
//   } catch (error) {
//     res.status(500).json({ error: error.message })
//   }
// })
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

module.exports = router
