import { initStep1V2 } from './step1.js';
import { initStep2V2 } from './step2.js';
import { initStep3V2 } from './step3.js';
import { setupStepNavigationV2 } from './stepNavigation.js';
import { formData } from '../../js/data.js';
import { setCookie, getCookieValue } from '../../js/utils/cookies.js';

document.addEventListener('DOMContentLoaded', () => {
  // Set currency fixed to BGN (Bulgarian only)
  formData.currency = 'BGN';

  // Track referrer
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');
  if (ref) {
    setCookie('referrer', ref, 10);
  }

  // Init steps
  initStep1V2();
  initStep2V2();
  initStep3V2();

  // Navigation
  setupStepNavigationV2();

  window.formData = formData;
});


