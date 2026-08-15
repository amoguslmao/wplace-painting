import {
	getAllAccounts,
	getTemplates,
	getLogs,
	getQueue,
	bulkFetchAccounts,
} from "/js/api.js";

const DashboardManager = (() => {
	let statsUpdateInterval = null;

	const init = () => {
		document.addEventListener("DOMContentLoaded", loadDashboardStats);
		// Update stats every 30 seconds
		statsUpdateInterval = setInterval(loadDashboardStats, 30000);
	};

	/**
	 * Load dashboard stats
	 */
	const loadDashboardStats = async () => {
		try {
			// Fetch all data in parallel
			const [accountsRes, templatesRes, queueRes, logsRes] =
				await Promise.all([
					getAllAccounts().catch(() => ({ data: [] })),
					getTemplates().catch(() => ({ data: [] })),
					getQueue().catch(() => ({ data: [] })),
					getLogs(50).catch(() => ({ data: [] })),
				]);

			// Update stats
			const accountsElement = document.getElementById("accountsCount");
			if (accountsElement) {
				accountsElement.textContent = accountsRes.length || 0;
			}

			const templatesElement = document.getElementById("templatesCount");
			if (templatesElement) {
				templatesElement.textContent = templatesRes.length || 0;
			}

			const queueElement = document.getElementById("queueCount");
			if (queueElement) {
				queueElement.textContent = queueRes.data?.length || 0;
			}

			const logsElement = document.getElementById("logsCount");
			if (logsElement) {
				logsElement.textContent = logsRes.data?.length || 0;
			}

			// Update last updated time
			const now = new Date();
			const lastUpdatedElement = document.getElementById("lastUpdated");
			if (lastUpdatedElement) {
				lastUpdatedElement.textContent =
					now.toLocaleTimeString("vi-VN");
			}
		} catch (error) {
			console.error("Error loading dashboard stats:", error);
		}
	};

	/**
	 * Bulk fetch accounts
	 */
	const bulkGetAccounts = async () => {
		try {
			showNotification("Đang fetch tất cả tài khoản...", "info");
			const response = await bulkFetchAccounts();
			showNotification(
				`Fetch thành công ${response.fetched || 0} tài khoản!`,
				"success",
			);

			// Reload stats
			setTimeout(() => {
				loadDashboardStats();
			}, 1000);
		} catch (error) {
			console.error("Error bulk fetching:", error);
			showNotification(
				error.message || "Lỗi khi fetch tài khoản",
				"danger",
			);
		}
	};

	/**
	 * Cleanup on page unload
	 */
	const cleanup = () => {
		if (statsUpdateInterval) {
			clearInterval(statsUpdateInterval);
		}
	};

	return {
		init,
		bulkGetAccounts,
		cleanup,
	};
})();

DashboardManager.init();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
	DashboardManager.cleanup();
});

// Export to global scope for inline onclick handlers
window.bulkGetAccounts = DashboardManager.bulkGetAccounts;
