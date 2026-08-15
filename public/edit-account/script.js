import { getAllAccounts, updateAccount } from "/js/api.js";
import { getJWTExpiration, formatJWTExpiration } from "/js/jwtParser.js";

const EditAccountManager = (() => {
	let accountId = null;
	let currentAccount = null;

	const init = () => {
		document.addEventListener("DOMContentLoaded", initializeEdit);
	};

	const initializeEdit = () => {
		const urlParams = new URLSearchParams(window.location.search);
		accountId = parseInt(urlParams.get("id"));

		if (!accountId) {
			showErrorState("Không tìm thấy ID tài khoản");
			return;
		}

		loadAccount();
	};

	/**
	 * Load thông tin tài khoản
	 */
	const loadAccount = async () => {
		try {
			const response = await getAllAccounts();
			const accounts = response || [];

			currentAccount = accounts.find((acc) => acc.id === accountId);

			if (!currentAccount) {
				showErrorState("Không tìm thấy tài khoản này");
				return;
			}

			renderForm();
		} catch (error) {
			console.error("Error loading account:", error);
			showErrorState("Lỗi khi tải thông tin tài khoản");
		}
	};

	/**
	 * Render form chỉnh sửa
	 */
	const renderForm = () => {
		const user = currentAccount.user;
		const container = document.getElementById("editFormContainer");

		if (!container) return;

		// Update page title
		const pageTitle = document.getElementById("pageTitle");
		if (pageTitle) {
			pageTitle.textContent = `Chỉnh sửa Tài Khoản: ${user.name}#${user.id}`;
		}

		container.innerHTML = "";

		const form = document.createElement("form");
		form.id = "editForm";

		// Basic info section
		const basicSection = createFormSection("Thông tin cơ bản", [
			{
				type: "info-box",
				content:
					"Một số trường dưới đây chỉ có thể xem, không thể chỉnh sửa. Những thay đổi sẽ được lưu vào cơ sở dữ liệu của server.",
			},
			{
				type: "row",
				fields: [
					{
						type: "readonly",
						label: "Account ID",
						value: currentAccount.id,
					},
					{
						type: "readonly",
						label: "User ID",
						value: user.id,
					},
				],
			},
			{
				type: "row",
				fields: [
					{
						type: "text",
						id: "userName",
						label: "Tên người dùng",
						value: user.name,
						disabled: true,
						badge: "Chỉ xem",
					},
					{
						type: "number",
						id: "userLevel",
						label: "Level",
						value: user.level,
						step: 0.001,
					},
				],
			},
			{
				type: "row",
				fields: [
					{
						type: "number",
						id: "pixelsPainted",
						label: "Pixels Painted",
						value: user.pixelsPainted,
					},
					{
						type: "number",
						id: "droplets",
						label: "Droplets",
						value: user.droplets,
					},
				],
			},
			{
				type: "row",
				fields: [
					{
						type: "text",
						id: "country",
						label: "Đất nước",
						value: user.country,
					},
					{
						type: "text",
						id: "discord",
						label: "Discord",
						value: user.discord,
					},
				],
			},
		]);
		form.appendChild(basicSection);

		// Charges section
		const chargesSection = createFormSection("Charges", [
			{
				type: "row",
				fields: [
					{
						type: "number",
						id: "chargesCurrent",
						label: "Charges Hiện tại",
						value: user.charges.count,
					},
					{
						type: "number",
						id: "chargesMax",
						label: "Charges Tối đa",
						value: user.charges.max,
					},
					{
						type: "number",
						id: "chargesCooldown",
						label: "Cooldown (ms)",
						value: user.charges.cooldownMs,
					},
				],
			},
		]);
		form.appendChild(chargesSection);

		// Alliance section
		const allianceSection = createFormSection("Alliance", [
			{
				type: "row",
				fields: [
					{
						type: "number",
						id: "allianceId",
						label: "Alliance ID",
						value: user.allianceId || "",
						placeholder: "Để trống nếu không thuộc alliance",
					},
					{
						type: "select",
						id: "allianceRole",
						label: "Alliance Role",
						options: [
							{ value: "", label: "Không có" },
							{
								value: "admin",
								label: "Admin",
								selected: user.allianceRole === "admin",
							},
							{
								value: "member",
								label: "Member",
								selected: user.allianceRole === "member",
							},
						],
					},
				],
			},
		]);
		form.appendChild(allianceSection);

		// Other info section
		const otherSection = createFormSection("Thông tin khác", [
			{
				type: "row",
				fields: [
					{
						type: "text",
						id: "role",
						label: "Role",
						value: user.role,
					},
					{
						type: "select",
						id: "isCustomer",
						label: "Loại tài khoản",
						options: [
							{
								value: "false",
								label: "Regular",
								selected: !user.isCustomer,
							},
							{
								value: "true",
								label: "Customer",
								selected: user.isCustomer,
							},
						],
					},
				],
			},
			{
				type: "row",
				fields: [
					{
						type: "checkbox",
						id: "showLastPixel",
						label: "Hiển thị pixel cuối cùng",
						checked: user.showLastPixel,
					},
					{
						type: "checkbox",
						id: "needsPhoneVerification",
						label: "Cần xác minh điện thoại",
						checked: user.needsPhoneVerification,
					},
				],
			},
			...(user.suspensionReason
				? [
						{
							type: "row",
							fields: [
								{
									type: "textarea",
									id: "suspensionReason",
									label: "Lý do tạm ngưng",
									value: user.suspensionReason,
									rows: 3,
								},
							],
						},
					]
				: []),
		]);
		form.appendChild(otherSection);

		// System info section
		const systemSection = createFormSection(
			"Thông tin hệ thống (Chỉ xem)",
			[
				{
					type: "row",
					fields: [
						{
							type: "readonly",
							label: "Token Hết hạn",
							// value: new Date(
							// 	currentAccount.jwtToken !== "hidden"
							// 		? currentAccount.jwtToken
							// 		: user.timeoutUntil,
							// ).toLocaleString("vi-VN"),
							value: formatJWTExpiration(currentAccount.jwtToken)
						},
						{
							type: "readonly",
							label: "Timeout Until",
							value: new Date(user.timeoutUntil).toLocaleString(
								"vi-VN",
							),
						},
					],
				},
				{
					type: "row",
					fields: [
						{
							type: "readonly",
							label: "Last Fetch",
							value: new Date(
								currentAccount.lastFetch,
							).toLocaleString("vi-VN"),
						},
					],
				},
			],
		);
		form.appendChild(systemSection);

		// Form actions
		const actionsDiv = document.createElement("div");
		actionsDiv.className = "form-actions";

		const cancelBtn = document.createElement("button");
		cancelBtn.type = "button";
		cancelBtn.className = "btn-secondary";
		cancelBtn.textContent = "Hủy";
		cancelBtn.addEventListener("click", () => window.history.back());

		const saveBtn = document.createElement("button");
		saveBtn.type = "button";
		saveBtn.className = "btn-primary";
		saveBtn.textContent = "Lưu thay đổi";
		saveBtn.addEventListener("click", validateAndSave);

		actionsDiv.appendChild(cancelBtn);
		actionsDiv.appendChild(saveBtn);

		form.appendChild(actionsDiv);

		container.appendChild(form);
	};

	/**
	 * Create form section
	 */
	const createFormSection = (title, fields) => {
		const section = document.createElement("div");
		section.className = "form-section";

		const heading = document.createElement("h2");
		heading.textContent = title;
		section.appendChild(heading);

		fields.forEach((field) => {
			if (field.type === "info-box") {
				const infoBox = document.createElement("div");
				infoBox.className = "info-box";
				infoBox.innerHTML = `<strong>Lưu ý:</strong> ${field.content}`;
				section.appendChild(infoBox);
			} else if (field.type === "row") {
				const row = document.createElement("div");
				row.className = "form-row";

				field.fields.forEach((fieldDef) => {
					const group = createFormGroup(fieldDef);
					row.appendChild(group);
				});

				section.appendChild(row);
			}
		});

		return section;
	};

	/**
	 * Create form group
	 */
	const createFormGroup = (fieldDef) => {
		const group = document.createElement("div");

		if (fieldDef.type === "readonly") {
			group.className = "form-group-readonly";
			const label = document.createElement("label");
			label.textContent = fieldDef.label;
			const value = document.createElement("div");
			value.className = "value";
			value.textContent = fieldDef.value;
			group.appendChild(label);
			group.appendChild(value);
		} else if (fieldDef.type === "checkbox") {
			group.className = "form-group";
			const label = document.createElement("label");
			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.id = fieldDef.id;
			if (fieldDef.checked) checkbox.checked = true;
			label.appendChild(checkbox);
			label.appendChild(document.createTextNode(fieldDef.label));
			group.appendChild(label);
		} else if (fieldDef.type === "select") {
			group.className = "form-group";
			const label = document.createElement("label");
			label.htmlFor = fieldDef.id;
			label.textContent = fieldDef.label;
			const select = document.createElement("select");
			select.id = fieldDef.id;
			fieldDef.options.forEach((opt) => {
				const option = document.createElement("option");
				option.value = opt.value;
				option.textContent = opt.label;
				if (opt.selected) option.selected = true;
				select.appendChild(option);
			});
			group.appendChild(label);
			group.appendChild(select);
		} else if (fieldDef.type === "textarea") {
			group.className = "form-group";
			const label = document.createElement("label");
			label.htmlFor = fieldDef.id;
			label.textContent = fieldDef.label;
			const textarea = document.createElement("textarea");
			textarea.id = fieldDef.id;
			textarea.rows = fieldDef.rows || 4;
			textarea.value = fieldDef.value || "";
			group.appendChild(label);
			group.appendChild(textarea);
		} else {
			// text, number, email, etc.
			group.className = "form-group";
			const label = document.createElement("label");
			label.htmlFor = fieldDef.id;
			label.textContent = fieldDef.label;
			if (fieldDef.badge) {
				const badge = document.createElement("span");
				badge.className = "badge-readonly";
				badge.textContent = fieldDef.badge;
				label.appendChild(badge);
			}
			const input = document.createElement("input");
			input.type = fieldDef.type || "text";
			input.id = fieldDef.id;
			input.value = fieldDef.value || "";
			if (fieldDef.placeholder) input.placeholder = fieldDef.placeholder;
			if (fieldDef.disabled) input.disabled = true;
			if (fieldDef.step) input.step = fieldDef.step;
			group.appendChild(label);
			group.appendChild(input);
		}

		return group;
	};

	/**
	 * Validate và lưu thay đổi
	 */
	const validateAndSave = () => {
		// Validate dữ liệu
		const level = parseFloat(document.getElementById("userLevel").value);
		const pixelsPainted = parseInt(
			document.getElementById("pixelsPainted").value,
		);
		const droplets = parseInt(document.getElementById("droplets").value);
		const chargesCurrent = parseInt(
			document.getElementById("chargesCurrent").value,
		);
		const chargesMax = parseInt(
			document.getElementById("chargesMax").value,
		);

		if (isNaN(level) || level < 0) {
			showNotification("Level phải là số dương", "warning");
			return;
		}

		if (isNaN(pixelsPainted) || pixelsPainted < 0) {
			showNotification("Pixels Painted phải là số dương", "warning");
			return;
		}

		if (isNaN(droplets) || droplets < 0) {
			showNotification("Droplets phải là số dương", "warning");
			return;
		}

		if (isNaN(chargesCurrent) || chargesCurrent < 0) {
			showNotification("Charges Current phải là số dương", "warning");
			return;
		}

		if (isNaN(chargesMax) || chargesMax < 0) {
			showNotification("Charges Max phải là số dương", "warning");
			return;
		}

		if (chargesCurrent > chargesMax) {
			showNotification(
				"Charges Current không thể vượt quá Charges Max",
				"warning",
			);
			return;
		}

		// Mở modal xác nhận
		toggleModal("confirmSaveModal", true);
	};

	/**
	 * Submit thay đổi
	 */
	const submitChanges = async () => {
		try {
			toggleModal("confirmSaveModal", false);
			showNotification("Đang lưu thay đổi...", "info");

			// Collect form data
			const updateData = {
				level: parseFloat(document.getElementById("userLevel").value),
				pixelsPainted: parseInt(
					document.getElementById("pixelsPainted").value,
				),
				droplets: parseInt(document.getElementById("droplets").value),
				country: document.getElementById("country").value,
				discord: document.getElementById("discord").value,
				role: document.getElementById("role").value,
				isCustomer:
					document.getElementById("isCustomer").value === "true",
				showLastPixel: document.getElementById("showLastPixel").checked,
				needsPhoneVerification: document.getElementById(
					"needsPhoneVerification",
				).checked,
				allianceId: document.getElementById("allianceId").value
					? parseInt(document.getElementById("allianceId").value)
					: null,
				allianceRole:
					document.getElementById("allianceRole").value || null,
				charges: {
					current: parseInt(
						document.getElementById("chargesCurrent").value,
					),
					max: parseInt(document.getElementById("chargesMax").value),
					cooldownMs: parseInt(
						document.getElementById("chargesCooldown").value,
					),
				},
			};

			if (
				currentAccount.user.suspensionReason &&
				document.getElementById("suspensionReason")
			) {
				updateData.suspensionReason =
					document.getElementById("suspensionReason").value;
			}

			const response = await updateAccount(accountId, updateData);
			showNotification("Thay đổi đã được lưu thành công!", "success");

			setTimeout(() => {
				window.location.href = "/accounts/";
			}, 1500);
		} catch (error) {
			console.error("Error saving changes:", error);
			showNotification(error.message || "Lỗi khi lưu thay đổi", "danger");
		}
	};

	/**
	 * Show error state
	 */
	const showErrorState = (message) => {
		const container = document.getElementById("editFormContainer");

		if (!container) return;

		container.innerHTML = "";

		const errorDiv = document.createElement("div");
		errorDiv.className = "error-state";

		const emoji = document.createElement("div");
		emoji.className = "emoji";
		emoji.textContent = "❌";

		const text = document.createElement("p");
		text.textContent = message;

		const link = document.createElement("a");
		link.href = "/accounts/";
		link.className = "btn-secondary";
		link.style.display = "inline-block";
		link.style.marginTop = "1rem";
		link.textContent = "Quay lại danh sách";

		errorDiv.appendChild(emoji);
		errorDiv.appendChild(text);
		errorDiv.appendChild(link);

		container.appendChild(errorDiv);
	};

	return {
		init,
		submitChanges,
	};
})();

EditAccountManager.init();

// Export to global scope for inline onclick handlers
window.submitChanges = EditAccountManager.submitChanges;
