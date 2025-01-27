// store-edit.js (or wherever your Alpine stores are declared)
document.addEventListener('alpine:init', () => {
  Alpine.store(
    'edit',
    Alpine.reactive({
      // ===== State =====
      editing: false, // Whether we’re in edit mode
      editMode: '', // 'editOverwrite' or 'editCopy'
      openEditModal: false, // Toggle for “choose edit type” modal
      showInvoiceItems: false, // Toggle to show/hide invoice detail area
      invoiceItems: {}, // Holds the currently selected invoice’s data
      initialValuesInvItems: {}, // For restoring the invoice data on cancel
      listItems: [], // All invoices for the selected client

      // For new items / existing items
      existingItems: {
        showItemModal: false,
        openDropdown: false,
        combinedItems: [],
        filteredItems: [],
        searchQuery: '',
      },

      // Price editing states
      editingPrice: '',
      editingPriceValue: 0,

      // For adding new item
      newItem: {
        type: '',
        name: '',
        price: null,
        quantity: null,
        time: null,
      },

      // ===== Methods =====
      init() {
        console.log('[Edit Store] Initialised')
      },

      // ---- Invoice List: Load all invoices for current client
      async fetchListById() {
        try {
          const client = Alpine.store('clients').selectedClient
          const response = await fetch(`/editor/list/${client.id}`) // << match your route
          if (!response.ok) {
            throw new Error(`Error fetching invoices: ${response.statusText}`)
          }
          this.listItems = await response.json()
        } catch (error) {
          console.error('Error fetching invoice list items:', error)
        }
      },

      // ---- Invoice Items: Load details for a specific invoice
      async fetchItems(invoiceId) {
        try {
          const client = Alpine.store('clients').selectedClient
          const response = await fetch(`/editor/invoices/${client.id}/${invoiceId}`) // << match your route
          if (!response.ok) {
            throw new Error(`Error fetching invoice items: ${response.statusText}`)
          }
          this.invoiceItems = await response.json()
          this.showInvoiceItems = true
          this.editing = false
        } catch (error) {
          console.error(`Error fetching invoice items: ${error}`)
        }
      },

      // ---- Opening the “Choose Edit Type” modal
      editInvoice() {
        if (this.editMode === 'editOverwrite') {
          // Save current invoice data for restoration if user cancels
          this.initialValuesInvItems = JSON.parse(JSON.stringify(this.invoiceItems))
          this.editing = true
          this.openEditModal = false
          // callSuccess('Editing invoice in Overwrite mode.', ...);
        } else if (this.editMode === 'editCopy') {
          this.initialValuesInvItems = JSON.parse(JSON.stringify(this.invoiceItems))
          this.editing = true
          this.openEditModal = false
          // callSuccess('Editing invoice in Copy mode.', ...);
        } else {
          // callError('Please select an edit type first.');
        }
      },

      // ---- Cancel the current edit & restore data
      cancelEdit() {
        return new Promise(resolve => {
          if (this.editing === true) {
            const confirmCancel = confirm('You will lose current edits. Continue?')
            if (confirmCancel) {
              // Restore old data
              this.invoiceItems = JSON.parse(JSON.stringify(this.initialValuesInvItems))
              this.editing = false
              this.editMode = ''
              // callWarning('Edit cancelled.');
              resolve(true)
            } else {
              resolve(false)
            }
          } else {
            resolve(false)
          }
        })
      },

      // ---- Save an Edit
      saveEdit() {
        if (!this.editMode) {
          // callError('No edit mode selected.');
          return
        }
        const proceed = confirm('Saving edits cannot be undone. Proceed?')
        if (!proceed) return

        try {
          // Gather data to send to backend
          const data = {
            clientId: this.invoiceItems.client?.id,
            clientName: this.invoiceItems.client?.name,
            invoiceNumber: this.invoiceItems.invoice.invoice_number,
            // ...
            editType: this.editMode,
            // ... any other fields you need
          }

          // Example of how you might do different logic for overwrite/copy
          if (this.editMode === 'editOverwrite') {
            // callSuccess(`Invoice ${data.invoiceNumber} overwritten successfully.`);
          }
          if (this.editMode === 'editCopy') {
            // callSuccess(`Invoice ${data.invoiceNumber} copied successfully.`);
          }

          // Actually send `data` to your backend endpoint
          // e.g. await fetch(...)

          // Reset states
          this.editing = false
          this.editMode = ''
        } catch (error) {
          console.error('Error saving edit:', error)
          // callError('Error saving edits.');
        }
      },

      // ---- Price Editing
      savePrice(forWhich, whatValue) {
        if (!this.invoiceItems?.invoice) return
        if (forWhich in this.invoiceItems.invoice) {
          this.invoiceItems.invoice[forWhich] = whatValue
        }
        if (forWhich === 'vat' || forWhich === 'discount') {
          this.calculateTotals()
        }
        this.editingPrice = ''
        // callSuccess('Price saved!');
      },

      calculateTotals() {
        const invoice = this.invoiceItems
        if (!invoice?.invoiceItems || !invoice?.invoice) return

        // Subtotal
        let subtotal = invoice.invoiceItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        // Example: if you store a `vat_percent` on the invoice
        let vat = subtotal * (invoice.invoice.vat_percent / 100 || 0)

        // Discount
        let discount = 0
        if (invoice.invoice.discount_percent === 1) {
          discount = (invoice.invoice.discount / 100) * subtotal
        } else if (invoice.invoice.discount_flat === 1) {
          discount = invoice.invoice.discount
        }

        let totalPreDiscount = subtotal + vat - discount

        // Deposit
        let deposit = 0
        if (invoice.invoice.deposit_percent === 1) {
          deposit = (invoice.invoice.deposit / 100) * totalPreDiscount
        } else if (invoice.invoice.deposit_flat === 1) {
          deposit = invoice.invoice.deposit
        }

        let total = totalPreDiscount - deposit

        // Store results
        invoice.invoice.subtotal = subtotal
        invoice.invoice.vat = vat
        invoice.invoice.total_pre_discount = totalPreDiscount
        invoice.invoice.total = total
      },

      // ---- Add/Remove Items
      addNewItem(item) {
        const newItem = {
          ...item,
          quantity: item.quantity,
        }
        // push into the invoice’s item array
        if (this.invoiceItems?.invoiceItems) {
          this.invoiceItems.invoiceItems.push(newItem)
        }

        // Reset the quantity on the “existing items” side
        const index = this.existingItems.combinedItems.findIndex(i => i.frontEndId === item.frontEndId)
        if (index !== -1) {
          this.existingItems.combinedItems[index].quantity = 1
        }
        this.calculateTotals()
      },
      removeInvoiceItem(id) {
        if (!this.invoiceItems?.invoiceItems) return
        this.invoiceItems.invoiceItems = this.invoiceItems.invoiceItems.filter(item => item.id !== id)
        this.calculateTotals()
      },

      // ---- Searching and Filtering
      searchItems() {
        const query = this.existingItems.searchQuery.toLowerCase()
        this.existingItems.filteredItems = this.existingItems.combinedItems.filter(item =>
          item.name.toLowerCase().includes(query),
        )
      },

      // ---- Fetch styles/samples for items
      async fetchStylesAndSamples(clientId) {
        if (!clientId) return
        try {
          const [stylesResponse, samplesResponse] = await Promise.all([
            fetch(`/styles/client/${clientId}`),
            fetch(`/api/samples/client/${clientId}`),
          ])

          const styles = await stylesResponse.json()
          const samples = await samplesResponse.json()

          const preInsertStyles = styles.map(style => ({
            ...style,
            type: 'style',
            frontEndId: `style-${style.id}`,
            quantity: 1,
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
          // callError('Error getting styles/samples.');
        }
      },
    }),
  )
})
