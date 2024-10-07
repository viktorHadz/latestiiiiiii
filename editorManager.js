export default function editorManager() {
    return {
        showClientModal: false,
        showDropdown: false,
        clients: [],
        selectedClient: [],
        listItems: [],
        invoiceItems: [],

        init() {
            this.fetchClients()
            this.loadSelectedClient()
            this.fetchListById()
        },

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
        /**
        Fetch the data from backend for invoices as you want displayed. On click func to show the invoice object that you pull from the backend
        */
        async fetchInvoiceInfo(invoiceId = this.listItems.id) {
            try {
                const response = await fetch()
            } catch (error) {
                console.error('Error fetching invoices:', error)
            }
        },

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