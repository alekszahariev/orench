import { formData } from '../data.js';
import {getCurrencySymbol} from '../utils/currency.js'
let basePrice = 0;
let isCodSelected = false;
const COD_FEE = 19.90;

export function initPaymentMethods() {
    const cardOption = document.getElementById('paymentCard');
    const codOption = document.getElementById('paymentCOD');
    const hiddenInput = document.getElementById('selectedPaymentMethod');

    if (!cardOption || !codOption || !hiddenInput) {
        console.error('Payment method elements not found');
        return;
    }

    // Check URL path for language codes
    const path = window.location.pathname;
    const isInternational = path.startsWith('/en') || path.startsWith('/de');

    if (isInternational) {
        // Hide COD option
        codOption.style.display = 'none';

        // Select card by default
        hiddenInput.value = 'card';
        formData.paymentType = 'card';
        cardOption.classList.add('selected');
        isCodSelected = false;
    } else {
        // Show COD and set default as card
        codOption.style.display = 'block';
        hiddenInput.value = 'card';
        formData.paymentType = 'card';
        cardOption.classList.add('selected');
        isCodSelected = false;

        // Add event listeners only if cod is visible
        codOption.addEventListener('click', () => selectPaymentMethod('cod'));
    }

    cardOption.addEventListener('click', () => selectPaymentMethod('card'));
}

export function selectPaymentMethod(method) {
    const cardOption = document.getElementById('paymentCard');
    const codOption = document.getElementById('paymentCOD');
    const hiddenInput = document.getElementById('selectedPaymentMethod');

    if (!cardOption || !codOption || !hiddenInput) {
        console.error('Payment method elements not found');
        return;
    }

    // Reset all selections
    cardOption.classList.remove('selected');
    codOption.classList.remove('selected');

    // Apply new selection
    if (method === 'card') {
        cardOption.classList.add('selected');
        formData.paymentType = 'card';
        hiddenInput.value = 'card';
        isCodSelected = false;
    } else if (method === 'cod') {
        codOption.classList.add('selected');
        formData.paymentType = 'cod';
        hiddenInput.value = 'cod';
        isCodSelected = true;
    }

    updateTotalPrice();
}

export function updateTotalPrice() {
    const totalBox = document.getElementById('totalPriceBox');
    const totalAmount = document.getElementById('totalAmount');

    if (!totalAmount) {
        console.error('Total amount element not found');
        return;
    }

    // Ensure we have a valid base price
    if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
        if (totalBox) {
            totalBox.style.display = 'none';
        }
        console.warn('[updateTotalPrice] Invalid base price:', basePrice);
        return;
    }

    // Calculate final price
    let finalPrice = basePrice;
    // Include extras from formData
    const pkg = parseFloat(formData.packagePrice || 0) || 0;
    const speed = parseFloat(formData.orderSpeedPrice || 0) || 0;
    finalPrice += pkg + speed;
    if (isCodSelected || formData.paymentType === 'cod') {
        finalPrice += COD_FEE;
    }

    // Update formData with final price
    formData.price = finalPrice;

    // Update UI
    const eur = (finalPrice/1.95583).toFixed(2);
    totalAmount.textContent = `${finalPrice.toFixed(2)} ${getCurrencySymbol()} ( €${eur} )`;

    // Update bottom CTA button with real-time price
    const jumpBtn = document.getElementById('btnJumpSubmit');
    if (jumpBtn) {
        jumpBtn.textContent = `Завършете Поръчката си — ${finalPrice.toFixed(2)} ${getCurrencySymbol()} ( €${eur} )`;
    }
    if (totalBox) {
        totalBox.style.display = 'flex';
    }

}

export function setBasePrice(price) {
    const numericPrice = parseFloat(price);
    
    if (isNaN(numericPrice) || numericPrice < 0) {
        console.error('[setBasePrice] Invalid price:', price);
        return;
    }

    basePrice = numericPrice;
    
    // Update the total price with new base price
    updateTotalPrice();
}

// Make functions available globally for backward compatibility
window.selectPaymentMethod = selectPaymentMethod;
window.updateTotalPrice = updateTotalPrice;