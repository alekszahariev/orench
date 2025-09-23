import { formData } from '../../js/data.js';
import { setBasePrice, updateTotalPrice } from '../../js/utils/payment.js';
import { formatPrice } from '../../js/utils/currency.js';
import { config } from '../../js/config.js';

export function initStep2V2() {
  const sizeContainer = document.querySelector('.size-options-step3');
  const sizeErrorStep3 = document.getElementById('sizeErrorStep3');
  const packageOptions = document.querySelectorAll('.package-option');
  const speedOptions = document.querySelectorAll('.speed-option');
  const premiumInfoBtn = document.getElementById('premiumInfoBtn');
  const premiumModal = document.getElementById('premiumModal');
  const closePremiumModal = document.getElementById('closePremiumModal');
  const step2Next = document.getElementById('step2NextV2');

  function enforcePriorityFlag() {
    try {
      const fastEl = document.querySelector('.speed-option[data-type="fast"]');
      const stdEl = document.querySelector('.speed-option[data-type="standard"]');
      if (!config.enablePriorityOrder) {
        if (fastEl) fastEl.style.display = 'none';
        if (stdEl) {
          document.querySelectorAll('.speed-option').forEach(p => p.classList.remove('selected'));
          stdEl.classList.add('selected');
        }
        formData.orderSpeed = 'standard';
        formData.orderSpeedPrice = 0;
        updateTotalPrice();
      } else {
        if (fastEl) fastEl.style.display = '';
      }
    } catch (e) {}
  }

  function computeAdjustedSizePrice(basePrice) {
    const count = formData.peopleCount || 1;
    if (count <= 1) return basePrice;
    if (count === 2) return basePrice * 2;
    return basePrice * count * 0.8;
  }

  let sizesLoaded = false;
  let sizesData = null;
  async function loadSizes() {
    try {
      if (!sizesLoaded) {
        const res = await fetch('https://custom-apis.vercel.app/api/airtable_getsizes');
        sizesData = await res.json();
        sizesLoaded = true;
      }
      renderSizes();
    } catch (e) {
      console.error('sizes v2 error', e);
    }
  }

  function renderSizes() {
    if (!sizeContainer || !sizesData) return;
    const currencySymbol = 'лв.';
    sizeContainer.innerHTML = '';
    sizesData.forEach(item => {
      const name = item.Name || '';
      const price = parseFloat(item.Price || '0');
      const numericSize = name.replace(/\D/g, '');
      if (!name || !price) return;
      const div = document.createElement('div');
      div.className = 'size-option';
      div.dataset.size = numericSize;
      div.dataset.price = String(price);
      if (numericSize === '15') {
        const badge = document.createElement('div');
        badge.className = 'popular-badge';
        badge.textContent = 'Най-поръчвано';
        badge.style.cssText = 'position:absolute;top:-8px;right:-8px;background:#ff4444;color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:bold;z-index:1;box-shadow:0 2px 4px rgba(0,0,0,0.2);';
        div.style.position = 'relative';
        div.appendChild(badge);
      }
      const h3 = document.createElement('h3');
      h3.textContent = name;
      const p = document.createElement('p');
      const adjusted = computeAdjustedSizePrice(price);
      const eur = (adjusted / 1.95583).toFixed(2);
      p.innerHTML = `<div>${formatPrice(adjusted)} ${currencySymbol}</div><div style="font-size:0.85em;color:#666;margin-top:2px;">(€${eur})</div>`;
      div.appendChild(h3);
      div.appendChild(p);
      sizeContainer.appendChild(div);
    });

    const sizeOptions = sizeContainer.querySelectorAll('.size-option');
    sizeOptions.forEach(option => {
      option.addEventListener('click', () => {
        sizeOptions.forEach(s => s.classList.remove('selected'));
        option.classList.add('selected');
        formData.size = option.getAttribute('data-size');
        const base = parseFloat(option.getAttribute('data-price')) || 0;
        setBasePrice(computeAdjustedSizePrice(base));
        updateTotalPrice();
        if (sizeErrorStep3) sizeErrorStep3.style.display = 'none';
      });
    });

    if (formData.size) {
      const selected = sizeContainer.querySelector(`.size-option[data-size="${formData.size}"]`);
      if (selected) selected.click(); else sizeContainer.querySelector('.size-option')?.click();
    } else {
      sizeContainer.querySelector('.size-option')?.click();
    }
  }

  packageOptions.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('disabled')) return;
      const type = el.getAttribute('data-type');
      const price = parseFloat(el.getAttribute('data-price')) || 0;
      // Enforce premium packaging availability flag
      if (type === 'premium' && !config.enablePremiumPackaging) return;
      formData.packageType = type;
      formData.packagePrice = price;
      document.querySelectorAll('.package-option').forEach(p => p.classList.remove('selected'));
      el.classList.add('selected');
      updateTotalPrice();
    });
  });

  speedOptions.forEach(el => {
    el.addEventListener('click', () => {
      const type = el.getAttribute('data-type');
      const price = parseFloat(el.getAttribute('data-price')) || 0;
      if (!config.enablePriorityOrder && type === 'fast') return;
      formData.orderSpeed = type;
      formData.orderSpeedPrice = price;
      document.querySelectorAll('.speed-option').forEach(p => p.classList.remove('selected'));
      el.classList.add('selected');
      updateTotalPrice();
    });
  });

  if (premiumInfoBtn && premiumModal && closePremiumModal) {
    premiumInfoBtn.addEventListener('click', () => {
      premiumModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
    closePremiumModal.addEventListener('click', () => {
      premiumModal.style.display = 'none';
      document.body.style.overflow = '';
    });
    premiumModal.addEventListener('click', (e) => {
      if (e.target === premiumModal) {
        premiumModal.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  step2Next.addEventListener('click', () => {
    if (!formData.size) {
      if (sizeErrorStep3) {
        sizeErrorStep3.style.display = 'block';
        sizeErrorStep3.textContent = 'Моля, изберете размер.';
      }
      return;
    }
    goToStep(3);
  });

  enforcePriorityFlag();
  // Apply premium packaging flag: hide/disable premium card if disabled
  try {
    const premiumEl = document.querySelector('.package-option[data-type="premium"]');
    if (premiumEl) {
      if (!config.enablePremiumPackaging) {
        premiumEl.classList.add('disabled');
        premiumEl.style.opacity = '0.5';
        premiumEl.style.pointerEvents = 'none';
        if (premiumEl.classList.contains('selected')) {
          const basicEl = document.querySelector('.package-option[data-type="basic"]');
          if (basicEl) basicEl.click();
        }
      } else {
        premiumEl.classList.remove('disabled');
        premiumEl.style.opacity = '';
        premiumEl.style.pointerEvents = '';
      }
    }
  } catch (e) {}
  loadSizes();
}


