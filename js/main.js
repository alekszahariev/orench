import { initStep1 } from './steps/step1.js';
import { initStep2 } from './steps/step2.js';
import { initStep3 } from './steps/step3.js';
import { initStep4 } from './steps/step4.js';
import { setupStepNavigation } from './steps/stepNavigation.js';
import { loadReviews } from './components/getreview.js';
import { formData } from './data.js';
import './components/getposes.js';
import './components/getsizes.js';
import './components/getstyle.js';
import { initPaymentMethods } from './utils/payment.js';
import { setCookie,getCookieValue } from './utils/cookies.js';

const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get('ref');
if (ref) {
  setCookie('referrer', ref, 10); // запази за 10 дни
}

document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    // Set currency fixed to BGN (Bulgarian only)
    formData.currency = 'BGN';
    // Init all steps
    initStep1();
    initStep2();
    initStep3();
    initStep4();

    // Navigation and jump buttons
    setupStepNavigation();
    window.formData = formData
});


