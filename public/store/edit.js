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
      activeItemId: null, // currently selected parent invoice ID
      invoiceItems: { invoiceItems: [] }, // full details for the selected parent invoice

      // Flags for parent invoice editing
      editing: false,
      editMode: '',
      openEditModal: false,
      initialValuesInvItems: {},
      customItemCounter: 0,

      // Note
      modNote: false,
      viewNote: false,
      uiNote: '',

      // ==== 2. Copy Invoice Editing (via Modal) ====
      selectedCopy: {},
      copyInitialValues: {},
      tempValues: {},
      showCopyModal: false,
      // Open copy modal and back up original values for cancellation
      async openCopyModal(copy) {
        await this.fetchCopyInvoice(copy.id)
        this.copyInitialValues = JSON.parse(JSON.stringify(this.selectedCopy))
        this.showCopyModal = true
      },

      // Revert changes and close the copy modal.
      cancelCopyEdit() {
        this.selectedCopy = JSON.parse(JSON.stringify(this.copyInitialValues))
        this.showCopyModal = false
        this.copyInitialValues = {}
      },

      //Disc/Depo
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
      // ==== ALL METHODS ====
      async init() {
        console.log('{ Edit Store } Initialising')
        // Reactive effect for client changes.
        this.clientChangeEffect()
        await this.fetchListById()
        console.log('{ Edit Store } ==> Initialised')
      },
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
              item.date = new Date(item.date).toLocaleDateString('en-GB')
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
          // Optionally, when going back, reset hasMore to true.
          this.hasMore = true
          await this.fetchListById()
          this.loadPrev = false
        }
      },

      resetInvoicePagination(clientId) {
        this.invoiceBook = []
        this.currentPage = 1
        this.hasMore = true
        this.totalPages = null
        this.activeClientId = clientId
        this.activeItemId = null
        this.showInvoiceItems = false
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
      // Fetch individual copy invoice details
      async fetchCopyInvoice(copyInvoiceId) {
        try {
          if (!copyInvoiceId) {
            console.warn('No copy invoice ID provided.')
            this.selectedCopy = { invoiceItems: [] }
            return
          }

          const response = await fetch(`/editor/invoice/copy/${copyInvoiceId}`)
          if (!response.ok) throw new Error(response.statusText)
          const data = await response.json()

          // Ensure uniqueness for invoiceItems.
          const uniqueItems = []
          const seen = new Set()
          data.invoice.invoiceItems.forEach(item => {
            const key = `copy-${item.type}-${item.origin_id}`
            if (!seen.has(key)) {
              seen.add(key)
              uniqueItems.push({ ...item, frontendId: key })
            }
          })
          this.selectedCopy = { ...data.invoice, invoiceItems: uniqueItems }
          // Initial values for copies
          this.showCopyModal = true
          this.copyInitialValues = JSON.parse(JSON.stringify(this.selectedCopy))
        } catch (error) {
          console.error('Error fetching copy invoice:', error)
          callError('Error retrieving copy invoice', 'Try again or contact support.')
        }
      },
      // --- Open Edit Modal ---
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

      // ====== SAVING ======
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
      saveEdit({ mode } = { mode: 'overwrite' }) {
        if (!confirm('Are you sure you want to save this invoice?')) return
        if (this.invoiceItems.invoice.deposit_value <= 0 && mode === 'copy') {
          callInfo('Cannot save a copy', 'Attached invoices must have a deposit')
          return
        }
        const invoice = this.invoiceItems.invoice
        const data = {
          invoiceId: invoice.id,
          clientId: invoice.client_id,
          items: this.invoiceItems.invoiceItems.map(item => ({
            name: item.name,
            price: item.price,
            type: item.type,
            time: item.type === 'sample' ? item.time : 0,
            invoice_id: invoice.id,
            quantity: parseInt(item.quantity, 10),
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

        const endpoint = mode === 'overwrite' ? `/editor/invoice/save/overwrite` : `/editor/invoice/save/copy`
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
          .then(res => res.json())
          .then(async response => {
            if (response.error) throw new Error(response.error)
            if (mode === 'overwrite') {
              callSuccess('Invoice updated successfully')
            } else if (mode === 'copy') {
              callSuccess('Invoice copy saved successfully')
            }
            // Update the current invoice in invoiceBook.
            let existingInvoice = this.invoiceBook.find(inv => inv.id === invoice.id)
            if (existingInvoice) {
              Object.assign(existingInvoice, invoice)
            }
            // Refresh the copies (children) for this invoice.
            await this.refreshInvoiceCopies(invoice.id)
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
        this.invoiceItems.invoiceItems.push(newItem)
        this.newItem = { type: '', name: '', price: null, quantity: null, time: null }
        this.calculateTotals()
      },

      // --- DELETE ---
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
            const endpoint = copy ? '/editor/invoice/copy/delete/' : '/editor/invoice/delete/'
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
        const item = this.invoiceItems.invoiceItems.find(i => i.frontendId === uniqueKey)
        if (item) {
          item.quantity += 1
          this.calculateTotals()
        }
      },
      decrementInvoiceItem(uniqueKey) {
        const item = this.invoiceItems.invoiceItems.find(i => i.frontendId === uniqueKey)
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
      removeInvoiceItem(uniqueKey) {
        if (confirm('Remove this item?')) {
          this.invoiceItems.invoiceItems = this.invoiceItems.invoiceItems.filter(i => i.frontendId !== uniqueKey)
          this.calculateTotals()
        }
      },

      // --- Discount Functions ---
      addDiscount() {
        const invoice = isCopy ? this.selectedCopy : this.invoiceItems.invoice
        if (invoice.discount_value !== 0) {
          callWarning('Cannot change discount', 'Remove existing discount and try again.')
          return
        }
        if (this.uiDiscount > invoice.subtotal) {
          callError('Discount cannot exceed subtotal', 'Adjust amount and try again.')
          return
        }
        invoice.discount_value = this.uiDiscount
        this.calculateTotals()
      },
      changeDiscountType(isCopy = false) {
        const invoice = isCopy ? this.selectedCopy : this.invoiceItems.invoice
        if (invoice.discount_value !== 0) {
          callWarning('Cannot change discount', 'Remove existing discount and try again.')
          return
        }
        invoice.discount_type = invoice.discount_type === 1 ? 0 : 1
      },
      removeDiscount(isCopy = false) {
        const invoice = isCopy ? this.selectedCopy : this.invoiceItems.invoice
        invoice.discount_value = 0
        invoice.discVal_ifPercent = 0
        this.calculateTotals()
      },

      // --- Deposit Functions ---
      addDeposit(isCopy = false) {
        const invoice = isCopy ? this.selectedCopy : this.invoiceItems.invoice
        if (invoice.deposit_value !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        invoice.deposit_value = this.uiDeposit
        this.uiDeposit = 0
        this.calculateTotals()
      },
      changeDepositType(isCopy = false) {
        const invoice = isCopy ? this.selectedCopy : this.invoiceItems.invoice
        if (invoice.deposit_value !== 0) {
          callWarning('Cannot change deposit', 'Remove existing deposit and try again.')
          return
        }
        invoice.deposit_type = invoice.deposit_type === 1 ? 0 : 1
        if (isCopy) {
          const svgElem = document.getElementById('change-deposit-type-copy')
          if (svgElem) {
            svgElem.classList.remove('animate-spin-once')
            void svgElem.offsetWidth
            svgElem.classList.add('animate-spin-once')
          }
        }
      },
      removeDeposit(isCopy = false) {
        const invoice = isCopy ? this.selectedCopy : this.invoiceItems.invoice

        invoice.deposit_value = 0
        invoice.depoVal_ifPercent = 0
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
    }),
  )
})
