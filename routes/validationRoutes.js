const express = require('express')
const router = express.Router()
const { invoiceSchema } = require('../services/invoiceSchema')

// Route to validate an invoice
router.post('/invoice', (req, res) => {
  try {
    const validatedData = invoiceSchema.parse(req.body)
    res.json({ success: true, validatedData })
  } catch (error) {
    console.error('Validation Failed:', error.errors)
    res.status(400).json({ error: 'Validation Error', details: error.errors })
  }
})

module.exports = router
