// API Base URL
const API_BASE_URL = "/api";

/**
 * Hàm fetch API chung
 * @param {string} endpoint
 * @param {object} options
 * @returns { object }
 */
async function apiCall(endpoint, options = {}) {
	const url = `${API_BASE_URL}${endpoint}`;

	const defaultOptions = {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	};

	const finalOptions = { ...defaultOptions, ...options };

	try {
		const response = await fetch(url, finalOptions);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.message || `HTTP Error: ${response.status}`,
			);
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
	return apiCall("/accounts", { method: "GET" });
}

/**
 * Thêm tài khoản mới
 */
async function addAccount(jwtToken) {
	return apiCall("/accounts", {
		method: "POST",
		body: JSON.stringify({ tokens: [jwtToken] }),
	});
}

/**
 * Xóa tài khoản
 */
async function deleteAccount(accountId) {
	return apiCall(`/accounts/${accountId}`, { method: "DELETE" });
}

/**
 * Fetch thông tin tài khoản
 */
async function fetchAccountInfo(accountId) {
	return apiCall(`/accounts/${accountId}/user/fetch`, { method: "GET" });
}

/**
 * Update tài khoản
 */
async function updateAccount(accountId, data) {
	return apiCall(`/accounts/update/${accountId}`, {
		method: "PUT",
		body: JSON.stringify(data),
	});
}

/**
 * Fetch tất cả tài khoản
 */
async function bulkFetchAccounts() {
	return apiCall("/accounts/bulkFetch", { method: "POST" });
}

/**
 * Import JWT Token
 * @param {string[]} jwtTokens
 */
async function importJWTToken(jwtTokens) {
	return apiCall("/accounts", {
		method: "POST",
		body: JSON.stringify({ tokens: jwtTokens }),
	});
}

/**
 * Lấy danh sách template
 */
async function getTemplates() {
	return apiCall("/templates", { method: "GET" });
}

/**
 * Lấy logs
 */
async function getLogs(limit = 100) {
	return apiCall(`/logs?limit=${limit}`, { method: "GET" });
}

/**
 * Lấy queue
 */
async function getQueue() {
	return apiCall("/queue", { method: "GET" });
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
