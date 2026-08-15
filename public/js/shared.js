/**
 * Create header element with navigation
 */
function createHeader() {
	const header = document.createElement("header");
	const headerContent = document.createElement("div");
	headerContent.className = "header-content";

	const headerBrand = document.createElement("div");
	headerBrand.className = "header-brand";

	const headerLogo = document.createElement("div");
	headerLogo.className = "header-logo";
	headerLogo.textContent = "W";

	const headerBrandText = document.createElement("span");
	headerBrandText.textContent = "wplace-painting";

	headerBrand.appendChild(headerLogo);
	headerBrand.appendChild(headerBrandText);

	const nav = document.createElement("nav");
	nav.className = "header-nav";

	const navLinks = [
		{ href: "/", text: "Dashboard" },
		{ href: "/accounts/", text: "Quản lý Tài Khoản" },
		{ href: "/templates/", text: "Quản lý Template" },
		{ href: "/logs/", text: "Real-time Logs" },
		{ href: "/queue/", text: "Queue" },
	];

	navLinks.forEach(({ href, text }) => {
		const link = document.createElement("a");
		link.href = href;
		link.textContent = text;
		nav.appendChild(link);
	});

	headerContent.appendChild(headerBrand);
	headerContent.appendChild(nav);
	header.appendChild(headerContent);

	document.body.insertBefore(header, document.body.firstChild);
}

/**
 * Create footer element
 */
function createFooter() {
	const footer = document.createElement("footer");
	const footerContent = document.createElement("div");
	footerContent.className = "footer-content";

	const footerText = document.createElement("div");
	footerText.className = "footer-text";
	footerText.innerHTML = "Made by <strong>amoguslmao.</strong>";

	const footerLinks = document.createElement("div");
	footerLinks.className = "footer-links";

	const githubLink = document.createElement("a");
	githubLink.href = "https://github.com/amoguslmao/wplace-painting";
	githubLink.target = "_blank";
	githubLink.rel = "noopener noreferrer";
	githubLink.textContent = "GitHub Repository";

	const divider = document.createElement("span");
	divider.className = "footer-divider";
	divider.textContent = "|";

	const copyright = document.createElement("span");
	copyright.textContent = "© 2026 wplace-painting";

	footerLinks.appendChild(githubLink);
	footerLinks.appendChild(divider);
	footerLinks.appendChild(copyright);

	footerContent.appendChild(footerText);
	footerContent.appendChild(footerLinks);
	footer.appendChild(footerContent);

	document.body.appendChild(footer);
}

/**
 * Initialize header and footer on DOM ready
 */
document.addEventListener("DOMContentLoaded", () => {
	createHeader();
	createFooter();

	const container = document.querySelector(".container");
	if (!container) {
		const mainContent = document.querySelector(".main-content");
		if (mainContent) {
			const newContainer = document.createElement("div");
			newContainer.className = "container";
			mainContent.parentElement?.replaceChild(newContainer, mainContent);
			newContainer.appendChild(mainContent);
		}
	}
});

/**
 * Show notification/toast message
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, danger, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showNotification(message, type = "info", duration = 3000) {
	let container = document.getElementById("notificationContainer");
	if (!container) {
		container = document.createElement("div");
		container.id = "notificationContainer";
		container.setAttribute("aria-label", "Thông báo");
		container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      width: min(400px, calc(100vw - 40px));
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
		document.body.appendChild(container);
	}

	const alert = document.createElement("div");
	alert.className = `alert alert-${type}`;
	alert.setAttribute("role", type === "danger" ? "alert" : "status");
	alert.setAttribute("aria-live", type === "danger" ? "assertive" : "polite");
	alert.setAttribute("aria-atomic", "true");

	const messageSpan = document.createElement("span");
	messageSpan.textContent = message;
	alert.appendChild(messageSpan);

	alert.style.cssText = `
		width: 100%;
		margin: 0;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
		pointer-events: auto;
  `;

	container.appendChild(alert);

	setTimeout(() => {
		alert.remove();
		if (!container.children.length) container.remove();
	}, duration);
}

/**
 * Toggle modal visibility
 * @param {string} modalId - Modal element ID
 * @param {boolean} show - Show or hide
 */
function toggleModal(modalId, show = true) {
	const modal = document.getElementById(modalId);
	if (!modal) return;

	if (show) {
		modal.classList.add("active");
	} else {
		modal.classList.remove("active");
	}
}

/**
 * Close modal when clicking outside
 */
document.addEventListener("click", (event) => {
	if (event.target.classList.contains("modal")) {
		event.target.classList.remove("active");
	}
});
