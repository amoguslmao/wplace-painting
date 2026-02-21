// API Base URL
const API_BASE_URL = '/api';

/**
 * Hàm fetch API chung
 */
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Lấy tất cả tài khoản
 */
async function getAllAccounts() {
  return apiCall('/accounts/getAll', { method: 'GET' });
}

/**
 * Thêm tài khoản mới
 */
async function addAccount(jwtToken) {
  return apiCall('/accounts/add', {
    method: 'POST',
    body: JSON.stringify({ jwtToken }),
  });
}

/**
 * Xóa tài khoản
 */
async function deleteAccount(accountId) {
  return apiCall(`/accounts/delete/${accountId}`, { method: 'DELETE' });
}

/**
 * Fetch thông tin tài khoản
 */
async function fetchAccountInfo(accountId) {
  return apiCall(`/accounts/fetch/${accountId}`, { method: 'POST' });
}

/**
 * Update tài khoản
 */
async function updateAccount(accountId, data) {
  return apiCall(`/accounts/update/${accountId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Fetch tất cả tài khoản
 */
async function bulkFetchAccounts() {
  return apiCall('/accounts/bulkFetch', { method: 'POST' });
}

/**
 * Import JWT Token
 */
async function importJWTToken(jwtToken) {
  return apiCall('/accounts/import', {
    method: 'POST',
    body: JSON.stringify({ jwtToken }),
  });
}

/**
 * Lấy danh sách template
 */
async function getTemplates() {
  return apiCall('/templates/list', { method: 'GET' });
}

/**
 * Lấy logs
 */
async function getLogs(limit = 100) {
  return apiCall(`/logs?limit=${limit}`, { method: 'GET' });
}

/**
 * Lấy queue
 */
async function getQueue() {
  return apiCall('/queue', { method: 'GET' });
}

export {
  apiCall,
  getAllAccounts,
  addAccount,
  deleteAccount,
  fetchAccountInfo,
  updateAccount,
  bulkFetchAccounts,
  importJWTToken,
  getTemplates,
  getLogs,
  getQueue,
};
