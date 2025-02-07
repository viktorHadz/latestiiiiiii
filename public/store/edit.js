document.addEventListener('alpine:init', () => {
  Alpine.store(
    'edit',
    Alpine.reactive({
      // ===== State =====
      activeInvoiceFromList: null,
      editing: false,
      editMode: '',
      openEditModal: false,
      showInvoiceItems: false,
      // Holds the complete invoice data including invoice details and its items.
      invoiceItems: { invoiceItems: [] },
      initialValuesInvItems: {},
      // InvoiceBook items
      listItems: [],
      page: 1,
      hasMore: true,
      loading: false,

      edited: false,

      // Allowed (existing) items available for adding (styles and samples)
      existingItems: {
        showItemModal: false,
        openDropdown: false,
        combinedItems: [],
        filteredItems: [],
        searchQuery: '',
      },
      editingPrice: '',
      editingPriceValue: 0,

      newItem: {
        type: '',
        name: '',
        price: null,
        quantity: null,
        time: null,
      },

      // ===== Methods =====
      async init() {
        console.log('{ Edit Store } Initialising')
        await this.fetchListById()
        console.log('{ Edit Store } ==> Initialised')
      },
      async fetchStylesAndSamples(clientId) {
        if (!clientId) return
        try {
          const [stylesResponse, samplesResponse] = await Promise.all([
            fetch(`/item/styles/client/${clientId}`),
            fetch(`/item/samples/client/${clientId}`),
          ])

          const styles = await stylesResponse.json()
          const samples = await samplesResponse.json()

          const preInsertStyles = styles.map(style => ({
            ...style,
            type: 'style',
            frontEndId: `style-${style.id}`,
            quantity: 1,
            time: 'N/A',
          }))

          const preInsertSamples = samples.map(sample => ({
            ...sample,
            type: 'sample',
            frontEndId: `sample-${sample.id}`,
            quantity: 1,
          }))

          this.existingItems.combinedItems = [...preInsertStyles, ...preInsertSamples]
          this.existingItems.filteredItems = [...this.existingItems.combinedItems]
        } catch (error) {
          console.error('Error fetching styles/samples:', error)
          callError('Error retrieving items', 'Please restart the program, try again or call support.')
        }
      },
      async fetchInvoice(invoiceId) {
        try {
          const client = Alpine.store('clients').selectedClient
          if (!client?.id || !invoiceId) return
          if (this.editing) {
            callWarning('Cannot change while editing', 'Complete edit and try again')
            return
          }
          // Fetch the invoice
          const res = await fetch(`/editor/invoice/${client.id}/${invoiceId}`)
          if (!res.ok) throw new Error(`Error fetching invoice: ${res.statusText}`)
          const data = await res.json()

          console.log('Fetched invoice data:', data)

          // Normalize invoice items:
          const invoiceItems = (data.invoiceItems || []).map(item => {
            item.refId = item.refId || item.id
            item.frontEndId = `${item.type}-${item.refId}`
            return item
          })

          this.invoiceItems = { ...data, invoiceItems }

          // Ensure styles and samples are available
          if (!data.existingStyles || !data.existingSamples) {
            await this.fetchStylesAndSamples(client.id)
          }

          // Process allowed items (styles and samples)
          const styles = data.existingStyles || this.existingItems.combinedItems.filter(i => i.type === 'style')
          const samples = data.existingSamples || this.existingItems.combinedItems.filter(i => i.type === 'sample')

          const combined = [
            ...styles.map(style => ({
              ...style,
              type: 'style',
              frontEndId: `style-${style.id}`,
              quantity: 1,
              time: 'N/A',
            })),
            ...samples.map(sample => ({
              ...sample,
              type: 'sample',
              frontEndId: `sample-${sample.id}`,
              quantity: 1,
            })),
          ]

          this.existingItems.combinedItems = combined
          this.existingItems.filteredItems = [...combined]

          this.showInvoiceItems = true
          this.activeItemId = invoiceId
          this.editing = false
        } catch (error) {
          console.error('Error fetching invoice:', error)
        }
      },
      // Called in pdfStore so that invoicesbook always holds latest invoice list
      // Fetch invoice book list
      async fetchListById() {
        if (this.loading || !this.hasMore) return // Prevent spam clicks
        this.loading = true

        try {
          const client = Alpine.store('clients').selectedClient
          if (!client?.id) return

          let res = await fetch(`/editor/list/${client.id}?page=${this.page}`)
          if (!res.ok) throw new Error(`Error fetching invoices: ${res.statusText}`)

          let data = await res.json()

          if (data.length === 0) {
            this.hasMore = false // No more invoices
          } else {
            data.forEach(item => {
              if (!this.listItems.some(existing => existing.id === item.id)) {
                this.listItems.push(item)
              }
            })

            this.page++
            console.log(`invoice page ==> ${this.page}`)
            console.log(`InvoiceBookItems ==> ${this.listItems}`)
          }
        } catch (error) {
          console.error('Error fetching invoice list items:', error)
        } finally {
          this.loading = false
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

          // Find and update the local invoice in listItems
          let invoice = this.listItems.find(i => i.id === invoiceId)
          if (invoice) {
            invoice.invoice_status = data.newStatus
          }

          console.log(`Invoice ${invoiceId} marked as ${data.newStatus}`)
        } catch (error) {
          console.error('Error updating invoice status:', error)
        }
      },

      // Event listener for loading more invoices when the scroll container nears the bottom
      attachScrollListener() {
        // Attach event to the scrollable div only
        const scrollContainer = document.querySelector('.invoice-book-scroll')
        if (!scrollContainer) return

        scrollContainer.addEventListener('scroll', () => {
          if (this.loading || !this.hasMore) return // Prevent multiple calls

          const nearBottom =
            scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 10

          if (nearBottom) {
            this.fetchListById()
          }
        })
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
        try {
          let res = await fetch(`/editor/invoice/delete/${invoiceId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) {
            throw new Error(`Error deleting invoice: ${res.statusText}`)
          }

          // Remove the deleted invoice from the local array $store.edit.showInvoiceItems
          this.listItems = this.listItems.filter(i => i.id !== invoiceId)
          this.showInvoiceItems = false
          this.invoiceItems = { invoiceItems: [] }
          this.activeItemId = null
          callInfo('Invoice deleted')
        } catch (error) {
          callError('Invoice does not exist', 'Refresh page and try again or call support.')
          console.error('Error deleting invoice', error)
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
            this.invoiceItems = JSON.parse(JSON.stringify(this.initialValuesInvItems))
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
        if (!confirm('Saving edits cannot be undone. Proceed?')) return
        try {
          const data = {
            clientId: this.invoiceItems.client?.id,
            clientName: this.invoiceItems.client?.name,
            invoiceNumber: this.invoiceItems.invoice.invoice_number,
            editType: this.editMode,
          }
          // (Send data to backend here.)
          this.editing = false
          this.editMode = ''
        } catch (error) {
          console.error('Error saving edit:', error)
        }
      },

      savePrice(forWhich, whatValue) {
        if (this.invoiceItems?.invoice && forWhich in this.invoiceItems.invoice) {
          this.invoiceItems.invoice[forWhich] = whatValue
        }
        this.editingPrice = ''
      },

      addCustomItem() {
        console.log('[addCustomItem] Adding a new custom item.')

        // Validation
        if (!this.newItem.name || this.newItem.name.trim() === '') {
          callWarning('Missing Name', 'Please enter a name for the item.')
          return
        }
        if (!this.newItem.price || isNaN(this.newItem.price) || this.newItem.price <= 0) {
          callWarning('Invalid Price', 'Price must be a positive number.')
          return
        }
        if (!this.newItem.quantity || isNaN(this.newItem.quantity) || this.newItem.quantity < 1) {
          callWarning('Invalid Quantity', 'Quantity must be at least 1.')
          return
        }
        if (
          this.newItem.type === 'sample' &&
          (!this.newItem.time || isNaN(this.newItem.time) || this.newItem.time <= 0)
        ) {
          callWarning('Invalid Time', 'Samples require a valid time greater than 0.')
          return
        }

        // Helper function to round to two decimals
        const roundToTwo = value => Alpine.store('price').roundToTwo(value)

        // Generate unique ID for custom items
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 1000)
        const originId = `${this.newItem.type}-custom-${timestamp}${random}`

        const uniqueKey = `${this.newItem.type}-${originId}`
        console.log(`[addCustomItem] Generated uniqueKey: ${uniqueKey}`)

        const newItem = {
          name: this.newItem.name.trim(),
          type: this.newItem.type || 'style',
          origin_id: originId,
          price: roundToTwo(this.newItem.price),
          time: this.newItem.type === 'sample' ? roundToTwo(this.newItem.time) : 0,
          quantity: Math.floor(this.newItem.quantity), // Ensure it's an integer
          frontEndId: uniqueKey,
        }

        console.log('[addCustomItem] Adding new item:', newItem)

        this.invoiceItems.invoiceItems.push(newItem)

        // Clear the form after adding a custom item
        this.newItem = { type: '', name: '', price: null, quantity: null, time: null }
        this.calculateTotals()
        callSuccess('Custom item added.')
      },

      addDropdownItem(item) {
        console.log('[addDropdownItem] Adding item from dropdown:', item)

        if (!item.id) {
          callError('Invalid item', 'The selected item is missing an ID.')
          return
        }

        const originId = item.id // Match using DB ID
        console.log(`[addDropdownItem] Checking for existing item with origin_id: ${originId}`)

        // Ensure `invoiceItems.invoiceItems` is initialized
        if (!this.invoiceItems.invoiceItems) {
          this.invoiceItems.invoiceItems = []
        }

        // Check if the item already exists in the invoice (match by origin_id)
        const existingIndex = this.invoiceItems.invoiceItems.findIndex(i => i.origin_id === originId)

        if (existingIndex > -1) {
          console.log(`[addDropdownItem] Item already exists (origin_id: ${originId}), increasing quantity.`)
          this.invoiceItems.invoiceItems[existingIndex].quantity += 1
        } else {
          console.log(`[addDropdownItem] Item does not exist, adding new.`)

          // Ensure price and time are rounded properly
          const roundedPrice = Alpine.store('price').roundToTwo(item.price || 0)
          const roundedTime = item.type === 'sample' ? Alpine.store('price').roundToTwo(item.time || 0) : 0

          // Create a new item entry
          const newItem = {
            name: item.name,
            type: item.type || 'style',
            origin_id: originId, // Ensuring unique matching by DB ID
            price: item.type === 'sample' ? roundedPrice * roundedTime : roundedPrice,
            time: roundedTime,
            quantity: 1,
            frontEndId: `${item.type}-${originId}`, // Used for UI tracking, but not matching logic
          }

          console.log('[addDropdownItem] Adding new dropdown item:', newItem)
          this.invoiceItems.invoiceItems.push(newItem)
        }

        // Reset quantity in dropdown selection
        const dropdownIndex = this.existingItems.combinedItems.findIndex(x => x.id === item.id && x.type === item.type)
        if (dropdownIndex > -1) {
          this.existingItems.combinedItems[dropdownIndex].quantity = 1
        }
        this.calculateTotals()
        callSuccess('Item added from dropdown.')
      },
      calculateTotals() {
        // (A) Sum line items ignoring discount
        let baseSubtotal = 0
        if (this.invoiceItems.invoiceItems?.length) {
          this.invoiceItems.invoiceItems.forEach(item => {
            // If “sample” items needed special handling (price*time), do it here.
            // If item.price is already set up, just do price * quantity:
            baseSubtotal += item.price * (item.quantity || 1)
          })
        }

        // (B) Determine discount type & raw discount value
        //     discount_type might be 0 = no discount, 1 = flat, 2 = percent
        //     (Adjust to match how your code sets discount_type.)
        const discountType = parseInt(this.invoiceItems.invoice.discount_type ?? 0, 10)
        const discountRaw = parseFloat(this.invoiceItems.invoice.discount_value ?? 0) || 0

        let discountAmount = 0
        if (discountType !== 0 && discountRaw > 0) {
          if (discountType === 2) {
            // 2 => percentage discount, e.g. 10 => 10%
            discountAmount = (baseSubtotal * discountRaw) / 100
          } else {
            // 1 => flat discount
            discountAmount = discountRaw
          }
          // Optional: clamp discount if it exceeds subtotal
          if (discountAmount > baseSubtotal) {
            discountAmount = baseSubtotal
          }
        }

        // (C) discountedSubtotal = baseSubtotal - discountAmount
        const discountedSubtotal = baseSubtotal - discountAmount

        // (D) Calculate VAT from vat_percent on discountedSubtotal
        //     e.g. if vat_percent=20 => 20% => we do (20 / 100)
        const vatPercent = parseFloat(this.invoiceItems.invoice.vat_percent ?? 0) || 0
        const vatAmount = discountedSubtotal * (vatPercent / 100)

        // (E) Final total = discountedSubtotal + VAT
        const finalTotal = discountedSubtotal + vatAmount

        // (F) Round if needed (you already have a rounding function in Alpine.store('price'))
        const round = value => Alpine.store('price').roundToTwo(value)

        // (G) Assign computed values back to the invoice object
        this.invoiceItems.invoice.total_pre_discount = round(baseSubtotal) // base sum, no discount
        this.invoiceItems.invoice.discount_amount = round(discountAmount) // how much discount was applied
        this.invoiceItems.invoice.subtotal = round(discountedSubtotal) // post-discount, pre-VAT
        this.invoiceItems.invoice.vat = round(vatAmount) // numeric VAT
        this.invoiceItems.invoice.total = round(finalTotal) // final invoice total
      },

      // =================== EXAMPLES OF CALLING IT ===================
      incrementInvoiceItem(uniqueKey) {
        const item = this.invoiceItems.invoiceItems.find(i => i.frontEndId === uniqueKey)
        if (item) {
          item.quantity += 1
          this.calculateTotals()
        }
      },
      decrementInvoiceItem(uniqueKey) {
        const item = this.invoiceItems.invoiceItems.find(i => i.frontEndId === uniqueKey)
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
          this.invoiceItems.invoiceItems = this.invoiceItems.invoiceItems.filter(i => i.frontEndId !== uniqueKey)
          this.calculateTotals()
        }
      },
      // Filter Items
      searchItems() {
        const query = this.existingItems.searchQuery.toLowerCase()
        this.existingItems.filteredItems = this.existingItems.combinedItems.filter(item =>
          item.name.toLowerCase().includes(query),
        )
      },
    }),
  )
})
