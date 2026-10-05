import './style.css';

const source = document.querySelector('#sectionSource');
const forge = document.querySelector('#forgeButton');
const output = document.querySelector('#codeOutput code');
const state = document.querySelector('#outputState');
const hint = document.querySelector('#outputHint');
const copy = document.querySelector('#copyButton');
const clear = document.querySelector('#clearButton');
const toast = document.querySelector('#toast');
const tabs = document.querySelectorAll('.code-tab');

const code = {
  liquid: `<span class="code-note">{% comment %}</span> Forged by Section Forge <span class="code-note">{% endcomment %}</span>\n<section class="ritual-hero color-{{ section.settings.color_scheme }}">\n  <div class="ritual-hero__copy">\n    <p class="ritual-hero__eyebrow">{{ section.settings.eyebrow }}</p>\n    <h1>{{ section.settings.headline }}</h1>\n    <p>{{ section.settings.description }}</p>\n    <a href="{{ section.settings.button_link }}" class="button">\n      {{ section.settings.button_label }}\n    </a>\n  </div>\n\n  {{ section.settings.image | image_url: width: 1600 | image_tag }}\n</section>`,
  css: `.ritual-hero {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  min-height: 580px;\n  background: rgb(var(--color-background));\n}\n\n.ritual-hero__copy {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  padding: 10% 14%;\n}\n\n.ritual-hero__eyebrow {\n  margin: 0 0 1.5rem;\n  letter-spacing: .14em;\n  text-transform: uppercase;\n}`
};

function notify(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 2100);
}

function render(type) { output.innerHTML = code[type]; }

forge.addEventListener('click', () => {
  if (!source.value.trim()) { notify('Add a Builder section first.'); return; }
  forge.querySelector('span').textContent = 'Forging…';
  forge.disabled = true;
  window.setTimeout(() => {
    render('liquid');
    state.textContent = '✓ Converted';
    hint.textContent = 'Liquid and CSS ready to copy.';
    forge.querySelector('span').textContent = 'Forged';
    forge.disabled = false;
    notify('Section forged successfully.');
  }, 600);
});

tabs.forEach(tab => tab.addEventListener('click', () => {
  tabs.forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  render(tab.dataset.code);
}));

copy.addEventListener('click', async () => {
  const active = document.querySelector('.code-tab.active').dataset.code;
  await navigator.clipboard.writeText(code[active].replace(/<[^>]*>/g, ''));
  copy.textContent = 'Copied!';
  notify('Code copied to clipboard.');
  window.setTimeout(() => { copy.textContent = 'Copy code'; }, 1700);
});

clear.addEventListener('click', () => { source.value = ''; source.focus(); state.textContent = 'Awaiting source'; hint.textContent = 'Ready when you are.'; });
document.querySelector('#exportButton').addEventListener('click', () => notify('Forge your section before exporting.'));
