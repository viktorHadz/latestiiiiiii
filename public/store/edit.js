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

      // Note
      modNote: false,
      viewNote: false,
      uiNote: '',

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

      /*
      1. fetches client 
      2. checks it and if its okay 
      3. fetches llist of parent invoices and checks them if okay -->   
      4. creates !!DATA!! = all iinvoices for this page
      5. We map over invoiceIds and if thy are more than 0 --> copyRes if ok --> copyData
      6.  we fetch 2 copies invoiceBook.[invoiceId].copiedInvoices and invoiceBook.invoiceId.copies 
     
     
     */
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
          const data = await response.json()

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
      // --- Save Full Parent Edit ---
      saveEdit({ mode } = { mode: 'overwrite' }) {
        if (!confirm('Are you sure you want to save this invoice?')) return
        const invoice = this.invoiceItems.invoice
        const data = {
          invoiceId: invoice.id,
          clientId: invoice.client_id,
          items: this.invoiceItems.invoiceItems.map(item => ({
            name: item.name,
            price: item.price, // unit price stored as is
            type: item.type,
            time: item.type === 'sample' ? item.time : 0,
            invoice_id: invoice.id,
            quantity: parseInt(item.quantity, 10),
            // The total is computed in calculateTotals so you could recalc here or let the backend recalc
            total_item_price:
              item.type === 'sample' ? item.price * (item.time / 60) * item.quantity : item.price * item.quantity,
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
          date: invoice.date || new Date().toLocaleDateString('en-GB'),
        }

        // Choose endpoint based on mode option
        const endpoint = mode === 'overwrite' ? `/editor/invoice/save/overwrite` : `/editor/invoice/save/copy`
        const statusUpdate = fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
          .then(res => res.json())
          .then(response => {
            if (response.error) throw new Error(response.error)
            if (mode === 'overwrite') {
              callSuccess('Invoice updated successfully')
            } else {
              callSuccess('Invoice copy saved successfully')
            }
            // Update local invoiceBook if needed
            let existingInvoice = this.invoiceBook.find(inv => inv.id === invoice.id)
            if (existingInvoice) {
              Object.assign(existingInvoice, invoice)
            }
            this.openEditModal = false
            this.editing = false
            this.editMode = ''
          })
          .catch(error => {
            console.error('Error saving invoice:', error)
            callError('Error saving invoice', error.message)
          })
      },

      // --- Totals Calculation (as per original logic) ---
      calculateTotals() {
        const round = value => Alpine.store('price').roundToTwo(value)
        let baseSubtotal = 0
        this.invoiceItems.invoiceItems.forEach(item => {
          let lineTotal = 0
          if (item.type === 'sample') {
            // For samples, convert minutes to hours: (time/60) * unit price * quantity
            lineTotal = item.price * (item.time / 60) * item.quantity
          } else {
            // For styles, multiply unit price by quantity
            lineTotal = item.price * item.quantity
          }
          baseSubtotal += lineTotal
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
          depositAmount = round((total * depositRaw) / 100)
        } else if (depositType === 0) {
          depositAmount = round(depositRaw)
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
        // Use the quantity input provided by the user (defaulting to 1)
        const quantity = item.quantity || 1
        if (existingItem) {
          console.log('[addDropdownItem] Item already exists, increasing quantity.')
          existingItem.quantity += quantity
        } else {
          if (item.type === 'sample' && (!item.time || isNaN(item.time) || item.time <= 0)) {
            callError('Invalid Time', 'Samples require a valid time greater than 0.')
            return
          }
          const newItem = {
            name: item.name,
            type: item.type,
            price: item.price, // store unit price (hourly rate for samples or fixed price for styles)
            time: item.type === 'sample' ? item.time : 0,
            quantity: quantity,
            origin_id: item.id,
            frontendId: uniqueKey,
          }
          console.log('[addDropdownItem] Adding new dropdown item:', newItem)
          this.invoiceItems.invoiceItems.push(newItem)
        }
        // Optionally reset the dropdown’s quantity to 1
        const dropdownItem = this.existingItems.stylesAndSamples.find(x => x.frontEndId === uniqueKey)
        if (dropdownItem) dropdownItem.quantity = 1
        this.calculateTotals()
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

        // For samples, we store the hourly rate and time separately.
        // For styles, we simply store the price.
        const unitPrice = this.newItem.price
        const newItem = {
          name: this.newItem.name.trim(),
          type: this.newItem.type,
          price: unitPrice, // store unit price (i.e. hourly rate for samples)
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
      addNote() {
        if ($store.edit.invoiceItems.invoice.note.length) {
          callWarning('Note already exists', 'Remove existing note and try again')
          return
        }
        $store.edit.invoiceItems.invoice.note = this.uiNote.trim()
        this.uiNote = ''
        this.modNote = false
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
