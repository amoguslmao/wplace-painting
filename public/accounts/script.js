import {
	getAllAccounts,
	addAccount,
	deleteAccount,
	fetchAccountInfo,
	bulkFetchAccounts,
	importJWTToken,
} from "/js/api.js";
import { formatJWTExpiration } from "/js/jwtParser.js";

const AccountsManager = (() => {
	let accountsData = [];
	let accountToDelete = null;

	const init = () => {
		document.addEventListener("DOMContentLoaded", loadAccounts);
	};

	const loadAccounts = async () => {
		try {
			showLoadingState();
			const response = await getAllAccounts();
			accountsData = response || [];
			renderAccounts();
			updateAccountCount();
		} catch (error) {
			console.error("Error loading accounts:", error);
			showErrorState("Không thể tải danh sách tài khoản");
		}
	};

	const renderAccounts = () => {
		const container = document.getElementById("accountsContainer");

		if (!container) return;

		if (accountsData.length === 0) {
			container.innerHTML = "";
			const emptyState = document.createElement("div");
			emptyState.className = "empty-state";
			emptyState.innerHTML = `
        <div class="emoji">📭</div>
        <p>Chưa có tài khoản nào</p>
        <p class="text-muted">Hãy thêm tài khoản đầu tiên để bắt đầu</p>
      `;
			container.appendChild(emptyState);
			return;
		}

		container.innerHTML = "";
		accountsData.forEach((account) => {
			const card = createAccountCard(account);
			container.appendChild(card);
		});
	};

	const createAccountCard = (account) => {
		const user = account.user;
		const levelProgress = ((user.level % 1) * 100).toFixed(1);
		const hasAlliance = user.allianceId && user.allianceId > 0;
		const isCustomer = user.isCustomer === true;

		const card = document.createElement("div");
		card.className = "account-card";
		card.setAttribute("data-account-id", account.id);

		const header = document.createElement("div");
		header.className = "account-header";

		const idDiv = document.createElement("div");
		idDiv.className = "account-id";
		idDiv.textContent = `ID: ${account.id}`;

		const nameDiv = document.createElement("div");
		const nameSpan = document.createElement("span");
		nameSpan.className = "account-name";
		nameSpan.textContent = `${user.name}#${user.id}`;

		const levelSpan = document.createElement("span");
		levelSpan.className = "account-level";
		levelSpan.innerHTML = `Lv ${Math.floor(user.level)} <span style="font-size: 0.8rem;">(${levelProgress}%)</span>`;

		nameDiv.appendChild(nameSpan);
		nameDiv.appendChild(levelSpan);

		header.appendChild(idDiv);
		header.appendChild(nameDiv);

		const body = document.createElement("div");
		body.className = "account-body";

		const charges = createAccountStat(
			"Charges:",
			`${user.charges.count}/${user.charges.max}`,
			true,
		);
		const droplets = createAccountStat(
			"Droplets:",
			user.droplets.toString(),
		);
		const pixels = createAccountStat(
			"Pixels:",
			user.pixelsPainted.toLocaleString(),
		);
		const tokenExp = createAccountStat(
			"Token Exp:",
			formatJWTExpiration(account.jwtToken),
			false,
			true,
		);

		body.appendChild(charges);
		body.appendChild(droplets);
		body.appendChild(pixels);
		body.appendChild(tokenExp);

		if (hasAlliance) {
			const alliance = createAccountStat(
				"Alliance:",
				user.allianceName,
			);
			body.appendChild(alliance);
		}

		if (isCustomer) {
			const badge = document.createElement("div");
			badge.className = "badge badge-success";
			badge.style.marginTop = "0.5rem";
			badge.textContent = "Customer";
			body.appendChild(badge);
		}

		const footer = document.createElement("div");
		footer.className = "account-footer";

		const fetchBtn = document.createElement("button");
		fetchBtn.className = "btn-success";
		fetchBtn.title = "Fetch thông tin mới nhất";
		fetchBtn.textContent = "🔄 Fetch";
		fetchBtn.addEventListener("click", () => fetchAccountData(account.id));

		const editBtn = document.createElement("button");
		editBtn.className = "btn-primary";
		editBtn.textContent = "✏️ Sửa";
		editBtn.addEventListener("click", () => editAccount(account.id));

		const deleteBtn = document.createElement("button");
		deleteBtn.className = "btn-danger";
		deleteBtn.textContent = "🗑️";
		deleteBtn.addEventListener("click", () =>
			openDeleteModal(account.id, `${user.name}#${user.id}`),
		);

		footer.appendChild(fetchBtn);
		footer.appendChild(editBtn);
		footer.appendChild(deleteBtn);

		card.appendChild(header);
		card.appendChild(body);
		card.appendChild(footer);

		return card;
	};

	const createAccountStat = (
		label,
		value,
		isCharges = false,
		isSmall = false,
	) => {
		const stat = document.createElement("div");
		stat.className = `account-stat ${isCharges ? "charges" : ""}`;

		const labelSpan = document.createElement("span");
		labelSpan.className = "account-stat-label";
		labelSpan.textContent = label;

		const valueSpan = document.createElement("span");
		valueSpan.className = "account-stat-value";
		if (isSmall) valueSpan.style.fontSize = "0.85rem";
		valueSpan.textContent = value;

		stat.appendChild(labelSpan);
		stat.appendChild(valueSpan);

		return stat;
	};

	const addNewAccount = () => {
		const token = document.getElementById("jwtTokenInput").value.trim();
		if (!token) {
			showNotification("Vui lòng nhập JWT Token", "warning");
			return;
		}

		toggleModal("addAccountModal", true);
		document.getElementById("modalJwtToken").value = token;
	};

	const submitAddAccount = async () => {
		const token = document.getElementById("modalJwtToken").value.trim();

		if (!token) {
			showNotification("Vui lòng nhập JWT Token", "warning");
			return;
		}

		try {
			await addAccount(token);
			showNotification("Tài khoản đã được thêm thành công!", "success");
			toggleModal("addAccountModal", false);
			document.getElementById("modalJwtToken").value = "";
			document.getElementById("jwtTokenInput").value = "";
			await loadAccounts();
		} catch (error) {
			console.error("Error adding account:", error);
			showNotification(
				error.message || "Không thể thêm tài khoản",
				"danger",
			);
		}
	};

	const bulkFetchAll = async () => {
		try {
			showNotification(
				"Đang fetch thông tin tất cả tài khoản...",
				"info",
			);
			const response = await bulkFetchAccounts();
			showNotification(
				`Fetch thành công ${response.fetched || 0} tài khoản!`,
				"success",
			);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await loadAccounts();
		} catch (error) {
			console.error("Error bulk fetching:", error);
			showNotification(
				error.message || "Lỗi khi fetch tài khoản",
				"danger",
			);
		}
	};

	const fetchAccountData = async (accountId) => {
		try {
			showNotification("Đang fetch thông tin...", "info");
			await fetchAccountInfo(accountId);
			showNotification(
				"Thông tin tài khoản đã được cập nhật!",
				"success",
			);
			await new Promise((resolve) => setTimeout(resolve, 500));
			await loadAccounts();
		} catch (error) {
			console.error("Error fetching account:", error);
			showNotification(
				error.message || "Lỗi khi fetch tài khoản",
				"danger",
			);
		}
	};

	const showBulkImportModal = () => {
		toggleModal("bulkImportModal", true);
	};

	const submitBulkImport = async () => {
		/**
		 * @type {string}
		 */
		const input = document.getElementById("bulkTokensInput").value.trim();

		if (!input) {
			showNotification("Vui lòng nhập ít nhất 1 JWT Token", "warning");
			return;
		}

		const tokens = input
			.split("\n")
			.map((t) => t.trim())
			.filter((t) => t.length > 0);

		if (tokens.length === 0) {
			showNotification("Không tìm thấy token hợp lệ", "warning");
			return;
		}

		try {
			showNotification(`Đang nhập ${tokens.length} token...`, "info");

			let successCount = 0;
			let failCount = 0;

			const response = new BetterEventSource("/api/accounts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json; charset=utf-8",
				},
				body: JSON.stringify({
					tokens: tokens,
				}),
			});

			await response.connect();

			response.addEventListener("success", () => {
				successCount++;
			});

			response.addEventListener("failed", () => {
				failCount++;
			});

			response.addEventListener("error", (detail) => {
				throw new Error(detail);
			});

			toggleModal("bulkImportModal", false);
			document.getElementById("bulkTokensInput").value = "";
			showNotification(
				`Nhập xong! Thành công: ${successCount}, Thất bại: ${failCount}`,
				"success",
			);
			await loadAccounts();
		} catch (error) {
			console.error("Error bulk importing:", error);
			showNotification(error.message || "Lỗi khi nhập token", "danger");
		}
	};

	const exportAccounts = () => {
		try {
			const dataStr = JSON.stringify(accountsData, null, 2);
			const dataBlob = new Blob([dataStr], { type: "application/json" });
			const url = URL.createObjectURL(dataBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `accounts-${new Date().toISOString().split("T")[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
			showNotification("Dữ liệu đã được xuất!", "success");
		} catch (error) {
			console.error("Error exporting:", error);
			showNotification("Lỗi khi xuất dữ liệu", "danger");
		}
	};

	const refreshAccountsList = () => {
		loadAccounts();
	};

	const openDeleteModal = (accountId, accountName) => {
		accountToDelete = accountId;
		const nameElement = document.getElementById("deleteAccountName");
		if (nameElement) {
			nameElement.textContent = accountName;
		}
		toggleModal("confirmDeleteModal", true);
	};

	const confirmDelete = async () => {
		if (!accountToDelete) return;

		try {
			showNotification("Đang xóa tài khoản...", "info");
			await deleteAccount(accountToDelete);
			showNotification("Tài khoản đã được xóa!", "success");
			toggleModal("confirmDeleteModal", false);
			accountToDelete = null;
			await loadAccounts();
		} catch (error) {
			console.error("Error deleting account:", error);
			showNotification(
				error.message || "Lỗi khi xóa tài khoản",
				"danger",
			);
		}
	};

	const editAccount = (accountId) => {
		window.location.href = `/edit-account/?id=${accountId}`;
	};

	const showLoadingState = () => {
		const container = document.getElementById("accountsContainer");
		if (!container) return;

		container.innerHTML = "";
		const loadingDiv = document.createElement("div");
		loadingDiv.className = "loading-state";
		loadingDiv.innerHTML = `
      <div class="spinner"></div>
      <p>Đang tải danh sách tài khoản...</p>
    `;
		container.appendChild(loadingDiv);
	};

	const showErrorState = (message) => {
		const container = document.getElementById("accountsContainer");
		if (!container) return;

		container.innerHTML = "";
		const errorDiv = document.createElement("div");
		errorDiv.className = "empty-state";
		errorDiv.innerHTML = `
      <div class="emoji">❌</div>
      <p>${message}</p>
    `;
		container.appendChild(errorDiv);
	};

	const updateAccountCount = () => {
		const countElement = document.getElementById("accountCount");
		if (countElement) {
			countElement.textContent = accountsData.length;
		}
	};

	return {
		init,
		addNewAccount,
		submitAddAccount,
		bulkFetchAll,
		fetchAccountData,
		showBulkImportModal,
		submitBulkImport,
		exportAccounts,
		refreshAccountsList,
		openDeleteModal,
		confirmDelete,
		editAccount,
	};
})();

AccountsManager.init();

// Export to global scope for inline onclick handlers
window.bulkFetchAll = AccountsManager.bulkFetchAll;
window.addNewAccount = AccountsManager.addNewAccount;
window.submitAddAccount = AccountsManager.submitAddAccount;
window.showBulkImportModal = AccountsManager.showBulkImportModal;
window.submitBulkImport = AccountsManager.submitBulkImport;
window.exportAccounts = AccountsManager.exportAccounts;
window.refreshAccountsList = AccountsManager.refreshAccountsList;
window.fetchAccountData = AccountsManager.fetchAccountData;
window.editAccount = AccountsManager.editAccount;
window.openDeleteModal = AccountsManager.openDeleteModal;
window.confirmDelete = AccountsManager.confirmDelete;

class BetterEventSource extends EventTarget {
	/**
	 *
	 * @param { string } url
	 * @param { RequestInit } requestInit
	 */

	constructor(url, requestInit = {}) {
		super();
		this.url = url;
		this.requestInit = requestInit;
		this.controller = new AbortController(); // Để có thể ngắt kết nối khi cần
	}

	async connect() {
		try {
			const response = await fetch(this.url, {
				...this.requestInit,
				signal: this.controller.signal,
				headers: {
					...this.requestInit.headers,
					Accept: "text/event-stream", // Ép kiểu nhận stream
				},
			});

			if (!response.ok) {
				this.dispatchEvent(
					new CustomEvent("error", {
						detail: `HTTP Error: ${response.status}`,
					}),
				);
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = ""; // Nơi lưu trữ dữ liệu tạm nếu chunk bị cắt đôi

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				// SSE ngăn cách các gói tin bằng "\n\n"
				let parts = buffer.split("\n\n");

				// Phần cuối cùng có thể chưa hoàn thành, giữ lại cho vòng lặp sau
				buffer = parts.pop();

				for (const part of parts) {
					this._parseSSEMessage(part);
				}
			}
		} catch (error) {
			if (error.name === "AbortError") {
				console.log("Stream chủ động ngắt kết nối.");
			} else {
				this.dispatchEvent(
					new CustomEvent("error", { detail: error.message }),
				);
			}
		}
	}

	_parseSSEMessage(messageChunk) {
		let eventName = "message"; // Mặc định
		let data = "";

		const lines = messageChunk.split("\n");
		for (const line of lines) {
			if (line.startsWith("event:")) {
				eventName = line.replace("event:", "").trim();
			} else if (line.startsWith("data:")) {
				data = line.replace("data:", "").trim();
			}
		}

		// Phát sự kiện ra ngoài
		const event = new MessageEvent(eventName, {
			data: data,
			origin: this.url,
		});
		this.dispatchEvent(event);
	}

	close() {
		this.controller.abort();
	}
}
