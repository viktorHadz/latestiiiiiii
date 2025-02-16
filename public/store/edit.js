document.addEventListener('alpine:init', () => {
  Alpine.store(
    'edit',
    Alpine.reactive({
      // ==== 1. Invoice Book & Full Invoice Details ====
      invoiceBook: [],
      page: 1,
      hasMore: true,
      loading: false,
      activeClientId: null,
      activeItemId: null, // currently selected parent invoice ID
      invoiceItems: { invoiceItems: [] }, // full details for the selected parent invoice

      // Flags for parent invoice editing
      editing: false,
      editMode: '', // For now, use "editOverwrite" for full parent editing
      openEditModal: false, // flag to show the full parent edit modal
      initialValuesInvItems: {}, // deep–copy of invoice details for cancelEdit()
      customItemCounter: 0,

      // ==== 2. Copy Invoice Editing (via Modal) ====
      selectedCopy: {},
      showCopyModal: false,
      openCopyModal(copy) {
        // Open a modal to quickly update deposit/discount on a copy invoice
        this.selectedCopy = { ...copy }
        this.showCopyModal = true
      },
      uiDiscount: 0,
      modDisc: false,
      showXDisc: false,
      uiDeposit: 0,
      modDepo: false,
      showXDepo: false,

      async saveCopyEdit() {
        try {
          let res = await fetch(`/editor/invoice/copy/update/${this.selectedCopy.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deposit: this.selectedCopy.deposit,
              discount: this.selectedCopy.discount,
            }),
          })
          if (!res.ok) throw new Error('Failed to update copy invoice')
          // Update the corresponding copy in the parent invoice’s copies array
          let parentInvoice = this.invoiceBook.find(inv => inv.id === this.selectedCopy.original_invoice_id)
          if (parentInvoice && parentInvoice.copies) {
            let idx = parentInvoice.copies.findIndex(c => c.id === this.selectedCopy.id)
            if (idx !== -1) parentInvoice.copies[idx] = { ...this.selectedCopy }
          }
          this.showCopyModal = false
          callSuccess('Copy Invoice Updated')
        } catch (error) {
          console.error('Error saving copy edit:', error)
          callError('Failed to update invoice copy')
        }
      },

      // ==== 3. Items for Adding (Existing Items Dropdown & New Item Modal) ====
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

      newItem: {
        type: '',
        name: '',
        price: null,
        quantity: null,
        time: null,
      },

      // ==== 4. Utility Modals for Discounts & Deposits ====
      modDisc: false,
      showXDisc: false,
      uiDiscount: 0,
      modDepo: false,
      showXDepo: false,
      uiDeposit: 0,

      // ==== ALL METHODS ====
      async init() {
        console.log('{ Edit Store } Initialising')
        await this.fetchListById()
        this.clientChangeSync()
        this.invoiceCreatedSync()
        this.watchTabSwitch()
        console.log('{ Edit Store } ==> Initialised')
      },

      // --- Fetch Invoice List (parent invoices plus copies attached) ---
      async fetchListById() {
        if (this.loading || !this.hasMore) return
        this.loading = true
        try {
          const client = Alpine.store('clients').selectedClient
          if (!client?.id) return
          if (this.activeClientId !== client.id) {
            this.invoiceBook = []
            this.page = 1
            this.hasMore = true
            this.activeClientId = client.id
          }
          let res = await fetch(`/editor/list/${client.id}?page=${this.page}`)
          if (!res.ok) throw new Error(`Error fetching invoices: ${res.statusText}`)
          let data = await res.json()
          if (data.length === 0) {
            this.hasMore = false
          } else {
            const invoiceIds = data.map(item => item.id)
            if (invoiceIds.length > 0) {
              // Fetch copies summaries for these parent invoices
              let copyRes = await fetch(`/editor/invoice/copy/names?invoiceIds=${invoiceIds.join(',')}`)
              let copyData = await copyRes.json()
              if (!copyRes.ok) throw new Error(`Error fetching copied invoices: ${copyData.error}`)
              data.forEach(item => {
                if (!this.invoiceBook.some(existing => existing.id === item.id)) {
                  item.date = new Date(item.date).toLocaleDateString('en-GB')
                  // Attach copies (if any) to the parent invoice
                  item.copies = copyData[item.id] || []
                  item.expanded = false
                  this.invoiceBook.push(item)
                }
              })
            }
            this.page++
          }
        } catch (error) {
          console.error('Error fetching invoice list:', error)
        } finally {
          this.loading = false
        }
      },

      // --- Fetch Full Invoice Details for a Parent Invoice ---
      async fetchInvoice(invoiceId) {
        try {
          if (!invoiceId) {
            console.warn('No invoice ID provided. Resetting invoice state.')
            this.activeItemId = null
            this.showInvoiceItems = false
            this.invoiceItems = { invoiceItems: [] }
            return
          }
          if (!this.invoiceBook.some(inv => inv.id === invoiceId)) {
            console.warn(`Invoice ${invoiceId} not found in invoiceBook. Resetting UI.`)
            if (this.activeItemId === invoiceId) {
              this.activeItemId = null
              this.showInvoiceItems = false
              this.invoiceItems = { invoiceItems: [] }
            }
            return
          }
          if (this.editing) {
            callWarning('Cannot change while editing', 'Complete edit and try again')
            return
          }
          const response = await fetch(`/editor/invoice/${invoiceId}`)
          if (!response.ok) throw new Error(`Error fetching invoice: ${response.statusText}`)
          const data = await response.json()
          console.log('Fetched invoice data:', data)
          this.customItemCounter = 0
          const uniqueItems = []
          const seen = new Set()
          data.invoiceItems.forEach(item => {
            const uniqueKey = `non-edit-${item.type}-${item.origin_id}`
            if (!seen.has(uniqueKey)) {
              seen.add(uniqueKey)
              uniqueItems.push({ ...item, frontendId: uniqueKey })
            }
          })
          this.invoiceItems = { ...data, invoiceItems: uniqueItems }
          this.calculateTotals()
          this.showInvoiceItems = true
          this.activeItemId = invoiceId
          this.editing = false
        } catch (error) {
          console.error('Error fetching invoice:', error)
          callError('Error retrieving invoice', 'Try again or contact support.')
        }
      },

      // --- Open Full Parent Edit Modal ---
      async openParentEditModal() {
        if (!this.invoiceItems.invoice) {
          callWarning('No invoice loaded', 'Select an invoice first')
          return
        }
        await this.getExistingItems(this.activeClientId)
        // Store a deep copy for canceling edits
        this.initialValuesInvItems = JSON.parse(JSON.stringify(this.invoiceItems))
        this.editing = true
        this.editMode = 'editOverwrite'
        this.openEditModal = true
      },
      // --- Fetch existing items when modal opens ---
      async getExistingItems(selectedClientId) {
        try {
          const response = await fetch(`/editor/existing/items/${selectedClientId}`)
          if (!response.ok) {
            throw new Error(`Unable to get existing items. Server issue. Status: ${response.status}`)
          }
          const data = await response.json() // { styles: [...], samples: [...] }

          // Transform styles
          const transformedStyles = data.styles.map(item => ({
            id: item.id,
            name: item.name || 'Unnamed Style',
            price: parseFloat(item.price) || 0,
            time: 'N/A', // Styles don't have time
            quantity: 1, // Default quantity
            type: 'style',
          }))

          // Transform samples
          const transformedSamples = data.samples.map(item => ({
            id: item.id,
            name: item.name || 'Unnamed Sample',
            price: parseFloat(item.price) || 0,
            time: parseInt(item.time, 10) || 0, // Convert to number
            quantity: 1, // Default quantity
            type: 'sample',
          }))

          // Merge styles and samples
          const mergedItems = [...transformedStyles, ...transformedSamples]

          // Update state
          this.existingItems.searchQuery = ''
          this.existingItems.stylesAndSamples = mergedItems

          console.log('Existing stylesAndSamples:', this.existingItems.stylesAndSamples)
        } catch (error) {
          console.error('Error fetching existing items:', error)
        }
      },
      exitEditMode() {
        if (confirm('You are about to exit. Continue?')) {
          this.invoiceItems = JSON.parse(JSON.stringify(this.initialValuesInvItems))
          this.editing = false
          this.editMode = ''
          this.openEditModal = false
        } else {
          this.editing = true
          this.editMode = 'editOverwrite'
          this.openEditModal = true
        }
      },

      // --- Save Full Parent Edit ---
      async saveEdit(options = { mode: 'overwrite' }) {
        if (!this.invoiceItems.invoice) return
        const invoice = this.invoiceItems.invoice
        // Calculate deposit value by deposit type
        let depoVal =
          invoice.deposit_type === 1
            ? parseFloat(invoice.depoVal_ifPercent) || 0
            : parseFloat(invoice.deposit_value) || 0
        let remaining = invoice.total - depoVal
        // Prevent marking as "paid" if remaining > 0
        if (options.mode === 'paid' && remaining !== 0) {
          callError("Invoice total doesn't equal 0", 'Ensure remaining balance is 0 to mark invoice as paid.')
          console.error('Invoice total does not match the expected value when marked as paid.')
          return
        }
        if (!confirm('Are you sure you want to save this invoice?')) return
        try {
          // Build the data object from the current invoice state
          const data = {
            invoiceId: invoice.id,
            clientId: invoice.client_id,
            items: this.invoiceItems.invoiceItems.map(item => ({
              name: item.name,
              price: parseFloat(item.price),
              type: item.type,
              time: item.type === 'sample' ? parseFloat(item.time) : 0,
              invoice_id: invoice.id,
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
            note: invoice.note ? invoice.note.trim() : '',
            totalPreDiscount: invoice.total_pre_discount,
            date: invoice.date || new Date().toISOString().split('T')[0],
          }

          // --- Determine invoice status ---
          if (options.mode === 'copy') {
            data.invoice_status = 'partially paid' // Always mark as "partially paid" when copying
          } else if (remaining === 0) {
            data.invoice_status = 'paid' // Mark as paid only if remaining is 0
          } else if (depoVal > 0) {
            data.invoice_status = 'partially paid' // Deposit applied but balance remains
          } else {
            data.invoice_status = 'unpaid' // No deposit, still unpaid
          }

          // Choose the endpoint based on mode
          const endpoint = options.mode === 'overwrite' ? '/editor/invoice/save/overwrite' : '/editor/invoice/save/copy'

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const response = await res.json()
          if (response.error) {
            throw new Error(response.error)
          }
          callSuccess(
            options.mode === 'overwrite' ? 'Invoice updated successfully' : 'Invoice copy created successfully',
          )
          // Optionally update the invoiceBook with the latest invoice data
          let existingInvoice = this.invoiceBook.find(inv => inv.id === invoice.id)
          if (existingInvoice) {
            Object.assign(existingInvoice, invoice)
          }

          // Reset edit mode flags
          this.openEditModal = false
          this.editing = false
          this.editMode = ''
        } catch (error) {
          console.error('Error saving invoice:', error)
          callError('Error saving invoice', error.message)
        }
      },

      // --- Totals Calculation (as per original logic) ---
      calculateTotals() {
        const round = value => Alpine.store('price').roundToTwo(value)
        let baseSubtotal = 0
        this.invoiceItems.invoiceItems.forEach(item => {
          baseSubtotal += item.price * item.quantity
        })
        const subtotalPreDiscount = round(baseSubtotal)
        const vatBeforeDiscount = round(subtotalPreDiscount * 0.2)
        const discountType = this.invoiceItems.invoice.discount_type
        let discountRaw = this.invoiceItems.invoice.discount_value
        let discountAmount = 0
        if (discountType === 1) {
          discountAmount = round((baseSubtotal * discountRaw) / 100)
        } else if (discountType === 0) {
          discountAmount = round(discountRaw)
        }
        if (discountAmount > baseSubtotal) {
          console.error(`Discount (${discountAmount}) exceeds subtotal (${baseSubtotal}). Removing discount.`)
          this.invoiceItems.invoice.discount_value = 0
          this.invoiceItems.invoice.discVal_ifPercent = 0
          discountRaw = 0
          discountAmount = 0
          callError('Discount exceeds subtotal', 'Resetting discount to 0.')
        }
        const subtotal = round(baseSubtotal - discountAmount)
        const vatAmount = round(subtotal * 0.2)
        const total = round(subtotal + vatAmount)
        const totalPreDiscount = round(subtotalPreDiscount + vatBeforeDiscount)
        const depositType = this.invoiceItems.invoice.deposit_type
        let depositRaw = this.invoiceItems.invoice.deposit_value
        let depositAmount = 0
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
        const remaining = round(total - depositAmount)

        this.invoiceItems.invoice = {
          ...this.invoiceItems.invoice,
          subtotal_pre_discount: subtotalPreDiscount,
          total_pre_discount: totalPreDiscount,
          subtotal,
          vat: vatAmount,
          total,
          discount_value: round(discountRaw),
          discVal_ifPercent: discountType === 1 ? discountAmount : 0,
          deposit_value: depositRaw,
          depoVal_ifPercent: depositType === 1 ? depositAmount : depositRaw,
          remaining: remaining,
        }
        console.log('invoice state after recalculation:', JSON.stringify(this.invoiceItems.invoice, null, 2))
      },

      // --- Add Custom Item (choose style or sample) ---
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

        // For samples, calculate per-unit price as price * time (do not multiply by quantity)
        const computedPrice =
          this.newItem.type === 'sample' ? this.newItem.price * this.newItem.time : this.newItem.price

        const newItem = {
          name: this.newItem.name.trim(),
          type: this.newItem.type,
          price: computedPrice,
          time: this.newItem.type === 'sample' ? this.newItem.time : 0,
          quantity: Math.floor(this.newItem.quantity),
          origin_id: newOriginId,
          frontendId: uniqueKey,
        }

        console.log('[addCustomItem] Adding new item:', newItem)
        this.invoiceItems.invoiceItems.push(newItem)
        // Reset the new item form
        this.newItem = { type: '', name: '', price: null, quantity: null, time: null }
        this.calculateTotals()
      },

      // --- Add Item from Existing Items Dropdown ---
      addDropdownItem(item) {
        console.log('[addDropdownItem] Adding item from dropdown:', item)
        if (!item.id || !item.type) {
          console.error('[addDropdownItem] Invalid item:', item)
          callError('Invalid item', 'Missing required fields (ID/Type).')
          return
        }
        const uniqueKey = `dropdown-${item.type}-${item.id}`
        const existingItem = this.invoiceItems.invoiceItems.find(
          invItem => invItem.origin_id === item.id && invItem.type === item.type,
        )
        if (existingItem) {
          console.log('[addDropdownItem] Item already exists, increasing quantity.')
          existingItem.quantity += 1
        } else {
          console.log('[addDropdownItem] Item does not exist, adding new.')
          if (item.type === 'sample' && (!item.time || isNaN(item.time) || item.time <= 0)) {
            callError('Invalid Time', 'Samples require a valid time greater than 0.')
            return
          }
          const newItem = {
            name: item.name,
            type: item.type,
            price: item.type === 'sample' ? item.price * item.time : item.price,
            time: item.type === 'sample' ? item.time : 0,
            quantity: 1,
            origin_id: item.id,
            frontendId: uniqueKey,
          }
          console.log('[addDropdownItem] Adding new dropdown item:', newItem)
          this.invoiceItems.invoiceItems.push(newItem)
        }
        const dropdownItem = this.existingItems.stylesAndSamples.find(x => x.frontEndId === uniqueKey)
        if (dropdownItem) dropdownItem.quantity = 1
        this.calculateTotals()
      },

      // --- Delete Invoice ---
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
            if (!res.ok) throw new Error(`Error deleting invoice: ${res.statusText}`)
            if (this.activeItemId === invoiceId) {
              this.activeItemId = null
              this.showInvoiceItems = false
              this.invoiceItems = { invoiceItems: [] }
            }
            this.invoiceBook = this.invoiceBook.filter(i => i.id !== invoiceId)
            callInfo('Invoice deleted')
          } catch (error) {
            callError('Invoice does not exist', 'Refresh page and try again or call support.')
            console.error('Error deleting invoice', error)
          }
        }
      },

      // --- Editing: Item Manipulation Methods ---
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
            return // removeInvoiceItem() calls calculateTotals()
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
      // --- Discount Functions ---
      addDiscount() {
        const invoice = this.invoiceItems.invoice
        if (invoice.discount_value !== 0) {
          callWarning('Cannot change discount', 'Remove existing discount and try again.')
          return
        }
        // If the discount amount (uiDiscount) exceeds subtotal, warn and abort.
        if (this.uiDiscount > invoice.subtotal) {
          callError('Discount cannot exceed subtotal', 'Adjust amount and try again.')
          return
        }
        invoice.discount_value = this.uiDiscount
        this.calculateTotals()
      },
      changeDiscountType() {
        const invoice = this.invoiceItems.invoice
        if (invoice.discount_value !== 0) {
          callWarning('Cannot change discount', 'Remove existing discount and try again.')
          return
        }
        invoice.discount_type = invoice.discount_type === 1 ? 0 : 1
      },
      removeDiscount() {
        this.invoiceItems.invoice.discount_value = 0
        this.invoiceItems.invoice.discVal_ifPercent = 0
        this.calculateTotals()
      },

      // --- Deposit Functions ---
      addDeposit() {
        const invoice = this.invoiceItems.invoice
        if (invoice.deposit_value !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        invoice.deposit_value = this.uiDeposit
        this.uiDeposit = 0
        this.calculateTotals()
      },
      changeDepositType() {
        const invoice = this.invoiceItems.invoice
        if (invoice.deposit_value !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        invoice.deposit_type = invoice.deposit_type === 1 ? 0 : 1
      },
      removeDeposit() {
        this.invoiceItems.invoice.deposit_value = 0
        this.invoiceItems.invoice.depoVal_ifPercent = 0
        this.calculateTotals()
      },

      // --- Sync Methods ---
      invoiceCreatedSync() {
        document.addEventListener('invoice-created', event => {
          const { clientId } = event.detail
          if (Alpine.store('clients').selectedClient?.id === clientId) {
            console.log('{ Edit Store } New invoice detected - fetching latest invoice')
            fetch(`/editor/list/${clientId}?page=1&limit=1`)
              .then(res => res.json())
              .then(data => {
                if (data.length > 0) {
                  const latestInvoice = data[0]
                  const exists = this.invoiceBook.some(inv => inv.id === latestInvoice.id)
                  if (!exists) {
                    this.invoiceBook.unshift(latestInvoice)
                  }
                }
              })
              .catch(error => console.error('Error fetching latest invoice:', error))
          } else {
            console.log('{ Edit Store } Invoice created for different client - resetting store')
            this.invoiceBook = []
            this.page = 1
            this.hasMore = true
            this.fetchListById()
          }
        })
      },
      clientChangeSync() {
        document.addEventListener('client-selected', event => {
          const newClient = event.detail
          if (!newClient?.id) return
          console.log('{ Edit Store } Client changed - updating invoice list')
          this.invoiceBook = []
          this.page = 1
          this.hasMore = true
          this.showInvoiceItems = false
          this.activeItemId = null
          this.fetchListById()
        })
      },
      watchTabSwitch() {
        if (this.editing) {
          document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
              console.log('{ Edit Store } Tab activated - refreshing invoices')
              this.invoiceBook = []
              this.page = 1
              this.hasMore = true
              this.fetchListById()
            }
          })
        }
      },
      getCustomIndex(item) {
        return this.invoiceItems.invoiceItems.filter(i => i.origin_id === null && i.type === item.type).indexOf(item)
      },
    }),
  )
})
