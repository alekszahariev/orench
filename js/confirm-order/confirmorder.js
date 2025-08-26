document.addEventListener('DOMContentLoaded', function() {
    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderid');

    if (orderId) {
        // Prepare the data to send
        const data = {
            orderId: orderId
        };

        // Send to webhook
        fetch('https://primary-production-f22c.up.railway.app/webhook/a02b8972-2111-4412-af4c-1279ed9e0e3a', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Thank you for your order');
        })
        .catch(error => {
            console.error('Error sending order confirmation:', error);
        });
    } else {
        console.error('No order ID found in URL');
    }
}); 