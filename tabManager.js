/** commit and see if it works without this. If it does then you can delete.

export default function tabManager() {
    return {
        tabSelected: 'clients',
        tabContent: '',

        async init() {
            await this.loadTabContent('clients');
        },

        async tabButtonClicked(tabName) {
            this.tabSelected = tabName;
            await this.loadTabContent(tabName);
        },

        tabContentActive(tabName) {
            return this.tabSelected === tabName;
        },

        async loadTabContent(tabName) {
            const response = await fetch(`/${tabName}.html`);
            const content = await response.text();
            this.tabContent = content;

            // Inject content and apply transitions
            this.$nextTick(() => {
                this.$refs.tabContentContainer.innerHTML = content;
                this.initTabComponent(tabName);
                this.applyTransitions(this.$refs.tabContentContainer);
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
        },

        applyTransitions(container) {
            container.classList.add('transition', 'ease-out', 'duration-5000', 'transform');
            container.style.transitionProperty = 'opacity, transform';
            container.style.transitionDuration = '5000ms'; 
        },
    };
}

 */
