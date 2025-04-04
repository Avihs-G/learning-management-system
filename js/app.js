// Global error handling
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
});

// Utility function for notifications
function showNotification(message, type = 'info') {
    const notificationContainer = document.createElement('div');
    notificationContainer.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    notificationContainer.textContent = message;
    
    document.body.appendChild(notificationContainer);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        document.body.removeChild(notificationContainer);
    }, 3000);
}

// Network connectivity check
function checkInternetConnection() {
    if (navigator.onLine) {
        console.log('Online');
        return true;
    } else {
        showNotification('No internet connection', 'warning');
        return false;
    }
}

// Add event listeners for online/offline events
window.addEventListener('online', () => {
    showNotification('Internet connection restored', 'success');
});

window.addEventListener('offline', () => {
    showNotification('Internet connection lost', 'danger');
});