import { formData } from '../../js/data.js';
import { validateEmail, validatePhone } from '../../js/utils/validators.js';
import { showError, hideError, scrollToError } from '../../js/utils/dom.js';
import { postOrder, validatePromoCode } from '../../js/utils/api.js';
import { initPaymentMethods, updateTotalPrice } from '../../js/utils/payment.js';
import { setCookie, getCookieValue } from '../../js/utils/cookies.js';

export function initStep3V2() {
  const form = document.getElementById('figureFormV2');
  const submitBtn = document.getElementById('submitFormV2');
  const submissionLoading = document.getElementById('submissionLoadingV2');
  const submissionSuccess = document.getElementById('submissionSuccessV2');
  const submissionError = document.getElementById('submissionErrorV2');
  const promoInput = document.getElementById('promoCodeInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoError = document.getElementById('promoError');
  const promoFeedback = document.getElementById('promoFeedback');

  // Prefill promo
  if (promoInput && formData.promo && formData.promo.code) {
    promoInput.value = formData.promo.code;
  }

  // Bind contact inputs
  const fields = ['fullName', 'email', 'phone', 'address', 'country', 'city', 'postcode'];
  fields.forEach(field => {
    const input = document.getElementById(field);
    input.addEventListener('input', () => formData.contact[field] = input.value);
  });

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

  if (applyPromoBtn) applyPromoBtn.addEventListener('click', handleApplyPromo);
  if (promoInput) {
    promoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); handleApplyPromo(); }
    });
  }

  initPaymentMethods();
  updateTotalPrice();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1) Validate photos (Step 1)
    const hasRequiredPhotos = Array.isArray(formData.personPhotos)
      && formData.personPhotos.slice(0, formData.peopleCount || 1).every(p => p && p.file);
    if (!hasRequiredPhotos) {
      const photoError = document.getElementById('photoError');
      if (photoError) {
        showError(photoError, 'Моля, качете снимка за всеки човек.');
        goToStep(1);
        scrollToError(photoError);
      }
      return;
    }

    // 2) Validate size selection (Step 2)
    if (!formData.size) {
      const sizeErr = document.getElementById('sizeErrorStep3');
      if (sizeErr) {
        showError(sizeErr, 'sizeError');
        goToStep(2);
        scrollToError(sizeErr);
      }
      return;
    }

    // 3) Validate payment method (Step 3)
    if (!formData.paymentType) {
      const payErr = document.getElementById('paymentError');
      if (payErr) {
        showError(payErr, 'paymentTypeError');
        scrollToError(payErr);
      }
      return;
    }

    // 4) Validate contact fields (Step 3)
    const contactErrorKeys = {
      fullName: 'nameError',
      email: 'emailError',
      phone: 'phoneError',
      address: 'addressError',
      country: 'countryError',
      city: 'cityError',
      postcode: 'postcodeError'
    };

    let firstErrorEl = null;
    let hasContactError = false;

    Object.keys(contactErrorKeys).forEach((field) => {
      const raw = (formData.contact[field] || '').trim();
      let isValidField = true;

      if (field === 'email') {
        isValidField = validateEmail(raw);
      } else if (field === 'phone') {
        const normalized = validatePhone(raw);
        isValidField = !!normalized;
        if (normalized) formData.contact.phone = normalized;
      } else {
        isValidField = !!raw;
      }

      const errorEl = document.getElementById(field + 'Error');
      if (!isValidField) {
        showError(errorEl, contactErrorKeys[field]);
        if (!firstErrorEl) firstErrorEl = errorEl;
        hasContactError = true;
      } else if (errorEl) {
        hideError(errorEl);
      }
    });

    if (hasContactError) {
      if (firstErrorEl) scrollToError(firstErrorEl);
      return;
    }

    submissionLoading.style.display = 'block';
    submitBtn.disabled = true;

    const fd = new FormData();
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
    if (peopleCount === 1 && photos[0] && photos[0].file) {
      fd.append('PersonPhoto', photos[0].file);
      fd.append('FileName_PersonPhoto', photos[0].name || 'person_1.jpg');
    }
    // Also attach PreviewImage same as the main uploaded image (first person photo)
    if (photos[0] && photos[0].file) {
      fd.append('PreviewImage', photos[0].file);
    }
    fd.append('peopleCount', String(peopleCount));
    // No preview generation in V2; we still send core order data
    fd.append('pose', formData.pose || '');
    fd.append('clothesDescription', formData.clothesDescription || '');
    fd.append('size', formData.size);
    fd.append('price', formData.price);
    if (formData.promo && formData.promo.isValid) {
      fd.append('priceDiscounted', String(formData.price));
    }
    fd.append('packageType', formData.packageType || 'basic');
    fd.append('packagePrice', formData.packagePrice || 0);
    fd.append('orderSpeed', formData.orderSpeed || 'standard');
    fd.append('orderSpeedPrice', formData.orderSpeedPrice || 0);
    fd.append('fullName', formData.contact.fullName);
    fd.append('email', formData.contact.email);
    fd.append('phone', validatePhone(formData.contact.phone));
    fd.append('address', formData.contact.address);
    fd.append('country', formData.contact.country);
    fd.append('city', formData.contact.city);
    fd.append('postcode', formData.contact.postcode);
    fd.append('currency', formData.currency);
    fd.append('paymentType', formData.paymentType);
    if (formData.promo && formData.promo.isValid) {
      fd.append('promoCode', formData.promo.code);
      fd.append('promoPercentOff', String(formData.promo.percentOff));
    }
    formData.affiliate = getCookieValue('referrer');
    if (formData.affiliate) {
      fd.append('refer', formData.affiliate);
    }
    // Explicitly mark order as V2 flow without preview
    fd.append('flowVersion', 'v2_no_preview');

    try {
      let loadingPercent = 1;
      const loadingInterval = setInterval(() => {
        loadingPercent++;
        submitBtn.textContent = `Зарежда ${loadingPercent}% ✨`;
        if (loadingPercent >= 100) clearInterval(loadingInterval);
      }, 120);

      const res = await postOrder(fd);
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
      submitBtn.disabled = false;
      submitBtn.textContent = 'Изпрати поръчка';
    }
  });
}


