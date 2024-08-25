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
        invoiceItems: [],
        discountPercent: 0,
        discountFlat: 0,
        vatPercent: 20, // Default VAT percentage
        subtotal: 0,
        discount: 0,
        vat: 0,
        total: 0,
        styleSearch: '',
        sampleSearch: '',
        // Add style for client
        showAddStyleModal: false,
        newStyle: { name: '', price: '' },
        // Add sample for client
        showAddSampleModal: false,
        newSample: { name: '', time: '', price: '' },

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

        openModal() {
            this.showClientModal = true;
        },

        toggleDropdown() {
            this.showDropdown = !this.showDropdown;
        },

        selectClient(client) {
            this.selectedClient = client;
            this.showDropdown = false;
            this.showClientModal = false;
            this.saveSelectedClient(client);
            this.fetchStyles(client.id);
            this.fetchSamples(client.id);
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
        // Probably need a post route too
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
            } catch (error) {
                console.error('Error adding sample:', error);
            }
        },

        // TODO: Add localstorage to set state? Maybe after fetch styles/client

        addItemToInvoice(item, type) {
            const newItem = { ...item, type, uniqueId: `${type}-${item.id}-${Date.now()}` };
            if (type === 'sample') {
                newItem.price = parseFloat(item.price) * parseFloat(item.time); // Calculate total price for sample
            }
            this.invoiceItems.push(newItem);
            this.calculateTotals();
        },

        removeItemFromInvoice(item) {
            this.invoiceItems = this.invoiceItems.filter(i => i.uniqueId !== item.uniqueId);
            this.calculateTotals();
        },

        calculateTotals() {
            this.subtotal = this.invoiceItems.reduce((total, item) => total + parseFloat(item.price), 0);
            this.discount = (this.subtotal * this.discountPercent / 100) + parseFloat(this.discountFlat);
            const subtotalAfterDiscount = this.subtotal - this.discount;
            this.vat = (subtotalAfterDiscount * this.vatPercent / 100);
            this.total = subtotalAfterDiscount + this.vat;
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
                    console.error('Error generating invoice:', await response.json());
                }
            } catch (error) {
                console.error('Error generating invoice:', error);
            }
        },

        async generatePDF(invoiceId) {
            try {
                const response = await fetch(`/api/invoices/${invoiceId}/pdf`, { method: 'GET' });
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Invoice-${invoiceId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error generating PDF:', error);
            }
        },

        closeModal() {
            this.showClientModal = false;
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
    };
}
