const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()

// Fetch all styles with client information
router.get('/styles', (req, res) => {
  // changes `styles.name AS styleName` to `styles.name`
  const query = `
    SELECT styles.id, styles.name, styles.price, clients.id AS clientId, clients.name AS clientName
    FROM styles
    LEFT JOIN clients ON styles.client_id = clients.id`

  db.all(query, [], (error, results) => {
    if (error) {
      return res.status(500).send(error)
    }
    res.json(results)
  })
})

router.get('/styles/:id', (req, res) => {
  const clientId = req.params.id
  db.all('SELECT * FROM styles WHERE client_id = ?', [clientId], (error, results) => {
    if (error) {
      return res.status(500).send(error)
    }
    res.json(results) // Corrected from "result" to "results"
  })
})

// Create new style
router.post('/styles', (req, res) => {
  const { name, price, client_id } = req.body

  db.run('INSERT INTO styles (name, price, client_id) VALUES (?, ?, ?)', [name, price, client_id], function (error) {
    if (error) {
      return res.status(500).send(error)
    }
    // Fetch the newly added style details
    db.get('SELECT * FROM styles WHERE id = ?', [this.lastID], (error, newStyle) => {
      if (error) {
        return res.status(500).send(error)
      }
      if (newStyle) {
        res.status(201).json(newStyle)
      } else {
        res.status(404).json({ message: 'Newly added style not found.' })
      }
    })
  })
})

// Update an existing style
router.put('/styles/:id', (req, res) => {
  const { name, price } = req.body
  const styleId = req.params.id

  db.run('UPDATE styles SET name = ?, price = ? WHERE id = ?', [name, price, styleId], function (error) {
    if (error) {
      return res.status(500).send(error)
    }
    res.status(201).json({ message: `Style updated with ID: ${styleId}` })
  })
})

// Delete a style
router.delete('/styles/:id', (req, res) => {
  const styleId = req.params.id

  db.run('DELETE FROM styles WHERE id = ?', [styleId], function (error) {
    if (error) {
      return res.status(500).send(error)
    }
    res.status(201).json({ message: `Style deleted with ID: ${styleId}` })
  })
})

// Fetch styles for a specific client
router.get('/styles/client/:clientId', (req, res) => {
  const clientId = req.params.clientId
  // changes `styles.name AS styleName` to `styles.name`
  const query = `
    SELECT styles.id, styles.name, styles.price
    FROM styles
    WHERE styles.client_id = ?`

  db.all(query, [clientId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    res.json(results)
  })
})

// SAMPLES BELOW

// I THINK INVOICES ARE USING THEIR OWN

// Add a new sample for a client
router.post('/api/samples', (req, res) => {
  const { name, time, price, client_id } = req.body

  db.run(
    'INSERT INTO samples (name, time, price, client_id) VALUES (?, ?, ?, ?)',
    [name, time, price, client_id],
    function (error) {
      if (error) {
        return res.status(500).send(error)
      }
      // Fetch the newly added sample details
      db.get('SELECT * FROM samples WHERE id = ?', [this.lastID], (error, newSample) => {
        if (error) {
          return res.status(500).send(error)
        }
        if (newSample) {
          res.status(201).json(newSample)
        } else {
          res.status(404).json({ message: 'Newly added sample not found.' })
        }
      })
    },
  )
})

// STILL USED IN REWORKED CODE 8/01/2025

// Fetch all samples for a specific client
router.get('/api/items/client/:clientId', (req, res) => {
  const clientId = req.params.clientId
  const query = `SELECT * FROM samples WHERE client_id = ?`

  db.all(query, [clientId], (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message })
    }
    res.json(results)
  })
})

// Fetch a specific sample by ID
router.get('/api/items/:id', (req, res) => {
  const sampleId = req.params.id
  db.get('SELECT * FROM samples WHERE id = ?', [sampleId], (error, result) => {
    if (error) {
      return res.status(500).send(error)
    }
    res.json(result)
  })
})

// Update an existing sample
router.put('/api/items/:id', (req, res) => {
  const { name, time, price } = req.body
  const sampleId = req.params.id

  db.run(
    'UPDATE samples SET name = ?, time = ?, price = ? WHERE id = ?',
    [name, time, price, sampleId],
    function (error) {
      if (error) {
        return res.status(500).send(error)
      }
      res.status(201).json({
        message: `Sample updated: id: ${sampleId} name: ${name} time: ${time} price: ${price} `,
      })
    },
  )
})

// Delete a sample
router.delete('/api/items/:id', (req, res) => {
  const sampleId = req.params.id

  db.run('DELETE FROM samples WHERE id = ?', [sampleId], function (error) {
    if (error) {
      return res.status(500).send(error)
    }
    res.status(201).json({ message: `Sample deleted with ID: ${sampleId}` })
  })
})

module.exports = router
