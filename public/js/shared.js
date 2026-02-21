// Hàm tạo header
function createHeader() {
  const header = document.createElement('header');
  header.innerHTML = `
    <div class="header-content">
      <div class="header-brand">
        <div class="header-logo">W</div>
        <span>wplace-painting</span>
      </div>
      <nav class="header-nav">
        <a href="/">Dashboard</a>
        <a href="/accounts/">Quản lý Tài Khoản</a>
        <a href="/templates/">Quản lý Template</a>
        <a href="/logs/">Real-time Logs</a>
        <a href="/queue/">Queue</a>
      </nav>
    </div>
  `;
  document.body.insertBefore(header, document.body.firstChild);
}

// Hàm tạo footer
function createFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = `
    <div class="footer-content">
      <div class="footer-text">
        Made by <strong>amoguslmao.</strong>
      </div>
      <div class="footer-links">
        <a href="https://github.com/amoguslmao/wplace-painting" target="_blank">GitHub Repository</a>
        <span class="footer-divider">|</span>
        <span>&copy; 2026 wplace-painting</span>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

// Gọi hàm khi DOM ready
document.addEventListener('DOMContentLoaded', () => {
  createHeader();
  createFooter();
  
  // Wrap content inside container
  const container = document.querySelector('.container');
  if (!container) {
    const body = document.body;
    const originalContent = body.innerHTML;
    body.innerHTML = '';
    
    const newContainer = document.createElement('div');
    newContainer.className = 'container';
    newContainer.innerHTML = `
      <header></header>
      <div class="main-content">${originalContent}</div>
      <footer></footer>
    `;
    
    body.appendChild(newContainer);
    createHeader();
    createFooter();
  }
});

// Notify người dùng
function showNotification(message, type = 'info', duration = 3000) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.innerHTML = `<span>${message}</span>`;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.maxWidth = '400px';
  
  document.body.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, duration);
}

// Hàm toggle modal
function toggleModal(modalId, show = true) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  
  if (show) {
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
  }
}

// Đóng modal khi click outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});
