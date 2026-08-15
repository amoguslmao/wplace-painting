import { getQueue } from "/js/api.js";

const QueueManager = (() => {
	let queueData = [];
	let autoRefreshInterval = null;
	let fetchInterval = 2000; // 2 seconds
	let isAutoRefresh = false;
	let sortAscending = true;
	let timerIntervals = {};

	const init = () => {
		document.addEventListener("DOMContentLoaded", fetchQueueNow);
		window.addEventListener("beforeunload", cleanup);
	};

	/**
	 * Fetch queue từ API
	 */
	const fetchQueueNow = async () => {
		try {
			const response = await getQueue();
			queueData = response.data || [];

			renderQueue();
			updateStats();
			updateUpdateTime();
		} catch (error) {
			console.error("Error fetching queue:", error);
			showNotification(error.message || "Lỗi khi fetch queue", "danger");
		}
	};

	/**
	 * Render queue items
	 */
	const renderQueue = () => {
		const container = document.getElementById("queueContainer");

		if (!container) return;

		if (queueData.length === 0) {
			container.innerHTML = "";
			const emptyState = document.createElement("div");
			emptyState.className = "empty-state";
			emptyState.innerHTML = `
        <div class="emoji">📭</div>
        <p>Chưa có dữ liệu</p>
        <p class="text-muted">Nhấn "Fetch Ngay" để tải danh sách hoặc bật Auto Refresh</p>
      `;
			container.appendChild(emptyState);
			return;
		}

		// Clear existing timers
		Object.keys(timerIntervals).forEach((key) =>
			clearInterval(timerIntervals[key]),
		);
		timerIntervals = {};

		// Sort queue items
		const sortedQueue = [...queueData].sort((a, b) => {
			const timeA = new Date(a.chargeUntil).getTime();
			const timeB = new Date(b.chargeUntil).getTime();
			return sortAscending ? timeA - timeB : timeB - timeA;
		});

		container.innerHTML = "";
		sortedQueue.forEach((item, index) => {
			const queueItem = createQueueItem(item, index);
			container.appendChild(queueItem);
		});

		// Start timers
		sortedQueue.forEach((item, index) => {
			startTimer(
				item.id || index,
				item.chargeUntil,
				item.charges.cooldownMs,
			);
		});
	};

	/**
	 * Tạo queue item element
	 */
	const createQueueItem = (item, index) => {
		const chargeUntilTime = new Date(item.chargeUntil);
		const now = new Date();
		const isCharging = chargeUntilTime > now;
		const timeRemaining = Math.max(
			0,
			chargeUntilTime.getTime() - now.getTime(),
		);

		const statusClass = isCharging ? "charging" : "ready";
		const statusText = isCharging ? "⏳ Đang Charge" : "✅ Sẵn sàng";

		const queueDiv = document.createElement("div");
		queueDiv.className = `queue-item ${statusClass}`;
		queueDiv.setAttribute("data-queue-id", item.id || index);

		const infoDiv = document.createElement("div");
		infoDiv.className = "queue-item-info";

		// Header
		const headerDiv = document.createElement("div");
		headerDiv.className = "queue-item-header";

		const nameSpan = document.createElement("span");
		nameSpan.className = "queue-account-name";
		nameSpan.textContent = `${item.user.name}#${item.user.id}`;

		const statusSpan = document.createElement("span");
		statusSpan.className = `queue-item-status ${statusClass}`;
		statusSpan.textContent = statusText;

		headerDiv.appendChild(nameSpan);
		headerDiv.appendChild(statusSpan);

		// Details
		const detailsDiv = document.createElement("div");
		detailsDiv.className = "queue-item-details";

		const chargesDetail = createQueueDetail(
			"Charges Hiện tại",
			`${item.charges.count}/${item.charges.max}`,
		);
		const cooldownDetail = createQueueDetail(
			"Cooldown",
			`${(item.charges.cooldownMs / 1000).toFixed(1)}s`,
		);
		const allianceDetail = createQueueDetail(
			"Alliance",
			item.user.allianceId || "N/A",
		);

		detailsDiv.appendChild(chargesDetail);
		detailsDiv.appendChild(cooldownDetail);
		detailsDiv.appendChild(allianceDetail);

		// Progress bar if charging
		if (isCharging) {
			const progressBar = document.createElement("div");
			progressBar.className = "queue-progress-bar";

			const progressFill = document.createElement("div");
			progressFill.className = "queue-progress-fill";
			progressFill.id = `progress-${item.id || index}`;
			progressFill.style.width = `${getProgressPercentage(chargeUntilTime)}%`;

			progressBar.appendChild(progressFill);
			infoDiv.appendChild(progressBar);
		}

		infoDiv.appendChild(headerDiv);
		infoDiv.appendChild(detailsDiv);

		// Timer
		const timerDiv = document.createElement("div");
		timerDiv.className = "queue-item-timer";

		const timerLabelSpan = document.createElement("span");
		timerLabelSpan.className = "queue-timer-label";
		timerLabelSpan.textContent = "Thời gian";

		const timerValueSpan = document.createElement("span");
		timerValueSpan.className = "queue-timer-value";
		timerValueSpan.id = `timer-${item.id || index}`;
		timerValueSpan.textContent = formatTime(timeRemaining);

		timerDiv.appendChild(timerLabelSpan);
		timerDiv.appendChild(timerValueSpan);

		queueDiv.appendChild(infoDiv);
		queueDiv.appendChild(timerDiv);

		return queueDiv;
	};

	/**
	 * Create queue detail element
	 */
	const createQueueDetail = (label, value) => {
		const detailDiv = document.createElement("div");
		detailDiv.className = "queue-detail";

		const labelSpan = document.createElement("span");
		labelSpan.className = "queue-detail-label";
		labelSpan.textContent = label;

		const valueSpan = document.createElement("span");
		valueSpan.className = "queue-detail-value";
		valueSpan.textContent = value;

		detailDiv.appendChild(labelSpan);
		detailDiv.appendChild(valueSpan);

		return detailDiv;
	};

	/**
	 * Start timer cho item
	 */
	const startTimer = (id, chargeUntilTime, cooldownMs) => {
		const chargeUntil = new Date(chargeUntilTime);

		const updateTimer = () => {
			const now = new Date();
			const timeRemaining = Math.max(
				0,
				chargeUntil.getTime() - now.getTime(),
			);

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
	};

	/**
	 * Get progress percentage
	 */
	const getProgressPercentage = (chargeUntilTime) => {
		const chargeUntil = new Date(chargeUntilTime);
		const now = new Date();
		const timeRemaining = Math.max(
			0,
			chargeUntil.getTime() - now.getTime(),
		);

		// Tìm item để lấy cooldownMs
		const queueItem = queueData.find((item) => {
			const until = new Date(item.chargeUntil);
			return until.getTime() === chargeUntil.getTime();
		});

		if (!queueItem) return 100;

		const cooldownMs = queueItem.charges.cooldownMs || 30000;
		const progress = ((cooldownMs - timeRemaining) / cooldownMs) * 100;
		return Math.min(100, Math.max(0, progress));
	};

	/**
	 * Format time
	 */
	const formatTime = (ms) => {
		if (ms <= 0) return "00:00:00";

		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		if (hours > 0) {
			return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
		}

		return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	};

	/**
	 * Update stats
	 */
	const updateStats = () => {
		const chargingCount = queueData.filter((item) => {
			const chargeUntil = new Date(item.chargeUntil);
			return chargeUntil > new Date();
		}).length;

		const totalCharges = queueData.reduce(
			(sum, item) => sum + item.charges.max,
			0,
		);
		const usedCharges = queueData.reduce(
			(sum, item) => sum + (item.charges.max - item.charges.count),
			0,
		);

		const chargingElement = document.getElementById("chargingAccountCount");
		if (chargingElement) {
			chargingElement.textContent = chargingCount;
		}

		const totalElement = document.getElementById("totalCharges");
		if (totalElement) {
			totalElement.textContent = totalCharges;
		}

		const usedElement = document.getElementById("usedCharges");
		if (usedElement) {
			usedElement.textContent = usedCharges;
		}
	};

	/**
	 * Update update time
	 */
	const updateUpdateTime = () => {
		const now = new Date();
		const timeStr = now.toLocaleTimeString("vi-VN");
		const timeElement = document.getElementById("updateTime");
		if (timeElement) {
			timeElement.textContent = timeStr;
		}
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
				fetchQueueNow();
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
	 * Toggle sort order
	 */
	const toggleSortOrder = () => {
		sortAscending = !sortAscending;
		const sortText = sortAscending
			? "⬇️ Sắp xếp theo Thời gian (Cũ trước)"
			: "⬆️ Sắp xếp theo Thời gian (Mới trước)";
		const sortElement = document.getElementById("sortStatus");
		if (sortElement) {
			sortElement.textContent = sortText;
		}
		renderQueue();
	};

	/**
	 * Clear queue
	 */
	const clearQueue = () => {
		if (
			!confirm(
				"Bạn có chắc chắn muốn xóa danh sách này? (Điều này chỉ xóa trên màn hình)",
			)
		) {
			return;
		}

		queueData = [];
		Object.keys(timerIntervals).forEach((key) =>
			clearInterval(timerIntervals[key]),
		);
		timerIntervals = {};
		renderQueue();
		updateStats();
		showNotification("Queue đã được xóa", "success");
	};

	/**
	 * Cleanup on page unload
	 */
	const cleanup = () => {
		if (autoRefreshInterval) {
			clearInterval(autoRefreshInterval);
		}
		Object.keys(timerIntervals).forEach((key) =>
			clearInterval(timerIntervals[key]),
		);
	};

	return {
		init,
		fetchQueueNow,
		toggleAutoRefresh,
		toggleSortOrder,
		clearQueue,
	};
})();

QueueManager.init();

// Export to global scope for inline onclick handlers
window.fetchQueueNow = QueueManager.fetchQueueNow;
window.toggleAutoRefresh = QueueManager.toggleAutoRefresh;
window.toggleSortOrder = QueueManager.toggleSortOrder;
window.clearQueue = QueueManager.clearQueue;
