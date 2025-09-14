export async function getUserIP() {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
}

export async function postToPreviewAPI(formDataToSend) {
    return fetch('https://n8n.enchantiya.com/webhook/f7ae757e-4b72-4748-af4a-9f919d4d8b65', {
        method: 'POST',
        body: formDataToSend
    });
}

export async function postOrder(formData) {
    return fetch('https://primary-production-f22c.up.railway.app/webhook/fa49284e-20c0-46d9-931a-d3f52867ebcb', {
        method: 'POST',
        body: formData
    });
}

export async function trackOrder(formData) {
    return fetch('https://primary-production-5c317.up.railway.app/webhook/fa49284e-20c0-46d9-931a-d3f52867ebcb', {
        method: 'POST',
        body: formData
    });
}

export async function validatePromoCode(code) {
    const res = await fetch('https://n8n.enchantiya.com/webhook/6087e7b2-4948-4609-8338-956feb224b51', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
    });
    if (!res.ok) {
        throw new Error('Network error');
    }
    return res.json();
}