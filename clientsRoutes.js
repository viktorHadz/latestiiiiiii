const express = require("express");
const router = express.Router();
const getDb = require("./database");
const db = getDb();

router.use(express.json());

// Fetch all clients
router.get("/clients", (req, res) => {
  // SQLite query to fetch all clients
  db.all("SELECT * FROM clients", [], (error, results) => {
    if (error) {
      // handle error
      return res.status(500).send(error);
    }
    res.json(results);
  });
});

// Fetch a specific client by ID
router.get("/clients/:id", (req, res) => {
  const clientId = req.params.id;
  db.get("SELECT * FROM clients WHERE id = ?", [clientId], (error, result) => {
    if (error) {
      return res.status(500).send(error);
    }
    res.json(result);
  });
});

// Add a new client
router.post("/clients", (req, res) => {
  const { name, company_name, address, email} = req.body;

  // SQLite query to add a new client
  db.run("INSERT INTO clients (name, company_name, address, email) VALUES (?, ?, ?, ?)", 
    [name, company_name, address, email], 
    function(error) {
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      res.status(201).json({ id: this.lastID, name, company_name, address, email });
  });
});

// Update an existing client
router.put("/clients/:id", (req, res) => {
  const { name, company_name, address, email } = req.body;
  const clientId = req.params.id;

  // SQLite query to update a client
  db.run("UPDATE clients SET name = ?, company_name = ?, address = ?, email = ? WHERE id = ?", [name, company_name, address, email, clientId], function(error) {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ message: `Client updated with ID: ${clientId}`, clientId: clientId });
  });
});

// Delete a client
router.delete("/clients/:id", (req, res) => {
  const clientId = req.params.id;

  // SQLite query to delete a client
  db.run("DELETE FROM clients WHERE id = ?", [clientId], function(error) {
    if (error) {
      console.error("Error deleting client:", error);
      return res.status(500).send(error);
    }
    res.json({ message: `Client deleted with ID: ${clientId}` });
  });
});

module.exports = router;
