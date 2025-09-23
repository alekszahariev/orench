let currentStep = 1;

export function setupStepNavigationV2() {
    const steps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const progressFill = document.getElementById('progressFill');

    window.goToStep = function(step) {
        if (step < 1 || step > steps.length) return;
        currentStep = step;

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.remove('active', 'completed');
            if (index + 1 < currentStep) indicator.classList.add('completed');
            if (index + 1 === currentStep) indicator.classList.add('active');
        });

        if (progressFill) {
            progressFill.style.width = `${((currentStep - 1) / (steps.length - 1)) * 100}%`;
        }

        steps.forEach((stepEl, index) => {
            stepEl.classList.toggle('active', index === currentStep - 1);
        });

        document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
    };

    stepIndicators.forEach((indicator) => {
        const step = parseInt(indicator.getAttribute('data-step'));
        indicator.addEventListener('click', () => {
            if (step <= currentStep) {
                goToStep(step);
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = parseInt(btn.getAttribute('data-step'));
            goToStep(target);
        });
    });
}


