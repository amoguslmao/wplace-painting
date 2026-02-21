import { 
  getAllAccounts,
  getTemplates,
  getLogs,
  getQueue,
  bulkFetchAccounts
} from '/js/api.js';

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
});

/**
 * Load dashboard stats
 */
async function loadDashboardStats() {
  try {
    // Fetch all data in parallel
    const [accountsRes, templatesRes, queueRes, logsRes] = await Promise.all([
      getAllAccounts().catch(() => ({ data: [] })),
      getTemplates().catch(() => ({ data: [] })),
      getQueue().catch(() => ({ data: [] })),
      getLogs(50).catch(() => ({ data: [] })),
    ]);

    // Update stats
    document.getElementById('accountsCount').textContent = accountsRes.data?.length || 0;
    document.getElementById('templatesCount').textContent = templatesRes.data?.length || 0;
    document.getElementById('queueCount').textContent = queueRes.data?.length || 0;
    document.getElementById('logsCount').textContent = logsRes.data?.length || 0;

    // Update last updated time
    const now = new Date();
    document.getElementById('lastUpdated').textContent = now.toLocaleTimeString('vi-VN');
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

/**
 * Bulk fetch accounts
 */
async function bulkFetchAccounts() {
  try {
    showNotification('Đang fetch tất cả tài khoản...', 'info');
    const response = await bulkFetchAccounts();
    showNotification(`Fetch thành công ${response.fetched || 0} tài khoản!`, 'success');
    
    // Reload stats
    setTimeout(() => {
      loadDashboardStats();
    }, 1000);
  } catch (error) {
    console.error('Error bulk fetching:', error);
    showNotification(error.message || 'Lỗi khi fetch tài khoản', 'danger');
  }
}

// Update stats every 30 seconds
setInterval(loadDashboardStats, 30000);
