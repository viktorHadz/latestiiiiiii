// const express = require('express')
// const router = express.Router()
// const getDb = require('../database')
// const db = getDb()

// router.use(express.json())

// // Fetch all samples for a specific client
// router.get('/api/items/client/:clientId', (req, res) => {
//   const clientId = req.params.clientId
//   const query = `SELECT * FROM samples WHERE client_id = ?`

//   db.all(query, [clientId], (error, results) => {
//     if (error) {
//       return res.status(500).json({ error: error.message })
//     }
//     res.json(results)
//   })
// })

// // Fetch a specific sample by ID
// router.get('/api/items/:id', (req, res) => {
//   const sampleId = req.params.id
//   db.get('SELECT * FROM samples WHERE id = ?', [sampleId], (error, result) => {
//     if (error) {
//       return res.status(500).send(error)
//     }
//     res.json(result)
//   })
// })

// // Update an existing sample
// router.put('/api/items/:id', (req, res) => {
//   const { name, time, price } = req.body
//   const sampleId = req.params.id

//   db.run(
//     'UPDATE samples SET name = ?, time = ?, price = ? WHERE id = ?',
//     [name, time, price, sampleId],
//     function (error) {
//       if (error) {
//         return res.status(500).send(error)
//       }
//       res.status(201).json({
//         message: `Sample updated: id: ${sampleId} name: ${name} time: ${time} price: ${price} `,
//       })
//     },
//   )
// })

// // Delete a sample
// router.delete('/api/items/:id', (req, res) => {
//   const sampleId = req.params.id

//   db.run('DELETE FROM samples WHERE id = ?', [sampleId], function (error) {
//     if (error) {
//       return res.status(500).send(error)
//     }
//     res.status(201).json({ message: `Sample deleted with ID: ${sampleId}` })
//   })
// })
// module.exports = router
