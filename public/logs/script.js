import { getLogs } from "/js/api.js";

const LogsManager = (() => {
	let logsData = [];
	let autoRefreshInterval = null;
	let fetchInterval = 5000; // 5 seconds
	let logsLimit = 100;
	let isAutoRefresh = false;

	const init = () => {
		document.addEventListener("DOMContentLoaded", initializePage);
	};

	const initializePage = () => {
		updateFetchInterval();
		updateLogsLimit();
	};

	/**
	 * Fetch logs từ API
	 */
	const fetchLogsNow = async () => {
		try {
			const loadingIndicator =
				document.getElementById("loadingIndicator");
			if (loadingIndicator) {
				loadingIndicator.textContent = "Đang tải...";
				loadingIndicator.className = "";
			}

			const response = await getLogs(logsLimit);
			logsData = response.data || [];

			renderLogs();
			updateLastUpdateTime();

			const countElement = document.getElementById("totalLogsCount");
			if (countElement) {
				countElement.textContent = logsData.length;
			}

			showNotification("Đã fetch logs thành công", "success");
		} catch (error) {
			console.error("Error fetching logs:", error);
			showNotification(error.message || "Lỗi khi fetch logs", "danger");
		} finally {
			const loadingIndicator =
				document.getElementById("loadingIndicator");
			if (loadingIndicator) {
				loadingIndicator.textContent = "Tắt";
				loadingIndicator.className = "text-muted";
			}
		}
	};

	/**
	 * Render logs
	 */
	const renderLogs = () => {
		const container = document.getElementById("logsContainer");

		if (!container) return;

		if (logsData.length === 0) {
			container.innerHTML = "";
			const emptyState = document.createElement("div");
			emptyState.className = "empty-state";
			emptyState.innerHTML = `
        <div class="emoji">📋</div>
        <p>Chưa có logs</p>
        <p class="text-muted">Nhấn "Fetch Ngay" để tải logs hoặc bật Auto Refresh</p>
      `;
			container.appendChild(emptyState);
			return;
		}

		// Filter logs
		const filteredLogs = applyFilters(true);

		container.innerHTML = "";
		filteredLogs.forEach((log, index) => {
			const entry = createLogEntry(log, index);
			container.appendChild(entry);
		});
	};

	/**
	 * Tạo log entry
	 */
	const createLogEntry = (log, index) => {
		const time = new Date(log.timestamp).toLocaleTimeString("vi-VN");
		const level = (log.level || "info").toLowerCase();
		const message = log.message || "";

		const entry = document.createElement("div");
		entry.className = `log-entry ${level}`;

		const levelSpan = document.createElement("span");
		levelSpan.className = "log-level";
		levelSpan.textContent = level;

		const timeSpan = document.createElement("span");
		timeSpan.className = "log-time";
		timeSpan.textContent = time;

		const messageSpan = document.createElement("span");
		messageSpan.className = "log-message";
		messageSpan.textContent = message;

		entry.appendChild(levelSpan);
		entry.appendChild(timeSpan);
		entry.appendChild(messageSpan);

		entry.addEventListener("click", () => {
			showLogDetail(log.id || index, level, message);
		});

		return entry;
	};

	/**
	 * Apply filters
	 */
	const applyFilters = (returnOnly = false) => {
		const filterLevel = document.getElementById("filterLevel");
		const filterValue = filterLevel?.value || "";

		let filtered = logsData;

		if (filterValue) {
			filtered = logsData.filter(
				(log) =>
					(log.level || "info").toLowerCase() ===
					filterValue.toLowerCase(),
			);
		}

		if (!returnOnly) {
			renderLogs();
		}

		return filtered;
	};

	/**
	 * Show log detail
	 */
	const showLogDetail = (id, level, message) => {
		const modalBody = document.getElementById("logDetailContent");

		if (!modalBody) return;

		const logRecord = logsData.find((l) => l.id === id) || {
			level,
			message,
		};
		const details =
			typeof logRecord === "string"
				? message
				: JSON.stringify(logRecord, null, 2);

		modalBody.innerHTML = "";

		const levelDiv = document.createElement("div");
		levelDiv.className = `log-detail-level log-entry ${level}`;
		const levelSpan = document.createElement("span");
		levelSpan.style.cssText =
			"background-color: rgba(255,107,53,0.2); color: var(--primary-color); padding: 0.25rem 0.5rem; border-radius: 3px;";
		levelSpan.textContent = level.toUpperCase();
		levelDiv.appendChild(levelSpan);

		const contentDiv = document.createElement("div");
		contentDiv.className = "log-detail-content";
		contentDiv.textContent = details;

		modalBody.appendChild(levelDiv);
		modalBody.appendChild(contentDiv);

		toggleModal("logDetailModal", true);
	};

	/**
	 * Copy log content
	 */
	const copyLogContent = () => {
		const content =
			document.getElementById("logDetailContent")?.textContent || "";
		navigator.clipboard.writeText(content).then(() => {
			showNotification("Đã copy log", "success");
		});
	};

	/**
	 * Toggle auto refresh
	 */
	const toggleAutoRefresh = () => {
		isAutoRefresh = !isAutoRefresh;

		const statusElement = document.getElementById("autoRefreshStatus");

		if (isAutoRefresh) {
			if (statusElement) {
				statusElement.textContent = "🟢 Bật Auto Refresh";
			}
			autoRefreshInterval = setInterval(() => {
				fetchLogsNow();
			}, fetchInterval);
			showNotification(
				`Auto Refresh bật (${fetchInterval / 1000}s)`,
				"success",
			);
		} else {
			if (statusElement) {
				statusElement.textContent = "🔴 Tắt Auto Refresh";
			}
			if (autoRefreshInterval) {
				clearInterval(autoRefreshInterval);
			}
			showNotification("Auto Refresh tắt", "success");
		}
	};

	/**
	 * Update fetch interval
	 */
	const updateFetchInterval = () => {
		const input = document.getElementById("fetchInterval");
		const value = parseInt(input?.value);

		if (isNaN(value) || value < 1 || value > 60) {
			showNotification("Fetch Interval phải từ 1 đến 60 giây", "warning");
			if (input) {
				input.value = fetchInterval / 1000;
			}
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

		showNotification(`Fetch Interval cập nhật: ${value}s`, "success");
	};

	/**
	 * Update logs limit
	 */
	const updateLogsLimit = () => {
		const input = document.getElementById("logsLimit");
		const value = parseInt(input?.value);

		if (isNaN(value) || value < 10 || value > 500) {
			showNotification("Logs Limit phải từ 10 đến 500", "warning");
			if (input) {
				input.value = logsLimit;
			}
			return;
		}

		logsLimit = value;
		showNotification(`Logs Limit cập nhật: ${value}`, "success");
	};

	/**
	 * Clear logs
	 */
	const clearLogs = () => {
		if (!confirm("Bạn có chắc chắn muốn xóa tất cả logs trên trang này?")) {
			return;
		}

		logsData = [];
		const countElement = document.getElementById("totalLogsCount");
		if (countElement) {
			countElement.textContent = "0";
		}
		renderLogs();
		showNotification("Logs đã được xóa", "success");
	};

	/**
	 * Update last update time
	 */
	const updateLastUpdateTime = () => {
		const now = new Date();
		const timeStr = now.toLocaleTimeString("vi-VN");
		const timeElement = document.getElementById("lastUpdateTime");
		if (timeElement) {
			timeElement.textContent = timeStr;
		}
	};

	return {
		init,
		fetchLogsNow,
		toggleAutoRefresh,
		updateFetchInterval,
		updateLogsLimit,
		clearLogs,
		copyLogContent,
		applyFilters,
	};
})();

LogsManager.init();

// Export to global scope for inline onclick handlers
window.fetchLogsNow = LogsManager.fetchLogsNow;
window.toggleAutoRefresh = LogsManager.toggleAutoRefresh;
window.updateFetchInterval = LogsManager.updateFetchInterval;
window.updateLogsLimit = LogsManager.updateLogsLimit;
window.clearLogs = LogsManager.clearLogs;
window.copyLogContent = LogsManager.copyLogContent;
window.applyFilters = LogsManager.applyFilters;
