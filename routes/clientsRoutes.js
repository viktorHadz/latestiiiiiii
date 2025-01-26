const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()

router.use(express.json())

// Fetch all clients
router.get('/get', (req, res) => {
  // SQLite query to fetch all clients
  db.all('SELECT * FROM clients', [], (error, results) => {
    if (error) {
      // handle error
      return res.status(500).send(error)
    }
    res.json(results)
  })
})

// Fetch a specific client by ID
router.get('/get/:id', (req, res) => {
  const clientId = req.params.id
  db.get('SELECT * FROM clients WHERE id = ?', [clientId], (error, result) => {
    if (error) {
      return res.status(500).send(error)
    }
    res.json(result)
  })
})

router.post('/create', (req, res) => {
  const { name, company_name, address, email } = req.body

  if (!name || !company_name || !address || !email) {
    console.log('This is the requests body: ', req.body)
    return res.status(400).json({ error: 'All fields are required' })
  }

  db.run(
    'INSERT INTO clients (name, company_name, address, email) VALUES (?, ?, ?, ?)',
    [name, company_name, address, email],
    function (error) {
      if (error) {
        console.error('Error inserting client:', error.message)
        return res.status(500).json({ error: error.message })
      }
      res.status(201).json({ id: this.lastID, name, company_name, address, email })
    },
  )
})

// Update an existing client
router.put('/update/:id', (req, res) => {
  const { name, company_name, address, email } = req.body
  const clientId = req.params.id

  // SQLite query to update a client
  db.run(
    'UPDATE clients SET name = ?, company_name = ?, address = ?, email = ? WHERE id = ?',
    [name, company_name, address, email, clientId],
    function (error) {
      if (error) {
        return res.status(500).json({ error: error.message })
      }
      res.json({
        message: `Client updated with ID: ${clientId}`,
        clientId: clientId,
      })
    },
  )
})

// Delete a client
router.delete('/delete/:id', (req, res) => {
  const clientId = req.params.id

  db.run('DELETE FROM clients WHERE id = ?', [clientId], function (error) {
    if (error) {
      return res.status(500).send(error)
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }
    res.json({ message: `Client deleted with ID: ${clientId}` })
  })
})

module.exports = router
