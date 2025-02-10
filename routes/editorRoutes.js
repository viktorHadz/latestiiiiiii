const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()

router.use(express.json())

// // Big boy route get all
// router.get('/invoice/:clientId/:invoiceId', (req, res) => {
//   const { clientId, invoiceId } = req.params
//   const invoiceEditObj = {}

//   // Get client details
//   const clientsQuery = 'SELECT * FROM clients WHERE id = ?'
//   db.get(clientsQuery, [clientId], (err, client) => {
//     if (err) {
//       return res.status(500).json({ error: `Error fetching client: ${err.message}` })
//     }
//     if (!client) {
//       return res.status(404).json({ error: 'Client not found' })
//     }
//     invoiceEditObj.client = client

//     // Get invoice details for the client
//     const invoiceQuery = 'SELECT * FROM invoices WHERE id = ? AND client_id = ?'
//     db.get(invoiceQuery, [invoiceId, clientId], (err, invoice) => {
//       if (err) {
//         return res.status(500).json({ error: `Error fetching invoice: ${err.message}` })
//       }
//       if (!invoice) {
//         return res.status(404).json({ error: 'Invoice not found' })
//       }
//       invoiceEditObj.invoice = invoice

//       // Get invoice items
//       const itemsQuery = 'SELECT * FROM invoice_items WHERE invoice_id = ?'
//       db.all(itemsQuery, [invoiceId], (err, items) => {
//         if (err) {
//           return res.status(500).json({ error: `Error fetching invoice items: ${err.message}` })
//         }
//         invoiceEditObj.invoiceItems = items

//         // Fetch styles and samples for this client in parallel.
//         db.all('SELECT * FROM styles WHERE client_id = ?', [clientId], (err, styles) => {
//           if (err) {
//             return res.status(500).json({ error: `Error fetching styles: ${err.message}` })
//           }
//           invoiceEditObj.existingStyles = styles
//           db.all('SELECT * FROM samples WHERE client_id = ?', [clientId], (err, samples) => {
//             if (err) {
//               return res.status(500).json({ error: `Error fetching samples: ${err.message}` })
//             }
//             invoiceEditObj.existingSamples = samples
//             // Send the unified object
//             res.json(invoiceEditObj)
//           })
//         })
//       })
//     })
//   })
// })

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
      'SELECT * FROM invoices WHERE client_id = ? ORDER BY date DESC, id DESC LIMIT ? OFFSET ?',
      [clientId, limit, offset],
      (err, invoiceDetails) => {
        if (err) {
          return res.status(500).json({ error: `Couldn't fetch invoices. ${err.message}` })
        }

        const listData = invoiceDetails.map(invoice => ({
          ...invoice,
          client_name: clientDetails.name,
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
router.get('/client/:clientId/items', (req, res) => {
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

    // Determine the new status ('paid' or 'unpaid')
    const newStatus = row.invoice_status === 'unpaid' ? 'paid' : 'unpaid'

    // Update the invoice status in the database
    const updateQuery = 'UPDATE invoices SET invoice_status = ? WHERE id = ?'
    db.run(updateQuery, [newStatus, invoiceId], function (err) {
      if (err) {
        return res.status(500).json({ error: `Couldn't update invoice status: ${err.message}` })
      }
      res.json({ success: true, newStatus })
    })
  })
})
// Delete
router.delete('/invoice/delete/:invoiceId', (req, res) => {
  const { invoiceId } = req.params
  const deleteQuery = 'DELETE FROM invoices WHERE id = ?'

  db.run(deleteQuery, [invoiceId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to delete invoice' })

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    res.status(200).json({ message: 'Invoice deleted successfully' })
  })
})

module.exports = router
