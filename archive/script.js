document.addEventListener('DOMContentLoaded', function () {
    // Initialize translations
// Removed translations: BG only

    // Global variables
    const form = document.getElementById('figureForm');
    const steps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const progressFill = document.getElementById('progressFill');
    let currentStep = 1;
    let PreviewFile = '';
    let progressInterval;
    let startTime;
    let isPreviewGenerated = false; // Нова променлива за контрол на preview статуса
    
    window.formData = {
        personPhoto: {
            file: '',
            name: '',
            file_b64: ''
        },
        clothesDescription: '',
        pose: '',
        imgStyle: 'cartoon',
        size: '',
        price: 0,
        paymentType: '',
        currency: "",
        previewPhoto: {
            file_b64: "",
            file: '',
            name: ""
        },
        contact: {
            fullName: '',
            email: '',
            phone: '',
            address: '',
            country: 'bg',
            city: '',
            postcode: ''
        }
    };

    // Initialize form
    initForm();

    // Set currency based on language
const currentLang = 'bg';
    switch (currentLang) {
        case 'de':
            formData.currency = 'EUR';
            break;
        case 'en':
            formData.currency = 'GBP';
            break;
        default:
            formData.currency = 'BGN'; // Default Bulgarian currency
            break;
    }

    const getUserIP = async () => {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        return data.ip;
    };

    function initForm() {
        // Step 1: Photo Upload
        const photoUpload = document.getElementById('photoUpload');
        const photoInput = document.getElementById('photoInput');
        const photoPreview = document.getElementById('photoPreview');
        const previewImage = document.getElementById('previewImage');
        const removePhoto = document.getElementById('removePhoto');
        const photoError = document.getElementById('photoError');
        const step1Next = document.getElementById('step1Next');

        photoUpload.addEventListener('click', () => {
            photoInput.click();
        });

        photoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];

                // Validate file type and size
                if (!['image/jpeg', 'image/png'].includes(file.type)) {
                    showError(photoError, 'photoError');
                    scrollToError(photoError);
                    return;
                }

                if (file.size > 10 * 1024 * 1024) { // 10MB
                    showError(photoError, 'photoError');
                    scrollToError(photoError);
                    return;
                }

                PreviewFile = file;

                const reader = new FileReader();

                reader.onload = (e) => {
                    const base64DataUrl = e.target.result;
                    formData.personPhoto.file = file;
                    formData.personPhoto.file_b64 = base64DataUrl;
                    formData.personPhoto.name = file.name;

                    previewImage.src = base64DataUrl;
                    photoUpload.style.display = 'none';
                    photoPreview.style.display = 'block';
                    hideError(photoError);
                };

                reader.readAsDataURL(file);
            }
        });

        removePhoto.addEventListener('click', (e) => {
            e.stopPropagation();
            photoInput.value = '';
            formData.personPhoto = {
                file: '',
                name: ''
            };
            photoPreview.style.display = 'none';
            photoUpload.style.display = 'flex';
        });

        step1Next.addEventListener('click', () => {
            if (validateStep1()) {
                goToStep(2);
            }
        });

        // Step 2: Figure Details
        const clothesDescription = document.getElementById('clothesDescription');
        const clothesError = document.getElementById('clothesError');
        const step2Next = document.getElementById('step2Next');

        clothesDescription.addEventListener('input', () => {
            formData.clothesDescription = clothesDescription.value;
            if (clothesDescription.value.length >= 8) {
                hideError(clothesError);
            }
        });

        step2Next.addEventListener('click', () => {
            if (validateStep2()) {
                goToStep(3);
            }
            setTimeout(() => {
                      generatePreview.click();
             }, 0);
        });

        // Step 3: Preview with Enhanced Loading
        const generatePreview = document.getElementById('generatePreview');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const previewLoading = document.getElementById('previewLoading');
        const previewResult = document.getElementById('previewResult');
        const previewInfo = document.getElementById('previewInfo');
        const previewErrorContainer = document.getElementById('previewErrorContainer');
        const previewError = document.getElementById('previewError');
        const retryPreview = document.getElementById('retryPreview');
        const step3Next = document.getElementById('step3Next');

        generatePreview.addEventListener('click', async () => {
            // Скролване нагоре при започване на генерирането
            document.querySelector('.form-container').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });

            previewPlaceholder.style.display = 'none';
            previewLoading.style.display = 'flex';
            previewLoading.innerHTML = ''; // Clear any previous content
            step3Next.textContent="Завършете Поръчката си";
            isPreviewGenerated = false; // Ресет на статуса при започване
            
            // Create enhanced loading animation container
            const loadingAnimation = document.createElement('div');
            loadingAnimation.style.position = 'relative';
            loadingAnimation.style.width = '100%';
            loadingAnimation.style.height = '100%';
            loadingAnimation.style.display = 'flex';
            loadingAnimation.style.flexDirection = 'column';
            loadingAnimation.style.alignItems = 'center';
            loadingAnimation.style.justifyContent = 'center';

            // Add the blurred image preview
            const loadingImage = document.createElement('img');
            loadingImage.src = URL.createObjectURL(PreviewFile);
            loadingImage.style.width = '80%';
            loadingImage.style.height = '80%';
            loadingImage.style.objectFit = 'contain';
            loadingImage.style.filter = 'blur(20px)';
            loadingImage.style.transition = 'filter 60s linear';

            // Create progress container
            const progressContainer = document.createElement('div');
            progressContainer.style.width = '80%';
            progressContainer.style.marginTop = '20px';
            progressContainer.style.textAlign = 'center';

            // Add progress bar background
            const progressBarBg = document.createElement('div');
            progressBarBg.style.width = '100%';
            progressBarBg.style.height = '8px';
            progressBarBg.style.backgroundColor = '#e0e0e0';
            progressBarBg.style.borderRadius = '4px';
            progressBarBg.style.overflow = 'hidden';
            progressBarBg.style.marginBottom = '15px';

            // Add progress bar fill
            const progressBarFill = document.createElement('div');
            progressBarFill.style.height = '100%';
            progressBarFill.style.backgroundColor = '#ea384c';
            progressBarFill.style.width = '0%';
            progressBarFill.style.transition = 'width 0.3s ease';
            progressBarFill.style.borderRadius = '4px';

            progressBarBg.appendChild(progressBarFill);

            // Add loading text with percentage
            const loadingText = document.createElement('p');
            loadingText.textContent = 'Създаване на визуализация... 0%';
            loadingText.style.margin = '0 0 10px 0';
            loadingText.style.color = '#333';
            loadingText.style.fontWeight = 'bold';
            loadingText.style.fontSize = '16px';

            // Add time estimate text
            const timeText = document.createElement('p');
            timeText.textContent = 'Очаквано време: до 1 минута';
            timeText.style.margin = '0';
            timeText.style.color = '#666';
            timeText.style.fontSize = '14px';

            // Add spinner
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.style.width = '30px';
            spinner.style.height = '30px';
            spinner.style.border = '3px solid rgba(0, 0, 0, 0.1)';
            spinner.style.borderRadius = '50%';
            spinner.style.borderTop = '3px solid #ea384c';
            spinner.style.animation = 'spin 1s linear infinite';
            spinner.style.margin = '15px auto 60px auto';
            spinner.style.display = 'block';

            // Add keyframe animation for spinner
            if (!document.getElementById('spinner-style')) {
                const style = document.createElement('style');
                style.id = 'spinner-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }

            // Assemble the loading animation
            progressContainer.appendChild(loadingText);
            progressContainer.appendChild(progressBarBg);
            progressContainer.appendChild(timeText);
            progressContainer.appendChild(spinner);

            loadingAnimation.appendChild(loadingImage);
            loadingAnimation.appendChild(progressContainer);
            previewLoading.appendChild(loadingAnimation);

            // Start the unblur animation
            setTimeout(() => {
                loadingImage.style.filter = 'blur(10px)';
            }, 100);

            // Start progress simulation
            startTime = Date.now();
            let progress = 0;

            progressInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000; // elapsed time in seconds
                const maxTime = 60; // 60 seconds max

                // Simulate realistic progress curve (faster at start, slower at end)
                const rawProgress = Math.min(elapsed / maxTime, 0.95); // Cap at 95% until actual completion
                progress = Math.floor(rawProgress * 100);

                // Update progress bar
                progressBarFill.style.width = `${progress}%`;

                // Update text based on progress
                if (progress < 30) {
                    loadingText.textContent = `Анализиране на снимката... ${progress}%`;
                } else if (progress < 60) {
                    loadingText.textContent = `Генериране на модел... ${progress}%`;
                } else if (progress < 90) {
                    loadingText.textContent = `Прилагане на стил... ${progress}%`;
                } else {
                    loadingText.textContent = `Финализиране... ${progress}%`;
                }

                // Update time estimate
                const remainingTime = Math.max(0, maxTime - elapsed);
                if (remainingTime > 30) {
                    timeText.textContent = `Остават: около ${Math.ceil(remainingTime)} секунди`;
                } else if (remainingTime > 5) {
                    timeText.textContent = `Остават: ${Math.ceil(remainingTime)} секунди`;
                } else if (remainingTime > 0) {
                    timeText.textContent = 'Почти готово...';
                } else {
                    timeText.textContent = 'Обработване на резултата...';
                }

            }, 500); // Update every 500ms for smooth animation

            const ip = await getUserIP();
            // Prepare form data for the API request
            const formDataToSend = new FormData();
            formDataToSend.append('PersonPhoto', formData.personPhoto.file);
            formDataToSend.append('pose', formData.pose);
            formDataToSend.append('clothesDescription', formData.clothesDescription);
            formDataToSend.append('imgStyle', formData.imgStyle);
            formDataToSend.append("ip", ip);

            try {
                const response = await fetch('https://n8n.enchantiya.com/webhook/f7ae757e-4b72-4748-af4a-9f919d4d8b65', {
                    method: 'POST',
                    body: formDataToSend
                });

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const result = await response.json();

                // Clear progress interval
                if (progressInterval) {
                    clearInterval(progressInterval);
                }

                // Complete the progress animation
                progressBarFill.style.width = '100%';
                loadingText.textContent = 'Готово! 100%';
                timeText.textContent = 'Визуализацията е създадена успешно!';

                // Check if user is banned
                if (result.banned === "true") {
                    previewLoading.style.display = 'none';
                    previewErrorContainer.style.display = 'flex';
                    previewError.textContent = '24ч. лимит е достигнат. Може би имаш нужда от помощ? Моля, свържи се с нас за специално съдействие. 0897728307';
                    return;
                }

                const imageUrl = `data:image/png;base64,${result.image}`;

                // Convert base64 to File object
                const base64Response = await fetch(imageUrl);
                const blob = await base64Response.blob();
                const file = new File([blob], Math.random().toString(36).substring(7) + ".png", { type: 'image/png' });

                formData.previewPhoto.file_b64 = imageUrl;
                formData.previewPhoto.name = file.name;
                formData.previewPhoto.file = file;

                // Wait a moment to show completion before hiding
                setTimeout(() => {
                    // Update UI
                    previewLoading.style.display = 'none';
                    previewResult.style.display = 'flex';
                    previewInfo.style.display = "flex";
                    isPreviewGenerated = true; // Маркираме като генерирано

                    // Display image
                    const img = document.getElementById("figurePreview");
                    img.src = imageUrl;
                    img.alt = 'Generated Preview';

                    // Скролване нагоре при успешно генериране
                    document.querySelector('.form-container').scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 1000); // Show completion for 1 second

            } catch (error) {
                console.error('Error generating preview:', error);
                
                // Clear progress interval
                if (progressInterval) {
                    clearInterval(progressInterval);
                }
                
                previewLoading.style.display = 'none';
                previewErrorContainer.style.display = 'flex';
                previewError.textContent = 'Не успяхме да генерираме модел. Моля, опитайте отново.';
            }
        });

        retryPreview.addEventListener('click', () => {
            // Clear any existing progress interval
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            
            previewErrorContainer.style.display = 'none';
            previewPlaceholder.style.display = 'flex';
            isPreviewGenerated = false; // Ресет на статуса
        });

        document.getElementById('btnJumpSubmit').addEventListener('click', function () {
            if (isPreviewGenerated) {
                goToStep(4);
            } else {
                // Показване на съобщение че трябва да се генерира preview
                alert('Моля, генерирайте визуализация преди да продължите!');
                // Скролване до бутона за генериране
                generatePreview.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        });

        step3Next.addEventListener('click', () => {
            if (validateStep3()) {
                goToStep(4);
            }
        });

        // Step 4: Contact & Shipping
        const contactForm = {
            fullName: document.getElementById('fullName'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            address: document.getElementById('address'),
            country: document.getElementById('country'),
            city: document.getElementById('city'),
            postcode: document.getElementById('postcode')
        };

        const contactErrors = {
            nameError: document.getElementById('nameError'),
            emailError: document.getElementById('emailError'),
            phoneError: document.getElementById('phoneError'),
            addressError: document.getElementById('addressError'),
            countryError: document.getElementById('countryError'),
            cityError: document.getElementById('cityError'),
            postcodeError: document.getElementById('postcodeError')
        };

        for (const field in contactForm) {
            contactForm[field].addEventListener('input', (e) => {
                formData.contact[field] = e.target.value;
            });
        }

        // Previous buttons
        document.querySelectorAll('.btn-prev').forEach(button => {
            button.addEventListener('click', () => {
                const targetStep = parseInt(button.getAttribute('data-step'));

                // Ако се връщаме от стъпка 3 към стъпка 2, нулирай preview-а
                if (currentStep === 3 && targetStep === 2) {
                    // Clear any existing progress interval
                    if (progressInterval) {
                        clearInterval(progressInterval);
                    }
                    
                    // Скриване на preview резултати и грешки
                    previewResult.style.display = 'none';
                    previewInfo.style.display = 'none';
                    previewErrorContainer.style.display = 'none';
                    previewLoading.style.display = 'none';

                    // Премахни анимация/blur изображение
                    const loadingImageEl = previewLoading.querySelector('img');
                    if (loadingImageEl) loadingImageEl.remove();

                    // Изчистване на изображението
                    const img = document.getElementById("figurePreview");
                    img.src = '';
                    img.alt = '';

                    // Покажи бутона "Generate Preview" отново
                    previewPlaceholder.style.display = 'flex';

                    // Нулиране на preview файла
                    formData.previewPhoto = {
                        file_b64: "",
                        file: '',
                        name: ""
                    };

                    // Ресет на preview статуса
                    isPreviewGenerated = false;

                    // ❗️Ресет на слайдъра с мненията
                    const sliderContainer = document.getElementById("reviewsSlider");
                    const testimonialWrapper = document.getElementById("testimonialWrapper");
                    if (sliderContainer) {
                        sliderContainer.style.display = "none";
                        sliderContainer.removeAttribute("data-loaded");
                    }
                    if (testimonialWrapper) {
                        testimonialWrapper.innerHTML = ""; // премахва всички слайдове
                    }
                }

                goToStep(targetStep);
            });
        });

        // Form submission
        const submitForm = document.getElementById('submitForm');
        const formContainer = document.querySelector('.form-container form');
        const submissionContainer = document.getElementById('submissionContainer');
        const submissionLoading = document.getElementById('submissionLoading');
        const submissionSuccess = document.getElementById('submissionSuccess');
        const submissionError = document.getElementById('submissionError');
        const errorMessage = document.getElementById('errorMessage');
        const retrySubmission = document.getElementById('retrySubmission');

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (validateStep4()) {
                submitForm.disabled = true;
                let loadingPercent = 1;
                const loadingInterval = setInterval(() => {
                    loadingPercent++;
                    submitForm.textContent = `Loading ${loadingPercent}%`;
                    if (loadingPercent >= 100) {
                        clearInterval(loadingInterval);
                    }
                }, 120); // 5000ms / 100 steps = 50ms per step

                async function submitFinalOrder() {
                    try {
                        const fd = new FormData();

                        // 🔁 Normalize phone
                        const validatedPhone = validatePhone(formData.contact.phone);
                        if (!validatedPhone) {
                            alert('Моля, въведи валиден телефонен номер във формат +359...');
                            return;
                        }

                        fd.append('PersonPhoto', formData.personPhoto.file); // the raw File object
                        fd.append('FileName_PersonPhoto', formData.personPhoto.name);
                        fd.append('pose', formData.pose);
                        fd.append('clothesDescription', formData.clothesDescription);
                        fd.append('size', formData.size);
                        fd.append('price', formData.price);
                        fd.append('fullName', formData.contact.fullName);
                        fd.append('email', formData.contact.email);
                        fd.append('phone', validatedPhone);
                        fd.append('address', formData.contact.address);
                        fd.append('country', formData.contact.country);
                        fd.append('city', formData.contact.city);
                        fd.append('postcode', formData.contact.postcode);
                        fd.append('PreviewImage', formData.previewPhoto.file);
                        fd.append('currency', formData.currency);
                        fd.append('paymentType', formData.paymentType);

                        // Send to Make
                        const response = await fetch('https://primary-production-5c317.up.railway.app/webhook/fa49284e-20c0-46d9-931a-d3f52867ebcb', {
                            method: 'POST',
                            body: fd,
                        });

                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }

                        const result = await response.json()
                        if (result.checkoutUrl) {
                            window.location.href = result.checkoutUrl;
                        }

                        // UI feedback
                        submissionLoading.style.display = 'none';
                        submissionSuccess.style.display = 'flex';
                    } catch (error) {
                        console.error('Order submission failed:', error);
                        submissionLoading.style.display = 'none';
                        submissionError.style.display = 'flex';
                        errorMessage.textContent = 'Something went wrong while placing your order.';
                    }
                }

                submitFinalOrder()
            }
        });

        retrySubmission.addEventListener('click', () => {
            submissionError.style.display = 'none';
            submissionLoading.style.display = 'flex';

            // Retry submission simulation
            setTimeout(() => {
                submissionLoading.style.display = 'none';
                submissionSuccess.style.display = 'flex';
            }, 2000);
        });

        // Initialize step indicators click events
        stepIndicators.forEach((indicator) => {
            indicator.addEventListener('click', () => {
                const step = parseInt(indicator.getAttribute('data-step'));

                // Only allow going to previous steps or current step
                if (step < currentStep || step === currentStep) {
                    goToStep(step);
                }
            });
        });
    }

    // Validation functions
    function validateStep1() {
        const photoError = document.getElementById('photoError');

        if (!formData.personPhoto.file) {
            showError(photoError, 'photoError');
            scrollToError(photoError);
            return false;
        }

        return true;
    }

    function validateStep2() {
        const clothesDescription = document.getElementById('clothesDescription');
        const clothesError = document.getElementById('clothesError');
        const poseError = document.getElementById('poseError');
        //const styleError = document.getElementById('styleError');
        let isValid = true;
        let firstErrorElement = null;

        if (clothesDescription.value.length < 8) {
            showError(clothesError, 'clothesError');
            if (!firstErrorElement) firstErrorElement = clothesError;
            isValid = false;
        }

        if (!formData.pose) {
            showError(poseError, 'poseError');
            if (!firstErrorElement) firstErrorElement = poseError;
            isValid = false;
        }
        
        if (!formData.imgStyle) {
            // Ако има styleError елемент
            const styleError = document.getElementById('styleError');
            if (styleError) {
                showError(styleError, 'styleError');
                if (!firstErrorElement) firstErrorElement = styleError;
            }
            isValid = false;
        }

        // Скролване до първата грешка
        if (!isValid && firstErrorElement) {
            scrollToError(firstErrorElement);
        }

        return isValid;
    }

    function validateStep3() {
        // Проверяваме дали е генериран preview
        if (!isPreviewGenerated) {
            // Показваме съобщение
            alert('Моля, генерирайте визуализация преди да продължите!');
            
            // Скролваме до бутона за генериране
            const generatePreview = document.getElementById('generatePreview');
            if (generatePreview) {
                generatePreview.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'center'
                });
            }
            return false;
        }
        return true;
    }

    function validateStep4() {
        const fields = [
            { value: formData.contact.fullName, errorElement: document.getElementById('nameError'), message: 'nameError' },
            { value: formData.contact.email, errorElement: document.getElementById('emailError'), message: 'emailError', validator: validateEmail },
            { value: formData.contact.phone, errorElement: document.getElementById('phoneError'), message: 'phoneError', validator: validatePhone },
            { value: formData.contact.address, errorElement: document.getElementById('addressError'), message: 'addressError' },
            { value: formData.contact.country, errorElement: document.getElementById('countryError'), message: 'countryError' },
            { value: formData.contact.city, errorElement: document.getElementById('cityError'), message: 'cityError' },
            { value: formData.contact.postcode, errorElement: document.getElementById('postcodeError'), message: 'postcodeError' },
            { value: formData.size, errorElement: document.getElementById('sizeError'), message: 'sizeError' }, 
            { value: formData.paymentType, errorElement: document.getElementById('paymentError'), message: 'paymentTypeError' }
        ];
    
        let isValid = true;
        let firstErrorElement = null;
    
        fields.forEach(field => {
            if (!field.value) {
                showError(field.errorElement, field.message);
                if (!firstErrorElement) {
                    firstErrorElement = field.errorElement;
                }
                isValid = false;
            } else if (field.validator && !field.validator(field.value)) {
                showError(field.errorElement, field.message);
                if (!firstErrorElement) {
                    firstErrorElement = field.errorElement;
                }
                isValid = false;
            } else {
                hideError(field.errorElement);
            }
        });
    
        // Скролване до първата грешка
        if (!isValid && firstErrorElement) {
            scrollToError(firstErrorElement);
        }
    
        return isValid;
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function validatePhone(phone) {
        // Премахваме интервали, тирета и скоби
        phone = phone.replace(/[\s-()]/g, '');
    
        // Заменяме префикс 00359 с +359
        if (phone.startsWith('00359')) {
            phone = phone.replace(/^00359/, '+359');
        }
    
        // Заменяме водеща 0 с +359
        else if (phone.startsWith('0') && phone.length === 10) {
            phone = phone.replace(/^0/, '+359');
        }
    
        // Ако е 9-цифрен и започва с 8 (без префикс) — добавяме +359
        else if (/^8\d{8}$/.test(phone)) {
            phone = '+359' + phone;
        }
    
        // Ако вече е правилен формат (+359XXXXXXXXX)
        else if (/^\+359\d{9}$/.test(phone)) {
            // остава както е
        } else {
            return null; // невалиден номер
        }
    
        // Финална валидация — дали е точно +359 и 9 цифри след това
        return /^\+359\d{9}$/.test(phone) ? phone : null;
    }
    
    function showError(errorElement, message) {
        if (errorElement) {
           errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function hideError(errorElement) {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    function scrollToError(errorElement) {
        if (!errorElement) return;
        
        // Намираме родителския елемент или най-близкото поле за въвеждане
        const fieldContainer = errorElement.closest('.field-container') || 
                              errorElement.closest('.form-group') || 
                              errorElement.closest('.form-step') ||
                              errorElement.parentElement;
        
        if (fieldContainer) {
            fieldContainer.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Опционално: фокусиране на полето за въвеждане
            const inputElement = fieldContainer.querySelector('input, select, textarea');
            if (inputElement) {
                setTimeout(() => {
                    inputElement.focus();
                }, 300); // Малко забавяне за да завърши скролването
            }
        } else {
            // Ако не може да намери контейнер, скролва до самата грешка
            errorElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    // Step navigation
    function goToStep(step) {
        if (step < 1 || step > steps.length) return;

        // Update current step
        currentStep = step;

        // Update step indicators
        stepIndicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');

            if (stepNum < currentStep) {
                indicator.classList.add('completed');
            } else if (stepNum === currentStep) {
                indicator.classList.add('active');
            }
        });

        // Update progress bar
        progressFill.style.width = `${((currentStep - 1) / (steps.length - 1)) * 100}%`;

        // Show current step
        steps.forEach((stepEl, index) => {
            stepEl.classList.remove('active');
            if (index === currentStep - 1) {
                stepEl.classList.add('active');
            }
        });
        const jumpBtn = document.getElementById('jumpToSubmit');
        if (jumpBtn) {
            if (step === 3) {
                jumpBtn.style.display = 'block';
            } else {
                jumpBtn.style.display = 'none';
            }
        }

        // Scroll to top of form
        document.querySelector('.form-container').scrollIntoView({ behavior: 'smooth' });
    }
});

isCodChosen = false
function selectPaymentMethod(method) {
    const options = document.querySelectorAll('.payment-options .payment-option');

    options.forEach(option => {
        option.classList.remove('selected');
    });

    if (method === 'card') {
        document.getElementById('paymentCard').classList.add('selected');
        formData.paymentType = "card"
        if (isCodChosen == true) {
            formData.price -= 19.90
            isCodChosen = false
        }

    } else if (method === 'cod') {
        formData.paymentType = "cod"
        document.getElementById('paymentCOD').classList.add('selected');
    }

    const hiddenInput = document.getElementById('selectedPaymentMethod');
    if (hiddenInput) {
        hiddenInput.value = method;
    }
    if (typeof updateTotalPrice === 'function') {
        updateTotalPrice();
    }
}

function updateTotalPrice() {
    const totalBox = document.getElementById('totalPriceBox');
    const totalAmount = document.getElementById('totalAmount');

    const basePrice = parseFloat(window.formData.price || 0);
    const paymentMethod = document.getElementById('selectedPaymentMethod')?.value;

    if (!basePrice || isNaN(basePrice)) {
        totalBox.style.display = 'none';
        return;
    }

    let finalPrice = basePrice;
    // Only add COD fee if it hasn't been added before
    if (paymentMethod === 'cod' && isCodChosen == false) {
        finalPrice += 19.90;
        formData.price += 19.90
        isCodChosen = true
    }

    totalAmount.textContent = `${finalPrice.toFixed(2)} лв.`;
    totalBox.style.display = 'flex';
}

// Optional: auto-select the first size on page load
window.addEventListener('DOMContentLoaded', () => {
    const firstSize = document.querySelector('.size-option[data-price]');
    if (firstSize) {
        firstSize.click();
    }
});

function trackViberClick() {
    console.log('User clicked Viber button');
    // You can add analytics tracking here if needed
}

window.addEventListener('scroll', function () {
    const btnContainer = document.getElementById('jumpToSubmit');
    if (!btnContainer) return;

    const isStep3 = document.querySelector('#step3')?.classList.contains('active');
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    if (isStep3) {
        if (scrollY > 1300) {
            btnContainer.style.opacity = '0';
            btnContainer.style.pointerEvents = 'none';
        } else {
            btnContainer.style.opacity = '1';
            btnContainer.style.pointerEvents = 'auto';
        }
    }
});