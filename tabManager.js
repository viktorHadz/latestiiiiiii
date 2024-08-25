export default function tabManager() {
    return {
        tabSelected: 'clients',
        tabContent: '',

        async init() {
            this.tabContent = await this.loadTabContent('clients');
        },

        async tabButtonClicked(tabName) {
            this.tabSelected = tabName;
            this.tabContent = await this.loadTabContent(tabName);
        },

        tabContentActive(tabName) {
            return this.tabSelected === tabName;
        },

        async loadTabContent(tabName) {
            const response = await fetch(`/${tabName}.html`);
            const content = await response.text();
            this.tabContent = content;
            this.$nextTick(() => {
                this.initTabComponent(tabName);
            });
            return content;
        },

        initTabComponent(tabName) {
            if (tabName === 'styles') {
                Alpine.data('stylesManager', window.stylesManager);
            } else if (tabName === 'clients') {
                Alpine.data('clientManager', window.clientManager);
            } else if (tabName === 'invoices') {
                Alpine.data('invoiceManager', window.invoiceManager);
            }
        }
    };
}
