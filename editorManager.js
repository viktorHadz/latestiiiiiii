export default function editorManager() {
    return {
        showClientModal: false,
        showDropdown: false,
        clients: [],
        selectedClient: [],
        listItems: [],
        invoiceItems: {},
        showInvoiceItems: false,
        newItem: { 
            type: '',
            name: '', 
            price: null,
            quantity: null,
            showItemModal: false, 
        },
        
        editing: false,
        editMode: '',
        openEditModal: false,
        // Editing prices (e.g. subtotal, vat, discount etc.)
        editingPrice: '',
        editingPriceValue: 0,
        // Overwrite data structure to restore on cancel
        temporaryEditValues: {},
        

        // IMPORTANT: Use this to build out the expanded menu of the invoice list with associated invoices
        expanded: false,
        // Temp values to store edits to prices
       
        /*
        TODO:
        1. How do we handle multiple invoice copies? E.g. you've added one copy of the invoice but you need one more after that. What if the original has to be altered beforehand?
        2. Enable editing of items
            If overwriting do I edit the old items with the new price. Or rather make a new table - !!!!*****    overwrite_edit_item_copy   ****!!!!!
            If copying place inside the copyInvoices table (non existent yet)
        3. Enable adding new items into the invoice
            If overwriting edit - unable to add new items into Invoice Overwrite (Display that in the add modals as a question mark)
            If copying edit - add new items to the current invoice. When the user saves add this to copy_edit_invoiceItems 
        4. FIX - Generating empty invoices throws error but creates new empty invoice

            OVERALL
            1.OVERWRITE 
                I can edit item prices, I can remove items, I can edit final prices  
                I CANNOT add items
            2. COPY
                I can edit item prices, add items, remove items and edit final prices
        */

        addNewInvoiceStyle() {
            let items = this.invoiceItems.invoiceItems
             let newItem = {
                ...this.newStyle,
                id: 0,          // UCAREFUL LET BACKEND HANDLE
                name: "",
                price: 0,         // Default price, or replace with a dynamic value
                type: "",      // As the type is "style"
                time: 0,         // As per your structure
                quantity: 0,        // Default quantity
                invoice_id: this.invoiceItems.invoice.invoice_id // Set invoice_id from invoice object
            };
            items.push(newItem)
            console.log(items)

            //items.push()
        },
        init() {
          this.fetchClients()
          this.loadSelectedClient()
          this.fetchListById()
        },

        removeInvoiceItem(id) {
            this.invoiceItems.invoiceItems = this.invoiceItems.invoiceItems.filter(item => item.id !== id)
            this.calculateTotals()
        },
        requestEditedInvoiceData() {
            // Request the data here from backend then push into the invoice list html  
        },
        renameEditedInvoice() {
            // Rename invoice (e.g. edited on {dateOfEdit}) or give extension (E.G. SAM1.1 on) 
        },
        // MARK: SAVE EDIT
        saveEdit() {
            if (confirm('Saving edits cannot be undone. Are you sure you want to proceed?')) {
                // Create object to send into the backend
                const data = {
                    // client info
                    clientId: this.invoiceItems.client.id,
                    clientName: this.invoiceItems.client.name,
                    companyName: this.invoiceItems.client.company_name,
                    clientAddress: this.invoiceItems.client.address,
                    clientEmail: this.invoiceItems.client.email,
                    editType: this.editMode,
                    invoiceNumber: this.invoiceItems.invoice.invoice_number,
                    invoiceDate: this.invoiceItems.invoice.date,
                    discountPercent: this.invoiceItems.invoice.discount_percent,
                    discountFlat: this.invoiceItems.invoice.discount_flat,
                    discount: this.invoiceItems.invoice.discount,
                    depositPercent: this.invoiceItems.invoice.deposit_percent,
                    depositFlat: this.invoiceItems.invoice.deposit_flat,
                    deposit: this.invoiceItems.invoice.deposit,
                    subtotal: this.invoiceItems.invoice.subtotal,
                    vat: this.invoiceItems.invoice.vat,
                    total: this.invoiceItems.invoice.total,
                }
                
                // await a response from the backend to rertrieve altered invoice data after saving to db
                // this.requestEditedInvoiceData()
                // renameEditedInvoice()
                try {
                    // conditionally send different types of data depending on whether editing as copy or overwrite
                    if (this.editMode === 'editOverwrite') {
                        callSuccess(`Invoice - ${this.temporaryEditValues.invoice.invoice_number}`, 'Overwritten successfully.')
                        // Give the invoice number an altered tag
                        // Give altered date too
                        // renameEditedInvoice()
                    }
                    if (this.editMode === 'editCopy') {
                        // Fetch the new invoice number here by requesting a response from the backend function
                        callSuccess(`Invoice - ${this.temporaryEditValues.invoice.invoice_number}`, `Copied as ${data.editType} successfully.`)
                    }
                    // Use route and if you get 'error, log it in the catch.'   
                    this.editing = false
                    this.editMode = ''
                } catch (error) {
                    console.error('Error saving edit: ', error)
                    callError('Error saving edits.', 'Please call support or restart the program and try again.')
                }
                // If copy 
            }
        },
        
        // MARK: EDIT
        editInvoice() { 
            if (this.editMode === 'editOverwrite') {
                this.temporaryEditValues = JSON.parse(JSON.stringify(this.invoiceItems))
                this.editing = true
                this.openEditModal = false
                callSuccess(`Editing invoice. Overwriting the current invoice - (${this.temporaryEditValues.invoice.invoice_number}).`)
            } else if (this.editMode === 'editCopy') {
                this.temporaryEditValues = JSON.parse(JSON.stringify(this.invoiceItems))
                this.editing = true
                this.openEditModal = false
                callSuccess(`Editing invoice. Creating a copy of the current invoice - (${this.temporaryEditValues.invoice.invoice_number}).`)
            } else {
                callError('Empty selection.', 'Please select one of the edit types.')
                return
            }

        },
        cancelEdit() {
            return new Promise((resolve) => {
                if (this.editing === true) {
                    if(confirm('Current edit will be lost. Continue?')){
                        this.invoiceItems = JSON.parse(JSON.stringify(this.temporaryEditValues))
                        this.editing = false
                        callWarning(`Edit canceled.`, `Invoice ${this.temporaryEditValues.invoice.invoice_number} was not altered.`)
                        this.editMode = ''
                        resolve(true)
                    } else {
                        resolve(false)
                        return 
                    }
                } else {
                    resolve(false)
                    return

                }
            })
        },
        
        // MARK: FETCH INVOICE LIST
        async fetchListById(clientId = this.selectedClient.id) {
          try {
                const response = await fetch(`/editor/invoices/${clientId}`)
                if (!response.ok) {
                    throw new Error(`Error fetching invoices: ${response.statusText}`);
                }
                const data = await response.json()
                this.listItems = data
            }
            catch (error) {
                console.error('Error fetching invoice list items:', error)
            }
        },
        // MARK: FETCH INVOICE DATA
        async fetchItems(clientId, invoiceId) {
            if (this.editing === true) {
                const continueFunction = await this.cancelEdit()

                if(!continueFunction) {
                    return
                }
            } 
            try {
                const response = await fetch(`/editor/invoices/${clientId}/${invoiceId}`)
                if (!response.ok) {
                    throw new Error(`Error fetching incoice items: ${response.statusText}`)
                }
                const data = await response.json()
                this.invoiceItems = data
                this.showInvoiceItems = true
            } catch (error) {
                console.error(`Error fetching invoice items: ${error}`)
            }
            
        },

        //MARK: EDIT PRICES
        savePrice(forWhich, whatValue) {

            if (forWhich in this.invoiceItems.invoice) {
                this.invoiceItems.invoice[forWhich] = whatValue
            };

            if (forWhich === 'vat' || forWhich === 'discount') {
                this.calculateTotals()
            }

            this.editingPrice = ''
            callSuccess('Price saved yay!')
        },

        calculateTotals() {
            let invoice = this.invoiceItems
            // Calculate subtotal by summing the price * quantity of all invoice items
            let subtotal = invoice.invoiceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            
            // Calculate VAT as 20% of the subtotal
            let vat = subtotal * (invoice.invoice.vat_percent / 100)
            
            // Apply discount (either percentage or flat)
            let discount = 0
            if (invoice.invoice.discount_percent === 1) {
                discount = (invoice.invoice.discount / 100) * subtotal
            } else if (invoice.invoice.discount_flat === 1) {
                discount = invoice.invoice.discount
            }
            
            // Calculate total before deposit (subtotal + VAT - discount)
            let totalPreDiscount = subtotal + vat - discount
            
            // Apply deposit (either percentage or flat)
            let deposit = 0
            if (invoice.invoice.deposit_percent === 1) {
                deposit = (invoice.invoice.deposit / 100) * totalPreDiscount
            } else if (invoice.invoice.deposit_flat === 1) {
                deposit = invoice.invoice.deposit
            }
            
            // Calculate the final total (totalPreDiscount - deposit)
            let total = totalPreDiscount - deposit
            
            // Update the invoice object with the calculated values
            this.invoiceItems.invoice.subtotal = subtotal
            this.invoiceItems.invoice.vat = vat
            this.invoiceItems.invoice.total_pre_discount = totalPreDiscount
            this.invoiceItems.invoice.total = total

            // Return the updated invoice object
            console.log(invoice)
        },
        

        applyEffect(item) {
            let items = this.listItems.map((itemFromList) => itemFromList.id)
            let itemId
        
            if (items.includes(item.id)) {
                itemId = `rowid-${item.id}`
            }
            let rowEl = document.getElementById(itemId)

            const applyClassAndRemove = (el, className) => {
            // Remove any previous instance of the class
                el.classList.remove(className); 
                void el.offsetWidth; // Force a reflow to reset animation
                el.classList.add(className); // Reapply the class to trigger animation

                // Remove the class once the animation finishes
                el.addEventListener('animationend', () => {
                el.classList.remove(className);
                }, { once: true }); // `once: true` ensures the listener is removed after one execution
            };

            if (rowEl) {
                if (this.mode === "light") {
                applyClassAndRemove(rowEl, 'add-item-glow')
                }
                if (this.mode === "dark") {
                applyClassAndRemove(rowEl, 'add-item-glow-dark')
                }
            }

        },
        /**
        Fetch the data from backend for invoices as you want displayed. On click func to show the invoice object that you pull from the backend
        */
        // async fetchInvoiceInfo(invoiceId = this.listItems.id) {
        //     try {
        //         const response = await fetch()
        //     } catch (error) {
        //         console.error('Error fetching invoices:', error)
        //     }
        // },

        // CLIENTS MODAL AND FETCH - When changing clients I have to empty out the invoice visualizer
        async fetchClients() {
            try {
                const response = await fetch('/clients');
                this.clients = await response.json();
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        },

        toggleDropdown() {
            this.showDropdown = !this.showDropdown;
        },
        openModal() {
            this.showClientModal = true;
        },
        closeModal() {
            this.showClientModal = false;
        },

        selectClient(client) {
            this.selectedClient = client;
            this.showDropdown = false;
            this.showClientModal = false;
            this.saveSelectedClient(client);
        },

        saveSelectedClient(client) {
            localStorage.setItem('selectedClient', JSON.stringify(client));
        },

        loadSelectedClient() {
            const client = JSON.parse(localStorage.getItem('selectedClient'));
            if (client) {
                this.selectedClient = client;
            }
        },
    }
}
 