export default function toastManager() {
    // Define the window.toast function to dispatch events
    window.toast = function (message, options = {}) {
        let description = options.description || '';
        let type = options.type || 'info'; // Default to 'info' if no type is specified
        let position = options.position || 'top-center';
        let layout = 'stacked'; // Adjusted to indicate stacked layout
        let html = options.html || '';

        // Dispatch a custom event to show the toast
        window.dispatchEvent(new CustomEvent('toast-show', {
            detail: { type, message, description, position, layout, html }
        }));
    };

    return {
        toasts: [],

        // Method to add a toast with details
        addToast(toastDetail) {
            const id = 'toast-' + Math.random().toString(36).substring(2, 15);
            this.toasts.push({ id, ...toastDetail });
            setTimeout(() => this.removeToast(id), 4500); // Auto-remove after 4.5 seconds
        },

        // Method to remove toast by ID
        removeToast(id) {
            const toastElement = document.getElementById(id);
            if (toastElement) {
                toastElement.classList.add('opacity-0', '-translate-y-full');
                setTimeout(() => {
                    this.toasts = this.toasts.filter(toast => toast.id !== id);
                }, 300); // Delay to allow for transition effect
            } else {
                this.toasts = this.toasts.filter(toast => toast.id !== id);
            }
        },
        
        // Unified toast interface
        callToast({ type = 'info', message = '', description = '', position = 'top-center', html = '' }) {
            window.toast(message, { type, description, position, html });
        },

        // Error toast
        toastError(message, description='') {
            this.callToast( {
                type: 'danger',
                message: message,
                description: description,
                position: "top-center",
            })
        },
        toastSuccess(message, description='') {
            this.callToast({
                type: "success",
                message: message,
                description: description,
                position: "top-center"
            })
        },
        toastWarning(message, description='') {
            this.callToast({
                type: "warning",
                message: message,
                description: description,
                position: "top-center"
            })
        },
        toastInfo(message, description='') {
            this.callToast({
                type: "info",
                message: message,
                description: description,
                position: "top-center"
            })
        },

    };
}
