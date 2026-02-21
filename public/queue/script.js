import { getQueue } from '/js/api.js';

// State
let queueData = [];
let autoRefreshInterval = null;
let fetchInterval = 2000; // 2 seconds
let isAutoRefresh = false;
let sortAscending = true;
let timerIntervals = {};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  fetchQueueNow();
});

/**
 * Fetch queue từ API
 */
async function fetchQueueNow() {
  try {
    const response = await getQueue();
    queueData = response.data || [];
    
    renderQueue();
    updateStats();
    updateUpdateTime();
  } catch (error) {
    console.error('Error fetching queue:', error);
    showNotification(error.message || 'Lỗi khi fetch queue', 'danger');
  }
}

/**
 * Render queue items
 */
function renderQueue() {
  const container = document.getElementById('queueContainer');
  
  if (queueData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📭</div>
        <p>Chưa có dữ liệu</p>
        <p class="text-muted">Nhấn "Fetch Ngay" để tải danh sách hoặc bật Auto Refresh</p>
      </div>
    `;
    return;
  }

  // Clear existing timers
  Object.keys(timerIntervals).forEach(key => clearInterval(timerIntervals[key]));
  timerIntervals = {};

  // Sort queue items
  const sortedQueue = [...queueData].sort((a, b) => {
    const timeA = new Date(a.chargeUntil).getTime();
    const timeB = new Date(b.chargeUntil).getTime();
    return sortAscending ? timeA - timeB : timeB - timeA;
  });

  container.innerHTML = sortedQueue.map((item, index) => createQueueItem(item, index)).join('');

  // Start timers
  sortedQueue.forEach((item, index) => {
    startTimer(item.id || index, item.chargeUntil, item.charges.cooldownMs);
  });
}

/**
 * Tạo queue item
 */
function createQueueItem(item, index) {
  const chargeUntilTime = new Date(item.chargeUntil);
  const now = new Date();
  const isCharging = chargeUntilTime > now;
  const timeRemaining = Math.max(0, chargeUntilTime.getTime() - now.getTime());

  const statusClass = isCharging ? 'charging' : 'ready';
  const statusText = isCharging ? '⏳ Đang Charge' : '✅ Sẵn sàng';

  return `
    <div class="queue-item ${statusClass}" data-queue-id="${item.id || index}">
      <div class="queue-item-info">
        <div class="queue-item-header">
          <span class="queue-account-name">${item.user.name}#${item.user.id}</span>
          <span class="queue-item-status ${statusClass}">${statusText}</span>
        </div>

        <div class="queue-item-details">
          <div class="queue-detail">
            <span class="queue-detail-label">Charges Hiện tại</span>
            <span class="queue-detail-value">${item.charges.count}/${item.charges.max}</span>
          </div>
          <div class="queue-detail">
            <span class="queue-detail-label">Cooldown</span>
            <span class="queue-detail-value">${(item.charges.cooldownMs / 1000).toFixed(1)}s</span>
          </div>
          <div class="queue-detail">
            <span class="queue-detail-label">Alliance</span>
            <span class="queue-detail-value">${item.user.allianceId || 'N/A'}</span>
          </div>
        </div>

        ${isCharging ? `
          <div class="queue-progress-bar">
            <div class="queue-progress-fill" id="progress-${item.id || index}" style="width: ${getProgressPercentage(chargeUntilTime)}%"></div>
          </div>
        ` : ''}
      </div>

      <div class="queue-item-timer">
        <span class="queue-timer-label">Thời gian</span>
        <span class="queue-timer-value" id="timer-${item.id || index}">
          ${formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  `;
}

/**
 * Start timer cho item
 */
function startTimer(id, chargeUntilTime, cooldownMs) {
  const chargeUntil = new Date(chargeUntilTime);

  const updateTimer = () => {
    const now = new Date();
    const timeRemaining = Math.max(0, chargeUntil.getTime() - now.getTime());
    
    const timerElement = document.getElementById(`timer-${id}`);
    if (timerElement) {
      timerElement.textContent = formatTime(timeRemaining);
    }

    const progressElement = document.getElementById(`progress-${id}`);
    if (progressElement) {
      const progress = getProgressPercentage(chargeUntil);
      progressElement.style.width = `${Math.max(0, progress)}%`;
    }

    if (timeRemaining <= 0) {
      // Timer hoàn thành
      if (timerIntervals[id]) {
        clearInterval(timerIntervals[id]);
        delete timerIntervals[id];
      }
    }
  };

  timerIntervals[id] = setInterval(updateTimer, 1000);
  updateTimer(); // Call immediately
}

/**
 * Get progress percentage
 */
function getProgressPercentage(chargeUntilTime) {
  const chargeUntil = new Date(chargeUntilTime);
  const now = new Date();
  const timeRemaining = Math.max(0, chargeUntil.getTime() - now.getTime());
  const totalTime = chargeUntil.getTime() - (chargeUntil.getTime() - timeRemaining);
  
  // Tìm item để lấy cooldownMs
  const queueItem = queueData.find(item => {
    const until = new Date(item.chargeUntil);
    return until.getTime() === chargeUntil.getTime();
  });

  if (!queueItem) return 100;
  
  const cooldownMs = queueItem.charges.cooldownMs || 30000;
  const progress = ((cooldownMs - timeRemaining) / cooldownMs) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Format time
 */
function formatTime(ms) {
  if (ms <= 0) return '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Update stats
 */
function updateStats() {
  const chargingCount = queueData.filter(item => {
    const chargeUntil = new Date(item.chargeUntil);
    return chargeUntil > new Date();
  }).length;

  const totalCharges = queueData.reduce((sum, item) => sum + item.charges.max, 0);
  const usedCharges = queueData.reduce((sum, item) => sum + (item.charges.max - item.charges.count), 0);

  document.getElementById('chargingAccountCount').textContent = chargingCount;
  document.getElementById('totalCharges').textContent = totalCharges;
  document.getElementById('usedCharges').textContent = usedCharges;
}

/**
 * Update update time
 */
function updateUpdateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN');
  document.getElementById('updateTime').textContent = timeStr;
}

/**
 * Toggle auto refresh
 */
function toggleAutoRefresh() {
  isAutoRefresh = !isAutoRefresh;

  if (isAutoRefresh) {
    document.getElementById('autoRefreshStatus').textContent = '🟢 Bật Auto Refresh';
    autoRefreshInterval = setInterval(() => {
      fetchQueueNow();
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
 * Toggle sort order
 */
function toggleSortOrder() {
  sortAscending = !sortAscending;
  const sortText = sortAscending ? 
    '⬇️ Sắp xếp theo Thời gian (Cũ trước)' : 
    '⬆️ Sắp xếp theo Thời gian (Mới trước)';
  document.getElementById('sortStatus').textContent = sortText;
  renderQueue();
}

/**
 * Clear queue
 */
function clearQueue() {
  if (!confirm('Bạn có chắc chắn muốn xóa danh sách này? (Điều này chỉ xóa trên màn hình)')) {
    return;
  }

  queueData = [];
  Object.keys(timerIntervals).forEach(key => clearInterval(timerIntervals[key]));
  timerIntervals = {};
  renderQueue();
  updateStats();
  showNotification('Queue đã được xóa', 'success');
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  Object.keys(timerIntervals).forEach(key => clearInterval(timerIntervals[key]));
});
