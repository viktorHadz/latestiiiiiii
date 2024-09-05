import tabManager from './tabManager.js';
import clientManager from './clientManager.js';
import stylesManager from './stylesManager.js';
import invoiceManager from './invoiceManager.js';
import toastManager from './toastManager.js';

// Initialize toastManager and assign it to window
window.toastManager = toastManager(); // Make sure this initializes the toastManager correctly

// Expose callToast directly to the window for global access
window.callToast = window.toastManager.callToast.bind(window.toastManager); // Bind callToast correctly to toastManager

// Set up Alpine.js data
window.clientManager = clientManager;
window.stylesManager = stylesManager;
window.invoiceManager = invoiceManager;
window.tabManager = tabManager;

document.addEventListener('alpine:init', () => {
    Alpine.data('tabManager', tabManager);
    Alpine.data('clientManager', clientManager);
    Alpine.data('stylesManager', stylesManager);
    Alpine.data('invoiceManager', invoiceManager);
    Alpine.data('toastManager', toastManager);
});
