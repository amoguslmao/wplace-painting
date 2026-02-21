# wplace-painting Dashboard

Đây là một giao diện web HTML/CSS/JS để quản lý tài khoản Wplace và tự động hóa vẽ hình ảnh lên Wplace.

## 📁 Cấu trúc Thư mục

```
/public
├── index.html                 # Trang Dashboard chính
├── dashboard.css              # CSS cho Dashboard
├── dashboard.js               # JavaScript cho Dashboard
├── css/
│   ├── shared.css            # CSS chung cho tất cả các trang
│   ├── header.css            # CSS cho header
│   └── footer.css            # CSS cho footer
├── js/
│   ├── shared.js             # JS chung (header, footer, notify)
│   ├── api.js                # Các hàm API calls
│   └── jwtParser.js          # JWT Token parser
├── assets/                    # SVG, icons, etc.
├── accounts/
│   ├── index.html            # Trang quản lý tài khoản
│   ├── style.css             # CSS trang accounts
│   └── script.js             # JavaScript trang accounts
├── templates/
│   ├── index.html            # Trang quản lý template
│   ├── style.css             # CSS trang templates
│   └── script.js             # JavaScript trang templates
├── logs/
│   ├── index.html            # Trang Real-time Logs
│   ├── style.css             # CSS trang logs
│   └── script.js             # JavaScript trang logs
├── queue/
│   ├── index.html            # Trang Queue
│   ├── style.css             # CSS trang queue
│   └── script.js             # JavaScript trang queue
└── edit-account/
    ├── index.html            # Trang chỉnh sửa tài khoản
    ├── style.css             # CSS trang edit-account
    └── script.js             # JavaScript trang edit-account
```

## 🚀 Cách Sử Dụng

### 1. Chạy Server

```bash
npm run build  # Compile TypeScript
npm start      # Chạy server
```

Server sẽ chạy tại `http://localhost:PORT` (mặc định là port được cấu hình).

### 2. Truy cập Dashboard

Mở trình duyệt và truy cập:
```
http://localhost:PORT
```

## 📋 Các Trang/Tính Năng

### 1. **Dashboard** (/)
- Trang chủ với thanh sidebar điều hướng
- Hiển thị thống kê nhanh (số tài khoản, template, logs, queue)
- Quick actions để truy cập nhanh các tính năng
- Thông tin hệ thống

### 2. **Quản lý Tài Khoản** (/accounts/)
Chia thành 2 phần chính:

**Phần 1: Bulk Actions**
- ✨ Thêm tài khoản bằng JWT Token
- 🔄 Fetch tất cả tài khoản (bulk fetch)
- 📥 Nhập hàng loạt JWT Token
- 📤 Xuất dữ liệu tài khoản
- ♻️ Làm mới danh sách

**Phần 2: Danh sách Tài Khoản (Card View)**  
Mỗi tài khoản hiển thị:
- Username#ID (tên người dùng kèm ID)
- Account ID (nhỏ, màu xám)
- Level với % tiến độ
- Charges: current/max
- Droplets
- Hết hạn JWT Token
- Alliance ID (nếu có)
- Các nút hành động: Fetch, Sửa, Xóa

### 3. **Quản lý Template** (/templates/)
- Hiển thị danh sách template dưới dạng card
- Cho mỗi template:
  - Hình ảnh đã được chỉnh sửa
  - Tên, mô tả
  - Số lượng tài khoản
  - Các nút: Sửa, Xóa
- Chi tiết template:
  - Thông tin cơ bản
  - Danh sách tài khoản dùng template
  - Settings (tọa độ, kích thước, etc.)

### 4. **Real-time Logs** (/logs/)
- Fetch logs từ API
- Tùy chỉnh:
  - Fetch Interval (1-60 giây)
  - Số lượng logs (10-500)
  - Auto Refresh (bật/tắt)
  - Lọc theo Level (error, warning, info, debug)
- Hiển thị logs dạng list với:
  - Level (color-coded)
  - Thời gian
  - Nội dung log
- Click log để xem chi tiết

### 5. **Queue** (/queue/)  
Hiển thị các tài khoản đang charge:
- Thống kê:
  - Số tài khoản đang charge
  - Tổng charges
  - Charges được sử dụng
  - Thời gian cập nhật
- Danh sách tài khoản với:
  - Status (Đang Charge/Sẵn sàng)
  - Charges hiện tại/max
  - Cooldown
  - Alliance
  - Countdown timer (tính real-time)
  - Progress bar
- Controls:
  - Fetch Ngay
  - Auto Refresh
  - Sort (Old first/New first)
  - Xóa danh sách

### 6. **Chỉnh sửa Tài Khoản** (/edit-account/?id=<accountId>)
- Chỉnh sửa thông tin tài khoản:
  - Level
  - Pixels Painted
  - Droplets
  - Country, Discord
  - Charges (current, max, cooldown)
  - Alliance ID & Role
  - Role, Is Customer
  - Show Last Pixel, Needs Phone Verification
- Xem thông tin hệ thống (read-only):
  - Token hết hạn
  - Timeout Until
  - Last Fetch
- Lưu thay đổi (với xác nhận modal)

## 🔗 API Endpoints

Tất cả các API endpoints có pattern: `/api/<resource>/<action>`

**Chú ý**: Hãy cập nhật các URL API endpoint trong file `/public/js/api.js` và các file script của từng trang theo đúng backend APIs của bạn.

### Endpoints cần thiết:

```
GET    /api/accounts/getAll              - Lấy tất cả tài khoản
POST   /api/accounts/add                 - Thêm tài khoản mới
DELETE /api/accounts/delete/:id          - Xóa tài khoản
POST   /api/accounts/fetch/:id           - Fetch thông tin tài khoản
PUT    /api/accounts/update/:id          - Cập nhật tài khoản
POST   /api/accounts/bulkFetch           - Fetch tất cả tài khoản
POST   /api/accounts/import              - Import JWT Token

GET    /api/templates/list               - Lấy danh sách template
POST   /api/templates/create             - Tạo template mới
PUT    /api/templates/update/:id         - Cập nhật template
DELETE /api/templates/delete/:id         - Xóa template

GET    /api/logs?limit=100               - Lấy logs

GET    /api/queue                        - Lấy queue
```

## 🎨 Styling

- **Color Scheme**: Dark theme với accent màu cam (#ff6b35)
- **Responsive**: Hỗ trợ desktop, tablet, mobile
- **Components**: Button, Card, Modal, Badge, Alert, Table, etc.

## 🔐 JWT Token

- JWT Token được parse bằng `parseJWT()` function trong `/public/js/jwtParser.js`
- Có thể lấy expiration date, validate token, format thời gian
- Các hàm có sẵn:
  - `parseJWT(token)` - Parse token
  - `getJWTExpiration(token)` - Lấy expiration
  - `isJWTExpired(token)` - Check hết hạn
  - `formatJWTExpiration(token)` - Format thời gian

## 🔔 Notifications

Sử dụng `showNotification(message, type, duration)`:
- `type`: 'success', 'danger', 'warning', 'info'
- `duration`: milliseconds (mặc định 3000)

```javascript
showNotification('Thành công!', 'success', 3000);
```

## 🔄 Auto-Refresh

Các trang logs và queue có tính năng auto-refresh:
- Tùy chỉnh fetch interval
- Bật/tắt auto refresh
- Timer cập nhật real-time

## 📦 Dependencies

- HTML5, CSS3, JavaScript (ES6+)
- Fetch API (built-in)
- No external dependencies (pure vanilla JS)

## ⚙️ Cấu hình

Các cấu hình chính trong `/public/js/api.js`:
```javascript
const API_BASE_URL = '/api';  // Đổi nếu API ở endpoint khác
```

## 🐛 Lưu ý

1. **CORS**: Nếu API ở domain khác, cần enable CORS trên server
2. **API URLs**: Cần cập nhật endpoints theo backend của bạn
3. **JWT Token**: Phải là token hợp lệ từ Wplace
4. **Images**: Template images cần được lưu trữ và trả về đúng URL

## 📝 Commit Message Guidelines

Khi có thay đổi frontend, hãy use meaningful commit messages:
```
feat: Add new feature
fix: Fix bug
style: CSS/styling changes
refactor: Code refactoring
docs: Documentation updates
```

## 💡 Future Enhancements

- [ ] Dark/Light mode toggle
- [ ] Export stats to PDF
- [ ] Advanced filtering
- [ ] Batch operations confirmation
- [ ] Settings page
- [ ] User preferences
- [ ] Analytics dashboard
- [ ] Real-time notifications

---

**Made by amoguslmao.**
Repository: https://github.com/amoguslmao/wplace-painting
