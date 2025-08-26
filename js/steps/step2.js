import { formData } from '../data.js';
import { showError, hideError, scrollToError } from '../utils/dom.js';

export function initStep2() {
  const clothesDescription = document.getElementById('clothesDescription');
  const clothesError = document.getElementById('clothesError');
  const poseError = document.getElementById('poseError');
  const styleError = document.getElementById('styleError');
  const step2Next = document.getElementById('step2Next');

  clothesDescription.addEventListener('input', () => {
    formData.clothesDescription = clothesDescription.value;
    if (clothesDescription.value.length >= 8) hideError(clothesError);
  });

  step2Next.addEventListener('click', () => {
    let valid = true;
    if (clothesDescription.value.length < 8) {
      showError(clothesError, 'clothesError');
      scrollToError(clothesError);
      valid = false;
    }
    if (!formData.pose) {
      showError(poseError, 'poseError');
      scrollToError(poseError);
      valid = false;
    }
    if (!formData.imgStyle) {
      showError(styleError, 'styleError');
      scrollToError(styleError);
      valid = false;
    }
    if (valid) goToStep(3);
  });
}