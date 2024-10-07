const express = require("express")
const router = express.Router()
const getDb = require("./database")
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
router.get("/editor/invoices/:clientId", (req, res) => {
    const clientId = req.params.clientId
    const dbQuery = 'SELECT id, invoice_number, client_name, client_id FROM invoices WHERE client_id = ?'
    db.all(dbQuery, [clientId], (err, invoices) => {
        if (err) {
            res.status(500).json({ error: `Couldn't fetch invoices for client ${clientId}. Status: ${err.message}` })
            return
        }
        res.json(invoices)
    })
})

// Create route for retrieving invoice items then invoice prices that we want the client to be able to edit 
/*
router.get("/editor/invoice/:clientId/:invoiceId", (req, res) => {
    const clientId = req.params.clientId
    const invoiceId = req.params.invoiceId
    
    const invoiceEditObj = {}
    
    const clientsQuery = 'SELECT * FROM clients'
    db.all(dbQuery, [clientId], [invoiceId], (err, invoices) => {
    
    // get data stick in object  
    // Object looks like: 
    let invoiceEditObj = 
    {
        name: invoice.name
    }
    },
    // return object 
    return invoiceEditObj
},
*/

// 2. Get invoices by client id  
// 3. Get invoice_items by invoice_id 
// Delete invocie with ID 
// Delete invoice items with invoice_id
// Update invocie with ID 
// Update invoice items with invoice_id



module.exports = router
