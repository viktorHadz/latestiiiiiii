const express = require("express");
const router = express.Router();
const getDb = require("./database");
const db = getDb();
const PDFDocument = require('pdfkit');
const { resolve } = require("path");

// Fetch all clients
router.get("/api/clients", (req, res) => {
    db.all("SELECT * FROM clients", [], (error, results) => {
        if (error) {
            return res.status(500).send({ error: "Error fetching clients" });
        }
        res.json(results);
    });
});

// Fetch a client information by their ID
router.get("/api/clients/:id", (req, res) => {
    const clientId = req.params.id;
    db.get("SELECT * FROM clients WHERE id = ?", [clientId], (error, result) => {
        if (error) {
            return res.status(500).send(error);
        }
        res.json(result);
    });
});

// Fetch styles for a specific client
router.get("/api/styles/client/:clientId", (req, res) => {
    const clientId = req.params.clientId;
    db.all("SELECT * FROM styles WHERE client_id = ?", [clientId], (error, results) => {
        if (error) {
            return res.status(500).send({ error: "Error fetching styles" });
        }
        res.json(results);
    });
});

// Fetch samples for a specific client
router.get("/api/samples/client/:clientId", (req, res) => {
    const clientId = req.params.clientId;
    db.all("SELECT * FROM samples WHERE client_id = ?", [clientId], (error, results) => {
        if (error) {
            return res.status(500).send({ error: "Error fetching samples" });
        }
        res.json(results);
    });
});

// Create new style from Invoicing menu
router.post("/styles", (req, res) => {
    const { name, price, client_id } = req.body;
  
    db.run("INSERT INTO styles (name, price, client_id) VALUES (?, ?, ?)", [name, price, client_id], function(error) {
      if (error) {
        return res.status(500).send(error);
      }
      // Fetch the newly added style details
      db.get("SELECT * FROM styles WHERE id = ?", [this.lastID], (error, newStyle) => {
        if (error) {
          return res.status(500).send(error);
        }
        if (newStyle) {
          res.status(201).json(newStyle);
        } else {
          res.status(404).json({ message: 'Newly added style not found.' });
        }
      });
    });
});
  
// Create new sample from Invoicing menu
router.post("/samples", (req, res) => {
    const { name, time, price, client_id } = req.body;

    db.run("INSERT INTO samples (name, time, price, client_id) VALUES (?, ?, ?, ?)", [name, time, price, client_id], function(error) {
        if (error) {
            return res.status(500).send(error);
        }
        // Fetch the newly added sample details
        db.get("SELECT * FROM samples WHERE id = ?", [this.lastID], (error, newSample) => {
            if (error) {
                return res.status(500).send(error);
            }
            if (newSample) {
                res.status(201).json(newSample);
            } else {
                res.status(404).json({ message: 'Newly added sample not found.' });
            }
        });
    });
});

// Route to get the next invoice number
router.get("/api/getNextInvoiceNumber", (req, res) => {
    db.get("SELECT MAX(invoice_number) AS maxInvoiceNumber FROM invoices", [], (error, result) => {
        if (error) {
            return res.status(500).send({ error: "Error fetching the max invoice number" });
        }
        const maxInvoiceNumber = result.maxInvoiceNumber;
        const nextInvoiceNumber = maxInvoiceNumber ? `SAM${parseInt(maxInvoiceNumber.slice(3)) + 1}` : 'SAM1';
        res.json({ nextInvoiceNumber });
    });
});

const insertInvoice = (clientId, discountPercent, discountFlat, vatPercent, subtotal, discount, vat, total) => {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO invoices (client_id, discount_percent, discount_flat, vat_percent, subtotal, discount, vat, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            [clientId, discountPercent, discountFlat, vatPercent, subtotal, discount, vat, total], 
            function(error) {
                if (error) {
                    return reject(new Error("Error inserting invoice: " + error.message));
                }

                const invoiceId = this.lastID;
                const invoiceNumber = `SAM${invoiceId}`;

                // Update the invoice with the generated invoice number
                db.run("UPDATE invoices SET invoice_number = ? WHERE id = ?", [invoiceNumber, invoiceId], function(updateError) {
                    if (updateError) {
                        return reject(new Error("Error updating invoice number: " + updateError.message));
                    }

                    resolve(invoiceId);
                });
            }
        );
    });
};

const insertItems = (invoiceId, items) => {
    return new Promise((resolve, reject) => {
        const placeholders = items.map(() => "(?, ?, ?, ?, ?, ?)").join(",");
        const values = items.flatMap(item => [item.name, item.price, item.type, item.time, invoiceId, item.quantity]);
        db.run(`INSERT INTO invoice_items (name, price, type, time, invoice_id, quantity) VALUES ${placeholders}`, values, function(error) {
            if (error) {
                return reject(new Error("Error inserting invoice items: " + error.message));
            }
            resolve();
        });
    });
};

router.post("/api/saveInvoice", async (req, res) => {
    const { clientId, items, discountPercent, discountFlat, vatPercent, subtotal, discount, vat, total } = req.body;

    try {
        const invoiceId = await insertInvoice(clientId, discountPercent, discountFlat, vatPercent, subtotal, discount, vat, total);
        await insertItems(invoiceId, items);

        const invoiceNumber = `SAM${invoiceId}`;
        const newInvoice = { id: invoiceId, invoiceNumber, clientId, items, discountPercent, discountFlat, vatPercent, subtotal, discount, vat, total };
        res.status(201).json(newInvoice);

    } catch (error) {
        res.status(500).json({ error: "Error saving invoice /api/saveInvoice: " + error.message });
    }
});



// Generate PDF for an invoice
router.get("/api/invoices/:id/pdf", async (req, res) => {
    const invoiceId = req.params.id;

    try {
        // Fetch the invoice from the database
        const invoice = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM invoices WHERE id = ?", [invoiceId], (error, invoice) => {
                if (error) {
                    return reject(error);
                }
                resolve(invoice);
            });
        });

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }
        // IVOICE: Fetch items(style/sample) for the creation of the invoice
        const fetchItems = () => {
            return new Promise((resolve, reject) => {
                db.all("SELECT * FROM invoice_items WHERE invoice_id = ?", [invoiceId], (error, items) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(items);
                });
            });
        };
        const items = await fetchItems();

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        
        // Set the filename using the correct invoice_number from the database
        res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoice_number}.pdf`);
        
        doc.pipe(res);
        doc.text(`Invoice Number: ${invoice.invoice_number}`, { align: 'center' });
        // Changed id to name 
        doc.text(`Client ID: ${invoice.client_id}`, { align: 'center' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.text('Items:', { align: 'left' });
        // Control item display
        items.forEach(item => {
            const itemDescription = item.type === 'sample' 
                ? `${item.name} (${item.type}) - £${item.price} - (x${item.quantity})` 
                : `${item.name} - £${item.price} - (x${item.quantity})`;
            doc.text(itemDescription, { align: 'left' });
        });
        doc.text(`Subtotal: ${invoice.subtotal}`, { align: 'left' });
        doc.text(`Discount: ${invoice.discount}`, { align: 'left' });
        doc.text(`VAT: ${invoice.vat}`, { align: 'left' });
        doc.text(`Total: ${invoice.total}`, { align: 'left' });
        doc.end();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Getting the invoice statuses
router.get("/api/invoices/statuses", (req, res) => {
    db.all("SELECT invoice_number, status FROM invoices", [], (error, results) => {
        if (error) {
            return res.status(500).send({ error: "Error fetching invoice statuses" });
        }
        res.json(results);
    });
});

// Update invoice status
router.post("/api/invoices/:invoiceNumber/updateStatus", (req, res) => {
    const invoiceNumber = req.params.invoiceNumber;
    const { status } = req.body;
    if (!status) {  // Added check to ensure status is provided
        return res.status(400).send({ error: "Status is required, look at /api/invoices/:invoiceNumber/updateStatus in the routes for invoicing." });
    }
    db.run("UPDATE invoices SET status = ? WHERE invoice_number = ?", [status, invoiceNumber], function(error) {
        if (error) {
            return res.status(500).send({ error: "Error updating invoice status" });
        }
        res.json({ message: `Status updated for invoice ${invoiceNumber}` });
    });
});

module.exports = router;
