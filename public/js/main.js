/**
 * Office CMS - Public Frontend Logic
 */

// API helper
async function apiGet(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Truncate text
function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// Create office card element
function createOfficeCard(office) {
  const card = document.createElement('a');
  card.href = `/office/${office.id}`;
  card.className = 'office-card';
  card.setAttribute('data-office-id', office.id);

  const hasPhoto = office.photos && office.photos.length > 0;

  card.innerHTML = `
    <div class="office-card__image-wrapper">
      ${hasPhoto
        ? `<img
            class="office-card__image"
            src="${escapeHtml(office.photos[0])}"
            alt="${escapeHtml(office.name)} office photo"
            loading="lazy"
            onerror="this.parentElement.innerHTML='<div class=\\"office-card__placeholder\\">${placeholderSvg()}</div>'"
          />`
        : `<div class="office-card__placeholder">${placeholderSvg()}</div>`
      }
    </div>
    <div class="office-card__body">
      <h2 class="office-card__name">${escapeHtml(office.name)}</h2>
      ${office.location
        ? `<div class="office-card__location">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${escapeHtml(office.location)}
          </div>`
        : ''
      }
      ${office.description
        ? `<p class="office-card__description">${escapeHtml(truncate(office.description, 150))}</p>`
        : ''
      }
    </div>
    <div class="office-card__footer">
      <span class="office-card__cta">
        View Details
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </span>
      ${hasPhoto
        ? `<span class="office-card__photo-count">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            ${office.photos.length}
          </span>`
        : ''
      }
    </div>
  `;

  return card;
}

function placeholderSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`;
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Load office directory
async function loadDirectory() {
  const grid = document.getElementById('office-grid');
  const loading = document.getElementById('loading-state');
  const empty = document.getElementById('empty-state');
  const errorEl = document.getElementById('error-state');

  if (!grid) return;

  try {
    const data = await apiGet('/api/offices');
    const offices = data.offices || [];

    loading?.classList.add('hidden');

    if (offices.length === 0) {
      empty?.classList.remove('hidden');
      return;
    }

    grid.innerHTML = '';
    offices.forEach(office => grid.appendChild(createOfficeCard(office)));
    grid.classList.remove('hidden');

    // Initialize intersection observer for lazy loading effects
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      grid.querySelectorAll('.office-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;
        observer.observe(card);
      });
    }
  } catch (err) {
    loading?.classList.add('hidden');
    if (errorEl) {
      errorEl.classList.remove('hidden');
      errorEl.textContent = 'Failed to load offices. Please refresh the page.';
    }
    console.error('Failed to load offices:', err);
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadDirectory();
});
