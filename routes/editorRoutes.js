const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()

router.use(express.json())

// Big boy route to get all
router.get('/invoice/:clientId/:invoiceId', (req, res) => {
  const { clientId, invoiceId } = req.params
  const invoiceEditObj = {}

  // Get client details
  const clientsQuery = 'SELECT * FROM clients WHERE id = ?'
  db.get(clientsQuery, [clientId], (err, client) => {
    if (err) {
      return res.status(500).json({ error: `Error fetching client: ${err.message}` })
    }
    if (!client) {
      return res.status(404).json({ error: 'Client not found' })
    }
    invoiceEditObj.client = client

    // Get invoice details for the client
    const invoiceQuery = 'SELECT * FROM invoices WHERE id = ? AND client_id = ?'
    db.get(invoiceQuery, [invoiceId, clientId], (err, invoice) => {
      if (err) {
        return res.status(500).json({ error: `Error fetching invoice: ${err.message}` })
      }
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' })
      }
      invoiceEditObj.invoice = invoice

      // Get invoice items
      const itemsQuery = 'SELECT * FROM invoice_items WHERE invoice_id = ?'
      db.all(itemsQuery, [invoiceId], (err, items) => {
        if (err) {
          return res.status(500).json({ error: `Error fetching invoice items: ${err.message}` })
        }
        invoiceEditObj.invoiceItems = items

        // Fetch styles and samples for this client in parallel.
        db.all('SELECT * FROM styles WHERE client_id = ?', [clientId], (err, styles) => {
          if (err) {
            return res.status(500).json({ error: `Error fetching styles: ${err.message}` })
          }
          invoiceEditObj.existingStyles = styles
          db.all('SELECT * FROM samples WHERE client_id = ?', [clientId], (err, samples) => {
            if (err) {
              return res.status(500).json({ error: `Error fetching samples: ${err.message}` })
            }
            invoiceEditObj.existingSamples = samples
            // Send the unified object
            res.json(invoiceEditObj)
          })
        })
      })
    })
  })
})

router.get('/list/:clientId', (req, res) => {
  const clientId = req.params.clientId
  const dbQueryInvoices = 'SELECT * FROM invoices WHERE client_id = ?'
  const dbQueryClient = 'SELECT name, address FROM clients WHERE id = ?'

  db.get(dbQueryClient, [clientId], (err, clientDetails) => {
    if (err) {
      res.status(500).json({
        error: `Couldn't fetch client details for client ${clientId}. Status: ${err.message}`,
      })
      return
    }

    db.all(dbQueryInvoices, [clientId], (err, invoiceDetails) => {
      if (err) {
        res.status(500).json({
          error: `Couldn't fetch invoices for client ${clientId}. Status: ${err.message}`,
        })
        return
      }
      const listData = invoiceDetails.map(invoice => ({
        ...invoice,
        client_name: clientDetails.name,
      }))
      res.json(listData)
    })
  })
})

// Route for invoice items and prices for client with id
// example - /editor/invoice/1/46
router.get('/invoices/:clientId/:invoiceId', (req, res) => {
  const clientId = req.params.clientId
  const invoiceId = req.params.invoiceId

  const invoiceEditObj = {}

  const clientsQuery = 'SELECT * FROM clients WHERE id = ?'

  db.get(clientsQuery, [clientId], (err, client) => {
    if (err) {
      res.status(500).json({ error: `Issue with client details. Status: ${err.message}` })
      return
    }
    if (!client) {
      res.status(404).json({ error: 'Issue getting client' })
      return
    }
    // add client to the invoiceEditObj
    invoiceEditObj.client = client

    const invoiceQuery = 'SELECT * FROM invoices WHERE id = ? AND client_id = ?'
    db.get(invoiceQuery, [invoiceId, clientId], (err, invoice) => {
      if (err) {
        res.status(500).json({
          error: `Error in route while getting items from invoices with client id and invoice id. Status: ${err.message}`,
        })
        return
      }
      if (!invoice) {
        res.status(404).json({ error: `Invoice not found::: ${err.message}` })
        return
      }
      invoiceEditObj.invoice = invoice

      const itemsQuery = 'SELECT * FROM invoice_items WHERE invoice_id = ?'
      db.all(itemsQuery, [invoiceId], (err, items) => {
        if (err) {
          res.status(500).json({
            error: `Error in route while getting items from invoice_items. Status: ${err.message}`,
          })
          return
        }

        invoiceEditObj.invoiceItems = items

        // SEND THE COMPLETED INVOICE OBJECT HERE:
        res.json(invoiceEditObj)
      })
    })
  })
})

module.exports = router
