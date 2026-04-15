/**
 * Office CMS - Admin Dashboard Logic
 */

// API helpers
async function apiRequest(method, url, body) {
  const options = {
    method,
    credentials: 'same-origin',
    headers: {},
  };

  if (body && !(body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    options.body = body;
  }

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || data.errors?.[0]?.msg || `HTTP ${res.status}`);
  }

  return data;
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

// =============================================
// ADMIN DASHBOARD (office-list)
// =============================================

class AdminDashboard {
  constructor() {
    this.offices = [];
    this.filtered = [];
    this.currentPage = 1;
    this.pageSize = 10;
    this.searchQuery = '';

    this.tableBody = document.getElementById('offices-tbody');
    this.searchInput = document.getElementById('search-input');
    this.totalCountEl = document.getElementById('total-count');
    this.paginationEl = document.getElementById('pagination');
    this.loadingEl = document.getElementById('loading-state');
    this.emptyEl = document.getElementById('empty-state');

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadOffices();
  }

  bindEvents() {
    this.searchInput?.addEventListener('input', e => {
      this.searchQuery = e.target.value.toLowerCase();
      this.currentPage = 1;
      this.render();
    });

    // Delete confirmation modal
    document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
      await this.confirmDelete();
    });

    document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
      this.closeDeleteModal();
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try {
        await apiRequest('POST', '/auth/logout');
        window.location.href = '/admin/login';
      } catch (e) {
        window.location.href = '/admin/login';
      }
    });
  }

  async loadOffices() {
    try {
      const data = await apiRequest('GET', '/admin/api/offices');
      this.offices = data.offices || [];
      this.loadingEl?.classList.add('hidden');
      this.render();
    } catch (err) {
      this.loadingEl?.classList.add('hidden');
      this.showAlert('Failed to load offices: ' + err.message, 'error');
    }
  }

  render() {
    this.filtered = this.offices.filter(o =>
      !this.searchQuery ||
      o.name.toLowerCase().includes(this.searchQuery) ||
      (o.location || '').toLowerCase().includes(this.searchQuery)
    );

    const start = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filtered.slice(start, start + this.pageSize);

    if (this.totalCountEl) {
      this.totalCountEl.textContent = this.offices.length;
    }

    if (this.tableBody) {
      if (this.filtered.length === 0) {
        this.emptyEl?.classList.remove('hidden');
        this.tableBody.innerHTML = '';
      } else {
        this.emptyEl?.classList.add('hidden');
        this.tableBody.innerHTML = pageItems.map(o => this.renderRow(o)).join('');
        this.bindRowEvents();
      }
    }

    this.renderPagination();
  }

  renderRow(office) {
    const hasPhoto = office.photos && office.photos.length > 0;
    const date = office.created_at ? new Date(office.created_at).toLocaleDateString() : '—';

    return `
      <tr>
        <td>
          ${hasPhoto
            ? `<img class="table__thumbnail" src="${escapeHtml(office.photos[0])}" alt="" loading="lazy" onerror="this.style.display='none'">`
            : `<div class="table__no-photo"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
          }
        </td>
        <td>
          <div class="table__office-name">${escapeHtml(office.name)}</div>
          <div class="table__office-location">${escapeHtml(office.location || '')}</div>
        </td>
        <td>${escapeHtml(office.contact_email || '—')}</td>
        <td>${office.photos ? office.photos.length : 0} photo${office.photos?.length !== 1 ? 's' : ''}</td>
        <td>
          <span class="badge badge--${office.published ? 'published' : 'draft'}">
            ${office.published ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>${date}</td>
        <td>
          <div class="action-buttons">
            <a href="/admin/office/${escapeHtml(office.id)}/edit" class="btn--edit">Edit</a>
            <a href="/office/${escapeHtml(office.id)}" target="_blank" class="btn--view">View</a>
            <button class="btn--delete" data-id="${escapeHtml(office.id)}" data-name="${escapeHtml(office.name)}">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  bindRowEvents() {
    this.tableBody?.querySelectorAll('.btn--delete').forEach(btn => {
      btn.addEventListener('click', () => {
        this.pendingDeleteId = btn.dataset.id;
        this.pendingDeleteName = btn.dataset.name;
        this.openDeleteModal();
      });
    });
  }

  openDeleteModal() {
    const modal = document.getElementById('delete-modal');
    const nameEl = document.getElementById('delete-office-name');
    if (nameEl) nameEl.textContent = this.pendingDeleteName;
    if (modal) modal.classList.remove('hidden');
  }

  closeDeleteModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.add('hidden');
    this.pendingDeleteId = null;
    this.pendingDeleteName = null;
  }

  async confirmDelete() {
    if (!this.pendingDeleteId) return;
    const btn = document.getElementById('confirm-delete-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Deleting…'; }

    try {
      await apiRequest('DELETE', `/admin/api/offices/${this.pendingDeleteId}`);
      this.offices = this.offices.filter(o => o.id !== this.pendingDeleteId);
      this.closeDeleteModal();
      this.render();
      this.showAlert('Office deleted successfully', 'success');
    } catch (err) {
      this.showAlert('Failed to delete: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Delete'; }
    }
  }

  renderPagination() {
    if (!this.paginationEl) return;
    const totalPages = Math.ceil(this.filtered.length / this.pageSize);

    if (totalPages <= 1) {
      this.paginationEl.innerHTML = '';
      return;
    }

    let html = `<button class="pagination__btn" ${this.currentPage <= 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">‹</button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pagination__btn ${i === this.currentPage ? 'pagination__btn--active' : ''}" data-page="${i}">${i}</button>`;
    }

    html += `<button class="pagination__btn" ${this.currentPage >= totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">›</button>`;

    html += `<span class="pagination__info">${this.filtered.length} offices</span>`;

    this.paginationEl.innerHTML = html;
    this.paginationEl.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.render();
      });
    });
  }

  showAlert(message, type = 'info') {
    const alertEl = document.getElementById('alert-message');
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `alert alert--${type}`;
    alertEl.classList.remove('hidden');
    setTimeout(() => alertEl.classList.add('hidden'), 5000);
  }
}

// =============================================
// OFFICE FORM (create/edit)
// =============================================

class OfficeForm {
  constructor() {
    this.officeId = document.getElementById('office-id')?.value;
    this.isEdit = !!this.officeId;
    this.photos = [];
    this.saveStatus = 'idle';

    this.form = document.getElementById('office-form');
    this.photosContainer = document.getElementById('photo-previews');
    this.dropzone = document.getElementById('photo-dropzone');
    this.fileInput = document.getElementById('photo-input');
    this.saveStatusEl = document.getElementById('save-status');

    this.init();
  }

  async init() {
    if (this.isEdit) {
      await this.loadOffice();
    }
    this.bindEvents();
  }

  async loadOffice() {
    try {
      const data = await apiRequest('GET', `/admin/api/offices/${this.officeId}`);
      const office = data.office;
      if (!office) {
        window.location.href = '/admin';
        return;
      }
      this.fillForm(office);
      this.photos = office.photos || [];
      this.renderPhotos();
    } catch (err) {
      this.showAlert('Failed to load office: ' + err.message, 'error');
    }
  }

  fillForm(office) {
    const fields = ['name', 'location', 'description', 'contact_email', 'contact_phone', 'contact_address'];
    fields.forEach(f => {
      const el = document.getElementById(`field-${f}`);
      if (el) el.value = office[f] || '';
    });

    const publishedToggle = document.getElementById('field-published');
    if (publishedToggle) publishedToggle.checked = office.published !== false;
  }

  bindEvents() {
    this.form?.addEventListener('submit', e => {
      e.preventDefault();
      this.save();
    });

    // Dropzone
    this.dropzone?.addEventListener('click', () => this.fileInput?.click());

    this.dropzone?.addEventListener('dragover', e => {
      e.preventDefault();
      this.dropzone.classList.add('photo-upload-zone--dragover');
    });

    this.dropzone?.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('photo-upload-zone--dragover');
    });

    this.dropzone?.addEventListener('drop', e => {
      e.preventDefault();
      this.dropzone.classList.remove('photo-upload-zone--dragover');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) this.uploadFiles(files);
    });

    this.fileInput?.addEventListener('change', e => {
      const files = Array.from(e.target.files);
      if (files.length > 0) this.uploadFiles(files);
      e.target.value = '';
    });

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      try {
        await apiRequest('POST', '/auth/logout');
      } finally {
        window.location.href = '/admin/login';
      }
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
      window.location.href = '/admin';
    });
  }

  getFormData() {
    return {
      name: document.getElementById('field-name')?.value?.trim() || '',
      location: document.getElementById('field-location')?.value?.trim() || '',
      description: document.getElementById('field-description')?.value?.trim() || '',
      contact_email: document.getElementById('field-contact_email')?.value?.trim() || '',
      contact_phone: document.getElementById('field-contact_phone')?.value?.trim() || '',
      contact_address: document.getElementById('field-contact_address')?.value?.trim() || '',
      published: document.getElementById('field-published')?.checked !== false,
    };
  }

  validate(data) {
    const errors = [];
    if (!data.name) errors.push('Office name is required');
    if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
      errors.push('Invalid email address');
    }
    return errors;
  }

  async save() {
    const data = this.getFormData();
    const errors = this.validate(data);

    if (errors.length > 0) {
      this.showAlert(errors[0], 'error');
      return;
    }

    this.setSaveStatus('saving');

    try {
      let result;
      if (this.isEdit) {
        result = await apiRequest('PUT', `/admin/api/offices/${this.officeId}`, data);
      } else {
        result = await apiRequest('POST', '/admin/api/offices', data);
        // Redirect to edit page after create
        if (result.office?.id) {
          window.location.href = `/admin/office/${result.office.id}/edit`;
          return;
        }
      }

      this.setSaveStatus('saved');
      setTimeout(() => this.setSaveStatus('idle'), 3000);
    } catch (err) {
      this.setSaveStatus('error');
      this.showAlert('Save failed: ' + err.message, 'error');
    }
  }

  setSaveStatus(status) {
    this.saveStatus = status;
    if (!this.saveStatusEl) return;

    const messages = {
      idle: '',
      saving: '⏳ Saving…',
      saved: '✅ Saved!',
      error: '❌ Save failed',
    };

    this.saveStatusEl.textContent = messages[status] || '';
    this.saveStatusEl.className = `save-bar__status${status === 'saved' ? ' save-bar__status--saved' : ''}`;
  }

  async uploadFiles(files) {
    if (!this.officeId) {
      // Must save first
      this.showAlert('Please save the office first before uploading photos', 'info');
      return;
    }

    const maxPhotos = 5;
    const available = maxPhotos - this.photos.length;
    const toUpload = files.slice(0, available);

    if (toUpload.length === 0) {
      this.showAlert(`Maximum ${maxPhotos} photos per office`, 'error');
      return;
    }

    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) {
        this.showAlert(`${file.name} is too large (max 5MB)`, 'error');
        continue;
      }

      // Show uploading placeholder
      const placeholderIdx = this.renderUploadingPlaceholder();

      try {
        const formData = new FormData();
        formData.append('photo', file);
        const result = await apiRequest('POST', `/api/upload/${this.officeId}`, formData);
        this.photos = result.photos || [];
        this.renderPhotos();
      } catch (err) {
        this.removeUploadingPlaceholder(placeholderIdx);
        this.showAlert('Upload failed: ' + err.message, 'error');
      }
    }
  }

  renderUploadingPlaceholder() {
    if (!this.photosContainer) return -1;
    const div = document.createElement('div');
    div.className = 'photo-preview uploading';
    div.innerHTML = `
      <div class="photo-preview__upload-progress">
        <div class="spinner" style="width:24px;height:24px;border-width:2px;"></div>
        <span style="font-size:0.75rem;color:#666">Uploading…</span>
      </div>
    `;
    this.photosContainer.appendChild(div);
    return this.photosContainer.children.length - 1;
  }

  removeUploadingPlaceholder() {
    const uploading = this.photosContainer?.querySelector('.uploading');
    if (uploading) uploading.remove();
  }

  renderPhotos() {
    if (!this.photosContainer) return;
    this.photosContainer.innerHTML = '';

    this.photos.forEach((url, i) => {
      const div = document.createElement('div');
      div.className = 'photo-preview';
      div.innerHTML = `
        <img class="photo-preview__image" src="${escapeHtml(url)}" alt="Photo ${i + 1}" loading="lazy">
        <div class="photo-preview__overlay">
          <button class="photo-preview__delete" data-idx="${i}" title="Delete photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `;
      div.querySelector('.photo-preview__delete').addEventListener('click', () => this.deletePhoto(i));
      this.photosContainer.appendChild(div);
    });

    // Update dropzone visibility
    if (this.dropzone) {
      const limit = 5;
      const remaining = limit - this.photos.length;
      const limitEl = this.dropzone.querySelector('.photo-upload-zone__limit');
      if (limitEl) {
        limitEl.textContent = remaining > 0
          ? `${this.photos.length}/${limit} photos — ${remaining} more allowed`
          : `Maximum ${limit} photos reached`;
      }
    }
  }

  async deletePhoto(idx) {
    if (!this.officeId) return;
    if (!confirm('Delete this photo?')) return;

    try {
      const result = await apiRequest('DELETE', `/api/upload/${this.officeId}/${idx}`);
      this.photos = result.photos || [];
      this.renderPhotos();
    } catch (err) {
      this.showAlert('Failed to delete photo: ' + err.message, 'error');
    }
  }

  showAlert(message, type = 'info') {
    const alertEl = document.getElementById('alert-message');
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `alert alert--${type}`;
    alertEl.classList.remove('hidden');
    setTimeout(() => alertEl.classList.add('hidden'), 5000);
  }
}

// =============================================
// LOGIN PAGE
// =============================================

class LoginPage {
  constructor() {
    this.form = document.getElementById('login-form');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.submitBtn = document.getElementById('submit-btn');
    this.errorEl = document.getElementById('error-message');

    this.bindEvents();
  }

  bindEvents() {
    this.form?.addEventListener('submit', e => {
      e.preventDefault();
      this.login();
    });
  }

  async login() {
    const email = this.emailInput?.value?.trim();
    const password = this.passwordInput?.value;

    if (!email || !password) {
      this.showError('Please enter email and password');
      return;
    }

    if (this.submitBtn) {
      this.submitBtn.disabled = true;
      this.submitBtn.textContent = 'Signing in…';
    }
    this.clearError();

    try {
      const data = await apiRequest('POST', '/auth/login', { email, password });
      if (data.redirect) {
        window.location.href = data.redirect;
      }
    } catch (err) {
      this.showError(err.message || 'Invalid credentials');
    } finally {
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = 'Sign In';
      }
    }
  }

  showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('hidden');
  }

  clearError() {
    this.errorEl?.classList.add('hidden');
  }
}

// Auto-initialize based on page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-form')) {
    new LoginPage();
  } else if (document.getElementById('offices-tbody')) {
    new AdminDashboard();
  } else if (document.getElementById('office-form')) {
    new OfficeForm();
  }
});
