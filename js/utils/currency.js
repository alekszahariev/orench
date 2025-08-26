// currency.js – Utilities for handling currency symbols and formatting

export function getCurrencySymbol() {
  return 'лв.';
}

export function formatPrice(price) {
  const num = parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

// Функция за обновяване на валутните символи в DOM
export function updateCurrencySymbols() {
  const currencySymbol = getCurrencySymbol();
  document.querySelectorAll('.currency-symbol').forEach(element => {
      element.textContent = currencySymbol;
  });
}