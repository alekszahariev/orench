export function scrollToError(errorElement) {
    const fieldContainer = errorElement.closest('.field-container') || errorElement.closest('.form-step');
    if (fieldContainer) {
        fieldContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = fieldContainer.querySelector('input, textarea, select');
        if (input) setTimeout(() => input.focus(), 300);
    } else {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

const BG_MESSAGES = {
    clothesError: 'Описанието трябва да е поне 8 символа.',
    poseError: 'Моля, изберете поза.',
    styleError: 'Моля, изберете стил.',
    photoError: 'Моля, качете JPEG или PNG файл.',
    nameError: 'Моля, въведете пълното си име.',
    emailError: 'Моля, въведете валиден имейл адрес.',
    phoneError: 'Моля, въведете валиден телефонен номер.',
    addressError: 'Моля, въведете вашия адрес.',
    countryError: 'Моля, въведете вашата държава.',
    cityError: 'Моля, въведете вашия град.',
    postcodeError: 'Моля, въведете вашия пощенски код.',
    sizeError: 'Моля, изберете размер.',
    paymentTypeError: 'Моля, изберете начин на плащане.'
};

export function showError(el, keyOrText) {
    const text = BG_MESSAGES[keyOrText] || keyOrText || 'Моля, проверете въведените данни.';
    el.textContent = text;
    el.style.display = 'block';
}

export function hideError(el) {
    el.style.display = 'none';
}