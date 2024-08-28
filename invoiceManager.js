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
        // Invoice items
        invoiceItems: [],
        // Price forming menu
        subtotal: 0,
        vat: 0,
        deposit: 0,
        discount: 0,
        discountPercent: 0,
        discountFlat: 0,
        vatPercent: 20,
        total: 0,
        // Search Bar
        styleSearch: '',
        sampleSearch: '',
        // Add new style for client
        showAddStyleModal: false,
        newStyle: { name: '', price: null },
        // Add new sample for client
        showAddSampleModal: false,
        newSample: { name: '', time: null, price: null },

        init() {
            this.fetchClients();
            this.loadSelectedClient();
        },

        async fetchClients() {
            try {
                const response = await fetch('/api/clients');
                this.clients = await response.json();
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        },

        selectClient(client) {
            this.selectedClient = client;
            this.showDropdown = false;
            this.showClientModal = false;
            this.saveSelectedClient(client);
            this.fetchStyles(client.id);
            this.fetchSamples(client.id);
            // Empty out the Invoice Items Table | You need to ensure that styles are saved for the client youre clearing them out of and load them when selected
            this.invoiceItems = []
            
        },

        saveSelectedClient(client) {
            localStorage.setItem('selectedClient', JSON.stringify(client));
        },

        loadSelectedClient() {
            const client = JSON.parse(localStorage.getItem('selectedClient'));
            if (client) {
                this.selectedClient = client;
                this.fetchStyles(client.id);
                this.fetchSamples(client.id);
            }
        },
        openModal() {
            this.showClientModal = true;
        },
        closeModal() {
            this.showClientModal = false;
        },
        toggleDropdown() {
            this.showDropdown = !this.showDropdown;
        },
        async fetchStyles(clientId) {
            try {
                const response = await fetch(`/api/styles/client/${clientId}`);
                this.styles = (await response.json()).map(style => ({ ...style }));
                this.filteredStyles = this.styles;
            } catch (error) {
                console.error('Error fetching styles:', error);
            }
        },

        async fetchSamples(clientId) {
            try {
                const response = await fetch(`/api/samples/client/${clientId}`);
                this.samples = (await response.json()).map(sample => ({ ...sample, sampleName: sample.name }));
                this.filteredSamples = this.samples;
            } catch (error) {
                console.error('Error fetching samples:', error);
            }
        },
        // Adds new style/sample in DB and updates UI
        async invoAddStyle() {
            const style = { ...this.newStyle, client_id: this.selectedClient.id };
            try {
                const response = await fetch('/styles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(style)
                });
                const newStyle = await response.json();
                newStyle.name = newStyle.name; 
                this.styles.push({ ...newStyle});
                this.filteredStyles = this.styles;
                this.showAddStyleModal = false;
                this.newStyle = { name: '', price: null };
            } catch (error) {
                console.error('Error adding style:', error);
            }
        },

        async invoAddSample() {
            const sample = { ...this.newSample, client_id: this.selectedClient.id };
            try {
                const response = await fetch('/samples', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sample)
                });
                const newSample = await response.json();
                this.samples.push({ ...newSample, isEditing: false });
                this.filteredSamples = this.samples;
                this.showAddSampleModal = false;
                this.newSample = {name: '', style: null, price: null}
            } catch (error) {
                console.error('Error adding sample:', error);
            }
        },
        // TODO: Add localstorage to set state? Maybe after fetch styles/client
        
        addItemToInvoice(item, type) {
            console.log("Adding item to invoice")
            const uniqueId = `${type}-${item.id}`
            let qty = 1
            let itemExists = false
            // Map over the invoiceItems
            this.invoiceItems = this.invoiceItems.map(invoiceItem => {
                // if the item exists is in the lsit 
                if (invoiceItem.uniqueId === uniqueId) {
                    itemExists = true;
                    if (invoiceItem.type === 'sample') {
                        return {
                            ...invoiceItem,
                            quantity: invoiceItem.quantity + qty,
                            price: parseFloat(item.price) * parseFloat(item.time)
                        }
                    } else {
                        return {
                            ...invoiceItem,
                            quantity: invoiceItem.quantity + qty
                        }
                    }
                } else {
                    // returns the invoiceItem unchanged
                    return invoiceItem
                }
            })
            // If the item does not exist, add it to the invoiceItems array
            if (!itemExists) {
                if (type === "sample") {
                    this.invoiceItems.push({
                        ...item,
                        type,
                        uniqueId,
                        quantity: qty,
                        price: parseFloat(item.price) * parseFloat(item.time) 
                    })
                } else {
                    this.invoiceItems.push({
                        ...item,
                        type,
                        uniqueId,
                        quantity: qty,
                        price: parseFloat(item.price)
                    })
                }
            }
            this.calculateTotals()
            // update the discounts section
            // add invoice items to localstorage by calling a function bellow
        },

        removeItemFromInvoice(item) {
            this.invoiceItems = this.invoiceItems.filter(i => i.uniqueId !== item.uniqueId);
            this.calculateTotals();
        },

        async generateInvoice() {
            const invoiceData = {
                clientId: this.selectedClient.id,
                items: this.invoiceItems,
                discountPercent: this.discountPercent,
                discountFlat: this.discountFlat,
                vatPercent: this.vatPercent,
                subtotal: this.subtotal,
                discount: this.discount,
                vat: this.vat,
                total: this.total
            };

            try {
                const response = await fetch('/api/saveInvoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoiceData)
                });

                if (response.ok) {
                    const invoice = await response.json();
                    this.generatePDF(invoice.id);
                } else {
                    console.error('Error generating invoice, data sent from invoiceData was shit:', await response.json());
                }
            } catch (error) {
                console.error('Error generating invoice:', error);
            }
        },

        async generatePDF(invoiceId) {
            try {
                const response = await fetch(`/api/invoices/${invoiceId}/pdf`, { method: 'GET' });
                console.log("Invoice id is:" + invoiceId)

                console.log(response)
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                console.log(url)
                // PDF Filename - set by Content-Disposition in backend.
                a.download = `S.A.M.Creations-${invoiceId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
        },

        calculateSubTotal() {
            let sampleTotal = []
            sampleTotal = this.invoiceItems
                .filter(item => item.type === "sample")
                .map(item => ({
                    price: item.price,
                    quantity: item.quantity,
                    total: (item.price * item.quantity) 
                }))
            console.log("Sample: ")
            console.log(sampleTotal)
            let styleTotal = []
            styleTotal = this.invoiceItems
                .filter(item => item.type === "style")
                .map(item => ({
                    price: item.price,
                    quantity: item.quantity,
                    total: (price * quantity)
                }))
            console.log("Style: ")
            console.log(styleTotal)
            
            let subTotal = sampleTotal + styleTotal
            console.log("Subtotal: ")
            console.log(this.subTotal)
            return subTotal
            // console.log("samplePriceTotal is:")
            // console.log(samplePrice)
            

            // Loop each sample to get all of them and sum them together 
            // Loop each item too then sum both of those together (maybe get all of them together)
            // Sample price = (time * price) * quantity
            // Style price = price * quantity 
        
        },
        calculateTotals() {
            this.calculateSubTotal()
            //this.subtotal = this.invoiceItems.reduce((total, item) => total + parseFloat(item.price), 0);

            
            this.discount = (this.subtotal * this.discountPercent / 100) + parseFloat(this.discountFlat);
            const subtotalAfterDiscount = this.subtotal - this.discount;
            this.vat = (subtotalAfterDiscount * this.vatPercent / 100);
            this.total = subtotalAfterDiscount + this.vat;
        },

        searchStyles() {
            this.filteredStyles = this.styles.filter(style => 
                style.name.toLowerCase().includes(this.styleSearch.toLowerCase())
            );
        },
        
        searchSamples() {
            this.filteredSamples = this.samples.filter( sample => 
                sample.sampleName.toLowerCase().includes(this.sampleSearch.toLowerCase())
            )
        },
        // create a counter each time an item/sample gets added in the added items table
        // Remove each item getting added in its own row. Instead another item with the same name needs to be counted 
        // Price then needs to properly update 
    };
}
