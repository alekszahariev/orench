import { formData } from '../data.js';
import { validateEmail, validatePhone } from '../utils/validators.js';
import { showError, hideError, scrollToError } from '../utils/dom.js';
import { postOrder, validatePromoCode } from '../utils/api.js';
import { updateTotalPrice } from '../utils/payment.js';


export function initStep4() {
  const form = document.getElementById('figureForm');
  const submitForm = document.getElementById('submitForm');
  const submissionLoading = document.getElementById('submissionLoading');
  const submissionSuccess = document.getElementById('submissionSuccess');
  const submissionError = document.getElementById('submissionError');
  const promoInput = document.getElementById('promoCodeInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoError = document.getElementById('promoError');
  const promoFeedback = document.getElementById('promoFeedback');

  const fields = ['fullName', 'email', 'phone', 'address', 'country', 'city', 'postcode'];
  fields.forEach(field => {
    const input = document.getElementById(field);
    input.addEventListener('input', () => formData.contact[field] = input.value);
  });

  // Prefill promo code if already set
  if (promoInput && formData.promo && formData.promo.code) {
    promoInput.value = formData.promo.code;
  }

  async function handleApplyPromo() {
    if (!promoInput) return;
    const code = (promoInput.value || '').trim();
    if (!code) {
      if (promoError) {
        promoError.style.display = 'block';
        promoError.textContent = 'Моля, въведете промо код.';
      }
      if (promoFeedback) promoFeedback.style.display = 'none';
      formData.promo = { code: '', percentOff: 0, isValid: false };
      updateTotalPrice();
      return;
    }
    // loading state
    if (applyPromoBtn) {
      applyPromoBtn.disabled = true;
      applyPromoBtn.textContent = 'Проверка...';
    }
    if (promoError) {
      promoError.style.display = 'none';
      promoError.textContent = '';
    }
    if (promoFeedback) {
      promoFeedback.style.display = 'none';
      promoFeedback.textContent = '';
    }
    try {
      const result = await validatePromoCode(code);
      // Expecting { status: true, off: 15 }
      const isValid = !!result && (result.status === true || result.status === 'true');
      const percentOff = isValid ? parseFloat(result.off) || 0 : 0;
      if (isValid && percentOff > 0) {
        formData.promo.code = code;
        formData.promo.percentOff = percentOff;
        formData.promo.isValid = true;
        if (promoFeedback) {
          promoFeedback.style.display = 'block';
          promoFeedback.textContent = `Успешно приложен промо код: -${percentOff}%`;
        }
      } else {
        formData.promo = { code: '', percentOff: 0, isValid: false };
        if (promoError) {
          promoError.style.display = 'block';
          promoError.textContent = 'Невалиден промо код.';
        }
      }
    } catch (e) {
      console.error('Promo validation error', e);
      formData.promo = { code: '', percentOff: 0, isValid: false };
      if (promoError) {
        promoError.style.display = 'block';
        promoError.textContent = 'Грешка при проверка на промо кода. Опитайте отново.';
      }
    } finally {
      if (applyPromoBtn) {
        applyPromoBtn.disabled = false;
        applyPromoBtn.textContent = 'Приложи';
      }
      updateTotalPrice();
    }
  }

  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', handleApplyPromo);
  }
  if (promoInput) {
    promoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyPromo();
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const validators = {
      email: validateEmail(formData.contact.email),
      phone: validatePhone(formData.contact.phone)
    };

    let valid = true;
    fields.forEach(field => {
      const val = formData.contact[field];
      const errorEl = document.getElementById(field + 'Error');
      if (!val || (validators[field] === false)) {
        showError(errorEl, field + 'Error');
        if (valid) scrollToError(errorEl);
        valid = false;
      } else {
        hideError(errorEl);
      }
    });

    if (!formData.size || !formData.paymentType) {
      showError(document.getElementById('sizeError'), 'sizeError');
      showError(document.getElementById('paymentError'), 'paymentTypeError');
      return;
    }

    if (!valid) return;

    submissionLoading.style.display = 'block';

    const fd = new FormData();
    // Send all uploaded photos
    const peopleCount = formData.peopleCount || 1;
    const photos = Array.isArray(formData.personPhotos) && formData.personPhotos.length > 0
      ? formData.personPhotos.slice(0, peopleCount)
      : [formData.personPhoto];
    photos.forEach((p, idx) => {
      if (p && p.file) {
        fd.append(`PersonPhoto_${idx+1}`, p.file);
        fd.append(`FileName_PersonPhoto_${idx+1}`, p.name || `person_${idx+1}.jpg`);
      }
    });
    // Backwards compatibility: only for single-person orders
    if (peopleCount === 1 && photos[0] && photos[0].file) {
      fd.append('PersonPhoto', photos[0].file);
      fd.append('FileName_PersonPhoto', photos[0].name || 'person_1.jpg');
    }
    fd.append('peopleCount', String(peopleCount));
    fd.append('pose', formData.pose);
    fd.append('clothesDescription', formData.clothesDescription);
    fd.append('size', formData.size);
    fd.append('price', formData.price);
    // In case backend needs final discount info explicitly
    if (formData.promo && formData.promo.isValid) {
      fd.append('priceDiscounted', String(formData.price));
    }
    fd.append('packageType', formData.packageType);
    fd.append('packagePrice', formData.packagePrice);
    fd.append('orderSpeed', formData.orderSpeed);
    fd.append('orderSpeedPrice', formData.orderSpeedPrice);
    fd.append('fullName', formData.contact.fullName);
    fd.append('email', formData.contact.email);
    fd.append('phone', validatePhone(formData.contact.phone));
    fd.append('address', formData.contact.address);
    fd.append('country', formData.contact.country);
    fd.append('city', formData.contact.city);
    fd.append('postcode', formData.contact.postcode);
    fd.append('PreviewImage', formData.previewPhoto.file);
    // If user selected a specific preview in Step 3 slider, prefer that
    if (Array.isArray(formData.previewPhotos) && formData.previewPhotos.length > 0) {
      const idx = (typeof formData.selectedPreviewIndex === 'number' && formData.selectedPreviewIndex >= 0)
        ? formData.selectedPreviewIndex
        : 0;
      const selected = formData.previewPhotos[idx];
      if (selected && selected.file) {
        fd.set('PreviewImage', selected.file);
      }
    }
    fd.append('currency', formData.currency);
    fd.append('paymentType', formData.paymentType);
    // Promo fields
    if (formData.promo && formData.promo.isValid) {
      fd.append('promoCode', formData.promo.code);
      fd.append('promoPercentOff', String(formData.promo.percentOff));
    }
    formData.affiliate = getCookieValue('referrer');

    if (formData.affiliate) {
      fd.append('refer', formData.affiliate);
    }

    try {
      const submitBtn = document.getElementById('submitForm');
      submitForm.disabled = true;
                 let loadingPercent = 1;
                const loadingInterval = setInterval(() => {
                    loadingPercent++;
                     submitBtn.textContent = `Зарежда ${loadingPercent}% ✨`;
                    if (loadingPercent >= 100) {
                        clearInterval(loadingInterval);
                    }
                }, 120); // 5000ms / 100 steps = 50ms per step
      const res = await postOrder(fd);
      // add 0-100% loading animation on the submit button over 10 second
      const result = await res.json();
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        submissionSuccess.style.display = 'flex';
      }
    } catch (err) {
      console.error(err);
      submissionError.style.display = 'flex';
    } finally {
      submissionLoading.style.display = 'none';
    }
  });
}