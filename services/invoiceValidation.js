const getDb = require('../database')
const { invoiceSchema } = require('./invoiceSchema') // One source of truth
const db = getDb()

/**
 * Fetch an invoice, structure it correctly, and validate.
 */
async function fetchInvoiceById(invoiceId, isCopy = false, isReadOnly = false) {
  try {
    // Fetch the invoice details
    const invoice = await new Promise((resolve, reject) => {
      db.get(
        isCopy ? 'SELECT * FROM copied_invoices WHERE id = ?' : 'SELECT * FROM invoices WHERE id = ?',
        [invoiceId],
        (err, row) => (err ? reject(err) : resolve(row)),
      )
    })

    if (!invoice) throw new Error('Invoice not found')

    // Fetch the invoice items
    const items = await new Promise((resolve, reject) => {
      db.all(
        isCopy
          ? 'SELECT * FROM copied_invoice_items WHERE invoice_id = ?'
          : 'SELECT * FROM invoice_items WHERE invoice_id = ?',
        [invoiceId],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      )
    })

    // Fetch deposits for the invoice
    const deposits = await new Promise((resolve, reject) => {
      db.all(
        isCopy
          ? 'SELECT key, amount FROM copied_deposits WHERE copied_invoice_id = ?'
          : 'SELECT key, amount FROM deposits WHERE invoice_id = ?',
        [invoiceId],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      )
    })

    // **Determine the frontendId prefix based on state**
    let frontendPrefix = ''
    if (isReadOnly) {
      frontendPrefix = isCopy ? 'readonly-copy' : 'readonly-parent'
    } else if (isCopy) {
      frontendPrefix = 'edit-copy'
    } else {
      frontendPrefix = 'edit-parent'
    }

    // **Assign unique frontendId to each item**
    const processedItems = items.map((item, index) => ({
      ...item,
      frontendId: `${frontendPrefix}-${index}-${item.origin_id}-${item.id}`,
    }))

    // Standardized Data Structure for the Invoice
    const invoiceData = {
      invoice_id: invoice.id,
      clientId: invoice.client_id,
      invoice_number: invoice.invoice_number,
      invoice_status: invoice.invoice_status,
      isCopy,
      original_invoice_id: isCopy ? invoice.original_invoice_id : null, // Keep original invoice reference
      totals: {
        discountType: invoice.discount_type,
        discountValue: invoice.discount_value,
        discVal_ifPercent: invoice.discVal_ifPercent,
        depositType: invoice.deposit_type,
        depositValue: invoice.deposit_value,
        depoVal_ifPercent: invoice.depoVal_ifPercent,
        note: invoice.note || '',
        date: invoice.date,
        due_by_date: invoice.due_by_date,
        subtotal: invoice.subtotal,
        vat: invoice.vat,
        total: invoice.total,
        totalPreDiscount: invoice.total_pre_discount,
        remaining_balance: invoice.remaining_balance,
        deposits: deposits || [], // Include deposits
        subtotal_pre_discount: invoice.subtotal,
        total_pre_discount: invoice.total_pre_discount,
      },
      items: processedItems, // Updated with `frontendId`
    }

    // Validate before returning (Ensures data integrity)
    return invoiceSchema.parse(invoiceData)
  } catch (error) {
    console.error('Error fetching invoice:', error)
    throw error
  }
}

/**
 * Standardized processing of invoice items (matches frontend logic)
 */
function processInvoiceItems(items, prefix = 'item') {
  if (!Array.isArray(items)) return []

  const uniqueItems = []
  const seen = new Set()

  items.forEach(item => {
    const key = `${prefix}-${item.type}-${item.id}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueItems.push({ ...item, frontendId: key })
    }
  })

  return uniqueItems
}

module.exports = { fetchInvoiceById, validateAndSave }

/**
 * Validate and prepare invoice for database insertion.
 */
async function validateAndSave(invoiceData) {
  try {
    const params = invoiceSchema.parse(invoiceData)

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE invoices SET 
          client_id = ?, total = ?, remaining_balance = ?, discount_type = ?, 
          discount_value = ?, discVal_ifPercent = ?, deposit_type = ?, deposit_value = ?, 
          depoVal_ifPercent = ?, note = ?, total_pre_discount = ?, date = ?, 
          due_by_date = ?, invoice_status = ? 
        WHERE id = ?`,
        [
          params.clientId,
          params.totals.total,
          params.totals.remaining_balance,
          params.totals.discountType,
          params.totals.discountValue,
          params.totals.discVal_ifPercent,
          params.totals.depositType,
          params.totals.depositValue,
          params.totals.depoVal_ifPercent,
          params.totals.note,
          params.totals.totalPreDiscount,
          params.totals.date,
          params.totals.due_by_date,
          params.invoice_status,
          params.invoice_id,
        ],
        function (error) {
          if (error) reject(error)
          resolve()
        },
      )
    })

    return 'Invoice saved successfully.'
  } catch (error) {
    console.error('Error saving invoice:', error)
    throw new Error('Error saving invoice')
  }
}

module.exports = { fetchInvoiceById, validateAndSave }
