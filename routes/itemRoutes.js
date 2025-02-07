const express = require('express')
const router = express.Router()
const getDb = require('../database')
const db = getDb()

// Fetch all styles for a specified client
router.get('/styles/client/:id', (req, res) => {
  const clientId = req.params.id
  db.all('SELECT * FROM styles WHERE client_id = ?', [clientId], (error, results) => {
    if (error) {
      return res.status(500).send(error)
    }
    res.json(results)
  })
})

// Create new style
router.post('/styles/new', (req, res) => {
  const { name, price, clientId } = req.body
  if (!name) return res.status(400).json({ error: 'Missing name' })
  if (!price) return res.status(400).json({ error: 'Missing price' })
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' })

  db.get('SELECT id FROM clients WHERE id = ?', [clientId], (err, client) => {
    if (err) return res.status(500).json({ error: 'Database error.' })
    if (!client) return res.status(400).json({ error: 'No client found.' })

    db.run('INSERT INTO styles (name, price, client_id) VALUES (?, ?, ?)', [name, price, clientId], function (err2) {
      if (err2) return res.status(500).json({ error: 'Insert error.' })
      res.json({ id: this.lastID, name, price, clientId })
    })
  })
})

// Update an existing style
router.put('/styles/update/:id', (req, res) => {
  const { name, price } = req.body
  const styleId = req.params.id

  db.run('UPDATE styles SET name = ?, price = ? WHERE id = ?', [name, price, styleId], function (error) {
    if (error) return res.status(500).send(error)
    res.status(201).json({ message: `Style updated with ID: ${styleId}` })
  })
})
// Delete a style
router.delete('/styles/delete/:id', (req, res) => {
  const styleId = req.params.id

  db.run('DELETE FROM styles WHERE id = ?', [styleId], function (error) {
    if (error) return res.status(500).send(error)
    res.status(201).json({ message: `Style deleted with ID: ${styleId}` })
  })
})

// SAMPLES BELOW

// Fetch all samples for a specific client
router.get('/samples/client/:clientId', (req, res) => {
  const clientId = req.params.clientId
  const query = `SELECT * FROM samples WHERE client_id = ?`

  db.all(query, [clientId], (error, results) => {
    if (error) return res.status(500).json({ error: error.message })
    res.json(results)
  })
})
// create new sample
router.post('/samples/new', (req, res) => {
  const { name, time, price, clientId } = req.body
  if (!name) return res.status(400).json({ error: 'Missing name' })
  if (!time) return res.status(400).json({ error: 'Missing time' })
  if (!price) return res.status(400).json({ error: 'Missing price' })
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' })

  db.get('SELECT id FROM clients WHERE id = ?', [clientId], (err, client) => {
    if (err) return res.status(500).json({ error: 'Database error.' })
    if (!client) return res.status(400).json({ error: 'No client found.' })

    db.run(
      'INSERT INTO samples (name, time, price, client_id) VALUES (?, ?, ?, ?)',
      [name, time, price, clientId],
      function (err2) {
        if (err2) return res.status(500).json({ error: 'Insert error.' })
        res.json({ id: this.lastID, name, time, price, clientId })
      },
    )
  })
})
// Update a sample (e.g. after editing)
router.put('/samples/update/:id', (req, res) => {
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
router.delete('/samples/delete/:id', (req, res) => {
  const sampleId = req.params.id

  db.run('DELETE FROM samples WHERE id = ?', [sampleId], function (error) {
    if (error) {
      return res.status(500).send(error)
    }
    res.status(201).json({ message: `Sample deleted with ID: ${sampleId}` })
  })
})

module.exports = router
