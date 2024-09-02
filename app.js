import tabManager from './tabManager.js';
import clientManager from './clientManager.js';
import stylesManager from './stylesManager.js';
import invoiceManager from './invoiceManager.js';
import toastManager from './toastManager.js'

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

// You can define the various different toasts here. E.g. errors successes etc.
window.toast = function(message, options = {}) {
    let description = '';
    let type = 'default';
    let position = 'top-center';
    let html = '';

    // Set toast options if provided
    if (typeof options.description !== 'undefined') description = options.description;
    if (typeof options.type !== 'undefined') type = options.type;
    if (typeof options.position !== 'undefined') position = options.position;
    if (typeof options.html !== 'undefined') html = options.html;

    // Dispatch a custom event to show the toast
    window.dispatchEvent(new CustomEvent('toast-show', {
        detail: {
            type: type,
            message: message,
            description: description,
            position: position,
            html: html
        }
    }));
    // Customize html if you want here
    /*
    window.customToastHTML = `
        <div class='relative flex items-start justify-center p-4'>
            <img src='https://cdn.devdojo.com/images/august2023/headshot-new.jpeg' class='w-10 h-10 mr-2 rounded-full'>
            <div class='flex flex-col'>
                <p class='text-sm font-medium text-gray-800'>New Friend Request</p>
                <p class='mt-1 text-xs leading-none text-gray-800'>Friend request from John Doe.</p>
                <div class='flex mt-3'>
                    <button type='button' @click='burnToast(toast.id)' class='inline-flex items-center px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'>Accept</button>
                    <button type='button' @click='burnToast(toast.id)' class='inline-flex items-center px-2 py-1 ml-3 text-xs font-semibold text-gray-900 bg-white rounded shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50'>Decline</button>
                </div>
            </div>
        </div>
    `


    call it like so:
    // Example
        callToast() {
            window.toast('MASDA', {type: 'success', description: 'Wawawewa description', })
            console.log("clicked")
        },
     */
};