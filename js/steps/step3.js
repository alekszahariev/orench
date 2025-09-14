// step3.js – Enhanced Preview Generation with Loading UI
import { formData } from '../data.js';
import { getUserIP, postToPreviewAPI } from '../utils/api.js';
import { compressBase64Image } from '../utils/compressimage.js';
import { setBasePrice, updateTotalPrice } from '../utils/payment.js';
import { formatPrice } from '../utils/currency.js';
import { config } from '../config.js';


let isPreviewGenerated = false;
let progressInterval;
let previewSwiper;
let isGenerating = false; // prevent duplicate webhook calls
let step3Initialized = false; // prevent duplicate event bindings

export function initStep3() {
  if (step3Initialized) return;
  step3Initialized = true;
  const generatePreview = document.getElementById('generatePreview');
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const previewLoading = document.getElementById('previewLoading');
  const previewResult = document.getElementById('previewResult');
  const previewSlides = document.getElementById('previewSlides');
  const previewInfo = document.getElementById('previewInfo');
  const previewErrorContainer = document.getElementById('previewErrorContainer');
  const previewError = document.getElementById('previewError');
  const retryPreview = document.getElementById('retryPreview');
  const step2Next = document.getElementById('step2Next');
  const step3Next = document.getElementById('step3Next');
  document.getElementById('btnJumpSubmit').textContent = 'Завършете Поръчката си';
  // Initialize placeholder slider
  try {
    new Swiper('.example-slider', { slidesPerView: 'auto', spaceBetween: 16, grabCursor: true });
  } catch (e) {}

  // Step 3 options: sizes, package, speed
  const sizeContainer = document.querySelector('.size-options-step3');
  const sizeErrorStep3 = document.getElementById('sizeErrorStep3');
  const packageOptions = document.querySelectorAll('.package-option');
  const speedOptions = document.querySelectorAll('.speed-option');
  const premiumInfoBtn = document.getElementById('premiumInfoBtn');
  const premiumModal = document.getElementById('premiumModal');
  const closePremiumModal = document.getElementById('closePremiumModal');

  // Enforce priority-order flag on UI and state
  function enforcePriorityFlag() {
    try {
      const fastEl = document.querySelector('.speed-option[data-type="fast"]');
      const stdEl = document.querySelector('.speed-option[data-type="standard"]');
      if (!config.enablePriorityOrder) {
        // Hide fast option entirely
        if (fastEl) fastEl.style.display = 'none';
        // Force-select standard in UI and state
        if (stdEl) {
          document.querySelectorAll('.speed-option').forEach(p => p.classList.remove('selected'));
          stdEl.classList.add('selected');
        }
        formData.orderSpeed = 'standard';
        formData.orderSpeedPrice = 0;
        updateTotalPrice();
      } else {
        // Show fast option when enabled
        if (fastEl) fastEl.style.display = '';
      }
    } catch (e) {
      // no-op if DOM not ready
    }
  }

  function computeAdjustedSizePrice(basePrice) {
    const count = formData.peopleCount || 1;
    if (count <= 1) return basePrice;
    if (count === 2) return basePrice * 2;
    return basePrice * count * 0.8; // 20% discount for 3+ people
  }

  function updatePeopleMultiplierBadge() {}

  // Inject sizes using the same API as getsizes and re-render on step activation
  let sizesLoaded = false;
  let sizesData = null;
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
        badge.style.cssText = `position:absolute;top:-8px;right:-8px;background:#ff4444;color:#fff;padding:4px 8px;border-radius:12px;font-size:12px;font-weight:bold;z-index:1;box-shadow:0 2px 4px rgba(0,0,0,0.2);`;
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

    // Select previously chosen size or first
    if (formData.size) {
      const selected = sizeContainer.querySelector(`.size-option[data-size="${formData.size}"]`);
      if (selected) selected.click(); else sizeContainer.querySelector('.size-option')?.click();
    } else {
      sizeContainer.querySelector('.size-option')?.click();
    }

    updatePeopleMultiplierBadge();
    // Premium availability toggle
    const premiumEl = document.querySelector('.package-option[data-type="premium"]');
    if (premiumEl) {
      const isAvailable = premiumEl.getAttribute('data-available') !== 'false';
      if (!isAvailable) {
        premiumEl.classList.add('disabled');
        if (!premiumEl.querySelector('.soldout-badge')) {
          const badge = document.createElement('div');
          badge.className = 'soldout-badge';
          badge.textContent = 'Изчерпано';
          premiumEl.appendChild(badge);
        }
        if (premiumEl.classList.contains('selected')) {
          const basicEl = document.querySelector('.package-option[data-type="basic"]');
          if (basicEl) basicEl.click();
        }
      } else {
        premiumEl.classList.remove('disabled');
        const b = premiumEl.querySelector('.soldout-badge');
        if (b) b.remove();
      }
    }
  }

  (async function loadSizesIntoStep3() {
    try {
      if (!sizesLoaded) {
        const res = await fetch('https://custom-apis.vercel.app/api/airtable_getsizes');
        sizesData = await res.json();
        sizesLoaded = true;
      }
      renderSizes();
    } catch (e) {
      console.error('sizes step3 error', e);
    }
  })();

  // Re-render sizes when Step 3 becomes active (e.g., after changing people in Step 1)
  const step3El = document.getElementById('step3');
  if (step3El) {
    const mo = new MutationObserver(() => {
      if (step3El.classList.contains('active')) {
        renderSizes();
      }
    });
    mo.observe(step3El, { attributes: true, attributeFilter: ['class'] });
  }

  function selectPackage(type, price) {
    formData.packageType = type;
    formData.packagePrice = price;
    document.querySelectorAll('.package-option').forEach(p => p.classList.remove('selected'));
    const selected = document.querySelector(`.package-option[data-type="${type}"]`);
    if (selected) selected.classList.add('selected');
    updateTotalPrice();
  }

  function selectSpeed(type, price) {
    formData.orderSpeed = type;
    formData.orderSpeedPrice = price;
    document.querySelectorAll('.speed-option').forEach(p => p.classList.remove('selected'));
    const selected = document.querySelector(`.speed-option[data-type="${type}"]`);
    if (selected) selected.classList.add('selected');
    updateTotalPrice();
  }

  packageOptions.forEach(el => {
    el.addEventListener('click', () => {
      if (el.classList.contains('disabled')) return;
      const type = el.getAttribute('data-type');
      const price = parseFloat(el.getAttribute('data-price')) || 0;
      selectPackage(type, price);
    });
  });
  speedOptions.forEach(el => {
    el.addEventListener('click', () => {
      const type = el.getAttribute('data-type');
      const price = parseFloat(el.getAttribute('data-price')) || 0;
      if (!config.enablePriorityOrder && type === 'fast') return;
      selectSpeed(type, price);
    });
  });
  // Apply flag after listeners are set
  enforcePriorityFlag();
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
  async function generateImagePreview() {
    if (isGenerating) return; // lock
    isGenerating = true;
    document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });

    previewPlaceholder.style.display = 'none';
    previewLoading.style.display = 'flex';
    previewLoading.innerHTML = '';
    step3Next.textContent = 'Завършете Поръчката си';
    isPreviewGenerated = false;

    const loadingAnimation = document.createElement('div');
    loadingAnimation.style.cssText = 'position:relative; width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center';

    const loadingImage = document.createElement('img');
    loadingImage.src = URL.createObjectURL(formData.personPhoto.file);
    loadingImage.style.cssText = 'width:80%; height:80%; object-fit:contain; filter:blur(20px); transition:filter 60s linear; margin-top:100px;';

    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = 'width:80%; margin-top:20px; text-align:center';

    const progressBarBg = document.createElement('div');
    progressBarBg.style.cssText = 'width:100%; height:8px; background-color:#e0e0e0; border-radius:4px; overflow:hidden; margin-bottom:15px';

    const progressBarFill = document.createElement('div');
    progressBarFill.style.cssText = 'height:100%; background-color:#ea384c; width:0%; transition:width 0.3s ease; border-radius:4px';
    progressBarBg.appendChild(progressBarFill);

    const loadingText = document.createElement('p');
    loadingText.textContent = `Създаване на визуализация... 0%`;
    loadingText.style.cssText = 'margin:0 0 10px 0; color:#333; font-weight:bold; font-size:16px';

    const timeText = document.createElement('p');
    timeText.textContent = `Очаквано време: до 1 минута`;
    timeText.style.cssText = 'margin:0; color:#666; font-size:14px';

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.cssText = 'width:30px; height:30px; border:3px solid rgba(0, 0, 0, 0.1); border-radius:50%; border-top:3px solid #ea384c; animation:spin 1s linear infinite; margin:15px auto 60px auto';

    if (!document.getElementById('spinner-style')) {
      const style = document.createElement('style');
      style.id = 'spinner-style';
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    progressContainer.appendChild(loadingText);
    progressContainer.appendChild(progressBarBg);
    progressContainer.appendChild(timeText);
    progressContainer.appendChild(spinner);
    loadingAnimation.appendChild(loadingImage);
    loadingAnimation.appendChild(progressContainer);
    previewLoading.appendChild(loadingAnimation);

    setTimeout(() => loadingImage.style.filter = 'blur(10px)', 100);

    const startTime = Date.now();
    progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const rawProgress = Math.min(elapsed / 60, 0.95);
      const progress = Math.floor(rawProgress * 100);

      progressBarFill.style.width = `${progress}%`;
      loadingText.textContent = progress < 30 ? `Анализиране на снимката... ${progress}%`
        : progress < 60 ?`Генериране на модел... ${progress}%`
        : progress < 90 ? `Прилагане на стил... ${progress}%`
        : `Финализиране... ${progress}%`;

      const remainingTime = Math.max(0, 60 - elapsed);
      timeText.textContent = remainingTime > 30 ? `Остават: около ${Math.ceil(remainingTime)} секунди`
        : remainingTime > 5 ? `Остават: ${Math.ceil(remainingTime)} секунди`
        : remainingTime > 0 ? `Почти готово...`
        : `Обработване на резултата...`;
    }, 500);

    const ip = await getUserIP();
    const formDataToSend = new FormData();
    // Send all uploaded photos
    const peopleCount = formData.peopleCount || 1;
    const photos = Array.isArray(formData.personPhotos) && formData.personPhotos.length > 0
      ? formData.personPhotos.slice(0, peopleCount)
      : [formData.personPhoto];
    photos.forEach((p, idx) => {
      if (p && p.file) {
        formDataToSend.append(`PersonPhoto_${idx+1}`, p.file);
        formDataToSend.append(`FileName_PersonPhoto_${idx+1}`, p.name || `person_${idx+1}.jpg`);
      }
    });
    // Backwards compatibility: only send legacy key for single-person orders
    if (peopleCount === 1 && photos[0] && photos[0].file) {
      formDataToSend.append('PersonPhoto', photos[0].file);
      formDataToSend.append('FileName_PersonPhoto', photos[0].name || 'person_1.jpg');
    }
    formDataToSend.append('peopleCount', String(peopleCount));
    formDataToSend.append('pose', formData.pose);
    formDataToSend.append('clothesDescription', formData.clothesDescription);
    formDataToSend.append('imgStyle', formData.imgStyle);
    formDataToSend.append('ip', ip);

    try {
      const response = await postToPreviewAPI(formDataToSend);
      if (!response.ok) throw new Error('Network error');
      const result = await response.json();

      clearInterval(progressInterval);
      progressBarFill.style.width = '100%';
      loadingText.textContent = `Готово! 100%`;
      timeText.textContent = `Визуализацията е създадена успешно!`;

      if (result.banned === 'true') {
        previewLoading.style.display = 'none';
        previewErrorContainer.style.display = 'flex';
        previewError.textContent = '24ч. лимит е достигнат. Може би имаш нужда от помощ? Моля, свържи се с нас за специално съдействие. 0897728307';
        return;
      }

    const imageUrl = `data:image/png;base64,${result.image}`;
    // Compress to JPEG with 70% quality and use matching extension/type
      const compressedBlob = await compressBase64Image(imageUrl, 'image/jpeg', 0.7);
      const file = new File([compressedBlob], Math.random().toString(36).substring(7) + '.jpg', { type: 'image/jpeg' });
      

      formData.previewPhoto.file_b64 = await new Promise((res) => {
        const reader = new FileReader();
        reader.onloadend = () => res(reader.result);
        reader.readAsDataURL(compressedBlob);
      });
      
      formData.previewPhoto.name = file.name;
      formData.previewPhoto.file = file;

      setTimeout(() => {
        // Save preview locally (newest first)
        formData.previewPhotos = formData.previewPhotos || [];
        const previewId = Math.random().toString(36).slice(2);
        formData.previewPhotos.unshift({ id: previewId, file, url: imageUrl, name: file.name });
        formData.selectedPreviewIndex = 0;

        // Render or prepend slide
        if (previewSlides) {
          const slide = document.createElement('div');
          slide.className = 'swiper-slide';
          const wrap = document.createElement('div');
          wrap.className = 'preview-slide-wrap selected';
          const badge = document.createElement('div');
          badge.className = 'preview-selected-badge';
          badge.textContent = 'избрано';
          const imgEl = document.createElement('img');
          imgEl.src = imageUrl;
          imgEl.alt = 'Figure Preview';
          imgEl.className = 'preview-slide-img selected';
          imgEl.dataset.previewId = previewId;
          imgEl.addEventListener('click', () => {
            document.querySelectorAll('.preview-slide-img').forEach(el => el.classList.remove('selected'));
            document.querySelectorAll('.preview-slide-wrap').forEach(el => el.classList.remove('selected'));
            imgEl.classList.add('selected');
            wrap.classList.add('selected');
            const idx = (formData.previewPhotos || []).findIndex(p => p.id === imgEl.dataset.previewId);
            if (idx >= 0) formData.selectedPreviewIndex = idx;
          });
          wrap.appendChild(imgEl);
          wrap.appendChild(badge);
          slide.appendChild(wrap);
          if (previewSlides.firstChild) {
            previewSlides.insertBefore(slide, previewSlides.firstChild);
          } else {
            previewSlides.appendChild(slide);
          }
          // Clear previous selected states
          const wraps = previewSlides.querySelectorAll('.preview-slide-wrap');
          wraps.forEach((el, i) => {
            if (i === 0) el.classList.add('selected'); else el.classList.remove('selected');
          });
          const imgs = previewSlides.querySelectorAll('.preview-slide-img');
          imgs.forEach((el, i) => {
            if (i !== 0) el.classList.remove('selected');
          });

          try {
            if (!previewSwiper) {
              previewSwiper = new Swiper('#previewSlider', { slidesPerView: 'auto', spaceBetween: 12, grabCursor: true });
            } else {
              previewSwiper.update();
              previewSwiper.slideTo(0, 0);
            }
          } catch (e) {}
        }

        previewLoading.style.display = 'none';
        previewResult.style.display = 'flex';
        previewInfo.style.display = 'flex';
        isPreviewGenerated = true;
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 600);

    } catch (err) {
      console.error('Preview generation error:', err);
      clearInterval(progressInterval);
      previewLoading.style.display = 'none';
      previewErrorContainer.style.display = 'flex';
      previewError.textContent = 'Не успяхме да генерираме модела. Моля, опитайте отново.';
    } finally {
      isGenerating = false;
    }
  }

  generatePreview.addEventListener('click', generateImagePreview);
  step2Next.addEventListener('click', generateImagePreview);

  retryPreview.addEventListener('click', () => {
    if (progressInterval) clearInterval(progressInterval);
    previewErrorContainer.style.display = 'none';
    previewPlaceholder.style.display = 'flex';
    isPreviewGenerated = false;
  });

  document.getElementById('btnJumpSubmit').addEventListener('click', () => {
    if (isPreviewGenerated) {
      goToStep(4);
    } else {
      alert('Моля, генерирайте визуализация преди да продължите!');
      generatePreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  step3Next.addEventListener('click', () => {
    if (isPreviewGenerated) {
      goToStep(4);
    } else {
      alert('Моля, генерирайте визуализация преди да продължите!');
    }
  });
}


export function resetPreview() {
  const previewPlaceholder = document.getElementById('previewPlaceholder');
  const previewLoading = document.getElementById('previewLoading');
  const previewResult = document.getElementById('previewResult');
  const previewInfo = document.getElementById('previewInfo');
  const previewSlides = document.getElementById('previewSlides');
  const previewErrorContainer = document.getElementById('previewErrorContainer');
  

  if (progressInterval) clearInterval(progressInterval);

  if (previewErrorContainer) previewErrorContainer.style.display = 'none';
  if (previewLoading) previewLoading.style.display = 'none';
  // Keep existing previews visible if any
  if (formData.previewPhotos && formData.previewPhotos.length > 0) {
    if (previewResult) previewResult.style.display = 'flex';
    if (previewInfo) previewInfo.style.display = 'flex';
    if (previewPlaceholder) previewPlaceholder.style.display = 'none';
  } else {
    if (previewResult) previewResult.style.display = 'none';
    if (previewInfo) previewInfo.style.display = 'none';
    if (previewPlaceholder) previewPlaceholder.style.display = 'flex';
  }

  // Remove blurred loading image
  const blurImg = previewLoading?.querySelector('img');
  if (blurImg) blurImg.remove();


  // Do not clear stored previews; user can generate more

  isPreviewGenerated = false;
}