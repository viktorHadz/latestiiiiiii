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
                this.callSuccessToast()
            } catch (error) {
                console.error('Error adding client:', error);
                this.callDangerToast()
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
        },


        // Examples - need further customization. dont wanna be creating ones for each and every scenario.
        callToast() {
            window.toast('MASDA', {type: 'success', description: 'Wawawewa description', })
            console.log("clicked")
        },

        callSuccessToast() {
            window.dispatchEvent(new CustomEvent('toast-show', { 
                detail: { type: 'success', message: 'Success!', description: 'Client added successfully.' }
            }));
        },

        callDangerToast() {
            window.dispatchEvent(new CustomEvent('toast-show', { 
                detail: { type: 'danger', message: 'Error!', description: 'Failed to add client.' }
            }));
        },

        callWarningToastDelete() {
            window.dispatchEvent(new CustomEvent('toast-show', { 
                detail: { type: 'warning', message: 'O.K.', description: 'Client removed.' }
            }));
        }
    };
}
