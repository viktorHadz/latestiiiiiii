document.addEventListener('alpine:init', () => {
  Alpine.store('validator', {
    validator(context, functionName) {
      const validations = {
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

        addDiscount: [
          {
            // Must have items
            condition: context.totals.subtotal <= 0,
            toast: () => callWarning('Cannot apply discount.', 'Insert items into invoice first.'),
          },
          {
            // Must not have deposit
            condition: context.totals.deposit !== 0,
            toast: () => callWarning('Cannot apply discount.', 'Remove the deposit first.'),
          },
          {
            // Must not already have a discount
            condition: context.totals.discount !== 0,
            toast: () => callWarning('Discount already applied.', 'Only one discount allowed.'),
          },
          {
            // Positive, non-zero numeric discount
            condition:
              typeof context.totals.discountValue !== 'number' ||
              isNaN(context.totals.discountValue) ||
              context.totals.discountValue <= 0,
            toast: () => callWarning('Invalid discount.', 'Discount must be greater than 0.'),
          },
          {
            // If percent, discount <= 100
            condition: context.totals.discountType === 1 && context.totals.discountValue > 100,
            toast: () => callWarning('Discount cannot exceed subtotal.', 'Check discount value.'),
          },
          {
            // If flat, discount <= subtotal
            condition: context.totals.discountType === 0 && context.totals.discountValue > context.totals.subtotal,
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
