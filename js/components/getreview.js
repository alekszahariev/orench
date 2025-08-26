export function loadReviews() {
  const sliderContainer = document.getElementById("reviewsSlider");
  const container = document.getElementById("testimonialWrapper");

  // If testimonials block isn't present (e.g., removed on Step 3), do nothing
  if (!sliderContainer || !container) return;

  sliderContainer.style.display = "block";
  if (sliderContainer.dataset.loaded === "true") return;

  // Вземаме езика от URL
  const langMatch = window.location.pathname.match(/^\/(bg|de|en)(\/|$)/);
  const currentLang = langMatch ? langMatch[1] : 'bg';

  // Присетнати ревюта с преводими имена и текст
  const testimonials = [
    {
      name: {
        en: "Sophie",
        bg: "Марин",
        de: "Leon"
      },
      username: {
        en: "@maria",
        bg: "@m_rinko",
        de: "@leon17"
      },
      text: {
        en: "I don't know how you did it, but when I saw your figurine... it made my dick drop 😂 1:1 with me it is! You are super!",
        bg: "Не знам как го направихте, но като си видях фигурката… направо ми падна ченето 😂 1:1 с мен е! Супер сте!",
        de: "Ich weiß nicht, wie du es gemacht hast, aber als ich deine Figur gesehen habe... da ist mir der Kragen geplatzt 😂 1:1 mit mir ist es! Du bist super!"
      }
    },
    {
      name: {
        en: "Sophie",
        bg: "Станислава",
        de: "Karl"
      },
      username: {
        en: "@maria",
        bg: "@stani_stan",
        de: "@karl_lion"
      },
      text: {
        en: "Great detail and fast delivery!",
        bg: "Поръчах го като подарък за гаджето ми и честно казано мислех че ще е нещо пластмасово и тъпо, ама като го видях на живо… Брутално!",
        de: "Ich habe es als Geschenk für meinen Freund bestellt und dachte ehrlich gesagt, es wäre etwas aus Plastik und dumm, aber als ich es in natura sah... Brutal!"
      }
    },
    {
      name: {
        en: "Sophie",
        bg: "Георги",
        de: "Adelheid"
      },
      username: {
        en: "@maria",
        bg: "@Georgi95",
        de: "@Adel.art"
      },
      text: {
        en: "Exactly what I imagined. Thank you!",
        bg: "Това е най-якия подарък който съм правила!! Той още не вярва че са го направили по снимка 😂",
        de: "Das ist das coolste Geschenk, das ich je gemacht habe!!! Er kann immer noch nicht glauben, dass sie es von einem Bild gemacht haben 😂."
      }
    },
    {
      name: {
        en: "Sophie",
        bg: "Ива",
        de: "Dirk"
      },
      username: {
        en: "@maria",
        bg: "@ivaaaaaaa",
        de: "@dedirk"
      },
      text: {
        en: "Exactly what I imagined. Thank you!",
        bg: "Мислех че е AI генераторче и до там… ама получих истинска фигура по мен си? уоу.",
        de: "Ich dachte, es wäre ein KI-Generator und das war's... aber ich habe eine echte Figur dabei, oder? wow."
      }
    },
    {
      name: {
        en: "Sophie",
        bg: "Алекс",
        de: "Elke"
      },
      username: {
        en: "@maria",
        bg: "@alex_the_real",
        de: "@vulpix_11"
      },
      text:{
        en:"I've never written a review, but here it's worth it. I want to order more for the whole company 😂",
        bg:"Не съм писал отзив никога ама тука си заслужава. Искам да поръчам още за цялата компания 😂",
        de:"Ich habe noch nie eine Bewertung geschrieben, aber hier ist es das wert. Ich möchte mehr für die ganze Firma bestellen 😂."
      }
    }
  ];

  testimonials.forEach(t => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `
      <h4>${t.name[currentLang] || t.name['en']} <span style="font-weight:normal; color:gray;">${t.username[currentLang] || t.username['en']}</span></h4>
      <p>${t.text[currentLang] || t.text['en']}</p>
    `;
    container.appendChild(slide);
  });

  new Swiper('.testimonial-slider', {
    slidesPerView: 'auto',
    spaceBetween: 16,
    grabCursor: true,
  });

  setTimeout(() => sliderContainer.setAttribute("data-loaded", "true"), 50);
}
