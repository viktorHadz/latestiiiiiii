document.addEventListener('alpine:init', () => {
  Alpine.store(
    'edit',
    Alpine.reactive({
      // ==== 1. Invoice Book & Full Invoice Details - Pagination ====
      invoiceBook: [],
      currentPage: 1,
      totalPages: null, // Set from the backend
      hasMore: true, // We set this based on currentPage < totalPages
      loading: false,
      loadPrev: false,
      loadNext: false,
      activeClientId: null,
      activeItemId: null,

      uiDiscount: 0,
      uiDeposit: 0,
      uiNewDeposit: 0,

      newItem: {
        type: '',
        name: '',
        price: null,
        time: null,
        total_item_price: null,
        quantity: null,
        invoiceId: null,
        origin_id: null,
        time: null,
        frontendId: '',
      },
      // Note
      modNote: false,
      viewNote: false,
      uiNote: '',
      // ==== State Keeping Variables
      currentInvoice: {
        clientId: null,
        invoice_id: null,
        invoice_number: '',
        invoice_status: '',
        isCopy: false,
        totals: {},
        items: [],
        searchQuery: '',
      },
      styleAndSample: [],

      editing: false,
      editMode: '',
      initialEditValues: {}, // Used for restoring state on cancel
      openEditModal: false,
      customItemCounter: 0,

      get activeItemKey() {
        return this.currentInvoice.isCopy ? 'copy-' + this.currentInvoice.id : 'parent-' + this.currentInvoice.id
      },
      get invoiceExists() {
        return this.currentInvoice.invoice_id !== null
      },
      get isEditingCopy() {
        return this.currentInvoice.isCopy && this.editing
      },

      async init() {
        console.log('{ Edit Store } Initialising')

        this.clientChangeEffect()
        await this.fetchInvoiceBookEffect()
        await this.styleAndSample(this.activeClientId)
        console.log('{ Edit Store } ==> Initialised')
      },
      async fetchInvoiceById(invoiceId, isCopy = false) {
        if (this.editing) {
          console.warn('Attempted invoice change while editing. Resetting edit state before fetching.')
          this.exitEdit()
          return
        }
        try {
          const res = await fetch(`/editor/invoice/${invoiceId}?isCopy=${isCopy}`)
          if (!res.ok) throw new Error('Error fetching invoice')

          const { invoice } = await res.json()
          if (!invoice) throw new Error('Invalid invoice data')
          this.currentInvoice = invoice // Assign directly

          this.calculateTotals()
        } catch (err) {
          console.error(err)
          callError('Error retrieving invoice', 'Try again or contact support.')
        }
      },
      async editInvoice() {
        if (!this.invoiceExists) {
          callWarning('No invoice selected', 'Pick an invoice first')
          return
        }
        this.initialEditValues = JSON.parse(JSON.stringify(this.currentInvoice))
        this.editing = true
        this.editMode = this.currentInvoice.isCopy ? 'copy' : 'editParent'
      },

      async cancelEdit() {
        if (!(await callConfirm('Cancel changes?'))) return
        this.currentInvoice = JSON.parse(JSON.stringify(this.initialEditValues))
        this.editing = false
        this.editMode = ''
      },

      exitEdit() {
        this.currentInvoice = JSON.parse(JSON.stringify(this.initialEditValues))
        this.editing = false
        this.editMode = ''
      },

      async deleteInvoice() {
        if (!this.invoiceExists) {
          callError('No invoice selected', 'Pick an invoice first')
          return
        }
        const confirmed = await callConfirm('Delete this invoice? This action cannot be undone.')
        if (!confirmed) return

        const endpoint = this.currentInvoice.isCopy
          ? `/editor/invoice/copy/delete/${this.currentInvoice.invoice_id}`
          : `/editor/invoice/delete/${this.currentInvoice.invoice_id}`

        try {
          const res = await fetch(endpoint, { method: 'DELETE' })
          if (!res.ok) throw new Error('Failed to delete invoice')

          callSuccess('Invoice deleted successfully')
          // Forces reactivity
          this.currentInvoice = { invoice_id: null, isCopy: false, totals: {}, items: [] }
          // Optionally refresh the invoice list / copies
          this.refreshInvoiceCopies(null)
        } catch (error) {
          console.error('Error deleting invoice:', error)
          callError('Error deleting invoice', 'Please refresh and try again.')
        }
      },
      // --- Computed Property to Handle UI States ---
      get invoiceViewMode() {
        if (!this.invoiceExists) return 'none' // No invoice selected
        if (this.isEditingCopy) return 'editCopy' // Editing a copy invoice
        if (this.editing) return 'editParent' // Editing a parent invoice
        if (this.currentInvoice.isCopy) return 'viewCopy' // Viewing a copy invoice
        return 'viewParent' // Viewing a parent invoice
      },
      // ==== ALL METHODS ====
      // --- Fetch Invoice List (for the current page, with copies attached) ---
      async fetchListById() {
        try {
          const client = Alpine.store('clients').selectedClient
          if (!client?.id) return

          // Request the invoices for the current page.
          // The backend should return { data: [invoices], totalPages: X }
          const res = await fetch(`/editor/list/${client.id}?page=${this.currentPage}`)
          if (!res.ok) throw new Error(`Error fetching invoices: ${res.statusText}`)
          const response = await res.json()
          const data = response.data || []
          this.totalPages = response.totalPages || 1

          if (data.length === 0) {
            this.hasMore = false
          } else {
            // Fetch copies for these invoices:
            const invoiceIds = data.map(item => item.id)
            const copyData = await this.fetchInvoiceCopies(invoiceIds)

            // Process each invoice:
            data.forEach(item => {
              item.copies = copyData[item.id]
              item.expanded = false
            })

            // Replace the invoiceBook with the data for the current page.
            this.invoiceBook = data
            // Set hasMore based on whether currentPage is less than totalPages.
            this.hasMore = this.currentPage < this.totalPages
          }
        } catch (error) {
          console.error('Error fetching invoice list:', error)
        }
      },
      // Pagination navigation methods:
      async nextPage() {
        if (this.currentPage < this.totalPages) {
          this.loadNext = true
          this.currentPage++
          await this.fetchListById()
          this.loadNext = false
        }
      },
      async prevPage() {
        if (this.currentPage > 1) {
          this.loadPrev = true
          this.currentPage--
          this.hasMore = true
          await this.fetchListById()
          this.loadPrev = false
        }
      },
      async refreshInvoiceCopies(invoiceId) {
        try {
          const res = await fetch(`/editor/invoice/copy/names?invoiceIds=${invoiceId}`)
          if (!res.ok) throw new Error('Error refreshing invoice copies')
          const copyData = await res.json()
          // Find the invoice in the current invoiceBook.
          const invoice = this.invoiceBook.find(inv => inv.id === invoiceId)
          if (invoice) {
            invoice.copies = copyData[invoiceId] || []
          }
        } catch (error) {
          console.error('Error refreshing copies for invoice:', invoiceId, error)
        }
      },
      // Gets styles and sample used in existing items tables
      async styleAndSample(clientId) {
        const res = await fetch(`/editor/existing/items/${clientId}`)
        if (!res.ok) {
          throw new Error(`[ Editor ]: Cannot retrieve items. ${res.status}`)
        }
        const items = await res.json()
        // Transform styles - add type and set defaults
        const formattedStyles = items.styles.map(style => ({
          ...style,
          type: 'Style',
          quantity: 1,
          time: 'N/A',
        }))
        // Transform samples - add type and set defaults
        const formattedSamples = items.samples.map(sample => ({
          ...sample,
          type: 'Sample',
          quantity: 1,
        }))
        this.styleAndSample = [...formattedStyles, ...formattedSamples]
        console.log('Formatted items:', this.styleAndSample)
      },

      // ====== SAVING ======
      async saveEdit({ mode } = { mode: 'overwrite' }) {
        if (!(await callConfirm(`Are you sure you want to ${mode} this invoice?`))) {
          return
        }

        if (this.currentInvoice.totals.depositValue <= 0 && mode === 'copy') {
          callInfo('Cannot save a copy', 'Invoices must have a deposit')
          return
        }

        try {
          const res = await fetch(`/editor/invoice/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.currentInvoice), // Send whole object
          })

          const response = await res.json()
          if (response.error) throw new Error(response.error)

          callSuccess('Invoice saved successfully')
          await this.refreshInvoiceCopies(this.currentInvoice.invoice_id)
          this.exitEdit()
        } catch (error) {
          console.error(error)
          callError('Error saving invoice', error.message)
        }
      },
      calculateTotals() {
        const round = value => Alpine.store('price').roundToTwo(value)

        // Now items are at currentInvoice.items
        const items = this.currentInvoice.items || []
        // Totals are stored in currentInvoice.totals
        let totals = { ...this.currentInvoice.totals }

        // 1. Base Subtotal
        let baseSubtotal = 0
        items.forEach(item => {
          let lineTotal = 0
          if (item.type === 'sample') {
            // For samples, convert minutes to hours
            lineTotal = item.price * (item.time / 60) * item.quantity
          } else {
            // For styles, multiply unit price by quantity
            lineTotal = item.price * item.quantity
          }
          baseSubtotal += lineTotal
        })
        const subtotalPreDiscount = round(baseSubtotal)
        const vatBeforeDiscount = round(subtotalPreDiscount * 0.2)

        // 2. Discount
        const discountType = totals.discountType
        let discountRaw = totals.discountValue
        let discountAmount = 0
        if (discountType === 1) {
          discountAmount = round((baseSubtotal * discountRaw) / 100)
        } else if (discountType === 0) {
          discountAmount = round(discountRaw)
        }
        // Check discount overage
        if (discountAmount > baseSubtotal) {
          console.error(`Discount (${discountAmount}) exceeds subtotal (${baseSubtotal}). Removing discount.`)
          totals.discountValue = 0
          totals.discVal_ifPercent = 0
          discountRaw = 0
          discountAmount = 0
          callError('Discount exceeds subtotal', 'Resetting discount to 0.')
        }

        // 3. Subtotal & VAT
        const subtotal = round(baseSubtotal - discountAmount)
        const vatAmount = round(subtotal * 0.2)
        const total = round(subtotal + vatAmount)
        const totalPreDiscount = round(subtotalPreDiscount + vatBeforeDiscount)

        // 4. Deposit - initial
        const depositType = totals.depositType
        let depositRaw = totals.depositValue
        let depositAmount = 0
        if (depositType === 1) {
          depositAmount = round((total * depositRaw) / 100)
        } else if (depositType === 0) {
          depositAmount = round(depositRaw)
        }
        // Check deposit overage
        if (depositAmount > total) {
          console.warn(`Deposit (${depositAmount}) exceeds total (${total}). Resetting deposit to 0.`)
          totals.depositValue = 0
          totals.depoVal_ifPercent = 0
          depositAmount = 0
          depositRaw = 0
          callError('Deposit exceeds total', 'Resetting deposit to 0.')
        }
        // 5. Get total deposits, with extra deposits
        if (!Array.isArray(totals.deposits)) {
          totals.deposits = []
        }
        let extraDeposits = totals.deposits.reduce((sum, d) => sum + d.amount, 0)
        const remaining = round(total - (depositAmount + extraDeposits))

        // 6. Push computed values back into totals
        totals.subtotal_pre_discount = subtotalPreDiscount
        totals.total_pre_discount = totalPreDiscount
        totals.subtotal = subtotal
        totals.vat = vatAmount
        totals.total = total
        totals.discountValue = round(discountRaw)
        totals.discVal_ifPercent = discountType === 1 ? discountAmount : 0
        totals.depositValue = depositRaw
        totals.depoVal_ifPercent = depositType === 1 ? depositAmount : depositRaw
        totals.remaining_balance = remaining

        // Update currentInvoice.totals
        this.currentInvoice.totals = totals

        console.log('invoice state after recalculation:', JSON.stringify(this.currentInvoice, null, 2))
      },
      addDropdownItem(item) {
        console.log('[addDropdownItem] Adding item:', item)
        // Check for existing item using origin_id + type
        const existingItem = this.currentInvoice.items.find(
          invItem =>
            invItem.frontendId === item.frontendId &&
            invItem.type === item.type &&
            invItem.origin_id === item.origin_id,
        )

        const quantity = item.quantity || 1

        if (existingItem) {
          console.log(`[addDropdownItem] Item already exists, increasing quantity.`)
          existingItem.quantity += quantity
        } else {
          if (item.type === 'sample' && (!item.time || isNaN(item.time) || item.time <= 0)) {
            callError('Invalid Time', 'Samples require a valid time greater than 0.')
            return
          }
          const newItem = {
            ...item,
            quantity: quantity,
          }

          console.log('[addDropdownItem] Adding new dropdown item:', newItem)
          this.currentInvoice.items.push(newItem)
        }

        this.calculateTotals()
      },

      addCustomItem() {
        console.log('[addCustomItem] Adding a new custom item.')
        if (!this.newItem.type || !this.newItem.name.trim()) {
          callError('Invalid Item', 'Custom item must have a name and type.')
          return
        }
        if (!this.newItem.price || isNaN(this.newItem.price) || this.newItem.price <= 0) {
          callError('Invalid Price', 'Price must be greater than 0.')
          return
        }
        if (
          this.newItem.type === 'sample' &&
          (!this.newItem.time || isNaN(this.newItem.time) || this.newItem.time <= 0)
        ) {
          callError('Invalid Time', 'Samples require a valid time greater than 0.')
          return
        }
        if (!this.newItem.quantity || isNaN(this.newItem.quantity) || this.newItem.quantity < 1) {
          callError('Invalid Quantity', 'Quantity must be at least 1.')
          return
        }
        this.customItemCounter += 1
        const uniqueKey = `custom-${this.newItem.type}-${this.customItemCounter}`
        const newOriginId = -this.customItemCounter
        const unitPrice = this.newItem.price
        const newItem = {
          name: this.newItem.name.trim(),
          type: this.newItem.type,
          price: unitPrice,
          time: this.newItem.type === 'sample' ? this.newItem.time : 0,
          quantity: Math.floor(this.newItem.quantity),
          origin_id: newOriginId,
          frontendId: uniqueKey,
        }
        console.log('[addCustomItem] Adding new item:', newItem)
        this.currentInvoice.items.push(newItem)
        this.newItem = { type: '', name: '', price: null, quantity: null, time: null }
        this.calculateTotals()
      },

      // --- Editing: Item Manipulation Methods ---
      incrementInvoiceItem(uniqueKey) {
        const item = this.currentInvoice.items.find(i => i.frontendId === uniqueKey)
        if (item) {
          item.quantity += 1
          this.calculateTotals()
        }
      },
      decrementInvoiceItem(uniqueKey) {
        const item = this.currentInvoice.items.find(i => i.frontendId === uniqueKey)
        if (item) {
          if (item.quantity > 1) {
            item.quantity -= 1
          } else {
            this.removeInvoiceItem(uniqueKey)
            return
          }
          this.calculateTotals()
        }
      },
      async removeInvoiceItem(uniqueKey) {
        if (await callConfirm('Remove this item?')) {
          this.currentInvoice.items = this.currentInvoice.items.filter(i => i.frontendId !== uniqueKey)
          this.calculateTotals()
        }
      },

      // --- Discount Functions ---
      addDiscount() {
        const invoice = this.currentInvoice.totals
        if (invoice.discountValue !== 0) {
          callWarning('Cannot change discount', 'Remove existing discount and try again.')
          return
        }
        if (this.uiDiscount > invoice.subtotal) {
          callError('Discount cannot exceed subtotal', 'Adjust amount and try again.')
          return
        }
        invoice.discountValue = this.uiDiscount
        this.calculateTotals()
      },
      changeDiscountType() {
        const invoice = this.currentInvoice.totals
        if (invoice.discountValue !== 0) {
          callWarning('Cannot change discount', 'Remove existing discount and try again.')
          return
        }
        invoice.discountType = invoice.discountType === 1 ? 0 : 1
      },
      removeDiscount() {
        const invoice = this.currentInvoice.totals
        invoice.discountValue = 0
        invoice.discVal_ifPercent = 0
        this.calculateTotals()
      },
      // --- Deposit Functions ---
      addDeposit() {
        const invoice = this.currentInvoice.totals
        if (invoice.depositValue !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        invoice.depositValue = this.uiDeposit
        this.uiDeposit = 0
        this.calculateTotals()
      },
      newDeposit() {
        const invoice = this.currentInvoice.totals

        if (invoice.remaining_balance === 0) {
          callWarning('Cannot add new deposit', 'Remaining balance cannot be 0')
          return
        }
        if (invoice.remaining_balance - this.uiNewDeposit < 0) {
          callWarning('Cannot add new deposit', 'Remaining balance cannot be a negative value')
          return
        }
        if (!Array.isArray(invoice.deposits)) {
          invoice.deposits = []
        }

        // Find the next deposit number
        let nextDepositNumber = invoice.deposits.length + 1
        let newDepositKey = `deposit-${nextDepositNumber}`
        // Create new deposit entry
        let newDepositEntry = {
          key: newDepositKey,
          amount: this.uiNewDeposit,
        }
        // Push new deposit into the list
        invoice.deposits.push(newDepositEntry)
        this.uiNewDeposit = 0
        this.calculateTotals()
      },
      removeExtraDeposit(index) {
        let invoice = this.currentInvoice.totals

        if (!Array.isArray(invoice.deposits) || invoice.deposits.length === 0) {
          return
        }

        // Remove deposit at given index
        invoice.deposits.splice(index, 1)

        // Recalculate totals
        this.calculateTotals()
      },
      changeDepositType() {
        const invoice = this.currentInvoice.totals
        if (invoice.depositValue !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        invoice.depositType = invoice.depositType === 1 ? 0 : 1
        // this.$store.edit.currentInvoice.totals = { ...invoice } // Force reactivity
      },
      removeDeposit() {
        const invoice = this.currentInvoice.totals
        invoice.depositValue = 0
        invoice.depoVal_ifPercent = 0
        this.calculateTotals()
      },
      addNote() {
        if ($store.edit.currentInvoice.data.note.length) {
          callWarning('Note already exists', 'Remove existing note and try again')
          return
        }
        $store.edit.currentInvoice.data.note = this.uiNote.trim()
        this.uiNote = ''
        this.modNote = false
      },

      // ==== Effects & Helpers ====
      // changeDate(path, newValue) {
      //   setNestedWithError(this, path, newValue)
      //   console.log(`Updated path "${path}" =>`, newValue)
      //   console.log('Store now:', JSON.parse(JSON.stringify(this)))
      // },
      getInvoiceClass(invoice) {
        return {
          'flex justify-between items-center shadow-md ring-vls/80 text-vdp dark:text-white dark:ring-bg-vlp-2-800':
            invoice.id === this.currentInvoice.invoice_id && !this.currentInvoice.isCopy,
          'flex justify-between items-center shadow hover:shadow-md rounded p-1.5 bg-vlp hover:bg-blue-50 dark:bg-vdp transition-all ring-1 ring-vls/40 hover:ring-vls/80 text-vls2 hover:text-vls3 dark:text-vds3light dark:hover:text-vds cursor-pointer':
            invoice.id !== this.currentInvoice.invoice_id || this.currentInvoice.isCopy,
          'bg-blue-50 dark:bg-vdp p-1.5 transition-all ring-1 ring-vls/80 rounded text-vls3 dark:text-vds':
            invoice.id === this.currentInvoice.invoice_id && !this.currentInvoice.isCopy,
        }
      },

      getCopyClass(copy) {
        return {
          'flex justify-between items-center shadow-md border-vls/80 text-vdp dark:text-white dark:border-bg-vlp-2-800':
            copy.id === this.currentInvoice.invoice_id && this.currentInvoice.isCopy,
          'flex justify-between items-center shadow hover:shadow-md rounded p-1.5 bg-vlp hover:bg-blue-50 dark:bg-vdp transition-all border-1 border-vls/40 hover:border-vls/80 text-vls2 hover:text-vls3 dark:text-vds3light dark:hover:text-vds cursor-pointer':
            copy.id !== this.currentInvoice.invoice_id || !this.currentInvoice.isCopy,
          '!bg-blue-50 dark:!bg-vdp p-1.5 transition-all border-1 border-vls/80 rounded text-vls3 dark:text-vds':
            copy.id === this.currentInvoice.invoice_id && this.currentInvoice.isCopy,
        }
      },
      async fetchInvoiceBookEffect() {
        const eventHandler = async () => {
          Alpine.effect(async () => {
            console.log('fetchInvoiceBookEffect')
            await this.fetchListById()
          })
        }
        document.removeEventListener('invoice:created', eventHandler)
        document.addEventListener('invoice:created', eventHandler)
      },

      // Helper to fetch copies for a list of invoice IDs.
      async fetchInvoiceCopies(invoiceIds) {
        let copyData = {}
        if (invoiceIds.length > 0) {
          const copyRes = await fetch(`/editor/invoice/copy/names?invoiceIds=${invoiceIds.join(',')}`)
          if (!copyRes.ok) throw new Error(`Error fetching copied invoices`)
          copyData = await copyRes.json()
        }
        return copyData
      },
      // Effect to reset pagination on client change
      clientChangeEffect() {
        Alpine.effect(() => {
          const selectedClient = Alpine.store('clients').selectedClient
          if (!selectedClient?.id) return
          if (this.activeClientId !== selectedClient.id) {
            this.resetInvoicePagination(selectedClient.id)
            this.fetchListById()
          }
        })
      },
      resetInvoicePagination(clientId) {
        this.invoiceBook = []
        this.currentPage = 1
        this.hasMore = true
        this.totalPages = null
        this.activeClientId = clientId
        this.activeItemId = null
        this.showInvoiceItems = false
        this.initialEditValues = {}
      },
    }),
  )
})
