import { getTemplates } from '/js/api.js';

// State
let templatesData = [];
let selectedTemplateId = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadTemplates();
});

/**
 * Load tất cả templates
 */
async function loadTemplates() {
  try {
    showLoadingState();
    const response = await getTemplates();
    templatesData = response.data || [];
    renderTemplates();
  } catch (error) {
    console.error('Error loading templates:', error);
    showErrorState('Không thể tải danh sách template');
  }
}

/**
 * Render danh sách templates
 */
function renderTemplates() {
  const container = document.getElementById('templatesContainer');
  
  if (templatesData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📭</div>
        <p>Chưa có template nào</p>
        <p class="text-muted">Hãy tạo template đầu tiên để bắt đầu</p>
      </div>
    `;
    return;
  }

  container.innerHTML = templatesData.map(template => createTemplateCard(template)).join('');
}

/**
 * Tạo card cho mỗi template
 */
function createTemplateCard(template) {
  const accountCount = template.accounts ? template.accounts.length : 0;
  const imageUrl = template.imageUrl || '';

  return `
    <div class="template-card" onclick="openTemplateDetail(${template.id})">
      <div class="template-image ${!imageUrl ? 'empty' : ''}">
        ${imageUrl ? `<img src="${imageUrl}" alt="${template.name}" />` : '🖼️'}
      </div>

      <div class="template-info">
        <div class="template-name">${template.name}</div>
        <div class="template-description">${template.description || 'Không có mô tả'}</div>
        
        <div class="template-stats">
          <div class="template-stat">
            <span class="template-stat-label">Tài khoản</span>
            <span class="template-stat-value">${accountCount}</span>
          </div>
          <div class="template-stat">
            <span class="template-stat-label">Trạng thái</span>
            <span class="template-stat-value">${template.status || 'Active'}</span>
          </div>
        </div>

        <div class="template-actions">
          <button class="btn-info" onclick="event.stopPropagation(); editTemplate(${template.id})">✏️ Sửa</button>
          <button class="btn-danger" onclick="event.stopPropagation(); deleteTemplate(${template.id})">🗑️</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Mở chi tiết template
 */
function openTemplateDetail(templateId) {
  const template = templatesData.find(t => t.id === templateId);
  if (!template) return;

  selectedTemplateId = templateId;

  const detailContent = `
    <div class="template-detail-content">
      <div class="template-detail-image">
        ${template.imageUrl ? `<img src="${template.imageUrl}" alt="${template.name}" />` : '<div style="display: flex; align-items: center; justify-content: center; height: 300px; color: var(--text-secondary);">No Image</div>'}
      </div>

      <div class="template-detail-info">
        <h3>Thông tin Template</h3>

        <div class="template-detail-group">
          <label>Tên Template:</label>
          <input type="text" value="${template.name}" id="detailTemplateName" />
        </div>

        <div class="template-detail-group">
          <label>Mô tả:</label>
          <textarea id="detailTemplateDescription" rows="4">${template.description || ''}</textarea>
        </div>

        <div class="template-detail-group">
          <label>Trạng thái:</label>
          <select id="detailTemplateStatus">
            <option value="active" ${template.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${template.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="archived" ${template.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </div>

        <h3 style="margin-top: 1.5rem;">Tài khoản (${template.accounts ? template.accounts.length : 0})</h3>
        <div class="template-accounts-list">
          ${template.accounts && template.accounts.length > 0 ? 
            template.accounts.map(account => `
              <div class="template-account-item">
                <span class="account-name">${account.name || `Account #${account.id}`}</span>
              </div>
            `).join('') :
            '<div class="text-muted">Chưa có tài khoản nào</div>'
          }
        </div>

        <div class="template-settings">
          <h4>Settings</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="detailTemplateWidth">Chiều rộng (px):</label>
              <input type="number" id="detailTemplateWidth" value="${template.settings?.width || 100}" />
            </div>
            <div class="form-group">
              <label for="detailTemplateHeight">Chiều cao (px):</label>
              <input type="number" id="detailTemplateHeight" value="${template.settings?.height || 100}" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="detailTemplateX">Tọa độ X:</label>
              <input type="number" id="detailTemplateX" value="${template.settings?.x || 0}" />
            </div>
            <div class="form-group">
              <label for="detailTemplateY">Tọa độ Y:</label>
              <input type="number" id="detailTemplateY" value="${template.settings?.y || 0}" />
            </div>
          </div>

          <button class="btn-primary" onclick="saveTemplateChanges()" style="width: 100%; margin-top: 1rem;">💾 Lưu thay đổi</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('detailModalTitle').textContent = `Chi tiết: ${template.name}`;
  document.getElementById('detailModalBody').innerHTML = detailContent;
  toggleModal('templateDetailModal', true);
}

/**
 * Tạo template modal
 */
function showCreateTemplateModal() {
  toggleModal('createTemplateModal', true);
}

/**
 * Submit tạo template
 */
async function submitCreateTemplate() {
  const name = document.getElementById('templateName').value.trim();
  const imageInput = document.getElementById('templateImage');
  const description = document.getElementById('templateDescription').value.trim();

  if (!name) {
    showNotification('Vui lòng nhập tên template', 'warning');
    return;
  }

  if (!imageInput.files.length) {
    showNotification('Vui lòng chọn hình ảnh', 'warning');
    return;
  }

  try {
    showNotification('Đang tạo template...', 'info');
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('image', imageInput.files[0]);

    const response = await fetch('/api/templates/create', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to create template');
    }

    showNotification('Template đã được tạo thành công!', 'success');
    toggleModal('createTemplateModal', false);
    document.getElementById('createTemplateForm').reset();
    loadTemplates();
  } catch (error) {
    console.error('Error creating template:', error);
    showNotification(error.message || 'Lỗi khi tạo template', 'danger');
  }
}

/**
 * Edit template
 */
function editTemplate(templateId) {
  openTemplateDetail(templateId);
}

/**
 * Lưu thay đổi template
 */
async function saveTemplateChanges() {
  const name = document.getElementById('detailTemplateName').value.trim();
  const description = document.getElementById('detailTemplateDescription').value.trim();
  const status = document.getElementById('detailTemplateStatus').value;
  const width = parseInt(document.getElementById('detailTemplateWidth').value);
  const height = parseInt(document.getElementById('detailTemplateHeight').value);
  const x = parseInt(document.getElementById('detailTemplateX').value);
  const y = parseInt(document.getElementById('detailTemplateY').value);

  if (!name) {
    showNotification('Vui lòng nhập tên template', 'warning');
    return;
  }

  try {
    showNotification('Đang lưu thay đổi...', 'info');

    const response = await fetch(`/api/templates/update/${selectedTemplateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        status,
        settings: { width, height, x, y },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to update template');
    }

    showNotification('Thay đổi đã được lưu!', 'success');
    toggleModal('templateDetailModal', false);
    loadTemplates();
  } catch (error) {
    console.error('Error updating template:', error);
    showNotification(error.message || 'Lỗi khi lưu thay đổi', 'danger');
  }
}

/**
 * Xóa template
 */
async function deleteTemplate(templateId = selectedTemplateId) {
  if (!templateId) return;

  if (!confirm('Bạn có chắc chắn muốn xóa template này?')) {
    return;
  }

  try {
    showNotification('Đang xóa template...', 'info');

    const response = await fetch(`/api/templates/delete/${templateId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete template');
    }

    showNotification('Template đã được xóa!', 'success');
    toggleModal('templateDetailModal', false);
    loadTemplates();
  } catch (error) {
    console.error('Error deleting template:', error);
    showNotification(error.message || 'Lỗi khi xóa template', 'danger');
  }
}

/**
 * Show error state
 */
function showErrorState(message) {
  const container = document.getElementById('templatesContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="emoji">❌</div>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Show loading state
 */
function showLoadingState() {
  const container = document.getElementById('templatesContainer');
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải danh sách template...</p>
    </div>
  `;
}
