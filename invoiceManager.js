export default function invoiceManager() {
  return {
    showClientModal: false,
    showDropdown: false,
    clients: [],
    styles: [],
    filteredStyles: [],
    samples: [],
    filteredSamples: [],
    selectedClient: null,
    // Invoicing
    invoiceItems: [],
    invoiceSearchQuery: '',
    quantities: {},
    // Search Bar
    styleSearch: '',
    sampleSearch: '',
    invoiceSearch: '',
    // Add new style item
    showAddStyleModal: false,
    newStyle: { name: '', price: null },
    // Add new sample item
    showAddSampleModal: false,
    newSample: { name: '', time: null, price: null },
    // Price forming menu - final values after all operations have been added to them
    subtotal: 0,
    staticSubtotal: 0,
    vat: 0,
    vatPercent: 20,
    preDiscountTotal: 0,
    total: 0,
    // Use for deposits popover menu
    popoverOpenDeposit: false,
    // Discount section
    popoverOpen: false,
    switchOpen: false, // Controls discount types, symbol
    isDiscountPercent: true,
    isDiscountFlat: false,
    symbol: '%',
    // This is discount in  the main price forming meny
    tempDiscount: 0,
    discount: 0,
    // State variable to conditionally show or hide the crossed over subtotal
    showNewSubtotal: false,
    // To display discount numeric value when discount is percent
    discValSub: 0,
    discountValue: 0,
    // Temporary values
    temporarySubtotal: 0,
    temporaryVat: 0,
    temporaryTotal: 0,

    // Deposit popover menu
    trigger: 'click',
    depositOpen: false,
    isDepositPercent: true,
    depositPercent: 1,
    depositFlat: 0,
    tempDeposit: 0,
    tempDepositDynamicValue: 0,
    depositSymbol: '%',
    deposit: 0,
    depositNumericValue: 0,
    depositDisplay: '',
    // Note
    invoiceNoteOpen: false,
    invoiceNotePopover: '',
    invoiceNote: '',
    noteLength: 0,
    lnght: 216,
    noteMaxLength: 217,
    // Hover card element
    hoverCardHovered: false,
    hoverCardDelay: 400,
    hoverCardLeaveDelay: 300,
    hoverCardTimout: null,
    hoverCardLeaveTimeout: null,
    // Tab section
    invoicingTabSelected: '1',
    invoicingTabId: null,

    init() {
      console.log('Initializing invoiceManager')

      this.fetchClients()
      this.loadSelectedClient()

      // NEW-IDATA
      // Items
      const storedItems =
        Alpine.store('invoLocalStore').load('invoiceItems') || []
      if (Array.isArray(storedItems)) {
        // Use array reassignment for clearer reactivity
        this.invoiceItems = [...storedItems]
        console.log('invoiceItems: ', this.invoiceItems)
      }
      // Totals
      const storedData = Alpine.store('invoLocalStore').load('invoiceData')
      if (storedData) {
        this.restoreInvoiceData(storedData)
      }

      // Watchers for items and totals
      this.$watch('invoiceItems', newItems => {
        Alpine.store('invoLocalStore').update('invoiceItems', newItems)
        this.calculateTotals()
      })
      // Now watch the entire object (buildInvoiceData) for changes
      this.$watch(
        () => this.buildInvoiceData(),
        newData => {
          console.log('Watcher totals triggered => calling calculateTotals():')
          this.calculateTotals()
          // update localStorage whenever any part of buildInvoiceData() changes
          Alpine.store('invoLocalStore').update('invoiceData', newData)
          console.log('Result: \n', newData)
        },
      )

      feather.replace()
      this.invoicingTabId = this.$id('invoicingTabId')
      this.$nextTick(() => {
        this.invoicingtabRepositionMarker(
          this.$refs.invoiceTabButtons.firstElementChild,
        )
      })
    },
    // NEW-IDATA
    buildInvoiceData() {
      return {
        // Values from your invoice state
        subtotal: this.subtotal,
        staticSubtotal: this.staticSubtotal,
        vat: this.vat,
        vatPercent: this.vatPercent,
        preDiscountTotal: this.preDiscountTotal,
        total: this.total,
        switchOpen: this.switchOpen,
        isDiscountPercent: this.isDiscountPercent,
        isDiscountFlat: this.isDiscountFlat,
        symbol: this.symbol,
        discount: this.discount,
        discountValue: this.discountValue,
        deposit: this.deposit,
        depositSymbol: this.depositSymbol,
        depositPercent: this.depositPercent,
        depositFlat: this.depositFlat,
        tempDeposit: this.tempDeposit,
        depositNumericValue: this.depositNumericValue,
        depositDisplay: this.depositDisplay,
        invoiceNote: this.invoiceNote,
      }
    },

    restoreInvoiceData(data) {
      // Safe merge - restores localStorage fields into Alpine state.
      // Only restore fields that exist in stored data
      // (This prevents overwriting defaults if a field wasn't saved)
      if (data.subtotal !== undefined) this.subtotal = data.subtotal
      if (data.staticSubtotal !== undefined)
        this.staticSubtotal = data.staticSubtotal
      if (data.vat !== undefined) this.vat = data.vat
      if (data.vatPercent !== undefined) this.vatPercent = data.vatPercent
      if (data.preDiscountTotal !== undefined)
        this.preDiscountTotal = data.preDiscountTotal
      if (data.total !== undefined) this.total = data.total
      if (data.switchOpen !== undefined) this.switchOpen = data.switchOpen
      if (data.isDiscountPercent !== undefined)
        this.isDiscountPercent = data.isDiscountPercent
      if (data.isDiscountFlat !== undefined)
        this.isDiscountFlat = data.isDiscountFlat
      if (data.symbol !== undefined) this.symbol = data.symbol
      if (data.discount !== undefined) this.discount = data.discount
      if (data.discountValue !== undefined)
        this.discountValue = data.discountValue
      if (data.deposit !== undefined) this.deposit = data.deposit
      if (data.depositSymbol !== undefined)
        this.depositSymbol = data.depositSymbol
      if (data.depositPercent !== undefined)
        this.depositPercent = data.depositPercent
      if (data.depositFlat !== undefined) this.depositFlat = data.depositFlat
      if (data.tempDeposit !== undefined) this.tempDeposit = data.tempDeposit
      if (data.depositNumericValue !== undefined)
        this.depositNumericValue = data.depositNumericValue
      if (data.depositDisplay !== undefined)
        this.depositDisplay = data.depositDisplay
      if (data.invoiceNote !== undefined) this.invoiceNote = data.invoiceNote
      console.log('Restored invoice data from localStorage:', data)
    },

    invoicingTabButtonClicked(tabButton) {
      this.invoicingTabSelected = tabButton.id.replace(
        this.invoicingTabId + '-',
        '',
      )
      this.invoicingtabRepositionMarker(tabButton)
    },

    invoicingtabRepositionMarker(tabButton) {
      if (this.$refs.tabMarker) {
        this.$refs.tabMarker.style.width = tabButton.offsetWidth + 'px'
        this.$refs.tabMarker.style.height = tabButton.offsetHeight + 'px'
        this.$refs.tabMarker.style.left = tabButton.offsetLeft + 'px'
      }
    },

    invoicingTabContentActive(tabContent) {
      return (
        this.invoicingTabSelected ==
        tabContent.id.replace(this.invoicingTabId + '-content-', '')
      )
    },

    invoicingTabButtonActive(tabContent) {
      const invoicingTabId = tabContent.id.split('-').slice(-1)
      return this.invoicingTabSelected == invoicingTabId
    },

    applyEffect(idOfItem) {
      this.$nextTick(() => {
        const targetItem = document.getElementById(idOfItem)
        if (!targetItem) {
          console.error(`Element with ID "${idOfItem}" not found.`)
          return
        }

        console.log('Target Item:', targetItem)
        const glowClass =
          this.mode === 'dark' ? 'add-item-glow-dark' : 'add-item-glow'

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
      })
    },

    hoverCardEnter() {
      clearTimeout(this.hoverCardLeaveTimeout)
      if (this.hoverCardHovered) return
      clearTimeout(this.hoverCardTimout)
      this.hoverCardTimout = setTimeout(() => {
        this.hoverCardHovered = true
      }, this.hoverCardDelay)
    },
    hoverCardLeave() {
      clearTimeout(this.hoverCardTimout)
      if (!this.hoverCardHovered) return
      clearTimeout(this.hoverCardLeaveTimeout)
      this.hoverCardLeaveTimeout = setTimeout(() => {
        this.hoverCardHovered = false
      }, this.hoverCardLeaveDelay)
    },

    handleMessageSubmit() {
      if (!this.validator(this, 'handleMessageSubmit')) return
      if (this.noteLength >= this.noteMaxLength) {
        callError('Note cannot exceed character limit.')
        this.$refs.invoiceNotePopover.focus()
        return
      }
      let noteText = this.$refs.noteText
      let removeBtn = this.$refs.removeBtn
      // Update the note first, then apply fade-in effect
      this.invoiceNote = this.invoiceNotePopover
      this.invoiceNotePopover = ''
      callSuccess('Note created successfully.', 'Hover over icon to preview.')
      setTimeout(() => {
        // Apply fade-in effect to both text and button
        noteText.classList.remove('fade-out-hidden')
        noteText.classList.add('fade-in-visible')
        removeBtn.classList.remove('fade-out-hidden')
        removeBtn.classList.add('fade-in-visible')
      }, 0)
      this.invoiceNoteOpen = false
    },

    trackLength() {
      // If input to the note you add 1 if delete you subtract 1
      this.noteLength = this.invoiceNotePopover.length
      if (this.noteLength >= this.noteMaxLength) {
        callWarning('Note cannot exceed limit characters.')
        this.$refs.invoiceNotePopover.focus()
        return
      }
    },

    removeMessage() {
      let noteText = this.$refs.noteText
      let removeBtn = this.$refs.removeBtn

      // Apply fade-out effect to both text and button
      noteText.classList.remove('fade-in-visible')
      noteText.classList.add('fade-out-hidden')
      removeBtn.classList.remove('fade-in-visible')
      removeBtn.classList.add('fade-out-hidden')
      callInfo('Note removed from invoice.')
      // Clear the note after the fade-out completes
      setTimeout(() => {
        this.invoiceNote = ''
      }, 300) // Matches the duration of the fade-out transition
    },

    //MARK: DEPOSIT

    resetDeposit() {
      let depositBtn = document.getElementById('confirm-deposit')
      this.tempDeposit = 0
      this.deposit = 0
      depositBtn.classList.add(
        'bg-gray-100',
        'hover:bg-gray-300',
        'text-gray-950',
      )
      depositBtn.classList.remove(
        'bg-green-500',
        'text-white',
        'hover:bg-green-600',
      )
      callSuccess('Deposit reset.')
    },

    handleDepositType() {
      if (this.deposit !== 0) {
        callError(
          'Cannot change deposit type',
          'Remove any existing deposits first.',
        )
        return
      }
      let inputFocus = this.$refs.tempDeposit
      const icon = document.getElementById('toggle-deposit-btn')
      icon.classList.add('spin') // Add animation class
      // Remove class after animation to reset for future clicks
      icon.addEventListener(
        'animationend',
        () => {
          icon.classList.remove('spin')
        },
        { once: true },
      )
      if (this.isDepositPercent) {
        this.depositSymbol = ''
        this.depositSymbol = '%'
        this.depositPercent = 1
        this.depositFlat = 0
      } else {
        this.depositSymbol = ''
        this.depositSymbol = '£'
        this.depositFlat = 1
        this.depositPercent = 0
      }
      inputFocus.focus()
    },

    calculateDeposit() {
      let inputFocus = this.$refs.tempDeposit
      try {
        if (!this.validator(this, 'calculateDeposit')) return
        let depositBtn = document.getElementById('confirm-deposit')
        let tempDeposit = this.tempDeposit
        let tempTotal = this.total
        let deposit = this.deposit
        let depositNumeric

        if (!this.isDepositPercent) {
          deposit = tempDeposit
        } else if (this.isDepositPercent) {
          deposit = (tempDeposit / 100) * tempTotal
          depositNumeric = deposit
          this.depositNumericValue = this.roundToTwo(depositNumeric)
        }

        this.deposit = this.roundToTwo(deposit)

        this.depositDisplay = this.isDepositPercent
          ? `${tempDeposit}% (£${this.depositNumericValue})`
          : `£${this.deposit}`

        depositBtn.classList.remove(
          'bg-gray-100',
          'hover:bg-gray-300',
          'text-gray-950',
        )
        depositBtn.classList.add(
          'bg-green-500',
          'text-white',
          'hover:bg-green-600',
        )
        callSuccess('Deposit added to invoice.')
        inputFocus.focus()
      } catch (error) {
        console.error(error)
        callError(
          'Error calculating deposit.',
          'Try again, refresh the program or call support.',
        )
        inputFocus.focus()
      }
    },

    handleDepositInput(event) {
      const inputValue = event.target.value
      if (inputValue === '' || isNaN(inputValue)) {
        this.tempDeposit = 0
      } else {
        // Update discount normally based on input
        this.tempDeposit = parseFloat(inputValue)
      }
    },

    validator(context, functionName) {
      const validations = {
        removeItemFromInvoice: [
          {
            condition: context.discount !== 0,
            toast: () =>
              callError(
                'Cannot remove item.',
                'Please clear any existing discount/deposit first.',
              ),
          },
          {
            condition: context.deposit !== 0,
            toast: () =>
              callError(
                'Cannot remove item.',
                'Please clear any existing discount/deposit first.',
              ),
          },
          {
            condition: context.subtotal < 0,
            toast: () =>
              callError(
                'Cannot remove item.',
                'Total cannot be a negative value. Check your discounts.',
              ),
          },
        ],
        removeAllInvoiceItems: [
          {
            condition: context.discount !== 0,
            toast: () =>
              callError(
                'Cannot remove items.',
                'Please clear any existing discount/deposit first.',
              ),
          },
          {
            condition: context.deposit !== 0,
            toast: () =>
              callError(
                'Cannot remove items.',
                'Please clear any existing discount/deposit first.',
              ),
          },
          {
            condition: context.subtotal < 0,
            toast: () =>
              callError(
                'Cannot remove items.',
                'Total cannot be a negative value. Check your discounts.',
              ),
          },
          {
            condition: context.invoiceItems.length === 0,
            toast: () => callInfo('No items to remove.'),
          },
        ],
        // Additional function-specific validations can be added here
        calculateDeposit: [
          {
            condition: context.deposit !== 0,
            toast: () =>
              callError(
                'Cannot change deposit.',
                'Remove any existing deposits first.',
              ),
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
            condition:
              context.isDepositPercent === false &&
              context.tempDeposit > context.total,
            toast: () => callError('Deposit cannot exceed the total.'),
          },
          {
            condition: context.tempDeposit <= 0,
            toast: () =>
              callError('Deposit cannot be zero or a negative value.'),
          },
        ],

        confirmDiscount: [
          {
            // Must have items
            condition: context.subtotal <= 0,
            toast: () =>
              callError(
                'Cannot apply discount.',
                'Insert items into invoice first.',
              ),
          },
          {
            // Must not have deposit
            condition: context.deposit !== 0,
            toast: () =>
              callError('Cannot apply discount.', 'Remove the deposit first.'),
          },
          {
            // Must not already have a discount
            condition: context.discount !== 0,
            toast: () =>
              callError(
                'Discount already applied.',
                'Only one discount allowed.',
              ),
          },
          {
            // Positive, non-zero numeric discount
            condition:
              typeof context.tempDiscount !== 'number' ||
              isNaN(context.tempDiscount) ||
              context.tempDiscount <= 0,
            toast: () =>
              callError(
                'Invalid discount.',
                'Discount must be greater than 0.',
              ),
          },
          {
            // If percent, discount <= 100
            condition: context.isDiscountPercent && context.tempDiscount > 100,
            toast: () =>
              callError(
                'Discount cannot exceed 100%.',
                'Check discount value.',
              ),
          },
          {
            // If flat, discount <= subtotal
            condition:
              context.isDiscountFlat && context.tempDiscount > context.subtotal,
            toast: () =>
              callError(
                'Discount cannot exceed subtotal.',
                'Adjust discount value.',
              ),
          },
        ],

        handleMessageSubmit: [
          {
            condition: context.subtotal === 0,
            toast: () =>
              callError(
                'Cannot insert note.',
                'Please add some items into your invoice first.',
              ),
          },
          {
            condition: context.invoiceNotePopover === '',
            toast: () =>
              callError(
                'Invoice note cannot be empty.',
                'Please input a message first.',
              ),
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

    /**

     TO DO LIST:
    ------------
    Saving/Reseting/Deleting Invoice State - How will this work.
    ---------------------------------------------------------------
      Saving
        1. When user adds a new item to the invoice list to keep track of invoice items and discounts
      Reseting
        1.
      Deleting
        1. When user changes clients - or should I save the user progress
        2. When user generates an invoice - Yes

    Selecting client needs to empty all totals - Or does it?
      Check if there is any subtotal or not if not ...do not accept anything

      Conditionals:
          If user presses confirm with no input throw error toast and return
          If user inputs negative value do not calculate
          If user inputs negative value and presses confirm throw error
    */

    /*------------------------------CLIENT FETCHING LOGIC------------------------*/
    async fetchClients() {
      try {
        const response = await fetch('/api/clients')
        this.clients = await response.json()
      } catch (error) {
        console.error('Error fetching clients:', error)
        callError(
          'Cannot get client. Try again, restart program or call support.',
        )
      }
    },

    async selectClient(client) {
      const handleClientChange = async () => {
        this.showClientModal = false
        // Reset prices and discounts
        this.invoiceItems = []

        this.resetDiscounts()
        // this.resetTemporaryDiscounts()
        // this.calculateTotals()

        // get samples and styles for new client
        await this.fetchStyles(client.id)
        await this.fetchSamples(client.id)
        // Select new client
        this.saveSelectedClient(client)
        this.selectedClient = client

        callSuccess('Selected client:', `${this.selectedClient.name}.`)
      }

      if (this.subtotal != 0) {
        if (
          confirm('Changing clients will erase the current invoice. Proceed?')
        ) {
          await handleClientChange()
          this.closeModal()
        }
      } else {
        await handleClientChange()
        this.closeModal()
      }
    },

    saveSelectedClient(client) {
      localStorage.setItem('selectedClient', JSON.stringify(client))
    },

    async loadSelectedClient() {
      const client = JSON.parse(localStorage.getItem('selectedClient'))
      if (client) {
        this.selectedClient = client
        await this.fetchStyles(client.id)
        await this.fetchSamples(client.id)
      }
    },
    openModal() {
      this.showClientModal = true
      if (this.showDropdown === true) {
        this.showDropdown = false
      }
    },
    closeModal() {
      this.showClientModal = false
      if (this.showDropdown === true) {
        this.showDropdown = false
      }
    },

    async fetchStyles(clientId) {
      try {
        const response = await fetch(`/api/styles/client/${clientId}`)
        this.styles = (await response.json()).map(style => ({ ...style }))
        this.filteredStyles = this.styles
      } catch (error) {
        console.error('Error fetching styles:', error)
        callToast({
          type: 'danger',
          message: 'Error fetching styles.',
          description: 'Please try again or contact support.',
          position: 'top-center',
        })
      }
    },
    async fetchSamples(clientId) {
      try {
        const response = await fetch(`/api/samples/client/${clientId}`)
        this.samples = (await response.json()).map(sample => ({
          ...sample,
        }))
        this.filteredSamples = this.samples
      } catch (error) {
        console.error('Error fetching samples:', error)
        callError('Please try again or contact support.')
      }
    },

    /*MARK: PRICE FORMING LOGIC*/
    handleInvoQtySubmit(item) {
      return this.quantities[item.id] || 1
    },

    addItemToInvoice(item, type) {
      // 1) Check discount/deposit FIRST and return if blocked
      if (this.deposit !== 0 || this.discount !== 0) {
        this.deposit !== 0
          ? callError('Cannot add items.', 'Remove deposit and try again.')
          : callError('Cannot add items.', 'Remove discount and try again.')
        return
      }

      const uniqueId = `${type}-${item.id}`
      const qty = this.quantities[item.id] || 1

      // Check if item already exists
      let existingItem = this.invoiceItems.find(i => i.uniqueId === uniqueId)

      if (!existingItem) {
        const newItem = { ...item }
        newItem.type = type
        newItem.uniqueId = uniqueId
        newItem.quantity = qty
        newItem.price =
          parseFloat(item.price) *
          (type === 'sample' ? parseFloat(item.time) : 1)

        this.invoiceItems = [...this.invoiceItems, newItem]
      } else {
        existingItem.quantity += qty
        if (type === 'sample') {
          existingItem.price = parseFloat(item.price) * parseFloat(item.time)
        }
      }

      // Recalculate & Persist
      this.calculateTotals()
    },

    removeSingleInvoiceItem(targetItem) {
      if (this.discount !== 0 || this.deposit !== 0) {
        callError(
          'Cannot remove item.',
          'Please clear any existing discount/deposit first.',
        )
        return
      }

      this.invoiceItems = this.invoiceItems
        .map(item => {
          if (item.uniqueId === targetItem.uniqueId) {
            return { ...item, quantity: item.quantity - 1 }
          }
          return item
        })
        .filter(item => item.quantity > 0)

      this.calculateTotals()
    },

    removeItemFromInvoice(item) {
      let confirmText = 'Are you sure you want to remove this item?'
      if (!this.validator(this, 'removeItemFromInvoice')) return
      if (confirm(confirmText) === true) {
        this.invoiceItems = this.invoiceItems.filter(
          i => i.uniqueId !== item.uniqueId,
        )

        this.calculateTotals()
        callSuccess('Item removed', 'Successfully removed item from invoice.')
      } else {
        return
      }

      if (this.subtotal < 0) {
        callError(
          'Cannot remove item.',
          'Total cannot be a negative value. Check your discounts.',
        )
        this.invoiceItems.push(item)
        this.calculateTotals()
        return
      }

      if (this.invoiceItems.length === 0) {
        this.resetDeposit()
        this.resetDiscounts()
      }
    },
    removeAllInvoiceItems() {
      if (this.discount != 0) {
        callError(
          'Cannot remove items.',
          'Please clear any existing discount/deposit first.',
        )
        return
      }
      if (this.deposit != 0) {
        callError(
          'Cannot remove items.',
          'Please clear any existing discount/deposit first.',
        )
        return
      }
      if (this.subtotal < 0) {
        callError(
          'Cannot remove item.',
          'Total cannot be a negative value. Check your discounts.',
        )
        return
      }

      if (confirm('Remove all items from invoice?')) {
        if (this.invoiceItems.length === 0) {
          callInfo('No items to remove.')
          return
        }
        this.invoiceItems = []
        this.resetDeposit()
        this.resetDiscounts()
        this.calculateTotals()
        callSuccess('All items removed.')
      } else {
        callInfo('No items removed.')
        return
      }
    },
    // Rounds numbers to two decimal spaces. Only use after all math ops. are done.
    roundToTwo(value) {
      return Math.round((value + Number.EPSILON) * 100) / 100
    },
    calculateSubTotal() {
      try {
        // Calculate the subtotal for samples
        let sampleTotal = this.invoiceItems
          .filter(item => item.type === 'sample')
          .reduce((total, item) => total + item.price * item.quantity, 0)

        // Calculate the subtotal for styles
        let styleTotal = this.invoiceItems
          .filter(item => item.type === 'style')
          .reduce((total, item) => total + item.price * item.quantity, 0)

        // Calculate the overall subtotal by summing both
        let subTotal = sampleTotal + styleTotal

        this.discValSub = subTotal
        console.log('calculateSubTotal => Values')
        console.log("Sample's total : ", sampleTotal)
        console.log("Style's total: ", styleTotal)
        return this.roundToTwo(subTotal)
      } catch (error) {
        console.error('Error calculating subtotal:', error)
        throw new Error(
          'Failed to calculate subtotal. Please check the input data.',
        )
      }
    },

    calculateTotals() {
      const logger = discount => {
        console.log(`CalculateTotals => Values ${discount}`)
        console.log('Subtotal: ' + this.subtotal)
        console.log('Vat: ' + this.vat)
        console.log('Discount: ' + this.discount)
        console.log('Total: ' + this.total)
      }
      // recalculate prices if there already is a discount present
      if (this.discount !== 0) {
        let subtotal = this.calculateSubTotal()
        let discount = this.discount
        let recalcSubtotal = 0

        if (this.isDiscountPercent === true) {
          recalcSubtotal = subtotal - (discount / 100) * subtotal
        } else if (this.isDiscountFlat === true) {
          recalcSubtotal = subtotal - discount
        }
        let recalcVat = (this.vatPercent / 100) * recalcSubtotal
        let recalcTotal = recalcSubtotal + recalcVat

        this.subtotal = this.roundToTwo(recalcSubtotal)
        this.vat = this.roundToTwo(recalcVat)
        this.total = this.roundToTwo(recalcTotal)
        // Static subtotal is the total displayed in the UI
        this.roundToTwo((this.staticSubtotal = this.subtotal))
        logger('WITH discount')
        return
      }

      this.subtotal = this.calculateSubTotal()
      let noDiscountVat = (this.vatPercent / 100) * this.subtotal
      this.vat = this.roundToTwo(noDiscountVat)
      let noDiscountTotal = this.subtotal + this.vat
      this.total = this.roundToTwo(noDiscountTotal)
      this.staticSubtotal = this.roundToTwo(this.subtotal)

      console.log('CalculateTotals => Values NO discount')
      logger('!NO! discount')
    },

    // MARK: DISCOUNT
    // // Helps keep discount input value to 0
    // handleDiscountInput(event) {
    //   const inputValue = event.target.value
    //   if (inputValue === '' || null) {
    //     this.temporaryDiscount = 0
    //   } else {
    //     // Update discount normally based on input
    //     this.temporaryDiscount = parseFloat(inputValue)
    //   }
    // },

    // Calculates temporary subtotal vat and total
    // calculateTemporaryValues() {
    //   if (this.isDiscountPercent === true) {
    //     this.temporarySubtotal =
    //       this.subtotal - (this.temporaryDiscount / 100) * this.subtotal
    //   } else if (this.isDiscountFlat === true) {
    //     this.temporarySubtotal = this.subtotal - this.temporaryDiscount
    //   }
    //   this.temporaryVat = (this.vatPercent / 100) * this.temporarySubtotal
    //   this.temporaryTotal = this.temporarySubtotal + this.temporaryVat
    // },
    confirmDiscount() {
      let inputFocus = this.$refs.discountInput
      if (!this.validator(this, 'confirmDiscount')) {
        inputFocus.focus()
        return
      }

      let subtotal = this.subtotal
      let discountVal = parseFloat(this.tempDiscount) // user-typed discount
      let discountAmount = 0
      let vat = 0
      let total = 0
      // Save total before calculations for UI & PDF
      let preDiscountTotal = this.total

      if (this.isDiscountPercent) {
        discountAmount = (discountVal / 100) * subtotal
        subtotal -= discountAmount
      } else {
        discountAmount = discountVal
        subtotal -= discountAmount
      }

      vat = (this.vatPercent / 100) * subtotal
      total = subtotal + vat

      // Update all values at once after calculations
      this.preDiscountTotal = preDiscountTotal
      this.subtotal = this.roundToTwo(subtotal)
      this.discount = this.roundToTwo(discountVal) // store the typed discount
      this.vat = this.roundToTwo(vat)
      this.total = this.roundToTwo(total)

      callSuccess('Discount applied.')
      inputFocus.focus()
      this.calculateTotals()
    },

    // Confirm all prices to send to main screen Prices menu
    // confirmDiscount() {
    //   let inputFocus = this.$refs.discountInput
    //   if (!this.validator(this, 'confirmDiscount')) {
    //     inputFocus.focus()
    //     return
    //   }
    //   let totalContainer = this.total
    //   const confirmBtn = document.getElementById('confirm-discount')
    //   this.preDiscountTotal = totalContainer // reference to the total before calculations
    //   this.subtotal = this.roundToTwo(this.temporarySubtotal)
    //   this.discount = this.roundToTwo(this.temporaryDiscount)
    //   // MARK: Discount Value - gets the numberic value for discounts when discount === percent
    //   if (this.isDiscountPercent === true) {
    //     this.discountValue = (this.discValSub / 100) * this.discount
    //   }
    //   this.vat = this.roundToTwo(this.temporaryVat)
    //   this.total = this.roundToTwo(this.temporaryTotal)
    //   this.resetTemporaryDiscounts()

    //   confirmBtn.classList.remove(
    //     'bg-gray-100',
    //     'hover:bg-gray-300',
    //     'text-gray-950',
    //   )
    //   confirmBtn.classList.add(
    //     'bg-green-500',
    //     'text-white',
    //     'hover:bg-green-600',
    //   )
    //   callSuccess('Discount applied.')

    //   inputFocus.focus()
    //   // Recalc & persist
    //   // NEW-IDATA
    //   this.calculateTotals()
    //   console.log('Subtotal: ' + this.subtotal)
    //   console.log('Vat: ' + this.vat)
    //   console.log('Discount: ' + this.discount)
    //   console.log('Total: ' + this.total)
    //   console.log('Total before discount: ' + this.preDiscountTotal)
    //   // HANDLE ERROR HERE
    // },

    // // Handlers for reseting discount
    // resetTemporaryDiscounts() {
    //   const discBubbleSubTotal = document.getElementById(
    //     'subtotal-discount-buble',
    //   )
    //   this.temporaryDiscount = 0
    //   this.temporarySubtotal = this.subtotal
    //   this.temporaryVat = this.vat
    //   this.temporaryTotal = this.total
    //   this.showNewSubtotal = false
    //   discBubbleSubTotal.classList.remove('line-through', 'text-gray-500')
    //   discBubbleSubTotal.classList.add('text-slate-300')
    // },
    // logTemps() {
    //   console.log('Logging Temps:')
    //   console.log('Discount:', this.temporaryDiscount)
    //   console.log('Subtotal', this.temporarySubtotal)
    //   console.log('Vat', this.temporaryVat)
    //   console.log('Total', this.temporaryTotal)
    //   console.log('New subtotal:', this.showNewSubtotal)
    // },

    // resetDiscounts() {
    //   const confirmBtn = document.getElementById('confirm-discount')

    //   if (this.deposit != 0) {
    //     this.resetDeposit()
    //   }
    //   this.discount = 0
    //   this.resetTemporaryDiscounts()
    //   this.temporaryVat = this.vat
    //   this.temporaryTotal = this.total
    //   this.discountValue = 0
    //   this.calculateTotals()
    //   confirmBtn.classList.remove(
    //     'bg-green-500',
    //     'text-white',
    //     'hover:bg-green-600',
    //   )
    //   confirmBtn.classList.add(
    //     'bg-gray-100',
    //     'hover:bg-gray-300',
    //     'text-gray-950',
    //   )
    // },
    resetDiscounts() {
      const confirmBtn = document.getElementById('confirm-discount')

      if (this.deposit != 0) {
        this.resetDeposit()
      }
      this.discount = 0
      this.discountValue = 0

      this.calculateTotals()
    },

    revolveSymbol(inputSymbol) {
      const symbol = document.getElementById(inputSymbol)
      symbol.classList.add('revolve')

      symbol.addEventListener(
        'animationend',
        () => {
          symbol.classList.remove('revolve')
        },
        { once: true },
      )
    },

    changeDiscount() {
      let inputFocus = this.$refs.discountInput
      if (this.discount != 0) {
        callError(
          'Cannot change discount type.',
          'Reset the existing discount first.',
        )
        inputFocus.focus()
        return
      }

      const icon = document.getElementById('rotateIcon')
      icon.classList.add('spin') // Add animation class
      // Remove class after animation to reset for future clicks
      icon.addEventListener(
        'animationend',
        () => {
          icon.classList.remove('spin')
        },
        { once: true },
      )

      if (this.switchOpen === true) {
        this.symbol = '£'
        this.isDiscountPercent = false
        this.isDiscountFlat = true
        this.revolveSymbol()
      }
      if (this.switchOpen === false) {
        this.symbol = '%'
        this.isDiscountPercent = true
        this.isDiscountFlat = false
        this.revolveSymbol()
      }
      inputFocus.focus()
    },

    /*MARK: ADD STYLES & SAMPLE */
    // Adds new style/sample in DB and updates UI
    async invoAddStyle() {
      const style = { ...this.newStyle, client_id: this.selectedClient.id }
      try {
        const response = await fetch('/styles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(style),
        })
        const newStyle = await response.json()
        this.styles.push({ ...newStyle })
        this.filteredStyles = this.styles
        this.showAddStyleModal = false
        this.newStyle = { name: '', price: null }
        callSuccess('Successfully added style.')
      } catch (error) {
        console.error('Error adding style:', error)
        callError('Error adding style.', 'Try again or call support.')
      }
    },
    async invoAddSample() {
      const sample = { ...this.newSample, client_id: this.selectedClient.id }
      try {
        const response = await fetch('/samples', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sample),
        })
        const newSample = await response.json()
        this.samples.push({ ...newSample, isEditing: false })
        this.filteredSamples = this.samples
        this.showAddSampleModal = false
        this.newSample = { name: '', style: null, price: null }
        callSuccess('Successfully added sample.')
      } catch (error) {
        console.error('Error adding sample:', error)
        callError('Error adding sample.', 'Try again or call support.')
      }
    },

    searchStyles() {
      this.filteredStyles = this.styles.filter(style =>
        style.name.toLowerCase().includes(this.styleSearch.toLowerCase()),
      )
    },

    searchSamples() {
      this.filteredSamples = this.samples.filter(sample =>
        sample.name.toLowerCase().includes(this.sampleSearch.toLowerCase()),
      )
    },
    searchInvoiceItems() {
      this.invoiceSearchQuery = this.invoiceSearchQuery.trim().toLowerCase()
    },

    /*---------------------------GENERATE INVOICE LOGIC-----------------------------*/
    /* TODO:
      1. If value is 0 and it returns error the invoice still makes an invoice in the backend
      2. NOTE! ---> Added Deposit and NOTE to DB
    */
    // Generates invoice
    async generateInvoice() {
      const invoiceData = {
        clientId: this.selectedClient.id,
        items: this.invoiceItems,
        discountPercent: this.isDiscountPercent,
        discountFlat: this.isDiscountFlat,
        vatPercent: this.vatPercent,
        subtotal: this.staticSubtotal,
        discount: this.discountValue,
        discountPercentValue: this.discount !== 0 ? this.discount : 0,
        vat: this.vat,
        total: this.total,
        deposit: this.deposit,
        depositPercentValue: this.tempDeposit !== 0 ? this.tempDeposit : 0,
        note: this.invoiceNote,
        totalPreDiscount: this.preDiscountTotal,
        date: new Date().toLocaleDateString(),
        depositFlat: this.depositFlat,
        depositPercent: this.depositPercent,
      }
      console.log('generateInvoice => invoiceData: ', invoiceData)
      try {
        const response = await fetch('/api/saveInvoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        })

        if (response.ok) {
          const invoice = await response.json()
          this.generatePDF(invoice.id)
        } else {
          console.error('Error generating invoice:', await response.json())
          callError(
            'Server error.',
            'Failed to generate invoice. Try again, restart or call support.',
          )
        }
      } catch (error) {
        console.error('Error generating invoice:', error)
        callError(
          'Unable to generate invoice. Try again, restart or contact support.',
        )
      }
    },

    async generatePDF(invoiceId) {
      try {
        const response = await fetch(`/api/invoices/${invoiceId}/pdf`, {
          method: 'GET',
        })
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        // PDF Filename - set by Content-Disposition in backend.
        a.download = `S.A.M.Creations-${invoiceId}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        callToast({
          type: 'success',
          message: 'PDF generated successfully.',
          position: 'top-center',
        })
      } catch (error) {
        console.error('Error generating PDF:', error)
        callToast({
          type: 'danger',
          message: 'PDF Generation Error!',
          description: 'Failed to generate PDF. Try again or contact support.',
          position: 'top-center',
        })
      }
    },
  }
}
