// import componentManager from './public/componentsLibrary/components.js';
import clientManager from './clientManager.js';
import stylesManager from './stylesManager.js';
import invoiceManager from './invoiceManager.js';
import editorManager from './editorManager.js';
import toastManager from './toastManager.js';

// window.componentManager = componentManager()
// Initialize toastManager and assign it to window
window.toastManager = toastManager()
// Bind calls to the toast manager 
window.callToast = window.toastManager.callToast.bind(window.toastManager);
window.callError = window.toastManager.toastError.bind(window.toastManager);
window.callSuccess = window.toastManager.toastSuccess.bind(window.toastManager);
window.callWarning = window.toastManager.toastWarning.bind(window.toastManager);
window.callInfo = window.toastManager.toastInfo.bind(window.toastManager);

document.addEventListener('alpine:init', () => {
    Alpine.data('tabManager', () => ({
        tabSelected: 'clients',
        tabContent: '',
        isLoading: true, // Set initial loading state to true for animation at the start of the app 
        mode: localStorage.getItem('theme') || 'light',
        
        toggleTheme() {
            this.mode = this.mode === 'light' ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark', this.mode === 'dark');
            localStorage.setItem('theme', this.mode);
            console.log(this.mode)
        },

        async init() {
            // Ensure isLoading is initially set to true, then trigger content load
            await this.loadInitialContent();
            if (this.mode === 'dark') {
                document.documentElement.classList.add('dark');
            }
            // Watch the tab content and the next tick when a change occurs fire htmx.process 
            this.$watch('tabContent', () => {
                this.$nextTick( () => {
                    htmx.process(this.$refs.tabContentContainer)
                    // hmx.logger() for debugging els 
                    // console.log(htmx)
                })
            })
            
            
        },

        async loadInitialContent() {
            // Load initial content 
            await this.loadTabContent('clients');
            this.isLoading = false; // Enter transition
        },

        async tabButtonClicked(tabName) {
            await this.changeTab(tabName);
        },

        tabContentActive(tabName) {
            return this.tabSelected === tabName;
        },

        async changeTab(tabName) {
            this.isLoading = true; // Trigger leave transition

            setTimeout(async () => {
                await this.loadTabContent(tabName);
                this.isLoading = false; // Trigger enter transition
            }, 200); // Adjust timeout to match transition duration
        },
        
        async loadTabContent(tabName) {
            const response = await fetch(`/${tabName}.html`)
            const content = await response.text()
            this.tabSelected = tabName;

            this.$nextTick(() => {
                this.tabContent = content;
                this.initTabComponent(tabName);
            });
        },

        initTabComponent(tabName) {
            if (tabName === 'styles') {
                Alpine.data('stylesManager', stylesManager)
            } else if (tabName === 'clients') {
                Alpine.data('clientManager', clientManager)
            } else if (tabName === 'invoices') {
                Alpine.data('invoiceManager', invoiceManager)
            } else if (tabName === 'editor') {
                Alpine.data('editorManager', editorManager)
            }
        },
        
    }));

    Alpine.data('clientManager', clientManager);
    Alpine.data('stylesManager', stylesManager);
    Alpine.data('invoiceManager', invoiceManager);
    Alpine.data('editorManager', editorManager);
    Alpine.data('toastManager', toastManager);
});
