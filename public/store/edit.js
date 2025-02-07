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

      addNewItem(item) {
        // If it's an existing style/sample, item.id is a real ID (e.g. 1,2,3,...).
        // If user typed a brand-new item, item.id is undefined => generate unique ID from timestamp.
        if (typeof item.id === 'undefined') {
          // e.g., "1685632351234" + random 3-digit => "1685632351234512"
          const timestamp = Date.now() // Milliseconds
          const random3 = Math.floor(Math.random() * 1000) // 0..999
          item.id = Number(`${timestamp}${random3}`) // convert string -> number
        }

        const originId = item.id
        const itemType = item.type || 'style'
        const qty = Number(item.quantity) >= 1 ? Number(item.quantity) : 1

        if (!this.invoiceItems.invoiceItems) {
          this.invoiceItems.invoiceItems = []
        }

        // Check if an item with (type, origin_id) is already present
        const existingIndex = this.invoiceItems.invoiceItems.findIndex(
          i => i.type === itemType && i.origin_id === originId,
        )

        // frontEndId for internal UI tracking
        const uniqueKey = `${itemType}-${originId}`
        console.log('Dropdown uniqueKey:', uniqueKey)
        console.log(
          'Current invoice item keys:',
          this.invoiceItems.invoiceItems.map(i => i.frontEndId),
        )
        console.log('invoiceItems Obj with Arr: ', this.invoiceItems)

        if (existingIndex > -1) {
          // Already in the invoice -> increment quantity
          this.invoiceItems.invoiceItems[existingIndex].quantity += qty
          console.log('Incremented quantity for item:', uniqueKey)
        } else {
          // Brand-new item
          const newItem = {
            name: item.name || 'Custom Item',
            type: itemType,
            origin_id: originId, // guaranteed non-null
            price: itemType === 'sample' ? parseFloat(item.price) * parseFloat(item.time || 0) : parseFloat(item.price),
            time: itemType === 'sample' ? parseFloat(item.time || 0) : 0,
            quantity: qty,
            frontEndId: uniqueKey,
          }
          console.log('Added new item:', newItem)
          this.invoiceItems.invoiceItems.push(newItem)
        }

        // If item was from existingItems, reset its quantity
        const dropdownIndex = this.existingItems.combinedItems.findIndex(x => x.id === originId && x.type === itemType)
        if (dropdownIndex > -1) {
          this.existingItems.combinedItems[dropdownIndex].quantity = 1
        }
      },

      // Inc/Dec/Remove
      incrementInvoiceItem(uniqueKey) {
        const item = this.invoiceItems.invoiceItems.find(i => i.frontEndId === uniqueKey)
        if (item) item.quantity = (item.quantity || 1) + 1
      },
      decrementInvoiceItem(uniqueKey) {
        const item = this.invoiceItems.invoiceItems.find(i => i.frontEndId === uniqueKey)
        if (item) {
          if (item.quantity > 1) {
            item.quantity -= 1
          } else {
            this.removeInvoiceItem(uniqueKey)
          }
        }
      },
      removeInvoiceItem(uniqueKey) {
        if (confirm('Remove item from invoice?')) {
          this.invoiceItems.invoiceItems = this.invoiceItems.invoiceItems.filter(i => i.frontEndId !== uniqueKey)
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
