document.addEventListener('alpine:init', () => {
  Alpine.store(
    'edit',
    Alpine.reactive({
      // ==== 1. InvoiceBook & Items ====
      invoiceBook: [],
      page: 1,
      hasMore: true,
      loading: false,
      // ==== 2. Invoice-Display & Edit ====
      editing: false,
      edited: false,
      editMode: '',
      openEditModal: false,
      showInvoiceItems: false,
      invoiceItems: { invoiceItems: [] },
      initialValuesInvItems: {},
      customItemCounter: 0,
      //====Copies====

      showCopies: true,
      copyInvoices: [],
      // ===== 3. Styles & Samples for Dropdown =====
      existingItems: {
        showItemModal: false,
        openDropdown: false,
        stylesAndSamples: [],
        searchQuery: '',

        get filteredItems() {
          const query = this.searchQuery.trim().toLowerCase()
          return query
            ? this.stylesAndSamples.filter(item => item.name.toLowerCase().includes(query))
            : this.stylesAndSamples
        },
      },
      // ===== 4. New Item Modal =====
      newItem: {
        type: '',
        name: '',
        price: null,
        quantity: null,
        time: null,
      },
      // ==== 5. Utility Modals (Discounts & Deposits)====
      modDisc: false,
      showXDisc: false,
      uiDiscount: 0,
      //Deposit
      modDepo: false,
      showXDepo: false,
      uiDeposit: 0,

      // ===== ALL METHODS =====
      async init() {
        console.log('{ Edit Store } Initialising')
        await this.fetchListById()
        this.clientChangeSync()
        this.invoiceCreatedSync()
        this.watchTabSwitch()
        console.log('{ Edit Store } ==> Initialised')
      },

      getCopyInvoNames(invoiceId) {
        if (!invoiceId) return

        // Avoid duplicate fetches
        if (this.copyInvoices[invoiceId]) return

        fetch(`/editor/invoice/copy/names/${invoiceId}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              console.error('Error fetching copied invoices:', data.error)
              return
            }

            this.copyInvoices[invoiceId] = data.map(inv => ({
              id: inv.id,
              number: inv.invoice_number,
            }))
          })
          .catch(error => {
            console.error('Error fetching copied invoices:', error)
          })
      },

      // ==== FETCH METHODS ====
      // 1. Fetch invoice book list
      async fetchListById() {
        if (this.loading || !this.hasMore) return // Prevent spam clicks
        this.loading = true

        try {
          const client = Alpine.store('clients').selectedClient
          if (!client?.id) return

          if (this.activeClientId !== client.id) {
            console.log('{ Edit Store } Client changed - resetting invoice list')
            this.invoiceBook = []
            this.page = 1
            this.hasMore = true
            this.activeClientId = client.id
          }

          let res = await fetch(`/editor/list/${client.id}?page=${this.page}`)
          if (!res.ok) throw new Error(`Error fetching invoices: ${res.statusText}`)

          let data = await res.json()

          if (data.length === 0) {
            this.hasMore = false // No more invoices
          } else {
            data.forEach(item => {
              if (!this.invoiceBook.some(existing => existing.id === item.id)) {
                item.date = new Date(item.date).toLocaleDateString('en-GB')
                this.invoiceBook.push(item)
                // Fetch copied invoices for each item
                this.getCopyInvoNames(item.id)
              }
            })

            this.page++
            console.log(`{ editStore } invoice page ==> ${this.page}`)
          }
        } catch (error) {
          console.error('Error fetching invoice list items:', error)
        } finally {
          this.loading = false
        }
      },

      // 2. Individual invoice details
      async fetchInvoice(invoiceId) {
        try {
          if (!invoiceId) return
          if (this.editing) {
            callWarning('Cannot change while editing', 'Complete edit and try again')
            return
          }

          const response = await fetch(`/editor/invoice/${invoiceId}`)
          if (!response.ok) throw new Error(`Error fetching invoice: ${response.statusText}`)
          const data = await response.json()
          console.log('Fetched invoice data:', data)

          // Reset custom item counter (only when loading a new invoice)
          this.customItemCounter = 0

          const uniqueItems = []
          const seen = new Set()

          data.invoiceItems.forEach(item => {
            const uniqueKey = `non-edit-${item.type}-${item.origin_id}`
            if (!seen.has(uniqueKey)) {
              seen.add(uniqueKey)
              uniqueItems.push({
                ...item,
                frontendId: uniqueKey,
              })
            }
          })

          this.invoiceItems = {
            ...data,
            invoiceItems: uniqueItems,
          }

          this.calculateTotals()
          this.showInvoiceItems = true
          this.activeItemId = invoiceId
          this.editing = false
        } catch (error) {
          console.error('Error fetching invoice:', error)
          callError('Error retrieving invoice', 'Try again or contact support.')
        }
      },

      // 3. Styles and samples for dropdown menu
      async fetchStylesAndSamples(clientId) {
        if (!clientId) return
        try {
          const response = await fetch(`/editor/client/${clientId}/items`)
          if (!response.ok) throw new Error(`Error fetching styles/samples: ${response.statusText}`)

          const data = await response.json()

          // Store all styles & samples in one array
          this.existingItems.stylesAndSamples = [
            ...data.styles.map(style => ({ ...style, type: 'style', frontEndId: `style-${style.id}`, quantity: 1 })),
            ...data.samples.map(sample => ({
              ...sample,
              type: 'sample',
              frontEndId: `sample-${sample.id}`,
              quantity: 1,
            })),
          ]
        } catch (error) {
          console.error('Error fetching styles/samples:', error)
          callError('Error retrieving items', 'Please restart the program, try again or call support.')
        }
      },
      async updatePaid(invoiceId) {
        try {
          let res = await fetch(`/editor/invoice/${invoiceId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })

          if (!res.ok) throw new Error(`Error updating invoice status: ${res.statusText}`)

          let data = await res.json()

          // Find and update the local invoice in invoiceBook
          let invoice = this.invoiceBook.find(i => i.id === invoiceId)
          if (invoice) {
            invoice.invoice_status = data.newStatus
          }

          console.log(`Invoice ${invoiceId} marked as ${data.newStatus}`)
        } catch (error) {
          console.error('Error updating invoice status:', error)
        }
      },

      editInvoice() {
        if (this.editMode === 'editOverwrite' || this.editMode === 'editCopy') {
          this.initialValuesInvItems = JSON.parse(JSON.stringify(this.invoiceItems))
          this.editing = true
          this.openEditModal = false
        }
      },

      cancelEdit() {
        return new Promise(resolve => {
          if (this.editing && confirm('You will lose current edits. Continue?')) {
            this.invoiceItems = JSON.parse(JSON.stringify(this.invoiceItems))
            this.editing = false
            this.editMode = ''
            resolve(true)
          } else {
            resolve(false)
          }
        })
      },

      saveEdit() {
        if (!this.editMode) return
        if (!confirm('Are you sure you want to save this invoice?')) return

        try {
          const invoice = this.invoiceItems.invoice

          const data = {
            invoiceId: invoice.id,
            clientId: invoice.client_id,
            items: this.invoiceItems.invoiceItems.map(item => ({
              name: item.name,
              price: parseFloat(item.price), // Ensure price is valid
              type: item.type,
              time: item.type === 'sample' ? parseFloat(item.time) : 0,
              invoice_id: invoice.id, // Attach invoice ID
              quantity: parseInt(item.quantity, 10),
              total_item_price: parseFloat(item.price) * parseInt(item.quantity, 10),
              origin_id: item.origin_id,
            })),
            discountType: invoice.discount_type,
            discountValue: invoice.discount_value,
            discVal_ifPercent: invoice.discVal_ifPercent,
            vatPercent: invoice.vat_percent,
            vat: invoice.vat,
            subtotal: invoice.subtotal,
            total: invoice.total,
            depositType: invoice.deposit_type,
            depositValue: invoice.deposit_value,
            depoVal_ifPercent: invoice.depoVal_ifPercent,
            note: invoice.note?.trim(),
            totalPreDiscount: invoice.total_pre_discount,
            date: invoice.date || new Date().toISOString().split('T')[0],
          }

          let endpoint =
            this.editMode === 'editOverwrite' ? `/editor/invoice/save/overwrite` : `/editor/invoice/save/copy`

          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
            .then(res => res.json())
            .then(response => {
              if (response.error) throw new Error(response.error)
              callSuccess('Invoice saved successfully')
              this.editing = false
              this.editMode = ''
            })
            .catch(error => {
              console.error('Error saving invoice:', error)
              callError('Error saving invoice', error.message)
            })
        } catch (error) {
          console.error('Error in saveEdit():', error)
        }
      },

      //Totals
      calculateTotals() {
        const round = value => Alpine.store('price').roundToTwo(value)

        // Calculate subtotal (sum of item prices * quantity)
        let baseSubtotal = 0
        this.invoiceItems.invoiceItems.forEach(item => {
          baseSubtotal += item.price * item.quantity
        })

        // Store subtotal BEFORE discount (for frontend display)
        const subtotalPreDiscount = round(baseSubtotal)
        const vatBeforeDiscount = round(subtotalPreDiscount * 0.2)

        // --- Determine discount --- // discountRaw: Holds the discount percentage (if %) or fixed amount (if £)
        const discountType = this.invoiceItems.invoice.discount_type
        let discountRaw = this.invoiceItems.invoice.discount_value
        let discountAmount = 0
        // Calculate discount based on type
        if (discountType === 1) {
          discountAmount = round((baseSubtotal * discountRaw) / 100) // Percentage discount
        } else if (discountType === 0) {
          discountAmount = round(discountRaw) // Flat discount
        }
        if (discountAmount > baseSubtotal) {
          console.error(`Discount (${discountAmount}) exceeds subtotal (${baseSubtotal}). Removing discount.`)
          // Reset discount
          this.invoiceItems.invoice.discount_value = 0
          this.invoiceItems.invoice.discVal_ifPercent = 0

          discountRaw = 0
          discountAmount = 0
          callError('Discount exceeds subtotal', 'Resetting discount to 0.')
        }
        // --- Apply discount ---
        const subtotal = round(baseSubtotal - discountAmount)
        // VAT calculated on the discounted subtotal
        const vatAmount = round(subtotal * 0.2)
        // Final total after VAT
        const total = round(subtotal + vatAmount)
        // Total before discount (saved in DB, including VAT)
        const totalPreDiscount = round(subtotalPreDiscount + vatBeforeDiscount)

        // --- Deposit Calculation (for display only) ---
        const depositType = this.invoiceItems.invoice.deposit_type
        let depositRaw = this.invoiceItems.invoice.deposit_value
        let depositAmount = 0
        // Calculate deposit amount based on type
        if (depositType === 1) {
          depositAmount = round((total * depositRaw) / 100) // Percentage deposit
        } else if (depositType === 0) {
          depositAmount = round(depositRaw) // Flat deposit
        }
        if (depositAmount > total) {
          console.error(`Deposit (${depositAmount}) exceeds total (${total}). Resetting deposit to 0.`)
          this.invoiceItems.invoice.deposit_value = 0
          this.invoiceItems.invoice.depoVal_ifPercent = 0
          depositAmount = 0
          depositRaw = 0
          callError('Deposit exceeds total', 'Resetting deposit to 0.')
        }

        // --- Assign computed values back to invoice object ---
        this.invoiceItems.invoice = {
          ...this.invoiceItems.invoice, // Preserve other invoice fields

          subtotal_pre_discount: subtotalPreDiscount, // For frontend display
          total_pre_discount: totalPreDiscount, // Always correct, even when no discount
          subtotal, // Used for calculations
          vat: vatAmount, // Always 20% of discounted subtotal
          total, // Final total after VAT

          // Discount values
          discount_value: round(discountRaw),
          discVal_ifPercent: discountType === 1 ? discountAmount : 0,

          // Deposit values (for display, does NOT affect `total`)
          deposit_value: depositRaw,
          depoVal_ifPercent: depositType === 1 ? depositAmount : depositRaw,
        }

        console.log('invoice state after recalculation:', JSON.stringify(this.invoiceItems.invoice, null, 2))
      },
      // Add Custom Items
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

        // **Increment the custom item counter**
        this.customItemCounter += 1

        // Generate a **proper unique frontendId** for custom items
        const uniqueKey = `custom-${this.newItem.type}-${this.customItemCounter}`
        const newOriginId = -this.customItemCounter

        const newItem = {
          name: this.newItem.name.trim(),
          type: this.newItem.type,
          price: this.newItem.type === 'sample' ? this.newItem.price * this.newItem.time : this.newItem.price,
          time: this.newItem.type === 'sample' ? this.newItem.time : 0,
          quantity: Math.floor(this.newItem.quantity), //  Use entered quantity, not always 1
          origin_id: newOriginId, // Custom items don't have an existing ID in the database
          frontendId: uniqueKey, // Unique key for Alpine.js rendering
        }

        console.log('[addCustomItem] Adding new item:', newItem)
        this.invoiceItems.invoiceItems.push(newItem)

        // Reset form inputs after adding
        this.newItem = { type: '', name: '', price: null, quantity: null, time: null }

        this.calculateTotals()
      },

      // Dropdown add from existing items for client
      addDropdownItem(item) {
        console.log('[addDropdownItem] Adding item from dropdown:', item)
        if (!item.id || !item.type) {
          console.error('[addDropdownItem] Invalid item:', item)
          callError('Invalid item', 'Missing required fields (ID/Type).')
          return
        }

        // Generate **consistent unique key**
        const uniqueKey = `dropdown-${item.type}-${item.id}`

        // Check if an item of the same `type` + `origin_id` already exists in invoice
        const existingItem = this.invoiceItems.invoiceItems.find(
          invItem => invItem.origin_id === item.id && invItem.type === item.type,
        )

        if (existingItem) {
          console.log(`[addDropdownItem] Item already exists, increasing quantity.`)
          existingItem.quantity += 1
        } else {
          console.log(`[addDropdownItem] Item does not exist, adding new.`)

          // Validate sample items (require time)
          if (item.type === 'sample' && (!item.time || isNaN(item.time) || item.time <= 0)) {
            callError('Invalid Time', 'Samples require a valid time greater than 0.')
            return
          }

          // Create a new item entry with **structured unique frontendId**
          const newItem = {
            name: item.name,
            type: item.type,
            price: item.type === 'sample' ? item.price * item.time : item.price,
            time: item.type === 'sample' ? item.time : 0,
            quantity: 1,
            origin_id: item.id, // Compare dropdown items to `origin_id`
            frontendId: uniqueKey,
          }

          console.log('[addDropdownItem] Adding new dropdown item:', newItem)
          this.invoiceItems.invoiceItems.push(newItem)
        }

        // Reset dropdown quantity field
        const dropdownItem = this.existingItems.stylesAndSamples.find(x => x.frontendId === uniqueKey)
        if (dropdownItem) dropdownItem.quantity = 1

        this.calculateTotals()
      },

      async deleteInvoice(invoiceId) {
        if (!invoiceId) {
          callError('Unable to delete invoice', 'Refresh page and try again or call support.')
          return
        }
        if (this.editing) {
          callWarning('Cannot delete while editing', 'Complete edit and try again')
          return
        }
        if (confirm('This will delete invoice and its items. Proceed?')) {
          try {
            let res = await fetch(`/editor/invoice/delete/${invoiceId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
            })
            if (!res.ok) {
              throw new Error(`Error deleting invoice: ${res.statusText}`)
            }

            // Remove the deleted invoice from the local array $store.edit.showInvoiceItems
            this.invoiceBook = this.invoiceBook.filter(i => i.id !== invoiceId)
            this.showInvoiceItems = false
            this.invoiceItems = { invoiceItems: [] }
            this.activeItemId = null
            callInfo('Invoice deleted')
          } catch (error) {
            callError('Invoice does not exist', 'Refresh page and try again or call support.')
            console.error('Error deleting invoice', error)
          }
        }
      },
      getCustomIndex(item) {
        return this.invoiceItems.invoiceItems.filter(i => i.origin_id === null && i.type === item.type).indexOf(item)
      },

      // Editing: Item manipulation methods
      incrementInvoiceItem(uniqueKey) {
        const item = this.invoiceItems.invoiceItems.find(
          i => i.frontendId === uniqueKey || (i.origin_id === null && i.frontendId === uniqueKey),
        )
        if (item) {
          item.quantity += 1
          this.calculateTotals()
        }
      },
      decrementInvoiceItem(uniqueKey) {
        const item = this.invoiceItems.invoiceItems.find(
          i => i.frontendId === uniqueKey || (i.origin_id === null && i.frontendId === uniqueKey),
        )
        if (item) {
          if (item.quantity > 1) {
            item.quantity -= 1
          } else {
            this.removeInvoiceItem(uniqueKey)
            return // Because removeInvoiceItem() also calls calculateTotals()
          }
          this.calculateTotals()
        }
      },
      removeInvoiceItem(uniqueKey) {
        if (confirm('Remove this item?')) {
          this.invoiceItems.invoiceItems = this.invoiceItems.invoiceItems.filter(i => i.frontendId !== uniqueKey)
          this.calculateTotals()
        }
      },

      // Discount modal controls
      addDiscount() {
        const invoice = Alpine.store('edit').invoiceItems.invoice
        if (invoice.discount_value !== 0) {
          callWarning('Cannot change discount', 'Removed existing discount and try again.')
          return
        }
        if (invoice.discount_value > invoice.subtotal) {
          callError('Discount cannot exceed subtotal', 'Adjust amount and try again')
          return
        }
        invoice.discount_value = this.uiDiscount
        this.calculateTotals()
      },
      changeDiscountType() {
        const invoice = Alpine.store('edit').invoiceItems.invoice
        if (invoice.discount_value !== 0) {
          callWarning('Cannot change discount', 'Remove existing discount and try again.')
          return
        }
        let toggleDisc = invoice.discount_type === 1 ? 0 : 1
        invoice.discount_type = toggleDisc
      },
      removeDiscount() {
        this.invoiceItems.invoice.discount_value = 0
        this.invoiceItems.invoice.discVal_ifPercent = 0
        this.calculateTotals()
      },
      // Deposit modal controls
      addDeposit() {
        const invoice = Alpine.store('edit').invoiceItems.invoice
        if (invoice.deposit_value !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        invoice.deposit_value = this.uiDeposit
        this.uiDeposit = 0
        this.calculateTotals()
      },
      changeDepositType() {
        const invoice = Alpine.store('edit').invoiceItems.invoice
        if (invoice.deposit_value !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        let toggleDepo = invoice.deposit_type === 1 ? 0 : 1
        invoice.deposit_type = toggleDepo
      },
      removeDeposit() {
        this.invoiceItems.invoice.deposit_value = 0
        this.invoiceItems.invoice.depoVal_ifPercent = 0
        this.calculateTotals()
      },

      // Sync methods
      invoiceCreatedSync() {
        document.addEventListener('invoice-created', event => {
          const { clientId } = event.detail
          if (Alpine.store('clients').selectedClient?.id === clientId) {
            console.log('{ Edit Store } New invoice detected - refreshing list')
            this.invoiceBook = []
            this.page = 1
            this.hasMore = true
            this.fetchListById()
            this.getCopyInvoNames(invoiceId)
          }
        })
      },
      clientChangeSync() {
        document.addEventListener('client-selected', event => {
          const newClient = event.detail
          if (!newClient?.id) return

          console.log('{ Edit Store } Client changed - updating invoice list')

          this.invoiceBook = [] // Clear the invoice list
          this.page = 1 // Reset pagination
          this.hasMore = true // Allow fetching again
          this.showInvoiceItems = false // Hide invoice details
          this.activeItemId = null // Deselect any active invoice

          this.fetchListById() // Fetch new invoices
        })
      },
      watchTabSwitch() {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            console.log('{ Edit Store } Tab activated - refreshing invoices')
            this.invoiceBook = []
            this.page = 1
            this.hasMore = true
            this.fetchListById()
          }
        })
      },
    }),
  )
})
