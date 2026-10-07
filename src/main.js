import './style.css';

const sourceEditor = document.getElementById('sourceEditor');
const codeDisplay = document.getElementById('codeDisplay');
const tabButtons = document.querySelectorAll('.tab-btn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const convertBtn = document.getElementById('convertBtn');
const toastMessage = document.getElementById('toastMessage');

// Preview card elements
const cardEyebrow = document.querySelector('.card-eyebrow');
const cardHeading = document.querySelector('.card-heading');
const cardBgImage = document.querySelector('.card-bg-image');

let activeTab = 'liquid';

const templates = {
  liquid: `{% assign section_heading = section.settings.heading | default: 'Designed for the long way around.' %}

<section class="trail-hero color-{{ section.settings.color_scheme }}">
  <div class="trail-hero__content">
    <p class="trail-hero__eyebrow">{{ section.settings.eyebrow }}</p>
    <h1>{{ section_heading }}</h1>
    {% if section.settings.button_label != blank %}
      <a class="trail-hero__button" href="{{ section.settings.button_link }}">
        {{ section.settings.button_label }}
      </a>
    {% endif %}
  </div>

  {% if section.settings.image != blank %}
    {{ section.settings.image | image_url: width: 1800 | image_tag:
      class: 'trail-hero__image',
      loading: 'eager',
      widths: '720, 1080, 1440, 1800'
    }}
  {% endif %}
</section>`,

  css: `.trail-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  min-height: 520px;
  background-color: var(--pine-darkest);
  overflow: hidden;
}

.trail-hero__content {
  position: relative;
  z-index: 2;
  padding: 3rem 2.5rem;
  max-width: 640px;
}

.trail-hero__eyebrow {
  font-family: monospace;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8ed0a5;
  margin-bottom: 0.75rem;
}

.trail-hero h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800;
  line-height: 1.1;
  color: #ffffff;
  margin-bottom: 1.5rem;
}

.trail-hero__button {
  display: inline-block;
  padding: 0.85rem 1.6rem;
  background-color: #ffffff;
  color: #153123;
  font-weight: 700;
  text-decoration: none;
  border-radius: 2px;
}

.trail-hero__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}`
};

function showToast(text) {
  toastMessage.textContent = text;
  toastMessage.classList.add('active');
  window.clearTimeout(toastMessage._timer);
  toastMessage._timer = window.setTimeout(() => {
    toastMessage.classList.remove('active');
  }, 2200);
}

function updateCodeView() {
  codeDisplay.textContent = templates[activeTab];
}

function updatePreviewFromSource() {
  try {
    const parsed = JSON.parse(sourceEditor.value);
    const options = parsed?.component?.options || parsed?.options || parsed;
    
    if (options.eyebrow && cardEyebrow) {
      cardEyebrow.textContent = options.eyebrow.toUpperCase();
    }
    if ((options.title || options.heading) && cardHeading) {
      cardHeading.textContent = options.title || options.heading;
    }
    if (options.image && cardBgImage) {
      cardBgImage.src = options.image;
    }
  } catch (err) {
    // If invalid JSON during typing, keep current preview
  }
}

// Tab switcher
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    activeTab = btn.dataset.tab;
    updateCodeView();
  });
});

// Copy code action
copyCodeBtn.addEventListener('click', async () => {
  const code = templates[activeTab];
  try {
    await navigator.clipboard.writeText(code);
    copyCodeBtn.textContent = 'COPIED!';
    showToast(`${activeTab.toUpperCase()} code copied to clipboard.`);
    setTimeout(() => {
      copyCodeBtn.textContent = 'COPY CODE';
    }, 1800);
  } catch (e) {
    showToast('Failed to copy code.');
  }
});

// Convert Section button action
convertBtn.addEventListener('click', () => {
  updatePreviewFromSource();
  convertBtn.textContent = 'CONVERTING...';
  convertBtn.disabled = true;
  setTimeout(() => {
    convertBtn.textContent = 'CONVERT SECTION';
    convertBtn.disabled = false;
    updateCodeView();
    showToast('Section converted to Shopify Liquid & CSS.');
  }, 450);
});

// Real-time source update
sourceEditor.addEventListener('input', updatePreviewFromSource);

// Initial render
updateCodeView();
updatePreviewFromSource();
