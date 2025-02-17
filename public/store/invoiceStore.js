document.addEventListener('alpine:init', () => {
  Alpine.store(
    'invo',
    Alpine.reactive({
      totals: {
        clientId: null,
        items: [],
        discountType: 0, // 0: flat, 1: percent
        discountValue: 0,
        discValIfPercent: 0,
        vatPercent: 20,
        vat: 0,
        subtotal: 0,
        total: 0,
        depositType: 0, // 0: flat, 1: percent
        depositValue: 0,
        depoValIfPercent: 0,
        note: '',
        totalPreDiscount: 0,
        date: new Date().toLocaleDateString(),
      },
      quantities: {},
      invoItemSearch: '',
      uiDiscount: 0,
      uiDeposit: 0,
      uiNote: '',
      // Initialize the store
      init() {
        console.log('{ InvoiceStore } Initializing')
        this.loadFromLocalStorage()
        this.syncClientId()
      },

      // Sync totals to localStorage on any change
      saveToLocalStorage() {
        localStorage.setItem('invoiceTotals', JSON.stringify(this.totals))
      },
      // Load totals from localStorage
      loadFromLocalStorage() {
        const storedTotals = localStorage.getItem('invoiceTotals')
        if (storedTotals) {
          Object.assign(this.totals, JSON.parse(storedTotals))
        }
      },
      // Receives event from clientStore and updates totals.clientId and checks
      syncClientId() {
        document.addEventListener('client-selected', event => {
          const newClient = event.detail
          if (newClient?.id !== this.totals.clientId) {
            console.log('{ InvoiceStore } Client changed - syncing clientId')
            this.totals.clientId = newClient.id

            // Clear totals only if items exist for a different client
            if (this.totals.items.length > 0 && this.totals.items[0].clientId !== newClient.id) {
              console.log('{ InvoiceStore } Resetting totals due to client change')
              this.totals.items = []
            }
          }
        })
      },
      // Business logic
      addItemToInvoice(item, type) {
        if (this.totals.discountValue !== 0 || this.totals.depositValue !== 0) {
          callWarning(
            'Cannot add items.',
            this.totals.depositValue !== 0 ? 'Remove deposit and try again.' : 'Remove discount and try again.',
          )
          return
        }
        if (this.totals.clientId === null) {
          this.totals.clientId = Alpine.store('clients').selectedClient.id
        }
        const uniqueId = `${type}-${item.id}`
        const qty = Math.max(this.quantities[item.id] || 1, 1)
        const existingItem = this.totals.items.find(i => i.uniqueId === uniqueId)
        if (!existingItem) {
          // NOTE: For sample items, we now simply store the hourly rate and the production time (in minutes)
          this.totals.items.push({
            ...item,
            clientId: Alpine.store('clients').selectedClient.id,
            uniqueId: uniqueId,
            type,
            quantity: qty,
            price: parseFloat(item.price), // hourly rate for samples, fixed price for styles
            time: type === 'sample' ? parseFloat(item.time) : 0, // production time (minutes)
          })
        } else {
          existingItem.quantity += qty
        }
        this.calculateTotals()
        delete this.quantities[item.id]
        console.log('Quantities: ', JSON.stringify(this.quantities, null, 2))
      },

      removeOneItem(targetItem) {
        if (this.totals.discountValue !== 0 || this.totals.depositValue !== 0) {
          callError('Cannot remove item.', 'Please clear any existing discount/deposit first.')
          return
        }

        this.totals.items = this.totals.items
          .map(item => {
            if (item.uniqueId === targetItem.uniqueId) {
              return { ...item, quantity: item.quantity - 1 }
            }
            return item
          })
          .filter(item => item.quantity > 0)

        this.calculateTotals()
      },
      removeEntireItem(targetItem) {
        if (this.totals.discountValue !== 0 || this.totals.depositValue !== 0) {
          callError('Cannot remove item.', 'Please clear any existing discount/deposit first.')
          return
        }
        if (confirm('Remove item from invoice?')) {
          this.totals.items = this.totals.items.filter(item => item.uniqueId !== targetItem.uniqueId)
          this.calculateTotals()
          callInfo('Item removed from invoice.')
        }
      },
      removeAllItems() {
        if (this.totals.discountValue !== 0 || this.totals.depositValue !== 0) {
          callError('Cannot remove item.', 'Please clear any existing discount/deposit first.')
          return
        }
        if (confirm('You are about to remove all items from the invoice. Proceed?')) {
          this.totals.items = []
          if (this.totals.items.length > 0) {
            calculateTotals()
            callInfo('Items removed', 'Invoice reset')
          } else if (this.totals.items === 0) {
            this.calculateTotals()
            callWarning('No items to remove')
          }
        }
      },

      addItemAnimation(itemId) {
        const targetItem = document.getElementById(itemId)
        if (!targetItem) {
          console.error(`Element with ID "${itemId}" not found.`)
          return
        }

        console.log('Target Item:', targetItem)
        const glowClass = this.mode === 'dark' ? 'add-item-glow-dark' : 'add-item-glow'

        // Apply the glow effect
        targetItem.classList.remove(glowClass)
        void targetItem.offsetWidth
        targetItem.classList.add(glowClass)

        // Remove the class once the animation finishes
        targetItem.addEventListener(
          'animationend',
          () => {
            targetItem.classList.remove(glowClass)
          },
          { once: true }, // Ensure the listener is removed after one execution
        )
      },
      totalsItemsEffects() {
        if (this.totals.items.length === 0) {
          console.log('{ InvoiceStore } No items to check for')
          return
        }
        const firstItemClientId = this.totals.items[0]?.clientId

        // Empty totals.items on client change
        if (this.totals.clientId !== firstItemClientId) {
          console.log('{ InvoiceStore } Client changed reseting - totals.items')
          this.totals.items.splice(0)
        }
      },

      effectTotalsClients() {
        const cliStore = Alpine.store('clients')

        // Prevent resetting totals during initialization
        if (!cliStore.isFetched) {
          console.log('{ InvoiceStore } ClientStore not yet fetched - skipping totals reset')
          return
        }

        // Reset totals if no clients exist in ClientStore
        if (cliStore.clients.length === 0) {
          console.log('{ InvoiceStore } No clients in ClientStore - resetting all totals')
          this.resetTotals()
        }
      },

      calculateLineTotal(item) {
        if (item.type === 'sample') {
          // Use hourly rate and convert minutes to hours:
          return item.price * (item.time / 60) * item.quantity
        } else {
          return item.price * item.quantity
        }
      },
      calculateSubTotal() {
        try {
          const subTotal = this.totals.items.reduce((total, item) => total + this.calculateLineTotal(item), 0)
          return this.roundToTwo(subTotal)
        } catch (error) {
          console.error('Error calculating subtotal:', { items: this.totals.items, error })
          throw new Error('Failed to calculate subtotal. Check the input data.')
        }
      },
      roundToTwo(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100
      },
      calculateTotals() {
        try {
          const subtotal = this.calculateSubTotal()
          let discountedSubtotal = subtotal
          if (this.totals.discountValue !== 0) {
            if (this.totals.discountType === 1) {
              discountedSubtotal -= (this.totals.discountValue / 100) * subtotal
            } else {
              discountedSubtotal -= this.totals.discountValue
            }
          }
          const vat = this.roundToTwo((this.totals.vatPercent / 100) * discountedSubtotal)
          const total = this.roundToTwo(discountedSubtotal + vat)
          this.totals = {
            ...this.totals,
            subtotal: this.roundToTwo(subtotal),
            discountedSubtotal: this.roundToTwo(discountedSubtotal),
            vat,
            total,
          }
          console.log(`CalculateTotals => Subtotal: ${subtotal}, VAT: ${vat}, Total: ${total}`)
        } catch (error) {
          console.error('Error calculating totals:', { totals: this.totals, error })
          throw new Error('Failed to calculate totals. Check the input data.')
        }
      },

      addDiscount() {
        // Validate input using uiDiscount instead of totals.discountValue
        if (!this.validator(this, 'addDiscount')) {
          return
        }

        const { discountType, subtotal, vatPercent } = this.totals
        const discountValue = this.uiDiscount
        let updatedSubtotal = subtotal

        // Apply discount based on type
        if (discountType === 1) {
          // Percentage discount
          updatedSubtotal -= (discountValue / 100) * subtotal
        } else {
          // Flat discount
          updatedSubtotal -= discountValue
        }

        // Final validation: ensure subtotal is not negative
        if (updatedSubtotal < 0) {
          callWarning('Invalid discount.', 'Discount cannot reduce subtotal below zero.')
          return
        }

        const discPercentVal = (discountValue / 100) * subtotal

        updatedSubtotal = this.roundToTwo(updatedSubtotal)
        const vat = this.roundToTwo((vatPercent / 100) * updatedSubtotal)
        const total = this.roundToTwo(updatedSubtotal + vat)
        // Update the store with calculated values
        this.totals = {
          ...this.totals,
          subtotal: updatedSubtotal,
          vat,
          total,
          discountValue, // Update applied discount
          discValIfPercent: discPercentVal,
          totalPreDiscount: subtotal, // Keep original subtotal
        }

        this.uiDiscount = 0 // Reset UI discount input
        callSuccess('Discount applied successfully.')
        this.saveToLocalStorage()
        this.calculateTotals()
      },

      removeDiscount() {
        if (this.totals.discountValue === 0) {
          callInfo('No discount to remove.')
          return
        }

        // Reset discount values
        this.totals.discountValue = 0
        this.totals.discountType = 0
        this.totals.discValIfPercent = 0

        // Recalculate totals
        const subtotal = this.calculateSubTotal()
        const vat = this.roundToTwo((subtotal / 100) * this.totals.vatPercent)
        const total = this.roundToTwo(subtotal + vat)

        console.log('Vat: ', vat, '\n', 'Total: ', total)
        // Update the totals
        this.totals = {
          ...this.totals,
          subtotal: subtotal,
          vat: vat,
          total: total,
          totalPreDiscount: subtotal, // Restore to the original subtotal
        }

        callSuccess('Discount removed successfully.')
        this.saveToLocalStorage()
        this.calculateTotals()
      },
      changeDiscountType() {
        if (this.totals.discountValue !== 0) {
          callWarning('Cannot change discount', 'Remove any existing discounts and try again.')
          return
        }
        let toggleDisc = this.totals.discountType === 1 ? 0 : 1
        this.totals = {
          ...this.totals,
          discountType: toggleDisc,
        }
      },

      addDeposit() {
        if (this.totals.depositValue !== 0) {
          callWarning('Cannot add', 'Remove existing deposit and try again')
          return
        }
        if (!this.validator(this, 'addDeposit')) {
          return
        }

        const depositValue = this.uiDeposit
        const { total, depositType } = this.totals

        let depositAmount = 0
        let depoPercentVal = 0

        if (depositType === 1) {
          depoPercentVal = this.roundToTwo((depositValue / 100) * total)
          depositAmount = depoPercentVal
        } else {
          depositAmount = depositValue
        }

        depositAmount = this.roundToTwo(depositAmount)

        // Update the totals
        this.totals = {
          ...this.totals,
          depositValue: depositValue,
          remainingTotalBalance: this.roundToTwo(total - depositAmount),
          depositType,
          depoValIfPercent: depoPercentVal,
        }

        this.uiDeposit = 0
        callSuccess('Deposit applied successfully.')
        this.saveToLocalStorage()
      },

      removeDeposit() {
        if (this.totals.depositValue === 0) {
          callInfo('No deposit to remove.')
          return
        }

        this.totals = {
          ...this.totals,
          depositValue: 0,
          depoValIfPercent: 0,
          remainingTotalBalance: this.totals.total,
          depositType: 0,
        }

        callSuccess('Deposit removed successfully.')
        this.saveToLocalStorage()
      },

      changeDepositType() {
        if (this.totals.depositValue !== 0) {
          callWarning('Cannot add', 'Remove existing deposit and try again')
          this.$refs.depoInput.focus()
          return
        }
        this.totals.depositType = this.totals.depositType === 1 ? 0 : 1
        const newType = this.totals.depositType === 1 ? 'Percentage' : 'Flat'
      },

      addNote() {
        if (this.totals.note.length !== 0 || this.totals.note === null) {
          callWarning('Cannot add note', 'Remove existing note to add new.')
          return
        }
        if (this.uiNote.length === 0) {
          callWarning('Note cannot be empty')
          return
        }
        this.totals = {
          ...this.totals,
          note: this.uiNote,
        }
        callSuccess('Note added to invoice.')
        this.uiNote = ''
      },
      resetTotals() {
        console.log('{ InvoiceStore } Resetting all totals')

        // Resetting the entire totals object
        this.totals = {
          clientId: null,
          items: [],
          discountType: 0,
          discountValue: 0,
          discValIfPercent: 0,
          vatPercent: 20,
          vat: 0,
          subtotal: 0,
          total: 0,
          depositType: 0,
          depositValue: 0,
          depoValIfPercent: 0,
          note: '',
          totalPreDiscount: 0,
          date: new Date().toLocaleDateString(),
        }

        // Resetting other properties related to totals
        this.quantities = {}
        this.invoItemSearch = ''
        this.uiDiscount = 0
        this.uiDeposit = 0
        this.uiNote = ''

        console.log('{ InvoiceStore } Totals after reset:', this.totals)
      },

      validator(context, functionName) {
        const validations = {
          addDiscount: [
            {
              // Must have items
              condition: context.totals.subtotal <= 0,
              toast: () => callWarning('Cannot apply discount.', 'Insert items into invoice first.'),
            },
            {
              // Must not have a deposit
              condition: context.totals.depositValue !== 0,
              toast: () => callWarning('Cannot apply discount.', 'Remove the deposit first.'),
            },
            {
              // Must not already have a discount
              condition: context.totals.discountValue !== 0,
              toast: () => callWarning('Discount already applied.', 'Only one discount allowed.'),
            },
            {
              // Positive, non-zero numeric discount
              condition: context.uiDiscount <= 0 || isNaN(context.uiDiscount),
              toast: () => callWarning('Invalid discount.', 'Discount must be greater than 0.'),
            },
            {
              // If percent, discount <= 100
              condition: context.totals.discountType === 1 && context.uiDiscount > 100,
              toast: () => callWarning('Invalid discount.', 'Discount cannot exceed 100%.'),
            },
            {
              // If flat, discount <= subtotal
              condition: context.totals.discountType === 0 && context.uiDiscount > context.totals.subtotal,
              toast: () => callWarning('Invalid discount.', 'Discount cannot exceed the subtotal.'),
            },
          ],
          addDeposit: [
            {
              // Total must be greater than 0
              condition: context.totals.total <= 0,
              toast: () => callWarning('Cannot apply deposit.', 'The total must be greater than 0.'),
            },
            {
              // Deposit must be a positive number
              condition: context.uiDeposit <= 0 || isNaN(context.uiDeposit),
              toast: () => callWarning('Invalid deposit.', 'Deposit must be a positive number.'),
            },
            {
              // Percentage deposit cannot exceed 100%
              condition: context.totals.depositType === 1 && context.uiDeposit > 100,
              toast: () => callWarning('Invalid deposit.', 'Percentage deposit cannot exceed 100%.'),
            },
            {
              // Flat deposit cannot exceed the total
              condition: context.totals.depositType === 0 && context.uiDeposit > context.totals.total,
              toast: () => callWarning('Invalid deposit.', 'Flat deposit cannot exceed the total amount.'),
            },
          ],
          removeDeposit: [
            {
              // Ensure there's a deposit to remove
              condition: context.totals.depositValue === 0,
              toast: () => callInfo('No deposit to remove.'),
            },
          ],
        }

        const functionValidations = validations[functionName] || []
        for (const { condition, toast } of functionValidations) {
          if (condition) {
            toast()
            return false
          }
        }
        return true
      },
    }),
  )
  // Trigger reactive tracking for all totals properties
  Alpine.effect(() => {
    const store = Alpine.store('invo')
    JSON.stringify(store.totals) // Track reactivity
    // store.watchStateEffects()
    store.effectTotalsClients()
    store.totalsItemsEffects()
  })

  // Save to localStorage only when totals change
  Alpine.effect(() => {
    const store = Alpine.store('invo')
    store.saveToLocalStorage()
  })
})
