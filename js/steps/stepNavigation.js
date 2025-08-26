// stepNavigation.js – Handles navigation between steps

import { resetPreview } from './step3.js';

let currentStep = 1;

export function setupStepNavigation() {
  const steps = document.querySelectorAll('.form-step');
  const stepIndicators = document.querySelectorAll('.step-indicator');
  const progressFill = document.getElementById('progressFill');

  window.goToStep = function(step) {
    if (step < 1 || step > steps.length) return;

    currentStep = step;

    // Update indicators
    stepIndicators.forEach((indicator, index) => {
      indicator.classList.remove('active', 'completed');
      if (index + 1 < currentStep) indicator.classList.add('completed');
      if (index + 1 === currentStep) indicator.classList.add('active');
    });

    // Update progress bar
    if (progressFill) {
      progressFill.style.width = `${((currentStep - 1) / (steps.length - 1)) * 100}%`;
    }

    // Show current step, hide others
    steps.forEach((stepEl, index) => {
      stepEl.classList.toggle('active', index === currentStep - 1);
    });

    // Jump-to-submit button logic (if present)
    const jumpBtn = document.getElementById('jumpToSubmit');
    if (jumpBtn) {
      jumpBtn.style.display = (currentStep === 3) ? 'block' : 'none';
    }

    document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Allow clicking indicators to go back
  stepIndicators.forEach((indicator) => {
    const step = parseInt(indicator.getAttribute('data-step'));
    indicator.addEventListener('click', () => {
      if (step <= currentStep) {
        goToStep(step);
      }
    });
  });

  // Back buttons
  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = parseInt(btn.getAttribute('data-step'));

      if(target == "2"){
       resetPreview()
      }
      goToStep(target);
    });
  });
}