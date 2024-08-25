import tabManager from './tabManager.js';
import clientManager from './clientManager.js';
import stylesManager from './stylesManager.js';
import invoiceManager from './invoiceManager.js';

window.clientManager = clientManager;
window.stylesManager = stylesManager;
window.invoiceManager = invoiceManager;

document.addEventListener('alpine:init', () => {
    Alpine.data('tabManager', tabManager);
    Alpine.data('clientManager', clientManager);
    Alpine.data('stylesManager', stylesManager);
    Alpine.data('invoiceManager', invoiceManager);
});
