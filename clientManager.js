export default function clientManager() {
    return {
        clients: [],
        newClient: { name: '', company_name: '', address: '', email: '' },
        showAddClientModal: false,
        init() {
            this.fetchClients();
        },

        async fetchClients() {
            try {
                const response = await fetch('/clients');
                this.clients = (await response.json()).map(client => ({ ...client, isEditing: false }));
            } catch (error) {
                console.error('Error fetching clients:', error);
            }
        },

        async saveClient(client) {
            const response = await fetch(`/clients/${client.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: client.name,
                    company_name: client.company_name,
                    address: client.address,
                    email: client.email
                })
            });
            client.isEditing = false;
            this.fetchClients();
            return await response.json();
        },

        async removeClient(clientId) {
            await fetch(`/clients/${clientId}`, {
                method: 'DELETE'
            });
            this.fetchClients();
        },

        editClient(client) {
            client.original = { ...client }; // Store original data
            client.isEditing = true;
        },
        
        cancelEdit(client) {
            Object.assign(client, client.original); // Revert to original data
            client.isEditing = false;
        },

        async addClient() {
            try {
                const newClient = await this.sendRequest('/clients', 'POST', this.newClient);
                this.clients.push({ ...newClient, isEditing: false });
                this.showAddClientModal = false;
                // Clear the form
                this.newClient = { name: '', company_name: '', address: '', email: '' };
            } catch (error) {
                console.error('Error adding client:', error);
            }
        },

        async sendRequest(url, method, body) {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return await response.json();
        }
    };
}
