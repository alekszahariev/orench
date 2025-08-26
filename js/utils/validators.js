export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone) {
    phone = phone.replace(/[\s-()]/g, '');
    if (phone.startsWith('00359')) phone = phone.replace(/^00359/, '+359');
    else if (phone.startsWith('0') && phone.length === 10) phone = phone.replace(/^0/, '+359');
    else if (/^8\d{8}$/.test(phone)) phone = '+359' + phone;
    if (/^\+359\d{9}$/.test(phone)) return phone;
    return null;
}