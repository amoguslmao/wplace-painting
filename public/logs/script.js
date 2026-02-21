import { getLogs } from '/js/api.js';

// State
let logsData = [];
let autoRefreshInterval = null;
let fetchInterval = 5000; // 5 seconds
let logsLimit = 100;
let isAutoRefresh = false;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initializePage();
});

/**
 * Initialize page
 */
function initializePage() {
  updateFetchInterval();
  updateLogsLimit();
}

/**
 * Fetch logs từ API
 */
async function fetchLogsNow() {
  try {
    document.getElementById('loadingIndicator').textContent = 'Đang tải...';
    document.getElementById('loadingIndicator').className = '';
    
    const response = await getLogs(logsLimit);
    logsData = response.data || [];
    
    renderLogs();
    updateLastUpdateTime();
    
    document.getElementById('totalLogsCount').textContent = logsData.length;
    showNotification('Đã fetch logs thành công', 'success');
  } catch (error) {
    console.error('Error fetching logs:', error);
    showNotification(error.message || 'Lỗi khi fetch logs', 'danger');
  } finally {
    document.getElementById('loadingIndicator').textContent = 'Tắt';
    document.getElementById('loadingIndicator').className = 'text-muted';
  }
}

/**
 * Render logs
 */
function renderLogs() {
  const container = document.getElementById('logsContainer');
  
  if (logsData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📋</div>
        <p>Chưa có logs</p>
        <p class="text-muted">Nhấn "Fetch Ngay" để tải logs hoặc bật Auto Refresh</p>
      </div>
    `;
    return;
  }

  // Filter logs
  const filteredLogs = applyFilters(true);
  
  container.innerHTML = filteredLogs.map(log => createLogEntry(log)).join('');
}

/**
 * Tạo log entry
 */
function createLogEntry(log) {
  const time = new Date(log.timestamp).toLocaleTimeString('vi-VN');
  const level = (log.level || 'info').toLowerCase();
  const message = log.message || '';

  return `
    <div class="log-entry ${level}" onclick="showLogDetail(${log.id || index}, '${level}', '${message.replace(/'/g, "\\'")}')">
      <span class="log-level">${level}</span>
      <span class="log-time">${time}</span>
      <span class="log-message">${escapeHtml(message)}</span>
    </div>
  `;
}

/**
 * Apply filters
 */
function applyFilters(returnOnly = false) {
  const filterLevel = document.getElementById('filterLevel').value;
  
  let filtered = logsData;
  
  if (filterLevel) {
    filtered = logsData.filter(log => 
      (log.level || 'info').toLowerCase() === filterLevel.toLowerCase()
    );
  }

  if (!returnOnly) {
    renderLogs();
  }
  
  return filtered;
}

/**
 * Show log detail
 */
function showLogDetail(id, level, message) {
  const modalBody = document.getElementById('logDetailContent');
  
  const logRecord = logsData.find(l => l.id === id) || { level, message };
  const details = typeof logRecord === 'string' ? message : JSON.stringify(logRecord, null, 2);
  
  modalBody.innerHTML = `
    <div class="log-detail-level" class="log-entry ${level}">
      <span style="background-color: rgba(255,107,53,0.2); color: var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 3px;">${level.toUpperCase()}</span>
    </div>
    <div class="log-detail-content">
${escapeHtml(details)}
    </div>
  `;
  
  toggleModal('logDetailModal', true);
}

/**
 * Copy log content
 */
function copyLogContent() {
  const content = document.getElementById('logDetailContent').textContent;
  navigator.clipboard.writeText(content).then(() => {
    showNotification('Đã copy log', 'success');
  });
}

/**
 * Toggle auto refresh
 */
function toggleAutoRefresh() {
  isAutoRefresh = !isAutoRefresh;
  
  if (isAutoRefresh) {
    document.getElementById('autoRefreshStatus').textContent = '🟢 Bật Auto Refresh';
    autoRefreshInterval = setInterval(() => {
      fetchLogsNow();
    }, fetchInterval);
    showNotification(`Auto Refresh bật (${fetchInterval / 1000}s)`, 'success');
  } else {
    document.getElementById('autoRefreshStatus').textContent = '🔴 Tắt Auto Refresh';
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
    showNotification('Auto Refresh tắt', 'success');
  }
}

/**
 * Update fetch interval
 */
function updateFetchInterval() {
  const value = parseInt(document.getElementById('fetchInterval').value);
  
  if (isNaN(value) || value < 1 || value > 60) {
    showNotification('Fetch Interval phải từ 1 đến 60 giây', 'warning');
    document.getElementById('fetchInterval').value = fetchInterval / 1000;
    return;
  }

  fetchInterval = value * 1000;
  
  // Restart auto refresh nếu đang bật
  if (isAutoRefresh) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
      fetchLogsNow();
    }, fetchInterval);
  }
  
  showNotification(`Fetch Interval cập nhật: ${value}s`, 'success');
}

/**
 * Update logs limit
 */
function updateLogsLimit() {
  const value = parseInt(document.getElementById('logsLimit').value);
  
  if (isNaN(value) || value < 10 || value > 500) {
    showNotification('Logs Limit phải từ 10 đến 500', 'warning');
    document.getElementById('logsLimit').value = logsLimit;
    return;
  }

  logsLimit = value;
  showNotification(`Logs Limit cập nhật: ${value}`, 'success');
}

/**
 * Clear logs
 */
function clearLogs() {
  if (!confirm('Bạn có chắc chắn muốn xóa tất cả logs trên trang này?')) {
    return;
  }

  logsData = [];
  document.getElementById('totalLogsCount').textContent = '0';
  renderLogs();
  showNotification('Logs đã được xóa', 'success');
}

/**
 * Update last update time
 */
function updateLastUpdateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN');
  document.getElementById('lastUpdateTime').textContent = timeStr;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
