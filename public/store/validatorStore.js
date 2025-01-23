document.addEventListener('alpine:init', () => {
  Alpine.store('validator', {
    validator(context, functionName) {
      const validations = {
        removeItemFromInvoice: [
          {
            condition: context.discount !== 0,
            toast: () => callError('Cannot remove item.', 'Please clear any existing discount/deposit first.'),
          },
          {
            condition: context.deposit !== 0,
            toast: () => callError('Cannot remove item.', 'Please clear any existing discount/deposit first.'),
          },
          {
            condition: context.subtotal < 0,
            toast: () => callError('Cannot remove item.', 'Total cannot be a negative value. Check your discounts.'),
          },
        ],
        removeAllInvoiceItems: [
          {
            condition: context.discount !== 0,
            toast: () => callError('Cannot remove items.', 'Please clear any existing discount/deposit first.'),
          },
          {
            condition: context.deposit !== 0,
            toast: () => callError('Cannot remove items.', 'Please clear any existing discount/deposit first.'),
          },
          {
            condition: context.subtotal < 0,
            toast: () => callError('Cannot remove items.', 'Total cannot be a negative value. Check your discounts.'),
          },
          {
            condition: context.invoiceItems.length === 0,
            toast: () => callInfo('No items to remove.'),
          },
        ],
        // Discount and deposit validations can be found here
        calculateDeposit: [
          {
            condition: context.deposit !== 0,
            toast: () => callError('Cannot change deposit.', 'Remove any existing deposits first.'),
          },
          {
            condition: context.total === 0,
            toast: () => callError('Total must be greater than zero.'),
          },
          {
            condition: context.isDepositPercent && context.tempDeposit > 100,
            toast: () => callError('Deposit cannot exceed 100%.'),
          },
          {
            condition: context.isDepositPercent === false && context.tempDeposit > context.total,
            toast: () => callError('Deposit cannot exceed the total.'),
          },
          {
            condition: context.tempDeposit <= 0,
            toast: () => callError('Deposit cannot be zero or a negative value.'),
          },
        ],

        confirmDiscount: [
          {
            // Must have items
            condition: context.subtotal <= 0,
            toast: () => callWarning('Cannot apply discount.', 'Insert items into invoice first.'),
          },
          {
            // Must not have deposit
            condition: context.deposit !== 0,
            toast: () => callWarning('Cannot apply discount.', 'Remove the deposit first.'),
          },
          {
            // Must not already have a discount
            condition: context.discount !== 0,
            toast: () => callWarning('Discount already applied.', 'Only one discount allowed.'),
          },
          {
            // Positive, non-zero numeric discount
            condition:
              typeof context.tempDiscount !== 'number' || isNaN(context.tempDiscount) || context.tempDiscount <= 0,
            toast: () => callWarning('Invalid discount.', 'Discount must be greater than 0.'),
          },
          {
            // If percent, discount <= 100
            condition: context.isDiscountPercent && context.tempDiscount > 100,
            toast: () => callWarning('Discount cannot exceed 100%.', 'Check discount value.'),
          },
          {
            // If flat, discount <= subtotal
            condition: context.isDiscountFlat && context.tempDiscount > context.subtotal,
            toast: () => callWarning('Discount cannot exceed subtotal.', 'Adjust discount value.'),
          },
        ],

        handleMessageSubmit: [
          {
            condition: context.subtotal === 0,
            toast: () => callError('Cannot insert note.', 'Please add some items into your invoice first.'),
          },
          {
            condition: context.invoiceNotePopover === '',
            toast: () => callError('Invoice note cannot be empty.', 'Please input a message first.'),
          },
        ],
      }

      // Run the validations for the specified function
      const functionValidations = validations[functionName] || []
      for (const { condition, toast } of functionValidations) {
        if (condition) {
          toast()
          return false
        }
      }
      return true
    },
  })
})
