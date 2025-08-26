import { formData } from '../data.js';
import { formatPrice } from '../utils/currency.js';
import { setBasePrice, initPaymentMethods } from '../utils/payment.js';

// Функция за конвертиране от лева в евро
function convertBgnToEur(bgn) {
  const exchangeRate = 1.95583; // Фиксиран курс на лева спрямо евро
  return (bgn / exchangeRate).toFixed(2);
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.size-options');

  function updateMainPriceDisplay(data, currencySymbol) {
    const priceElement = document.querySelector('.price-section .price');
    const priceNoteElement = document.querySelector('.price-section .price-note-class');

    const item12cm = data.find(item => {
      const name = item.Name || '';
      return name.replace(/\D/g, '') === '12';
    });

    if (priceElement && item12cm) {
      const price = item12cm.Price || '';
      const priceInEur = convertBgnToEur(parseFloat(price));
      priceElement.innerHTML = `
        <div>от ${formatPrice(price)} ${currencySymbol} за 12 см</div>
        <div style="font-size: 0.85em; color: #666; margin-top: 4px;">(от €${priceInEur})</div>
      `;
    }

    if (priceNoteElement) {
      priceNoteElement.textContent = '*Цената зависи от избрания размер';
    }
  }

  try {
    const response = await fetch('https://custom-apis.vercel.app/api/airtable_getsizes');
    const data = await response.json();
    const currencySymbol = 'лв.';

    if (data && data.length > 0) {
      updateMainPriceDisplay(data, currencySymbol);
    }

    data.forEach(item => {
      const name = item.Name || '';
      const price = item.Price || '';
      const numericSize = name.replace(/\D/g, '');

      if (name && price) {
        const div = document.createElement('div');
        div.className = 'size-option';
        div.dataset.size = numericSize;
        div.dataset.price = price;

        if (numericSize === '15') {
          const badge = document.createElement('div');
          badge.className = 'popular-badge';
          const badgeText = 'Най-Поръчвано';
          badge.textContent = badgeText;
          badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff4444;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          `;
          div.style.position = 'relative';
          div.appendChild(badge);
        }

        const h3 = document.createElement('h3');
        h3.textContent = name;

        const p = document.createElement('p');
        const priceInEur = convertBgnToEur(parseFloat(price));
        p.innerHTML = `
          <div>${formatPrice(price)} ${currencySymbol}</div>
          <div style="font-size: 0.85em; color: #666; margin-top: 2px;">(€${priceInEur})</div>
        `;

        div.appendChild(h3);
        div.appendChild(p);
        container.appendChild(div);
      }
    });

    // Initialize payment methods after sizes are loaded
    initPaymentMethods();

    const sizeError = document.getElementById('sizeError');
    const sizeOptions = document.querySelectorAll('.size-option');

    sizeOptions.forEach(option => {
      option.addEventListener('click', () => {
        sizeOptions.forEach(s => s.classList.remove('selected'));
        option.classList.add('selected');

        const size = option.getAttribute('data-size');
        const basePrice = parseFloat(option.getAttribute('data-price'));

        // Update formData
        formData.size = size;
        
        // Set the base price (this will automatically calculate total with payment method)
        setBasePrice(basePrice);

        // Hide size error if visible
        if (sizeError) sizeError.style.display = 'none';
        
      });
    });

    // Auto-select the first size on page load
    const firstSize = document.querySelector('.size-option[data-price]');
    if (firstSize) {
      setTimeout(() => {
        firstSize.click();
      }, 100); // Small delay to ensure everything is initialized
    }

  } catch (err) {
    console.error('Error loading sizes:', err);
  }
});