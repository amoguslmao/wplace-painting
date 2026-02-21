import { 
  getAllAccounts,
  updateAccount
} from '/js/api.js';

// State
let accountId = null;
let currentAccount = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  accountId = parseInt(urlParams.get('id'));

  if (!accountId) {
    showErrorState('Không tìm thấy ID tài khoản');
    return;
  }

  loadAccount();
});

/**
 * Load thông tin tài khoản
 */
async function loadAccount() {
  try {
    const response = await getAllAccounts();
    const accounts = response.data || [];
    
    currentAccount = accounts.find(acc => acc.id === accountId);
    
    if (!currentAccount) {
      showErrorState('Không tìm thấy tài khoản này');
      return;
    }

    renderForm();
  } catch (error) {
    console.error('Error loading account:', error);
    showErrorState('Lỗi khi tải thông tin tài khoản');
  }
}

/**
 * Render form chỉnh sửa
 */
function renderForm() {
  const user = currentAccount.user;
  const container = document.getElementById('editFormContainer');

  // Update page title
  document.getElementById('pageTitle').textContent = `Chỉnh sửa Tài Khoản: ${user.name}#${user.id}`;

  const formHTML = `
    <form id="editForm">
      <!-- User Basic Info Section -->
      <div class="form-section">
        <h2>Thông tin cơ bản</h2>
        
        <div class="info-box">
          <strong>Lưu ý:</strong> Một số trường dưới đây chỉ có thể xem, không thể chỉnh sửa. Những thay đổi sẽ được lưu vào cơ sở dữ liệu của server.
        </div>

        <div class="form-row">
          <div class="form-group-readonly">
            <label>Account ID</label>
            <div class="value">${currentAccount.id}</div>
          </div>
          <div class="form-group-readonly">
            <label>User ID</label>
            <div class="value">${user.id}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="userName">Tên người dùng <span class="badge-readonly">Chỉ xem</span></label>
            <input type="text" id="userName" value="${user.name}" disabled />
          </div>
          <div class="form-group">
            <label for="userLevel">Level</label>
            <input type="number" id="userLevel" value="${user.level}" step="0.001" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="pixelsPainted">Pixels Painted</label>
            <input type="number" id="pixelsPainted" value="${user.pixelsPainted}" />
          </div>
          <div class="form-group">
            <label for="droplets">Droplets</label>
            <input type="number" id="droplets" value="${user.droplets}" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="country">Đất nước</label>
            <input type="text" id="country" value="${user.country}" />
          </div>
          <div class="form-group">
            <label for="discord">Discord</label>
            <input type="text" id="discord" value="${user.discord}" />
          </div>
        </div>
      </div>

      <!-- Charges Section -->
      <div class="form-section">
        <h2>Charges</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="chargesCurrent">Charges Hiện tại</label>
            <input type="number" id="chargesCurrent" value="${user.charges.count}" />
          </div>
          <div class="form-group">
            <label for="chargesMax">Charges Tối đa</label>
            <input type="number" id="chargesMax" value="${user.charges.max}" />
          </div>
          <div class="form-group">
            <label for="chargesCooldown">Cooldown (ms)</label>
            <input type="number" id="chargesCooldown" value="${user.charges.cooldownMs}" />
          </div>
        </div>
      </div>

      <!-- Alliance Section -->
      <div class="form-section">
        <h2>Alliance</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="allianceId">Alliance ID</label>
            <input type="number" id="allianceId" value="${user.allianceId || ''}" placeholder="Để trống nếu không thuộc alliance" />
          </div>
          <div class="form-group">
            <label for="allianceRole">Alliance Role</label>
            <select id="allianceRole">
              <option value="">Không có</option>
              <option value="admin" ${user.allianceRole === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="member" ${user.allianceRole === 'member' ? 'selected' : ''}>Member</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Other Info Section -->
      <div class="form-section">
        <h2>Thông tin khác</h2>
        
        <div class="form-row">
          <div class="form-group">
            <label for="role">Role</label>
            <input type="text" id="role" value="${user.role}" />
          </div>
          <div class="form-group">
            <label for="isCustomer">Loại tài khoản</label>
            <select id="isCustomer">
              <option value="false" ${!user.isCustomer ? 'selected' : ''}>Regular</option>
              <option value="true" ${user.isCustomer ? 'selected' : ''}>Customer</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="showLastPixel">
              <input type="checkbox" id="showLastPixel" ${user.showLastPixel ? 'checked' : ''} />
              Hiển thị pixel cuối cùng
            </label>
          </div>
          <div class="form-group">
            <label for="needsPhoneVerification">
              <input type="checkbox" id="needsPhoneVerification" ${user.needsPhoneVerification ? 'checked' : ''} />
              Cần xác minh điện thoại
            </label>
          </div>
        </div>

        ${user.suspensionReason ? `
          <div class="form-row">
            <div class="form-group">
              <label for="suspensionReason">Lý do tạm ngưng</label>
              <textarea id="suspensionReason" rows="3">${user.suspensionReason}</textarea>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Read-only Info -->
      <div class="form-section">
        <h2>Thông tin hệ thống (Chỉ xem)</h2>
        
        <div class="form-row">
          <div class="form-group-readonly">
            <label>Token Hết hạn</label>
            <div class="value">${new Date(currentAccount.jwtToken !== 'hidden' ? 
              currentAccount.jwtToken : 
              user.timeoutUntil).toLocaleString('vi-VN')}</div>
          </div>
          <div class="form-group-readonly">
            <label>Timeout Until</label>
            <div class="value">${new Date(user.timeoutUntil).toLocaleString('vi-VN')}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group-readonly">
            <label>Last Fetch</label>
            <div class="value">${new Date(currentAccount.lastFetch * 1000).toLocaleString('vi-VN')}</div>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" class="btn-secondary" onclick="window.history.back()">Hủy</button>
        <button type="button" class="btn-primary" onclick="validateAndSave()">Lưu thay đổi</button>
      </div>
    </form>
  `;

  container.innerHTML = formHTML;
}

/**
 * Validate và lưu thay đổi
 */
function validateAndSave() {
  // Validate dữ liệu
  const level = parseFloat(document.getElementById('userLevel').value);
  const pixelsPainted = parseInt(document.getElementById('pixelsPainted').value);
  const droplets = parseInt(document.getElementById('droplets').value);
  const chargesCurrent = parseInt(document.getElementById('chargesCurrent').value);
  const chargesMax = parseInt(document.getElementById('chargesMax').value);

  if (isNaN(level) || level < 0) {
    showNotification('Level phải là số dương', 'warning');
    return;
  }

  if (isNaN(pixelsPainted) || pixelsPainted < 0) {
    showNotification('Pixels Painted phải là số dương', 'warning');
    return;
  }

  if (isNaN(droplets) || droplets < 0) {
    showNotification('Droplets phải là số dương', 'warning');
    return;
  }

  if (isNaN(chargesCurrent) || chargesCurrent < 0) {
    showNotification('Charges Current phải là số dương', 'warning');
    return;
  }

  if (isNaN(chargesMax) || chargesMax < 0) {
    showNotification('Charges Max phải là số dương', 'warning');
    return;
  }

  if (chargesCurrent > chargesMax) {
    showNotification('Charges Current không thể vượt quá Charges Max', 'warning');
    return;
  }

  // Mở modal xác nhận
  toggleModal('confirmSaveModal', true);
}

/**
 * Submit thay đổi
 */
async function submitChanges() {
  try {
    toggleModal('confirmSaveModal', false);
    showNotification('Đang lưu thay đổi...', 'info');

    // Collect form data
    const updateData = {
      level: parseFloat(document.getElementById('userLevel').value),
      pixelsPainted: parseInt(document.getElementById('pixelsPainted').value),
      droplets: parseInt(document.getElementById('droplets').value),
      country: document.getElementById('country').value,
      discord: document.getElementById('discord').value,
      role: document.getElementById('role').value,
      isCustomer: document.getElementById('isCustomer').value === 'true',
      showLastPixel: document.getElementById('showLastPixel').checked,
      needsPhoneVerification: document.getElementById('needsPhoneVerification').checked,
      allianceId: document.getElementById('allianceId').value ? 
        parseInt(document.getElementById('allianceId').value) : null,
      allianceRole: document.getElementById('allianceRole').value || null,
      charges: {
        current: parseInt(document.getElementById('chargesCurrent').value),
        max: parseInt(document.getElementById('chargesMax').value),
        cooldownMs: parseInt(document.getElementById('chargesCooldown').value),
      },
    };

    if (currentAccount.user.suspensionReason && document.getElementById('suspensionReason')) {
      updateData.suspensionReason = document.getElementById('suspensionReason').value;
    }

    const response = await updateAccount(accountId, updateData);
    showNotification('Thay đổi đã được lưu thành công!', 'success');
    
    setTimeout(() => {
      window.location.href = '/accounts/';
    }, 1500);
  } catch (error) {
    console.error('Error saving changes:', error);
    showNotification(error.message || 'Lỗi khi lưu thay đổi', 'danger');
  }
}

/**
 * Show error state
 */
function showErrorState(message) {
  const container = document.getElementById('editFormContainer');
  container.innerHTML = `
    <div class="error-state">
      <div class="emoji">❌</div>
      <p>${message}</p>
      <a href="/accounts/" class="btn-secondary" style="display: inline-block; margin-top: 1rem;">Quay lại danh sách</a>
    </div>
  `;
}
