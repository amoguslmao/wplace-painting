import { getAllAccounts, getTemplates } from "/js/api.js";

const PALETTE_CHECK_ENDPOINT = "/api/image/pallete-check";
const IMAGE_UPLOAD_ENDPOINT = "/api/image";
const TEMPLATE_ENDPOINT = "/api/templates";
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const state = {
	templates: [],
	assignedAccountsCache: new Map(),
	runningTemplateIds: new Set(),
	pendingStatusTemplateIds: new Set(),
	selectedImage: null,
	uploadFileName: "",
	uploadedImageName: "",
	paletteInformation: null,
	paletteStatus: "idle",
	paletteController: null,
	previewUrl: "",
	imageSelectionVersion: 0,
	formGeneration: 0,
	templatesRequestVersion: 0,
	isSubmitting: false,
	templateSubmissionAttempted: false,
	editTemplateId: null,
	editTemplateDetail: null,
	editTemplateRequestVersion: 0,
	isEditSubmitting: false,
	deleteTemplateId: null,
	isDeleting: false,
	lastFocusedElement: null,
	backgroundElements: [],
};

const refs = {};

document.addEventListener("DOMContentLoaded", () => {
	cacheElements();
	bindEvents();
	loadTemplates();
});

function cacheElements() {
	const ids = [
		"templatesContainer",
		"openCreateTemplateButton",
		"createTemplateModal",
		"closeCreateTemplateButton",
		"cancelCreateTemplateButton",
		"createTemplateForm",
		"templateImage",
		"imageDropzoneTitle",
		"imagePreviewPanel",
		"templateImagePreview",
		"selectedFileName",
		"selectedFileSize",
		"imageValidationMessage",
		"templateFieldsSection",
		"paletteCheckCard",
		"paletteStatusTitle",
		"paletteStatusDescription",
		"paletteResult",
		"paletteDimensions",
		"paletteColorCount",
		"palettePixelCount",
		"paletteColors",
		"templateName",
		"templateImageName",
		"tileX",
		"tileY",
		"pixelX",
		"pixelY",
		"accountSelector",
		"selectAllAccountsButton",
		"clearAccountsButton",
		"selectedAccountCount",
		"paintTransparentPixels",
		"skipPaintedPixels",
		"outlineFirst",
		"autoStart",
		"enableBuyMaxCharges",
		"buyMaxChargesLimitGroup",
		"buyMaxChargesLimit",
		"buyPaintCharges",
		"buyPremiumColors",
		"createSubmitStatus",
		"submitCreateTemplateButton",
		"editTemplateModal",
		"editTemplateTitle",
		"closeEditTemplateButton",
		"editTemplateLoading",
		"editTemplateForm",
		"editTemplateName",
		"editTileX",
		"editTileY",
		"editPixelX",
		"editPixelY",
		"editAccountSelector",
		"editSelectAllAccountsButton",
		"editClearAccountsButton",
		"editSelectedAccountCount",
		"editPaintTransparentPixels",
		"editSkipPaintedPixels",
		"editOutlineFirst",
		"editAutoStart",
		"editEnableBuyMaxCharges",
		"editBuyMaxChargesLimitGroup",
		"editBuyMaxChargesLimit",
		"editBuyPaintCharges",
		"editBuyPremiumColors",
		"editSubmitStatus",
		"cancelEditTemplateButton",
		"submitEditTemplateButton",
		"deleteTemplateModal",
		"closeDeleteTemplateButton",
		"deleteTemplatePrompt",
		"deleteSubmitStatus",
		"cancelDeleteTemplateButton",
		"confirmDeleteTemplateButton",
	];

	for (const id of ids) {
		refs[id] = document.getElementById(id);
	}
}

function bindEvents() {
	refs.openCreateTemplateButton.addEventListener("click", openCreateTemplateModal);
	refs.closeCreateTemplateButton.addEventListener("click", closeCreateTemplateModal);
	refs.cancelCreateTemplateButton.addEventListener("click", closeCreateTemplateModal);
	refs.templateImage.addEventListener("change", handleImageSelection);
	refs.createTemplateForm.addEventListener("submit", submitCreateTemplate);
	refs.createTemplateForm.addEventListener("input", handleFormInput);
	refs.createTemplateForm.addEventListener("change", handleFormInput);
	refs.enableBuyMaxCharges.addEventListener("change", toggleBuyMaxChargesLimit);
	refs.selectAllAccountsButton.addEventListener("click", () => setAllAccounts(true));
	refs.clearAccountsButton.addEventListener("click", () => setAllAccounts(false));
	refs.closeEditTemplateButton.addEventListener("click", closeEditTemplateModal);
	refs.cancelEditTemplateButton.addEventListener("click", closeEditTemplateModal);
	refs.editTemplateForm.addEventListener("submit", submitEditTemplate);
	refs.editTemplateForm.addEventListener("input", handleEditFormInput);
	refs.editTemplateForm.addEventListener("change", handleEditFormInput);
	refs.editEnableBuyMaxCharges.addEventListener("change", toggleEditBuyMaxChargesLimit);
	refs.editSelectAllAccountsButton.addEventListener("click", () => setAllEditAccounts(true));
	refs.editClearAccountsButton.addEventListener("click", () => setAllEditAccounts(false));
	refs.closeDeleteTemplateButton.addEventListener("click", closeDeleteTemplateModal);
	refs.cancelDeleteTemplateButton.addEventListener("click", closeDeleteTemplateModal);
	refs.confirmDeleteTemplateButton.addEventListener("click", deleteSelectedTemplate);

	document.addEventListener(
		"click",
		handleManagedModalBackdropClick,
		true,
	);

	document.addEventListener("keydown", handleModalKeydown);
}

async function loadTemplates() {
	const requestVersion = ++state.templatesRequestVersion;
	showLoadingState();

	try {
		const response = await getTemplates();
		if (requestVersion !== state.templatesRequestVersion) return;
		if (!Array.isArray(response)) {
			throw new Error("Dữ liệu template trả về không hợp lệ");
		}

		state.templates = response;
		const availableTemplateIds = new Set(
			response
				.map((template) => template?.id)
				.filter((id) => Number.isInteger(id) && id >= 0),
		);
		for (const templateId of state.runningTemplateIds) {
			if (!availableTemplateIds.has(templateId)) state.runningTemplateIds.delete(templateId);
		}
		state.assignedAccountsCache.clear();
		renderTemplates();
	} catch (error) {
		if (requestVersion !== state.templatesRequestVersion) return;
		console.error("Error loading templates:", error);
		showErrorState(error.message || "Không thể tải danh sách template");
	}
}

function renderTemplates() {
	refs.templatesContainer.replaceChildren();

	if (state.templates.length === 0) {
		const emptyState = createElement("div", "empty-state");
		const icon = createElement("div", "empty-state-icon", "◇");
		icon.setAttribute("aria-hidden", "true");
		emptyState.append(
			icon,
			createElement("p", "empty-state-title", "Chưa có template nào"),
			createElement(
				"p",
				"text-muted",
				"Hãy tạo template đầu tiên để bắt đầu.",
			),
		);
		refs.templatesContainer.appendChild(emptyState);
		return;
	}

	const fragment = document.createDocumentFragment();
	for (const template of state.templates) {
		fragment.appendChild(createTemplateCard(template));
	}
	refs.templatesContainer.appendChild(fragment);
}

function createTemplateCard(template) {
	const card = createElement("article", "template-card");
	const hasValidTemplateId = Number.isInteger(template.id) && template.id >= 0;
	if (hasValidTemplateId) card.dataset.templateId = String(template.id);

	const main = createElement("div", "template-card-main");
	const imageFrame = createElement("div", "template-image");
	createTemplateImage(imageFrame, template);

	const information = createElement("div", "template-info");
	const metadata = createElement("div", "template-metadata");
	metadata.append(
		createElement("span", "template-id", `ID: ${template.id ?? "—"}`),
		createCreatedTime(template.createdAt),
	);

	const name = createElement("h2", "template-name", template.name || "Template chưa đặt tên");

	const accountRow = createElement("div", "template-account-row");
	const accountSummary = createElement("p", "template-account-summary");
	accountSummary.append(
		createElement("span", "template-detail-label", "Total assigned Account:"),
		createElement(
			"strong",
			"template-detail-value",
			formatNumber(normalizeCount(template.totalAccounts)),
		),
	);

	const panelId = `template-accounts-${template.id}`;
	const showAccountsButton = createElement("button", "show-accounts-button", "Show All");
	showAccountsButton.type = "button";
	showAccountsButton.setAttribute("aria-expanded", "false");
	showAccountsButton.setAttribute("aria-controls", panelId);
	showAccountsButton.disabled = !hasValidTemplateId;
	if (!hasValidTemplateId) showAccountsButton.title = "Template không có ID hợp lệ";
	accountRow.append(accountSummary, showAccountsButton);

	const coordinateRow = createElement("p", "template-coordinates");
	coordinateRow.append(
		createElement("span", "template-detail-label", "Coords:"),
		createElement(
			"strong",
			"template-detail-value coordinates-value",
			formatCoordinates(template.coordinates),
		),
	);

	const actions = createTemplateActions(template, hasValidTemplateId);

	information.append(metadata, name, accountRow, coordinateRow, actions);
	main.append(imageFrame, information);

	const accountsPanel = createElement("section", "assigned-accounts-panel");
	accountsPanel.id = panelId;
	accountsPanel.hidden = true;
	accountsPanel.setAttribute("aria-label", `Tài khoản của template ${template.name || template.id}`);

	if (hasValidTemplateId) {
		showAccountsButton.addEventListener("click", () => {
			toggleAssignedAccounts(template, showAccountsButton, accountsPanel);
		});
	}

	card.append(main, accountsPanel);
	return card;
}

function createTemplateActions(template, hasValidTemplateId) {
	const actions = createElement("div", "template-actions");
	actions.appendChild(createElement("span", "template-actions-label", "Actions:"));

	const buttons = createElement("div", "template-action-buttons");
	const statusButton = createElement("button", "template-action-button template-status-button");
	const editButton = createElement(
		"button",
		"template-action-button template-edit-button",
		"Edit",
	);
	const deleteButton = createElement(
		"button",
		"template-action-button template-delete-button",
		"Delete",
	);

	for (const button of [statusButton, editButton, deleteButton]) {
		button.type = "button";
		button.disabled = !hasValidTemplateId;
	}
	buttons.append(statusButton, editButton, deleteButton);

	if (hasValidTemplateId) {
		setTemplateStatusButtonState(statusButton, template);
		editButton.setAttribute(
			"aria-label",
			`Edit template ${template.name || `#${template.id}`}`,
		);
		deleteButton.setAttribute(
			"aria-label",
			`Delete template ${template.name || `#${template.id}`}`,
		);
		statusButton.addEventListener("click", () => changeTemplateStatus(template, statusButton));
		editButton.addEventListener("click", () => openEditTemplateModal(template));
		deleteButton.addEventListener("click", () => openDeleteTemplateModal(template));
	} else {
		statusButton.textContent = "Start";
		statusButton.classList.add("is-start");
		statusButton.title = "Template không có ID hợp lệ";
		editButton.title = "Template không có ID hợp lệ";
		deleteButton.title = "Template không có ID hợp lệ";
	}

	actions.appendChild(buttons);
	return actions;
}

function setTemplateStatusButtonState(button, template) {
	const isRunning = state.runningTemplateIds.has(template.id);
	const isPending = state.pendingStatusTemplateIds.has(template.id);
	const actionLabel = isRunning ? "Stop" : "Start";

	button.textContent = isPending
		? isRunning
			? "Đang dừng..."
			: "Đang bắt đầu..."
		: actionLabel;
	button.disabled = isPending;
	button.classList.toggle("is-start", !isRunning);
	button.classList.toggle("is-stop", isRunning);
	button.setAttribute(
		"aria-label",
		`${actionLabel} template ${template.name || `#${template.id}`}`,
	);
	if (isPending) button.setAttribute("aria-busy", "true");
	else button.removeAttribute("aria-busy");
	syncTemplateSecondaryActionButtons(button, template);
}

function syncTemplateSecondaryActionButtons(statusButton, template) {
	const actionButtons = statusButton.closest(".template-action-buttons");
	if (!actionButtons) return;

	const isPending = state.pendingStatusTemplateIds.has(template.id);
	const isRunning = state.runningTemplateIds.has(template.id);
	const editButton = actionButtons.querySelector(".template-edit-button");
	const deleteButton = actionButtons.querySelector(".template-delete-button");

	if (editButton) editButton.disabled = isPending;
	if (deleteButton) {
		deleteButton.disabled = isPending || isRunning;
		deleteButton.title = isRunning
			? "Hãy dừng template trước khi xóa"
			: isPending
				? "Vui lòng chờ thao tác Start/Stop hoàn tất"
				: "";
	}
}

async function changeTemplateStatus(template, button) {
	if (state.pendingStatusTemplateIds.has(template.id)) return;

	const wasRunning = state.runningTemplateIds.has(template.id);
	const nextStatus = wasRunning ? "stop" : "start";
	state.pendingStatusTemplateIds.add(template.id);
	setTemplateStatusButtonState(button, template);

	try {
		await fetchJson(
			`${TEMPLATE_ENDPOINT}/${encodeURIComponent(template.id)}/status`,
			{
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: nextStatus }),
			},
		);

		if (nextStatus === "start") state.runningTemplateIds.add(template.id);
		else state.runningTemplateIds.delete(template.id);

		notify(
			nextStatus === "start"
				? `Đã bắt đầu template “${template.name || `#${template.id}`}”.`
				: `Đã dừng template “${template.name || `#${template.id}`}”.`,
			"success",
		);
	} catch (error) {
		console.error(`Error changing status for template ${template.id}:`, error);
		if (reconcileTemplateStatusFromError(template, nextStatus, error)) {
			notify(
				nextStatus === "start"
					? "Template đã chạy trên server. Nút đã được đồng bộ sang Stop."
					: "Template đã dừng trên server. Nút đã được đồng bộ sang Start.",
				"warning",
				5000,
			);
		} else {
			notify(error.message || "Không thể thay đổi trạng thái template", "danger", 5000);
		}
	} finally {
		state.pendingStatusTemplateIds.delete(template.id);
		const currentButton = refs.templatesContainer.querySelector(
			`.template-card[data-template-id="${template.id}"] .template-status-button`,
		);
		if (currentButton) setTemplateStatusButtonState(currentButton, template);
	}
}

function reconcileTemplateStatusFromError(template, attemptedStatus, error) {
	if (error?.status !== 400 || typeof error.body?.message !== "string") return false;

	if (
		attemptedStatus === "start" &&
		error.body.message.includes("has been started before.")
	) {
		state.runningTemplateIds.add(template.id);
		return true;
	}

	if (
		attemptedStatus === "stop" &&
		error.body.message.includes("has not started before.")
	) {
		state.runningTemplateIds.delete(template.id);
		return true;
	}

	return false;
}

function createTemplateImage(container, template) {
	if (!template.imageName) {
		showImageFallback(container, "Không có ảnh");
		return;
	}

	const image = document.createElement("img");
	image.src = `/api/image/${encodeURIComponent(template.imageName)}`;
	image.alt = `Ảnh template ${template.name || template.id}`;
	image.loading = "lazy";
	image.addEventListener("error", () => showImageFallback(container, "Không tải được ảnh"), {
		once: true,
	});
	container.appendChild(image);
}

function showImageFallback(container, message) {
	container.replaceChildren();
	container.classList.add("empty");
	const icon = createElement("span", "image-fallback-icon", "◇");
	icon.setAttribute("aria-hidden", "true");
	container.append(icon, createElement("span", "image-fallback-text", message));
}

function createCreatedTime(createdAt) {
	const time = createElement("time", "template-created");
	const value = typeof createdAt === "string" && createdAt.trim() ? createdAt.trim() : "—";
	time.textContent = `Created: ${value}`;
	if (value !== "—") {
		time.dateTime = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
			? `${value.replace(" ", "T")}Z`
			: value;
	}
	return time;
}

async function toggleAssignedAccounts(template, button, panel) {
	const panelState = panel.dataset.state;
	if (!panel.hidden && panelState !== "error") {
		panel.hidden = true;
		button.textContent = "Show All";
		button.setAttribute("aria-expanded", "false");
		return;
	}

	const cachedAccounts = state.assignedAccountsCache.get(template.id);
	if (cachedAccounts) {
		renderAssignedAccounts(panel, cachedAccounts);
		openAssignedAccountsPanel(button, panel);
		return;
	}

	button.disabled = true;
	button.textContent = "Đang tải...";
	panel.hidden = false;
	panel.dataset.state = "loading";
	panel.replaceChildren(createInlineLoading("Đang tải danh sách tài khoản..."));
	button.setAttribute("aria-expanded", "true");

	try {
		const accounts = await fetchJson(
			`${TEMPLATE_ENDPOINT}/${encodeURIComponent(template.id)}/assigned-accounts`,
		);
		if (!Array.isArray(accounts) || accounts.some((account) => typeof account !== "string")) {
			throw new Error("Danh sách tài khoản trả về không hợp lệ");
		}

		state.assignedAccountsCache.set(template.id, accounts);
		renderAssignedAccounts(panel, accounts);
		openAssignedAccountsPanel(button, panel);
	} catch (error) {
		console.error(`Error loading accounts for template ${template.id}:`, error);
		panel.dataset.state = "error";
		panel.replaceChildren(
			createElement(
				"p",
				"assigned-accounts-error",
				error.message || "Không thể tải danh sách tài khoản.",
			),
		);
		button.textContent = "Thử lại";
		button.setAttribute("aria-expanded", "true");
		notify(error.message || "Không thể tải danh sách tài khoản", "danger");
	} finally {
		button.disabled = false;
	}
}

function openAssignedAccountsPanel(button, panel) {
	panel.hidden = false;
	button.textContent = "Ẩn danh sách";
	button.setAttribute("aria-expanded", "true");
}

function renderAssignedAccounts(panel, accounts) {
	panel.replaceChildren();
	panel.dataset.state = "loaded";

	const header = createElement("div", "assigned-accounts-header");
	header.append(
		createElement("h3", "assigned-accounts-title", "Danh sách tài khoản"),
		createElement("span", "assigned-accounts-count", `${formatNumber(accounts.length)} tài khoản`),
	);
	panel.appendChild(header);

	if (accounts.length === 0) {
		panel.appendChild(
			createElement("p", "assigned-accounts-empty", "Template này chưa được gán tài khoản."),
		);
		return;
	}

	const list = createElement("ul", "assigned-accounts-list");
	for (const account of accounts) {
		const item = createElement("li", "assigned-account-item");
		const avatar = createElement("span", "assigned-account-avatar", account.slice(0, 1).toUpperCase());
		avatar.setAttribute("aria-hidden", "true");
		item.append(avatar, createElement("span", "assigned-account-name", account));
		list.appendChild(item);
	}
	panel.appendChild(list);
}

function showLoadingState() {
	const loading = createElement("div", "loading-state");
	loading.setAttribute("role", "status");
	const spinner = createElement("div", "spinner");
	spinner.setAttribute("aria-hidden", "true");
	loading.append(spinner, createElement("p", "", "Đang tải danh sách template..."));
	refs.templatesContainer.replaceChildren(loading);
}

function showErrorState(message) {
	const errorState = createElement("div", "empty-state error-state");
	const icon = createElement("div", "empty-state-icon", "!");
	icon.setAttribute("aria-hidden", "true");
	const retryButton = createElement("button", "btn-secondary", "Thử tải lại");
	retryButton.type = "button";
	retryButton.addEventListener("click", loadTemplates);
	errorState.append(icon, createElement("p", "empty-state-title", message), retryButton);
	refs.templatesContainer.replaceChildren(errorState);
}

function openEditTemplateModal(template) {
	if (state.pendingStatusTemplateIds.has(template.id)) {
		notify("Vui lòng chờ thao tác Start/Stop hoàn tất.", "warning");
		return;
	}

	state.lastFocusedElement = document.activeElement;
	state.editTemplateId = template.id;
	state.editTemplateDetail = null;
	state.isEditSubmitting = false;
	const requestVersion = ++state.editTemplateRequestVersion;

	resetEditTemplateFormForLoading(template);
	window.toggleModal("editTemplateModal", true);
	setBackgroundInert(true);
	requestAnimationFrame(() => refs.closeEditTemplateButton.focus());
	loadEditTemplateData(template.id, requestVersion);
}

function resetEditTemplateFormForLoading(template) {
	refs.editTemplateForm.reset();
	refs.editTemplateForm.hidden = true;
	refs.editTemplateForm.inert = false;
	refs.editTemplateForm.removeAttribute("aria-busy");
	refs.editTemplateLoading.hidden = false;
	refs.editTemplateLoading.dataset.state = "loading";
	refs.editTemplateLoading.replaceChildren(createInlineLoading("Đang tải cấu hình template..."));
	refs.editTemplateTitle.textContent = `Chỉnh sửa Template #${template.id}`;
	refs.editAccountSelector.replaceChildren();
	refs.editSelectAllAccountsButton.disabled = true;
	refs.editClearAccountsButton.disabled = true;
	refs.editSelectedAccountCount.textContent = "Đã chọn 0 tài khoản";
	refs.editBuyMaxChargesLimitGroup.hidden = true;
	refs.editBuyMaxChargesLimit.disabled = true;
	refs.editBuyMaxChargesLimit.required = false;
	refs.closeEditTemplateButton.disabled = false;
	refs.cancelEditTemplateButton.disabled = false;
	refs.submitEditTemplateButton.disabled = true;
	refs.submitEditTemplateButton.textContent = "Lưu thay đổi";
	refs.editSubmitStatus.textContent = "Đang tải dữ liệu hiện tại...";
}

async function loadEditTemplateData(templateId, requestVersion) {
	const accountsRequest = getAllAccounts()
		.then((response) => ({ accounts: normalizeAccountOptions(response), error: null }))
		.catch((error) => {
			console.error("Error loading accounts for edit template form:", error);
			return { accounts: [], error };
		});

	try {
		const [response, accountLoadResult] = await Promise.all([
			fetchJson(`${TEMPLATE_ENDPOINT}/${encodeURIComponent(templateId)}`),
			accountsRequest,
		]);
		if (
			requestVersion !== state.editTemplateRequestVersion ||
			templateId !== state.editTemplateId
		) {
			return;
		}

		const detail = validateEditableTemplate(response, templateId);
		state.editTemplateDetail = detail;
		populateEditTemplateForm(detail, accountLoadResult);
	} catch (error) {
		if (
			requestVersion !== state.editTemplateRequestVersion ||
			templateId !== state.editTemplateId
		) {
			return;
		}

		console.error(`Error loading template ${templateId} for editing:`, error);
		showEditTemplateLoadError(error.message || "Không thể tải cấu hình template.");
	}
}

function normalizeAccountOptions(response) {
	if (!Array.isArray(response)) throw new Error("Dữ liệu tài khoản trả về không hợp lệ");

	const accountsById = new Map();
	for (const account of response) {
		if (!Number.isInteger(account?.id) || account.id < 0 || accountsById.has(account.id)) {
			continue;
		}
		accountsById.set(account.id, {
			id: account.id,
			label: formatAccountLabel(account),
		});
	}
	return Array.from(accountsById.values());
}

function validateEditableTemplate(template, expectedId) {
	const setting = template?.setting;
	const purchase = setting?.purchase;
	const buyMaxCharges = purchase?.buyMaxCharges;
	const hasValidBuyMaxCharges =
		buyMaxCharges === false ||
		(Number.isInteger(buyMaxCharges) && buyMaxCharges >= 0);

	if (
		!template ||
		template.id !== expectedId ||
		typeof template.name !== "string" ||
		template.name.length === 0 ||
		!Array.isArray(template.assignedAccounts) ||
		template.assignedAccounts.some((id) => !Number.isInteger(id) || id < 0) ||
		!Array.isArray(template.coordinates) ||
		template.coordinates.length !== 4 ||
		template.coordinates.some((coordinate) => !Number.isInteger(coordinate)) ||
		typeof setting?.paintTransparentPixels !== "boolean" ||
		typeof setting?.skipPaintedPixels !== "boolean" ||
		typeof setting?.outlineFirst !== "boolean" ||
		typeof setting?.autoStart !== "boolean" ||
		!hasValidBuyMaxCharges ||
		typeof purchase?.buyPaintCharges !== "boolean" ||
		typeof purchase?.buyPremiumColors !== "boolean"
	) {
		throw new Error("Cấu hình template trả về không hợp lệ.");
	}

	return template;
}

function populateEditTemplateForm(template, accountLoadResult) {
	const [tileX, tileY, pixelX, pixelY] = template.coordinates;
	const { setting } = template;
	const buyMaxChargesEnabled = setting.purchase.buyMaxCharges !== false;

	refs.editTemplateName.value = template.name;
	refs.editTileX.value = String(tileX);
	refs.editTileY.value = String(tileY);
	refs.editPixelX.value = String(pixelX);
	refs.editPixelY.value = String(pixelY);
	refs.editPaintTransparentPixels.checked = setting.paintTransparentPixels;
	refs.editSkipPaintedPixels.checked = setting.skipPaintedPixels;
	refs.editOutlineFirst.checked = setting.outlineFirst;
	refs.editAutoStart.checked = setting.autoStart;
	refs.editEnableBuyMaxCharges.checked = buyMaxChargesEnabled;
	refs.editBuyMaxChargesLimit.value = buyMaxChargesEnabled
		? String(setting.purchase.buyMaxCharges)
		: "0";
	refs.editBuyPaintCharges.checked = setting.purchase.buyPaintCharges;
	refs.editBuyPremiumColors.checked = setting.purchase.buyPremiumColors;

	toggleEditBuyMaxChargesLimit();
	renderEditAccountSelector(
		accountLoadResult.accounts,
		template.assignedAccounts,
		accountLoadResult.error,
	);
	refs.editTemplateLoading.hidden = true;
	refs.editTemplateForm.hidden = false;
	updateEditSubmitState();
	requestAnimationFrame(() => {
		if (refs.editTemplateModal.classList.contains("active")) refs.editTemplateName.focus();
	});
}

function showEditTemplateLoadError(message) {
	state.editTemplateDetail = null;
	refs.editTemplateForm.hidden = true;
	refs.editTemplateLoading.hidden = false;
	refs.editTemplateLoading.dataset.state = "error";

	const retryButton = createElement("button", "btn-secondary", "Thử tải lại");
	retryButton.type = "button";
	retryButton.addEventListener("click", retryLoadEditTemplate);
	refs.editTemplateLoading.replaceChildren(
		createElement("p", "edit-template-load-message", message),
		retryButton,
	);
	refs.editSubmitStatus.textContent = "Không thể tải dữ liệu để chỉnh sửa.";
	refs.submitEditTemplateButton.disabled = true;
}

function retryLoadEditTemplate() {
	if (state.editTemplateId === null || state.isEditSubmitting) return;

	const template = state.templates.find(({ id }) => id === state.editTemplateId) || {
		id: state.editTemplateId,
	};
	const requestVersion = ++state.editTemplateRequestVersion;
	state.editTemplateDetail = null;
	resetEditTemplateFormForLoading(template);
	requestAnimationFrame(() => refs.closeEditTemplateButton.focus());
	loadEditTemplateData(template.id, requestVersion);
}

function renderEditAccountSelector(accounts, assignedAccountIds, accountLoadError) {
	refs.editAccountSelector.replaceChildren();
	const assignedIds = new Set(assignedAccountIds);
	const accountsById = new Map(accounts.map((account) => [account.id, account]));

	for (const accountId of assignedIds) {
		if (!accountsById.has(accountId)) {
			accountsById.set(accountId, {
				id: accountId,
				label: `Account ${accountId}`,
			});
		}
	}

	if (accountLoadError) {
		refs.editAccountSelector.appendChild(
			createElement(
				"p",
				"account-selector-message error",
				"Không tải được danh sách đầy đủ. Các tài khoản đang gán vẫn được giữ lại.",
			),
		);
	}

	if (accountsById.size === 0) {
		refs.editAccountSelector.appendChild(
			createElement(
				"p",
				"account-selector-message",
				accountLoadError ? "Không có tài khoản đang được gán." : "Chưa có tài khoản để gán.",
			),
		);
		refs.editSelectAllAccountsButton.disabled = true;
		refs.editClearAccountsButton.disabled = true;
		updateEditSelectedAccountCount();
		return;
	}

	const fragment = document.createDocumentFragment();
	for (const account of accountsById.values()) {
		const option = createElement("label", "account-option");
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "edit-account-checkbox";
		checkbox.value = String(account.id);
		checkbox.checked = assignedIds.has(account.id);

		const copy = createElement("span", "account-option-copy");
		copy.append(
			createElement("strong", "", account.label),
			createElement("small", "", `Account ID: ${account.id}`),
		);
		option.append(checkbox, copy);
		fragment.appendChild(option);
	}
	refs.editAccountSelector.appendChild(fragment);
	refs.editSelectAllAccountsButton.disabled = false;
	refs.editClearAccountsButton.disabled = false;
	updateEditSelectedAccountCount();
}

function handleEditFormInput(event) {
	if (event.target === refs.editTemplateName) {
		refs.editTemplateName.setCustomValidity(
			refs.editTemplateName.value.trim() ? "" : "Vui lòng nhập tên template.",
		);
	}
	if (event.target.matches?.(".edit-account-checkbox")) updateEditSelectedAccountCount();
	updateEditSubmitState();
}

function toggleEditBuyMaxChargesLimit() {
	const enabled = refs.editEnableBuyMaxCharges.checked;
	refs.editBuyMaxChargesLimitGroup.hidden = !enabled;
	refs.editBuyMaxChargesLimit.disabled = !enabled;
	refs.editBuyMaxChargesLimit.required = enabled;
	updateEditSubmitState();
}

function setAllEditAccounts(checked) {
	for (const checkbox of refs.editAccountSelector.querySelectorAll(".edit-account-checkbox")) {
		checkbox.checked = checked;
	}
	updateEditSelectedAccountCount();
	updateEditSubmitState();
}

function updateEditSelectedAccountCount() {
	const selected = refs.editAccountSelector.querySelectorAll(
		".edit-account-checkbox:checked",
	).length;
	refs.editSelectedAccountCount.textContent = `Đã chọn ${formatNumber(selected)} tài khoản`;
}

function updateEditSubmitState() {
	refs.editTemplateName.setCustomValidity(
		refs.editTemplateName.value.trim() || refs.editTemplateForm.hidden
			? ""
			: "Vui lòng nhập tên template.",
	);

	const formComplete = refs.editTemplateForm.checkValidity();
	const ready = Boolean(state.editTemplateDetail) && formComplete && !state.isEditSubmitting;
	refs.submitEditTemplateButton.disabled = !ready;

	if (state.isEditSubmitting || !state.editTemplateDetail) return;
	refs.editSubmitStatus.textContent = formComplete
		? "Mọi thay đổi đã sẵn sàng để lưu."
		: "Nhập đủ các trường bắt buộc để tiếp tục.";
}

function buildEditTemplatePayload() {
	const assignedAccounts = Array.from(
		refs.editAccountSelector.querySelectorAll(".edit-account-checkbox:checked"),
		(checkbox) => Number(checkbox.value),
	).filter((id) => Number.isInteger(id) && id >= 0);

	return {
		name: refs.editTemplateName.value.trim(),
		assignedAccounts,
		coordinates: [
			refs.editTileX.valueAsNumber,
			refs.editTileY.valueAsNumber,
			refs.editPixelX.valueAsNumber,
			refs.editPixelY.valueAsNumber,
		],
		setting: {
			paintTransparentPixels: refs.editPaintTransparentPixels.checked,
			skipPaintedPixels: refs.editSkipPaintedPixels.checked,
			outlineFirst: refs.editOutlineFirst.checked,
			autoStart: refs.editAutoStart.checked,
			purchase: {
				buyMaxCharges: refs.editEnableBuyMaxCharges.checked
					? refs.editBuyMaxChargesLimit.valueAsNumber
					: false,
				buyPaintCharges: refs.editBuyPaintCharges.checked,
				buyPremiumColors: refs.editBuyPremiumColors.checked,
			},
		},
	};
}

async function submitEditTemplate(event) {
	event.preventDefault();
	if (state.isEditSubmitting || state.editTemplateId === null) return;

	updateEditSubmitState();
	if (refs.submitEditTemplateButton.disabled) {
		refs.editTemplateForm.reportValidity();
		notify("Vui lòng nhập đủ các trường bắt buộc", "warning");
		return;
	}

	const templateId = state.editTemplateId;
	const payload = buildEditTemplatePayload();
	state.isEditSubmitting = true;
	refs.editTemplateForm.inert = true;
	refs.editTemplateForm.setAttribute("aria-busy", "true");
	refs.closeEditTemplateButton.disabled = true;
	refs.cancelEditTemplateButton.disabled = true;
	refs.submitEditTemplateButton.disabled = true;
	refs.submitEditTemplateButton.textContent = "Đang lưu...";
	refs.editSubmitStatus.textContent = "Đang cập nhật template trên server...";

	try {
		await fetchJson(`${TEMPLATE_ENDPOINT}/${encodeURIComponent(templateId)}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		const templateIndex = state.templates.findIndex(({ id }) => id === templateId);
		if (templateIndex !== -1) {
			state.templates[templateIndex] = {
				...state.templates[templateIndex],
				name: payload.name,
				coordinates: payload.coordinates,
				totalAccounts: payload.assignedAccounts.length,
			};
		}
		state.assignedAccountsCache.delete(templateId);
		state.isEditSubmitting = false;
		renderTemplates();
		state.lastFocusedElement =
			refs.templatesContainer.querySelector(
				`.template-card[data-template-id="${templateId}"] .template-edit-button`,
			) || refs.openCreateTemplateButton;
		closeEditTemplateModal();
		notify("Template đã được chỉnh sửa thành công!", "success");
	} catch (error) {
		console.error(`Error updating template ${templateId}:`, error);
		state.isEditSubmitting = false;
		refs.editTemplateForm.inert = false;
		refs.editTemplateForm.removeAttribute("aria-busy");
		refs.closeEditTemplateButton.disabled = false;
		refs.cancelEditTemplateButton.disabled = false;
		refs.submitEditTemplateButton.textContent = "Thử lưu lại";
		updateEditSubmitState();
		refs.editSubmitStatus.textContent = "Không thể lưu thay đổi. Vui lòng thử lại.";
		notify(error.message || "Lỗi khi chỉnh sửa template", "danger", 5000);
	}
}

function closeEditTemplateModal() {
	if (state.isEditSubmitting) return;

	window.toggleModal("editTemplateModal", false);
	setBackgroundInert(false);
	state.editTemplateRequestVersion += 1;
	state.editTemplateId = null;
	state.editTemplateDetail = null;
	refs.editTemplateForm.reset();
	refs.editTemplateForm.hidden = true;
	refs.editTemplateLoading.hidden = false;
	restoreLastModalFocus();
}

function openDeleteTemplateModal(template) {
	if (state.pendingStatusTemplateIds.has(template.id)) {
		notify("Vui lòng chờ thao tác Start/Stop hoàn tất.", "warning");
		return;
	}
	if (state.runningTemplateIds.has(template.id)) {
		notify("Hãy dừng template trước khi xóa.", "warning");
		return;
	}

	state.lastFocusedElement = document.activeElement;
	state.deleteTemplateId = template.id;
	state.isDeleting = false;
	refs.deleteTemplatePrompt.textContent = `Bạn có chắc muốn xóa template “${template.name || `#${template.id}`}”?`;
	refs.deleteSubmitStatus.textContent = "";
	refs.closeDeleteTemplateButton.disabled = false;
	refs.cancelDeleteTemplateButton.disabled = false;
	refs.confirmDeleteTemplateButton.disabled = false;
	refs.confirmDeleteTemplateButton.textContent = "Xóa Template";
	refs.deleteTemplateModal.removeAttribute("aria-busy");

	window.toggleModal("deleteTemplateModal", true);
	setBackgroundInert(true);
	requestAnimationFrame(() => refs.cancelDeleteTemplateButton.focus());
}

async function deleteSelectedTemplate() {
	if (state.isDeleting || state.deleteTemplateId === null) return;

	const templateId = state.deleteTemplateId;
	state.isDeleting = true;
	refs.deleteTemplateModal.setAttribute("aria-busy", "true");
	refs.closeDeleteTemplateButton.disabled = true;
	refs.cancelDeleteTemplateButton.disabled = true;
	refs.confirmDeleteTemplateButton.disabled = true;
	refs.confirmDeleteTemplateButton.textContent = "Đang xóa...";
	refs.deleteSubmitStatus.textContent = "Đang xóa template và ảnh liên quan...";

	try {
		await fetchJson(`${TEMPLATE_ENDPOINT}/${encodeURIComponent(templateId)}`, {
			method: "DELETE",
		});

		state.templates = state.templates.filter(({ id }) => id !== templateId);
		state.assignedAccountsCache.delete(templateId);
		state.runningTemplateIds.delete(templateId);
		state.pendingStatusTemplateIds.delete(templateId);
		state.isDeleting = false;
		renderTemplates();
		state.lastFocusedElement = refs.openCreateTemplateButton;
		closeDeleteTemplateModal();
		notify("Template đã được xóa thành công!", "success");
	} catch (error) {
		console.error(`Error deleting template ${templateId}:`, error);
		state.isDeleting = false;
		refs.deleteTemplateModal.removeAttribute("aria-busy");
		refs.closeDeleteTemplateButton.disabled = false;
		refs.cancelDeleteTemplateButton.disabled = false;
		refs.confirmDeleteTemplateButton.disabled = false;
		refs.confirmDeleteTemplateButton.textContent = "Thử xóa lại";
		refs.deleteSubmitStatus.textContent = "Không thể xóa template. Vui lòng thử lại.";
		notify(error.message || "Lỗi khi xóa template", "danger", 5000);
	}
}

function closeDeleteTemplateModal() {
	if (state.isDeleting) return;

	window.toggleModal("deleteTemplateModal", false);
	refs.deleteTemplateModal.removeAttribute("aria-busy");
	setBackgroundInert(false);
	state.deleteTemplateId = null;
	restoreLastModalFocus();
}

function handleManagedModalBackdropClick(event) {
	if (event.target === refs.createTemplateModal) {
		event.stopPropagation();
		if (!state.isSubmitting) closeCreateTemplateModal();
	} else if (event.target === refs.editTemplateModal) {
		event.stopPropagation();
		if (!state.isEditSubmitting) closeEditTemplateModal();
	} else if (event.target === refs.deleteTemplateModal) {
		event.stopPropagation();
		if (!state.isDeleting) closeDeleteTemplateModal();
	}
}

function restoreLastModalFocus() {
	const focusTarget = state.lastFocusedElement;
	state.lastFocusedElement = null;
	if (focusTarget instanceof HTMLElement && focusTarget.isConnected) focusTarget.focus();
	else refs.openCreateTemplateButton.focus();
}

function openCreateTemplateModal() {
	state.lastFocusedElement = document.activeElement;
	resetCreateTemplateForm();
	window.toggleModal("createTemplateModal", true);
	setBackgroundInert(true);
	loadAccountsForForm();
	requestAnimationFrame(() => refs.templateImage.focus());
}

function closeCreateTemplateModal() {
	if (state.isSubmitting) return;

	window.toggleModal("createTemplateModal", false);
	setBackgroundInert(false);
	resetCreateTemplateForm();
	restoreLastModalFocus();
}

function resetCreateTemplateForm() {
	state.formGeneration += 1;
	state.imageSelectionVersion += 1;
	state.paletteController?.abort();
	state.paletteController = null;
	state.selectedImage = null;
	state.uploadFileName = "";
	state.uploadedImageName = "";
	state.templateSubmissionAttempted = false;
	state.paletteInformation = null;
	state.paletteStatus = "idle";
	state.isSubmitting = false;

	revokePreviewUrl();
	refs.createTemplateForm.reset();
	refs.createTemplateForm.inert = false;
	refs.createTemplateForm.removeAttribute("aria-busy");
	refs.templateFieldsSection.hidden = true;
	refs.imagePreviewPanel.hidden = true;
	refs.templateImagePreview.removeAttribute("src");
	refs.imageDropzoneTitle.textContent = "Chọn một ảnh PNG";
	refs.imageValidationMessage.textContent = "";
	refs.imageValidationMessage.dataset.state = "idle";
	refs.templateImageName.value = "";
	refs.paletteResult.hidden = true;
	refs.paletteColors.replaceChildren();
	setPaletteStatus("idle", "Đang chờ ảnh PNG", "Kết quả từ server sẽ xuất hiện tại đây.");
	refs.accountSelector.replaceChildren(createInlineLoading("Đang tải tài khoản..."));
	refs.selectAllAccountsButton.disabled = true;
	refs.clearAccountsButton.disabled = true;
	refs.selectedAccountCount.textContent = "Đã chọn 0 tài khoản";
	refs.buyMaxChargesLimitGroup.hidden = true;
	refs.buyMaxChargesLimit.disabled = true;
	refs.buyMaxChargesLimit.required = false;
	refs.closeCreateTemplateButton.disabled = false;
	refs.cancelCreateTemplateButton.disabled = false;
	refs.submitCreateTemplateButton.textContent = "Tạo Template";
	refs.submitCreateTemplateButton.disabled = true;
	refs.createSubmitStatus.textContent = "Chọn một ảnh PNG để bắt đầu.";
	setProgressStep(1);
}

async function handleImageSelection() {
	const selectionVersion = ++state.imageSelectionVersion;
	state.paletteController?.abort();
	state.paletteController = null;
	state.selectedImage = null;
	state.uploadFileName = "";
	state.uploadedImageName = "";
	state.templateSubmissionAttempted = false;
	state.paletteInformation = null;
	state.paletteStatus = "idle";
	revokePreviewUrl();

	refs.templateFieldsSection.hidden = true;
	refs.imagePreviewPanel.hidden = true;
	refs.templateImagePreview.removeAttribute("src");
	refs.templateImageName.value = "";
	refs.paletteResult.hidden = true;
	refs.paletteColors.replaceChildren();
	refs.imageValidationMessage.textContent = "";

	const file = refs.templateImage.files?.[0];
	if (!file) {
		refs.imageDropzoneTitle.textContent = "Chọn một ảnh PNG";
		setProgressStep(1);
		updateSubmitState();
		return;
	}

	try {
		await validatePngFile(file);
		if (selectionVersion !== state.imageSelectionVersion) return;
	} catch (error) {
		if (selectionVersion !== state.imageSelectionVersion) return;
		refs.templateImage.value = "";
		refs.imageDropzoneTitle.textContent = "Chọn lại ảnh PNG";
		refs.imageValidationMessage.textContent = error.message;
		refs.imageValidationMessage.dataset.state = "error";
		setProgressStep(1);
		updateSubmitState();
		return;
	}

	state.selectedImage = file;
	state.uploadFileName = createUploadFileName(file.name);
	refs.templateImageName.value = state.uploadFileName;
	refs.imageDropzoneTitle.textContent = "Đổi ảnh PNG khác";
	refs.selectedFileName.textContent = file.name;
	refs.selectedFileSize.textContent = formatBytes(file.size);
	state.previewUrl = URL.createObjectURL(file);
	refs.templateImagePreview.src = state.previewUrl;
	refs.imagePreviewPanel.hidden = false;
	refs.templateFieldsSection.hidden = false;
	refs.imageValidationMessage.textContent = "Ảnh PNG hợp lệ. Đang kiểm tra bảng màu trên server.";
	refs.imageValidationMessage.dataset.state = "success";
	setProgressStep(2);

	state.paletteStatus = "checking";
	setPaletteStatus(
		"checking",
		"Đang kiểm tra bảng màu...",
		"Bạn có thể tiếp tục nhập thông tin trong lúc chờ.",
	);
	updateSubmitState();

	const controller = new AbortController();
	state.paletteController = controller;
	const formData = new FormData();
	formData.append("image", file);

	try {
		const response = await fetchJson(PALETTE_CHECK_ENDPOINT, {
			method: "POST",
			body: formData,
			signal: controller.signal,
		});
		if (selectionVersion !== state.imageSelectionVersion) return;

		const imageInformation = validatePaletteResponse(response);
		renderPaletteResult(imageInformation);

		const hasUnsupportedColors = imageInformation.usedColors.some(
			(color) => color.colorId === null,
		);
		const unsupportedPixels = imageInformation.usedColors
			.filter((color) => color.colorId === null)
			.reduce((total, color) => total + color.total, 0);

		if (hasUnsupportedColors) {
			state.paletteInformation = null;
			state.paletteStatus = "error";
			refs.templateImage.value = "";
			setPaletteStatus(
				"error",
				"Ảnh có màu ngoài bảng màu",
				`${formatNumber(unsupportedPixels)} pixel không khớp palette của server. Hãy chuẩn hóa màu rồi chọn lại ảnh.`,
			);
		} else {
			state.paletteInformation = imageInformation;
			state.paletteStatus = "success";
			setPaletteStatus(
				"success",
				"Kiểm tra bảng màu thành công",
				"Ảnh đã sẵn sàng để tạo template.",
			);
		}
	} catch (error) {
		if (error.name === "AbortError") return;
		if (selectionVersion !== state.imageSelectionVersion) return;

		console.error("Error checking image palette:", error);
		state.paletteInformation = null;
		state.paletteStatus = "error";
		refs.templateImage.value = "";
		setPaletteStatus(
			"error",
			"Không thể kiểm tra bảng màu",
			error.message || "Server không thể xử lý ảnh đã chọn.",
		);
	} finally {
		if (state.paletteController === controller) state.paletteController = null;
		if (selectionVersion === state.imageSelectionVersion) updateSubmitState();
	}
}

async function validatePngFile(file) {
	if (!(file instanceof File)) throw new Error("Không tìm thấy file đã chọn.");
	if (!file.name.toLowerCase().endsWith(".png")) {
		throw new Error("Chỉ chấp nhận file có phần mở rộng .png.");
	}
	if (file.type && file.type !== "image/png") {
		throw new Error("File đã chọn không có định dạng MIME image/png.");
	}
	if (file.size < PNG_SIGNATURE.length) {
		throw new Error("File PNG rỗng hoặc không hợp lệ.");
	}

	const signature = new Uint8Array(await file.slice(0, PNG_SIGNATURE.length).arrayBuffer());
	if (!PNG_SIGNATURE.every((byte, index) => signature[index] === byte)) {
		throw new Error("Nội dung file không có chữ ký PNG hợp lệ.");
	}
}

function validatePaletteResponse(response) {
	const imageInformation = response?.data;
	if (
		!imageInformation ||
		!Number.isInteger(imageInformation.width) ||
		imageInformation.width <= 0 ||
		!Number.isInteger(imageInformation.height) ||
		imageInformation.height <= 0 ||
		!Array.isArray(imageInformation.usedColors)
	) {
		throw new Error("Kết quả kiểm tra bảng màu không hợp lệ.");
	}

	for (const color of imageInformation.usedColors) {
		const hasValidColorId =
			color?.colorId === null ||
			(Number.isInteger(color?.colorId) && color.colorId >= 0);
		if (
			!hasValidColorId ||
			!Number.isInteger(color?.total) ||
			color.total < 0
		) {
			throw new Error("Kết quả màu từ server không đúng cấu trúc.");
		}
	}

	return {
		width: imageInformation.width,
		height: imageInformation.height,
		usedColors: imageInformation.usedColors.map((color) => ({
			colorId: color.colorId,
			total: color.total,
		})),
	};
}

function renderPaletteResult(imageInformation) {
	const totalPixels = imageInformation.usedColors.reduce(
		(total, color) => total + color.total,
		0,
	);
	refs.paletteDimensions.textContent = `${formatNumber(imageInformation.width)} × ${formatNumber(imageInformation.height)}`;
	refs.paletteColorCount.textContent = formatNumber(imageInformation.usedColors.length);
	refs.palettePixelCount.textContent = formatNumber(totalPixels);
	refs.paletteColors.replaceChildren();

	for (const color of imageInformation.usedColors) {
		const chip = createElement(
			"span",
			`palette-color-chip${color.colorId === null ? " unsupported" : ""}`,
		);
		chip.append(
			createElement(
				"strong",
				"",
				color.colorId === null ? "Ngoài palette" : `Màu #${color.colorId}`,
			),
			createElement("span", "", formatNumber(color.total)),
		);
		refs.paletteColors.appendChild(chip);
	}

	refs.paletteResult.hidden = false;
}

function setPaletteStatus(status, title, description) {
	refs.paletteCheckCard.dataset.state = status;
	refs.paletteStatusTitle.textContent = title;
	refs.paletteStatusDescription.textContent = description;
}

function handleFormInput(event) {
	if (event.target === refs.templateName) {
		refs.templateName.setCustomValidity(
			refs.templateName.value.trim() ? "" : "Vui lòng nhập tên template.",
		);
	}
	if (event.target.matches?.(".account-checkbox")) updateSelectedAccountCount();
	updateSubmitState();
}

function toggleBuyMaxChargesLimit() {
	const enabled = refs.enableBuyMaxCharges.checked;
	refs.buyMaxChargesLimitGroup.hidden = !enabled;
	refs.buyMaxChargesLimit.disabled = !enabled;
	refs.buyMaxChargesLimit.required = enabled;
	updateSubmitState();
}

function updateSubmitState() {
	refs.templateName.setCustomValidity(
		refs.templateName.value.trim() || refs.templateFieldsSection.hidden
			? ""
			: "Vui lòng nhập tên template.",
	);

	const formComplete = refs.createTemplateForm.checkValidity();
	const ready =
		Boolean(state.selectedImage) &&
		Boolean(state.paletteInformation) &&
		state.paletteStatus === "success" &&
		formComplete &&
		!state.isSubmitting;

	refs.submitCreateTemplateButton.disabled = !ready;

	if (state.isSubmitting) return;
	if (!state.selectedImage) {
		refs.createSubmitStatus.textContent = "Chọn một ảnh PNG để bắt đầu.";
		setProgressStep(1);
	} else if (state.paletteStatus === "checking") {
		refs.createSubmitStatus.textContent = "Đang chờ server kiểm tra bảng màu.";
		setProgressStep(2);
	} else if (state.paletteStatus === "error") {
		refs.createSubmitStatus.textContent = "Ảnh chưa vượt qua bước kiểm tra bảng màu.";
		setProgressStep(2);
	} else if (!formComplete) {
		refs.createSubmitStatus.textContent = "Nhập đủ các trường bắt buộc để tiếp tục.";
		setProgressStep(2);
	} else {
		refs.createSubmitStatus.textContent = "Mọi thông tin đã sẵn sàng.";
		setProgressStep(3);
	}
}

async function loadAccountsForForm() {
	const generation = state.formGeneration;
	refs.accountSelector.replaceChildren(createInlineLoading("Đang tải tài khoản..."));
	refs.selectAllAccountsButton.disabled = true;
	refs.clearAccountsButton.disabled = true;

	try {
		const response = await getAllAccounts();
		if (generation !== state.formGeneration) return;
		if (!Array.isArray(response)) throw new Error("Dữ liệu tài khoản trả về không hợp lệ");

		const safeAccounts = response
			.filter((account) => Number.isInteger(account?.id) && account.id >= 0)
			.map((account) => ({
				id: account.id,
				label: formatAccountLabel(account),
			}));
		renderAccountSelector(safeAccounts);
	} catch (error) {
		if (generation !== state.formGeneration) return;
		console.error("Error loading accounts for template form:", error);
		refs.accountSelector.replaceChildren(
			createElement(
				"p",
				"account-selector-message error",
				error.message || "Không thể tải danh sách tài khoản.",
			),
		);
	}
}

function renderAccountSelector(accounts) {
	refs.accountSelector.replaceChildren();

	if (accounts.length === 0) {
		refs.accountSelector.appendChild(
			createElement("p", "account-selector-message", "Chưa có tài khoản để gán."),
		);
		refs.selectAllAccountsButton.disabled = true;
		refs.clearAccountsButton.disabled = true;
		updateSelectedAccountCount();
		return;
	}

	const fragment = document.createDocumentFragment();
	for (const account of accounts) {
		const option = createElement("label", "account-option");
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.className = "account-checkbox";
		checkbox.value = String(account.id);
		const copy = createElement("span", "account-option-copy");
		copy.append(
			createElement("strong", "", account.label),
			createElement("small", "", `Account ID: ${account.id}`),
		);
		option.append(checkbox, copy);
		fragment.appendChild(option);
	}
	refs.accountSelector.appendChild(fragment);
	refs.selectAllAccountsButton.disabled = false;
	refs.clearAccountsButton.disabled = false;
	updateSelectedAccountCount();
}

function formatAccountLabel(account) {
	const name =
		typeof account.user?.name === "string" && account.user.name.trim()
			? account.user.name.trim()
			: `Account ${account.id}`;
	const userId = account.user?.id;
	return userId === undefined || userId === null ? name : `${name}#${userId}`;
}

function setAllAccounts(checked) {
	for (const checkbox of refs.accountSelector.querySelectorAll(".account-checkbox")) {
		checkbox.checked = checked;
	}
	updateSelectedAccountCount();
	updateSubmitState();
}

function updateSelectedAccountCount() {
	const selected = refs.accountSelector.querySelectorAll(".account-checkbox:checked").length;
	refs.selectedAccountCount.textContent = `Đã chọn ${formatNumber(selected)} tài khoản`;
}

async function submitCreateTemplate(event) {
	event.preventDefault();
	if (state.isSubmitting) return;

	updateSubmitState();
	if (refs.submitCreateTemplateButton.disabled) {
		refs.createTemplateForm.reportValidity();
		notify("Vui lòng hoàn tất ảnh và các trường bắt buộc", "warning");
		return;
	}

	const templateDraft = buildTemplatePayload(state.uploadFileName);
	state.isSubmitting = true;
	refs.createTemplateForm.inert = true;
	refs.createTemplateForm.setAttribute("aria-busy", "true");
	refs.closeCreateTemplateButton.disabled = true;
	refs.cancelCreateTemplateButton.disabled = true;
	refs.submitCreateTemplateButton.disabled = true;
	refs.submitCreateTemplateButton.textContent = "Đang tạo...";
	refs.createSubmitStatus.textContent = "Bước 1/2: Đang tải ảnh lên server...";
	setProgressStep(3);

	try {
		if (!state.uploadedImageName) {
			state.uploadedImageName = await uploadSelectedImage();
		}

		refs.createSubmitStatus.textContent = "Bước 2/2: Đang lưu thông tin template...";
		templateDraft.imageName = state.uploadedImageName;
		if (
			state.templateSubmissionAttempted &&
			(await templateExistsForUploadedImage(state.uploadedImageName))
		) {
			notify("Template đã được server tạo ở lần gửi trước.", "success");
			state.isSubmitting = false;
			closeCreateTemplateModal();
			await loadTemplates();
			return;
		}

		state.templateSubmissionAttempted = true;
		await fetchJson(TEMPLATE_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(templateDraft),
		});

		notify("Template đã được tạo thành công!", "success");
		state.isSubmitting = false;
		closeCreateTemplateModal();
		await loadTemplates();
	} catch (error) {
		console.error("Error creating template:", error);
		state.isSubmitting = false;
		refs.createTemplateForm.inert = false;
		refs.createTemplateForm.removeAttribute("aria-busy");
		refs.closeCreateTemplateButton.disabled = false;
		refs.cancelCreateTemplateButton.disabled = false;
		updateSubmitState();
		refs.submitCreateTemplateButton.textContent = "Thử tạo lại";
		refs.createSubmitStatus.textContent = state.uploadedImageName
			? "Ảnh đã tải lên, nhưng chưa thể lưu template. Bạn có thể thử lại."
			: "Không thể tải ảnh hoặc tạo template. Vui lòng thử lại.";
		notify(error.message || "Lỗi khi tạo template", "danger", 5000);
	}
}

function buildTemplatePayload(imageName) {
	const selectedAccounts = Array.from(
		refs.accountSelector.querySelectorAll(".account-checkbox:checked"),
		(checkbox) => Number(checkbox.value),
	).filter((id) => Number.isInteger(id) && id >= 0);

	return {
		name: refs.templateName.value.trim(),
		imageName,
		imageInformation: {
			width: state.paletteInformation.width,
			height: state.paletteInformation.height,
			usedColors: state.paletteInformation.usedColors.map((color) => ({
				colorId: color.colorId,
				total: color.total,
			})),
		},
		assignedAccounts: selectedAccounts,
		coordinates: [
			refs.tileX.valueAsNumber,
			refs.tileY.valueAsNumber,
			refs.pixelX.valueAsNumber,
			refs.pixelY.valueAsNumber,
		],
		setting: {
			paintTransparentPixels: refs.paintTransparentPixels.checked,
			skipPaintedPixels: refs.skipPaintedPixels.checked,
			outlineFirst: refs.outlineFirst.checked,
			autoStart: refs.autoStart.checked,
			purchase: {
				buyMaxCharges: refs.enableBuyMaxCharges.checked
					? refs.buyMaxChargesLimit.valueAsNumber
					: false,
				buyPaintCharges: refs.buyPaintCharges.checked,
				buyPremiumColors: refs.buyPremiumColors.checked,
			},
		},
	};
}

async function uploadSelectedImage() {
	const formData = new FormData();
	formData.append("image", state.selectedImage, state.uploadFileName);
	const response = await fetchJson(IMAGE_UPLOAD_ENDPOINT, {
		method: "POST",
		body: formData,
	});
	const path = typeof response?.path === "string" ? response.path : "";
	const imageName = path.split(/[\\/]/).filter(Boolean).pop();
	if (!imageName) throw new Error("Server không trả về tên ảnh đã tải lên.");
	return imageName;
}

async function templateExistsForUploadedImage(imageName) {
	refs.createSubmitStatus.textContent = "Đang xác minh kết quả của lần tạo trước...";
	const templates = await fetchJson(TEMPLATE_ENDPOINT);
	if (!Array.isArray(templates)) {
		throw new Error("Không thể xác minh template đã được tạo hay chưa.");
	}
	return templates.some((template) => template?.imageName === imageName);
}

async function fetchJson(url, options = {}) {
	const response = await fetch(url, options);
	const rawBody = await response.text();
	let body = null;
	const contentType = response.headers.get("content-type") || "";

	if (rawBody) {
		if (contentType.includes("application/json")) {
			try {
				body = JSON.parse(rawBody);
			} catch {
				body = null;
			}
		} else {
			body = rawBody;
		}
	}

	if (!response.ok) {
		const message =
			typeof body?.message === "string"
				? body.message
				: contentType.startsWith("text/plain") &&
					  typeof body === "string" &&
					  body.trim()
					? body.trim().slice(0, 300)
					: `Yêu cầu thất bại (HTTP ${response.status})`;
		const requestError = new Error(message);
		requestError.status = response.status;
		requestError.body = body;
		throw requestError;
	}

	return body;
}

function createUploadFileName(originalName) {
	const baseName = originalName.replace(/\.png$/i, "").normalize("NFKD");
	const safeBaseName =
		baseName
			.replace(/[^a-zA-Z0-9._-]+/g, "_")
			.replace(/^[_\s.-]+|[_\s.-]+$/g, "")
			.slice(0, 80) || "template";
	const randomPart = createRandomSuffix();
	return `${safeBaseName}_${Date.now()}_${randomPart}.png`;
}

function createRandomSuffix() {
	if (window.crypto?.getRandomValues) {
		const values = new Uint32Array(1);
		window.crypto.getRandomValues(values);
		return values[0].toString(36);
	}
	return Math.random().toString(36).slice(2, 10);
}

function setProgressStep(currentStep) {
	for (const step of document.querySelectorAll(".progress-step")) {
		const stepNumber = Number(step.dataset.step);
		step.classList.toggle("active", stepNumber === currentStep);
		step.classList.toggle("completed", stepNumber < currentStep);
		if (stepNumber === currentStep) step.setAttribute("aria-current", "step");
		else step.removeAttribute("aria-current");
	}
}

function handleModalKeydown(event) {
	let activeModal = null;
	let canClose = false;
	let closeModal = null;

	if (refs.createTemplateModal.classList.contains("active")) {
		activeModal = refs.createTemplateModal;
		canClose = !state.isSubmitting;
		closeModal = closeCreateTemplateModal;
	} else if (refs.editTemplateModal.classList.contains("active")) {
		activeModal = refs.editTemplateModal;
		canClose = !state.isEditSubmitting;
		closeModal = closeEditTemplateModal;
	} else if (refs.deleteTemplateModal.classList.contains("active")) {
		activeModal = refs.deleteTemplateModal;
		canClose = !state.isDeleting;
		closeModal = closeDeleteTemplateModal;
	}

	if (!activeModal) return;

	if (event.key === "Escape") {
		event.preventDefault();
		if (canClose) closeModal();
		return;
	}

	if (event.key !== "Tab") return;
	const focusable = Array.from(
		activeModal.querySelectorAll(
			'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
		),
	).filter((element) => !element.closest("[hidden]") && element.offsetParent !== null);
	if (focusable.length === 0) return;

	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}

function setBackgroundInert(shouldBeInert) {
	if (shouldBeInert) {
		document.body.classList.add("template-modal-open");
		state.backgroundElements = Array.from(
			document.querySelectorAll("body > header, body > .container, body > footer"),
		).map((element) => ({
			element,
			wasInert: element.inert,
			ariaHidden: element.getAttribute("aria-hidden"),
		}));

		for (const { element } of state.backgroundElements) {
			element.inert = true;
			element.setAttribute("aria-hidden", "true");
		}
		return;
	}

	document.body.classList.remove("template-modal-open");
	for (const { element, wasInert, ariaHidden } of state.backgroundElements) {
		element.inert = wasInert;
		if (ariaHidden === null) element.removeAttribute("aria-hidden");
		else element.setAttribute("aria-hidden", ariaHidden);
	}
	state.backgroundElements = [];
}

function revokePreviewUrl() {
	if (!state.previewUrl) return;
	URL.revokeObjectURL(state.previewUrl);
	state.previewUrl = "";
}

function createInlineLoading(message) {
	const loading = createElement("div", "inline-loading");
	const spinner = createElement("span", "spinner");
	spinner.setAttribute("aria-hidden", "true");
	loading.append(spinner, createElement("span", "", message));
	return loading;
}

function createElement(tagName, className = "", text = "") {
	const element = document.createElement(tagName);
	if (className) element.className = className;
	if (text !== "") element.textContent = text;
	return element;
}

function normalizeCount(value) {
	return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
}

function formatCoordinates(coordinates) {
	return Array.isArray(coordinates) && coordinates.length === 4
		? coordinates.join(", ")
		: "—";
}

function formatNumber(value) {
	return new Intl.NumberFormat("vi-VN").format(value);
}

function formatBytes(bytes) {
	if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
	const units = ["B", "KB", "MB", "GB"];
	const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** unitIndex;
	return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`;
}

function notify(message, type, duration) {
	if (typeof window.showNotification === "function") {
		window.showNotification(message, type, duration);
	}
}
