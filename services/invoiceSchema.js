// Define schema
/**
 * Schema for validating invoice data on the backend using Zod.
 *
 * The schema includes the following main sections:
 * - Invoice details such as invoice ID, client ID, invoice number, and copy status.
 * - Totals section containing various financial details like discount, VAT, subtotal, total, deposits, and dates.
 * - Items section which is an array of objects, each representing an item with details like ID, name, price, type, quantity, and total item price.
 *
 * This schema ensures that the invoice data adheres to the expected structure and data types.
 */
// Define schema
const { z } = require('zod')

// Define schema
const invoiceSchema = z.object({
  invoice_id: z.number(),
  clientId: z.number(),
  invoice_number: z.string(),
  invoice_status: z.string(),
  isCopy: z.boolean(),
  totals: z.object({
    discountType: z.number(),
    discountValue: z.number(),
    discVal_ifPercent: z.number(),
    depositType: z.number(),
    depositValue: z.number(),
    depoVal_ifPercent: z.number(),
    note: z.string(),
    date: z.string(),
    due_by_date: z.string(),
    subtotal: z.number(),
    vat: z.number(),
    total: z.number(),
    totalPreDiscount: z.number(),
    remaining_balance: z.number(),
    deposits: z
      .array(
        z.object({
          key: z.string(),
          amount: z.number(),
        }),
      )
      .optional(),
    subtotal_pre_discount: z.number(),
    total_pre_discount: z.number(),
  }),
  items: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      price: z.number(),
      type: z.string(),
      time: z.number(),
      quantity: z.number(),
      total_item_price: z.number(),
      invoice_id: z.number(),
      origin_id: z.number(),
      frontendId: z.string(),
    }),
  ),
})

module.exports = { invoiceSchema }
