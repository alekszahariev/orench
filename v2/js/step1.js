import { formData } from '../../js/data.js';
import { showError, hideError, scrollToError } from '../../js/utils/dom.js';
import { compressImage } from '../../js/utils/compressimage.js';

export function initStep1V2() {
  const photosContainer = document.getElementById('photosContainer');
  const photoError = document.getElementById('photoError');
  const step1Next = document.getElementById('step1Next');
  const minusBtn = document.getElementById('peopleMinus');
  const plusBtn = document.getElementById('peoplePlus');
  const valueEl = document.getElementById('peopleValue');

  if (!formData.peopleCount) formData.peopleCount = 1;
  if (!Array.isArray(formData.personPhotos)) formData.personPhotos = [];

  function createSlot(index) {
    const slot = document.createElement('div');
    slot.className = 'photo-slot';
    slot.dataset.index = String(index);

    const upload = document.createElement('div');
    upload.className = 'photo-upload';
    upload.innerHTML = `
      <input type="file" accept="image/jpeg, image/png" hidden>
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="upload-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
      <p>Снимка на лице #${index + 1}</p>
      <small>JPEG или PNG, макс. 10MB</small>
    `;

    const preview = document.createElement('div');
    preview.className = 'photo-preview';
    preview.style.display = 'none';

    const img = document.createElement('img');
    img.alt = `Preview ${index + 1}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-photo';
    remove.textContent = '×';
    preview.appendChild(img);
    preview.appendChild(remove);

    slot.appendChild(upload);
    slot.appendChild(preview);
    photosContainer.appendChild(slot);

    const input = upload.querySelector('input');
    upload.addEventListener('click', () => input.click());
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) {
        showError(photoError, 'photoError');
        scrollToError(photoError);
        return;
      }
      try {
        const compressedFile = await compressImage(file, 0.7, 1000);
        const reader = new FileReader();
        reader.onload = (ev) => {
          const fileObj = { file: compressedFile, name: compressedFile.name, file_b64: ev.target.result };
          formData.personPhotos[index] = fileObj;
          if (index === 0) formData.personPhoto = fileObj;
          img.src = ev.target.result;
          upload.style.display = 'none';
          preview.style.display = 'block';
          hideError(photoError);
        };
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error('Image compression failed:', err);
        showError(photoError, 'photoError');
        scrollToError(photoError);
      }
    });

    remove.addEventListener('click', (ev) => {
      ev.stopPropagation();
      formData.personPhotos[index] = { file: '', name: '', file_b64: '' };
      if (index === 0) formData.personPhoto = { file: '', name: '', file_b64: '' };
      input.value = '';
      preview.style.display = 'none';
      upload.style.display = 'flex';
    });
  }

  function renderSlots() {
    photosContainer.innerHTML = '';
    for (let i = 0; i < formData.peopleCount; i++) {
      if (!formData.personPhotos[i]) formData.personPhotos[i] = { file: '', name: '', file_b64: '' };
      createSlot(i);
      const slot = photosContainer.lastElementChild;
      const upload = slot.querySelector('.photo-upload');
      const preview = slot.querySelector('.photo-preview');
      const img = slot.querySelector('img');
      const existing = formData.personPhotos[i];
      if (existing && existing.file_b64) {
        img.src = existing.file_b64;
        upload.style.display = 'none';
        preview.style.display = 'block';
      }
    }
  }

  function updateCounterDisplay() {
    valueEl.textContent = String(formData.peopleCount);
  }

  minusBtn.addEventListener('click', () => {
    if (formData.peopleCount > 1) {
      formData.peopleCount--;
      formData.personPhotos = formData.personPhotos.slice(0, formData.peopleCount);
      updateCounterDisplay();
      renderSlots();
    }
  });

  plusBtn.addEventListener('click', () => {
    if (formData.peopleCount < 3) {
      formData.peopleCount++;
      updateCounterDisplay();
      renderSlots();
    }
  });

  step1Next.addEventListener('click', () => {
    const hasAll = formData.personPhotos.slice(0, formData.peopleCount).every(p => p && p.file);
    if (!hasAll) {
      showError(photoError, 'Моля, качете снимка за всеки човек.');
      scrollToError(photoError);
    } else {
      goToStep(2);
    }
  });

  updateCounterDisplay();
  renderSlots();
}


