export default function toastManager() {
    return {

        toasts: [],
    
        // Method to show a general toast
        addToast(toastDetail) {
            this.toasts.push({
                id: 'toast-' + Math.random().toString(36).substring(2, 15),
                ...toastDetail
            });
            setTimeout(() => this.removeToast(this.toasts[0].id), 4000); // Auto-remove after 4 seconds
        },
        
        // Method to remove toast by ID
        removeToast(id) {
            this.toasts = this.toasts.filter(toast => toast.id !== id);
        },
    
        // Predefined templates
        showSuccess(message, description = '') {
            this.addToast({
                type: 'success',
                message: message,
                description: description,
                html: '',
            });
        },
    
        showDanger(message, description = '') {
            this.addToast({
                type: 'danger',
                message: message,
                description: description,
                html: '',
            });
        },
    
        showInfo(message, description = '') {
            this.addToast({
                type: 'info',
                message: message,
                description: description,
                html: '',
            });
        },
    
        showWarning(message, description = '') {
            this.addToast({
                type: 'warning',
                message: message,
                description: description,
                html: '',
            });
        }


        
    }
}