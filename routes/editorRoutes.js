const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()

router.use(express.json())

/*
1. When user goes inside editor load invoice numbers in a list with the option to filter by client. SHould probably lazy load the invoice items to avoid performance issues? 
2. When the user clicks a specific invoice from the list. Only then visualise the data for that invocie. 
3. Allow the user to press edit to edit the invoice items 
4. Provide the user to save the edit or cancel it

IMPORTANT NOTE: When you delete a client does it delete the styles, items, invoices and invoice items for that client? 
For this I need routes:
    1. Get all ivnoices. 
    2. Get invoices by client id 
    3. Get invoice_items by invoice_id 
    4. Delete routes for:
        invoice with id
        invoice item with invoice_id
    5. Update routes for the above 

*/

// 2. Get invoices by client id
router.get('/editor/invoices/:clientId', (req, res) => {
  const clientId = req.params.clientId
  const dbQueryInvoices = 'SELECT id, invoice_number, client_id, date FROM invoices WHERE client_id = ?'
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
router.get('/editor/invoices/:clientId/:invoiceId', (req, res) => {
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

// Fetch styles for a specific client
router.get('/api/styles/client/:clientId', (req, res) => {
  const clientId = req.params.clientId
  db.all('SELECT * FROM styles WHERE client_id = ?', [clientId], (error, results) => {
    if (error) {
      return res.status(500).send({ error: 'Error fetching styles' })
    }
    res.json(results)
  })
})

// Fetch samples for a specific client
router.get('/api/items/client/:clientId', (req, res) => {
  const clientId = req.params.clientId
  db.all('SELECT * FROM samples WHERE client_id = ?', [clientId], (error, results) => {
    if (error) {
      return res.status(500).send({ error: 'Error fetching samples' })
    }
    res.json(results)
  })
})

// 2. Get invoices by client id
// 3. Get invoice_items by invoice_id
// Delete invocie with ID
// Delete invoice items with invoice_id
// Update invocie with ID
// Update invoice items with invoice_id

module.exports = router
