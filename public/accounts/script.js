import { 
  getAllAccounts, 
  addAccount, 
  deleteAccount, 
  fetchAccountInfo,
  bulkFetchAccounts,
  importJWTToken 
} from '/js/api.js';
import { formatJWTExpiration } from '/js/jwtParser.js';

// State
let accountsData = [];
let accountToDelete = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadAccounts();
});

/**
 * Load tất cả tài khoản
 */
async function loadAccounts() {
  try {
    showLoadingState();
    const response = await getAllAccounts();
    accountsData = response.data || [];
    renderAccounts();
    updateAccountCount();
  } catch (error) {
    console.error('Error loading accounts:', error);
    showErrorState('Không thể tải danh sách tài khoản');
  }
}

/**
 * Render danh sách tài khoản
 */
function renderAccounts() {
  const container = document.getElementById('accountsContainer');
  
  if (accountsData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📭</div>
        <p>Chưa có tài khoản nào</p>
        <p class="text-muted">Hãy thêm tài khoản đầu tiên để bắt đầu</p>
      </div>
    `;
    return;
  }

  container.innerHTML = accountsData.map(account => createAccountCard(account)).join('');
}

/**
 * Tạo card cho mỗi tài khoản
 */
function createAccountCard(account) {
  const user = account.user;
  const levelProgress = ((user.level % 1) * 100).toFixed(1);
  const expireDate = new Date(account.jwtToken !== 'hidden' ? 
    formatJWTExpiration(account.jwtToken) : 
    user.timeoutUntil);
  
  const allianceInfo = user.allianceId ? 
    `<div class="account-stat">
      <span class="account-stat-label">Alliance:</span>
      <span class="account-stat-value">${user.allianceId}</span>
    </div>` : 
    '';

  return `
    <div class="account-card" data-account-id="${account.id}">
      <div class="account-header">
        <div class="account-id">ID: ${account.id}</div>
        <div>
          <span class="account-name">${user.name}#${user.id}</span>
          <span class="account-level">Lv ${Math.floor(user.level)}<span style="font-size: 0.8rem;">${levelProgress}%</span></span>
        </div>
      </div>

      <div class="account-body">
        <div class="account-stat charges">
          <span class="account-stat-label">Charges:</span>
          <span class="account-stat-value">${user.charges.count}/${user.charges.max}</span>
        </div>

        <div class="account-stat">
          <span class="account-stat-label">Droplets:</span>
          <span class="account-stat-value">${user.droplets}</span>
        </div>

        <div class="account-stat">
          <span class="account-stat-label">Pixels:</span>
          <span class="account-stat-value">${user.pixelsPainted.toLocaleString()}</span>
        </div>

        <div class="account-stat">
          <span class="account-stat-label">Token Exp:</span>
          <span class="account-stat-value" style="font-size: 0.85rem;">${formatJWTExpiration(account.jwtToken)}</span>
        </div>

        ${allianceInfo}

        ${user.isCustomer ? '<div class="badge badge-success" style="margin-top: 0.5rem;">Customer</div>' : ''}
      </div>

      <div class="account-footer">
        <button class="btn-success" onclick="fetchAccountData(${account.id})" title="Fetch thông tin mới nhất">🔄 Fetch</button>
        <button class="btn-primary" onclick="editAccount(${account.id})">✏️ Sửa</button>
        <button class="btn-danger" onclick="openDeleteModal(${account.id}, '${user.name}#${user.id}')">🗑️</button>
      </div>
    </div>
  `;
}

/**
 * Thêm tài khoản mới
 */
async function addNewAccount() {
  const token = document.getElementById('jwtTokenInput').value.trim();
  if (!token) {
    showNotification('Vui lòng nhập JWT Token', 'warning');
    return;
  }

  try {
    // Có thể mở modal hoặc thêm trực tiếp
    toggleModal('addAccountModal', true);
    document.getElementById('modalJwtToken').value = token;
  } catch (error) {
    console.error('Error:', error);
    showNotification('Có lỗi xảy ra', 'danger');
  }
}

/**
 * Submit thêm tài khoản
 */
async function submitAddAccount() {
  const token = document.getElementById('modalJwtToken').value.trim();
  
  if (!token) {
    showNotification('Vui lòng nhập JWT Token', 'warning');
    return;
  }

  try {
    const response = await addAccount(token);
    showNotification('Tài khoản đã được thêm thành công!', 'success');
    toggleModal('addAccountModal', false);
    document.getElementById('modalJwtToken').value = '';
    document.getElementById('jwtTokenInput').value = '';
    loadAccounts();
  } catch (error) {
    console.error('Error adding account:', error);
    showNotification(error.message || 'Không thể thêm tài khoản', 'danger');
  }
}

/**
 * Bulk Fetch tất cả tài khoản
 */
async function bulkFetchAll() {
  try {
    showNotification('Đang fetch thông tin tất cả tài khoản...', 'info');
    const response = await bulkFetchAccounts();
    showNotification(`Fetch thành công ${response.fetched} tài khoản!`, 'success');
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadAccounts();
  } catch (error) {
    console.error('Error bulk fetching:', error);
    showNotification(error.message || 'Lỗi khi fetch tài khoản', 'danger');
  }
}

/**
 * Fetch thông tin tài khoản
 */
async function fetchAccountData(accountId) {
  try {
    showNotification('Đang fetch thông tin...', 'info');
    const response = await fetchAccountInfo(accountId);
    showNotification('Thông tin tài khoản đã được cập nhật!', 'success');
    await new Promise(resolve => setTimeout(resolve, 500));
    loadAccounts();
  } catch (error) {
    console.error('Error fetching account:', error);
    showNotification(error.message || 'Lỗi khi fetch tài khoản', 'danger');
  }
}

/**
 * Bulk Import modal
 */
function showBulkImportModal() {
  toggleModal('bulkImportModal', true);
}

/**
 * Submit bulk import
 */
async function submitBulkImport() {
  const input = document.getElementById('bulkTokensInput').value.trim();
  
  if (!input) {
    showNotification('Vui lòng nhập ít nhất 1 JWT Token', 'warning');
    return;
  }

  const tokens = input.split('\n')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (tokens.length === 0) {
    showNotification('Không tìm thấy token hợp lệ', 'warning');
    return;
  }

  try {
    showNotification(`Đang nhập ${tokens.length} token...`, 'info');
    
    let successCount = 0;
    let failCount = 0;

    for (const token of tokens) {
      try {
        await importJWTToken(token);
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    toggleModal('bulkImportModal', false);
    document.getElementById('bulkTokensInput').value = '';
    showNotification(`Nhập xong! Thành công: ${successCount}, Thất bại: ${failCount}`, 'success');
    loadAccounts();
  } catch (error) {
    console.error('Error bulk importing:', error);
    showNotification(error.message || 'Lỗi khi nhập token', 'danger');
  }
}

/**
 * Export accounts
 */
function exportAccounts() {
  try {
    const dataStr = JSON.stringify(accountsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `accounts-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Dữ liệu đã được xuất!', 'success');
  } catch (error) {
    console.error('Error exporting:', error);
    showNotification('Lỗi khi xuất dữ liệu', 'danger');
  }
}

/**
 * Refresh accounts list
 */
function refreshAccountsList() {
  loadAccounts();
}

/**
 * Open delete modal
 */
function openDeleteModal(accountId, accountName) {
  accountToDelete = accountId;
  document.getElementById('deleteAccountName').textContent = accountName;
  toggleModal('confirmDeleteModal', true);
}

/**
 * Confirm delete
 */
async function confirmDelete() {
  if (!accountToDelete) return;

  try {
    showNotification('Đang xóa tài khoản...', 'info');
    await deleteAccount(accountToDelete);
    showNotification('Tài khoản đã được xóa!', 'success');
    toggleModal('confirmDeleteModal', false);
    accountToDelete = null;
    loadAccounts();
  } catch (error) {
    console.error('Error deleting account:', error);
    showNotification(error.message || 'Lỗi khi xóa tài khoản', 'danger');
  }
}

/**
 * Edit account
 */
function editAccount(accountId) {
  // Redirect đến trang edit account
  window.location.href = `/edit-account/?id=${accountId}`;
}

/**
 * Show loading state
 */
function showLoadingState() {
  const container = document.getElementById('accountsContainer');
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải danh sách tài khoản...</p>
    </div>
  `;
}

/**
 * Show error state
 */
function showErrorState(message) {
  const container = document.getElementById('accountsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="emoji">❌</div>
      <p>${message}</p>
    </div>
  `;
}

/**
 * Update account count
 */
function updateAccountCount() {
  document.getElementById('accountCount').textContent = accountsData.length;
}
