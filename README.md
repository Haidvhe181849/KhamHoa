# 🌸 Khảm Hoa Store — Premium Jewelry E-commerce Platform
> **Brand Personality:** Modern Luxury, Elegant, Feminine, Minimalist, Premium Craftsmanship.
> **Target Audience:** Women aged 22-45 and luxury gift buyers.

---

## 📖 Giới thiệu Hệ thống
**Khảm Hoa Store** là nền tảng thương mại điện tử cao cấp chuyên doanh các sản phẩm trang sức khảm xà cừ, phụ kiện thủ công mỹ nghệ và quà tặng xa xỉ. Hệ thống được phát triển với hiệu năng vượt trội, giao diện người dùng sang trọng lấy tông màu Rose Gold và ngọc trai làm chủ đạo, kết hợp các tiêu chuẩn an ninh và kiểm toán nghiệp vụ cấp doanh nghiệp.

Dự án bao gồm hai thành phần cốt lõi:
1. **Backend API (Node.js / Express):** Kiến trúc RESTful vững chắc, tích hợp cơ sở dữ liệu MongoDB thông qua Mongoose, kết nối thời gian thực qua Socket.IO, bảo vệ an ninh đa tầng và hệ thống Audit Log (nhật ký hệ thống) toàn diện.
2. **Frontend UI (Next.js 15 App Router):** Sử dụng React 19, TailwindCSS, và TypeScript. Áp dụng cơ chế Server Components tối ưu SEO, Edge Runtime Middleware bảo vệ tuyến quản trị `/admin/*` ở tầng máy chủ tĩnh, mang lại trải nghiệm mượt mà, phản hồi lập tức.

---

## ⚙️ Kiến trúc & Cấu trúc Thư mục Hệ thống

Hệ thống được thiết kế theo mô hình **Monorepo** phân rã rạch ròi giữa Server (API) và Client (UI):

```text
KhamHoaStore/
├── backend/                  # ⚙️ MÁY CHỦ API (Node.js & Express)
│   ├── server.js             # Điểm khởi chạy Socket.IO và HTTP Server
│   ├── package.json          # Quản lý dependencies (helmet, rate-limit, v.v.)
│   ├── .env.example          # Tệp tin cấu hình mẫu chuẩn hóa cho Dev team
│   └── src/
│       ├── app.js            # Khởi tạo Express, cài đặt Middlewares bảo mật (Helmet, CORS)
│       ├── config/           # Cấu hình kết nối DB (MongoDB) & Lưu trữ (Cloudinary Cloud)
│       ├── controllers/      # Hàm xử lý nghiệp vụ API (Order, User, Product, Voucher, v.v.)
│       ├── middlewares/      # Bộ lọc trung gian (Xác thực JWT, phân quyền Admin, kiểm soát lỗi)
│       ├── models/           # Mongoose Schemas (User, Product, Order, Voucher, AuditLog, v.v.)
│       ├── routes/           # Định tuyến tài nguyên API endpoints
│       └── utils/            # Tiện ích bổ trợ (Gửi Email OTP SMTP, gửi cảnh báo Bot Telegram)
│
└── frontend/                 # 💻 GIAO DIỆN KHÁCH HÀNG & ADMIN (Next.js 15)
    ├── package.json          # Dependencies & Scripts chạy dự án
    ├── next.config.ts        # Cấu hình Next.js (chặn Clickjacking, HSTS, CORS headers)
    ├── src/
    │   ├── middleware.ts     # Edge/Server Router Guard - Giải mã & kiểm tra JWT Offline
    │   ├── app/              # App Router (Các trang Storefront & Phân vùng /admin/*)
    │   ├── components/       # UI Components thiết kế theo Brandbook Rose Gold & Minimalist
    │   ├── lib/              # API Client Helper (fetchWithAuth, API_BASE_URL)
    │   └── context/          # Context API quản lý State toàn cục (AuthContext, CartContext)
```

---

## 🛠️ Chiến lược Nghiệp vụ & Cơ sở Dữ liệu

### 1. Quản lý Kho hàng & Trạng thái Đơn hàng (Inventory Timing Strategy)
Để tránh tình trạng "giữ hàng ảo" (Overselling hoặc Holding ảo) gây ảnh hưởng đến doanh thu, Khảm Hoa Store áp dụng quy trình kiểm soát kho nghiêm ngặt:
* **PENDING (Chờ xác nhận):** Chỉ ghi nhận thông tin đặt hàng của khách hàng, **KHÔNG** trừ số lượng tồn kho của sản phẩm.
* **CONFIRMED (Đã xác nhận):** Admin thực hiện phê duyệt đơn hàng → Máy chủ sử dụng **Mongoose Database Transaction** nguyên tử để kiểm tra tồn kho tại chỗ và thực hiện trừ số lượng kho (`stock`), tăng số lượng đã bán (`sold`) của sản phẩm.
* **SHIPPING / DELIVERED:** Trạng thái giao hàng, không thể tự ý hủy đơn.
* **CANCELLED (Đã hủy):** 
  * Nếu khách tự hủy hoặc admin hủy khi đơn đang ở trạng thái **PENDING**: Không có biến động kho hàng vì hàng chưa được trừ.
  * Nếu admin hủy đơn khi đơn đã ở trạng thái **CONFIRMED**: Hệ thống sử dụng DB Transaction để tự động hoàn trả số lượng kho (`stock` tăng lại) và giảm chỉ số đã bán (`sold` giảm lại) của sản phẩm tương ứng.

### 2. Quản lý Khuyến mãi (Voucher)
* Phòng ngừa rủi ro **Race Condition** (nhiều yêu cầu áp dụng cùng một mã giảm giá giới hạn trong cùng 1 mili-giây).
* Sử dụng toán tử nguyên tử **Atomic Update** (`findOneAndUpdate` kết hợp `$inc`) để kiểm soát số lần sử dụng thực tế của voucher trực tiếp tại tầng cơ sở dữ liệu MongoDB, loại bỏ hoàn toàn khả năng voucher bị sử dụng vượt mức giới hạn cho phép.

---

## 🔒 Chiến dịch Vá Bảo Mật Đa Tầng (Pre-deployment Hardening)

Hệ thống đã trải qua hai giai đoạn vá bảo mật chuyên sâu để đạt chuẩn thương mại điện tử cao cấp:

### 🛡️ PHA 1: Khắc phục các lỗ hổng CRITICAL & HIGH
1. **Chống thao túng giá sản phẩm (0đ Checkout):** Tuyệt đối không tin tưởng vào giá sản phẩm gửi lên từ Client. Server tự động truy vấn giá bán gốc từ MongoDB dựa vào `productId` để nhân với số lượng và tính tổng giá tiền thực tế.
2. **Khóa ký JWT siêu mạnh:** Thay khóa generic mặc định bằng khóa ngẫu nhiên entropy cao dài 64 ký tự hex ngẫu nhiên bảo mật tuyệt đối.
3. **Phòng chống IDOR & Khuyết thiếu Auth tại API thanh toán:** Cài đặt middleware xác thực `protect` cho API xác nhận thanh toán `POST /api/orders/:id/notify-payment` và so khớp quyền sở hữu đơn hàng (dựa trên tài khoản đăng nhập hoặc số điện thoại khớp đơn hàng).
4. **Nâng cấp Thư viện An toàn:** Khắc phục hoàn toàn lỗ hổng tiêm tham số tùy ý (*Arbitrary Argument Injection* - CVE-2024-52599) bằng cách nâng cấp SDK `cloudinary` lên phiên bản `2.10.0` và tương thích hóa `multer-storage-cloudinary`.
5. **Chống Tấn công DoS Tải ảnh (Multer Limits):** Đặt cấu hình `limits: { fileSize: 5 * 1024 * 1024 }` chặn đứng các tệp tải lên lớn hơn 5MB từ tầng biên mạng.
6. **Bảo mật HTTP Response Headers phía Backend:** Tích hợp gói bảo mật mạng `helmet` toàn cục để ngăn chặn Clickjacking, MIME-sniffing.
7. **Bộ lọc Giới hạn Tần suất (Rate Limiting):** Áp dụng `express-rate-limit` giới hạn tối đa 5 đơn hàng / 5 phút trên một địa chỉ IP và 5 yêu cầu hỗ trợ / 15 phút, chặn bot spam.

### 🛡️ PHA 2: Bảo mật Nâng cao & Giám sát An ninh
1. **Security Headers phía Frontend (`next.config.ts`):** Thiết lập các header an ninh cho Next.js tĩnh & động (`X-Frame-Options: DENY`, `Strict-Transport-Security` HSTS tối đa 1 năm, `X-Content-Type-Options: nosniff`).
2. **Next.js Server-side Edge Middleware Router Guard:** Xây dựng tệp tin [middleware.ts](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/frontend/src/middleware.ts) chặn bắt toàn bộ yêu cầu vào `/admin/*`. Tệp sử dụng thư viện hiệu năng cao `jose` giải mã chữ ký JWT offline tại tầng Edge máy chủ để kiểm tra quyền hạn `role: 'admin'`, loại bỏ hoàn toàn độ trễ mạng và ngăn chặn lộ giao diện tĩnh kể cả khi tắt Javascript.
3. **Bộ lọc định dạng tệp tin thực tế (Multer fileFilter):** Chặn các đòn tấn công bypass đuôi mở rộng hình ảnh giả bằng cách kiểm tra trực tiếp Stream Metadata `file.mimetype` thực tế (chỉ chấp nhận `image/jpeg`, `image/png`, `image/webp`).
4. **Chống Tấn công sập máy chủ ReDoS (Regex DoS):** Viết bộ tiền xử lý loại bỏ toàn bộ các ký tự đặc biệt của biểu thức chính quy (`[-\/\\^$*+?.()|[\]{}]`) khỏi các chuỗi tìm kiếm đầu vào trước khi thực hiện truy vấn `{ $regex }` trên cơ sở dữ liệu.
5. **Hệ thống Kiểm toán An ninh (Admin Audit Logs):**
   - Định nghĩa Schema dữ liệu [AuditLog.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/models/AuditLog.js) lưu giữ: Ai thao tác (`adminName`, `userId`), làm gì (`action`), tác động lên đối tượng nào (`targetModel`, `targetId`), chi tiết sự kiện (`details`), và địa chỉ IP thực hiện (`ipAddress`).
   - Tích hợp ghi nhận nhật ký tự động vào 8 luồng quản trị nhạy cảm: duyệt đơn, giao hàng, hoàn tất đơn, hủy đơn của Admin, phê duyệt nhận tiền ngân hàng, nâng/hạ quyền người dùng, khóa và mở khóa tài khoản người dùng.
   - **Giao diện Tra cứu Lịch Nhật ký (Giao diện Admin):** Xây dựng trang [Audit Log Frontend](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/frontend/src/app/admin/audit-log/page.tsx) hỗ trợ tìm kiếm toàn văn, lọc theo loại hành động/đối tượng, phân trang và đặc biệt là **Lọc theo khoảng thời gian (Từ ngày - Đến ngày)** trực quan.

---

## 💻 Hướng dẫn Cài đặt & Chạy ứng dụng dưới Local

### Bước 1: Chuẩn bị Môi trường
* Máy tính đã cài đặt **Node.js** (Khuyên dùng v18+ hoặc v20 LTS).
* Cơ sở dữ liệu **MongoDB** (Local hoặc MongoDB Atlas Cloud).

### Bước 2: Thiết lập cấu hình Backend
1. Di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt toàn bộ dependencies:
   ```bash
   npm install
   ```
3. Tạo tệp cấu hình `.env` dựa theo mẫu chuẩn [.env.example](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/.env.example):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/khamhoa
   JWT_SECRET=your_super_strong_random_secret_hex_key
   
   # Cấu hình thanh toán MB Bank
   BANK_ID=970422
   BANK_ACCOUNT_NO=your_bank_account_number
   BANK_ACCOUNT_NAME=your_bank_account_holder_name_uppercase
   BANK_NAME=MB

   
   # Các cấu hình phụ khác (Cloudinary, Telegram, Email)
   ```
4. Đồng bộ cơ sở dữ liệu mẫu:
   ```bash
   npm run seed
   ```
5. Khởi chạy máy chủ Backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```

### Bước 3: Thiết lập cấu hình Frontend
1. Di chuyển vào thư mục `frontend`:
   ```bash
   cd ../frontend
   ```
2. Cài đặt toàn bộ thư viện:
   ```bash
   npm install
   ```
3. Khởi chạy máy chủ Next.js phát triển:
   ```bash
   npm run dev
   ```
4. Truy cập website tại địa chỉ: **[http://localhost:3000](http://localhost:3000)**.
5. Truy cập Trang Quản trị tại địa chỉ: **[http://localhost:3000/admin](http://localhost:3000/admin)** (yêu cầu đăng nhập tài khoản có quyền `admin`).

---

## 🚀 Hướng dẫn Triển khai lên Production (Deployment Guide)

### 1. Triển khai máy chủ API (Backend)
Máy chủ API backend Node.js có thể chạy dễ dàng trên các nền tảng Container hoặc Cloud Hosting (Render, AWS EC2, DigitalOcean, v.v.):
* **Yêu cầu môi trường:** Đảm bảo cài đặt biến môi trường `NODE_ENV=production`.
* **Cơ chế Cookie an toàn:** Trong môi trường Production, hệ thống tự động kích hoạt cờ `secure=true` cho Cookie JWT để đảm bảo cookie chỉ được truyền qua giao thức mã hóa HTTPS.
* **Lưu lượng mạng:** Cấu hình biến môi trường `FRONTEND_URL` trỏ về domain chính xác của Next.js để CORS hoạt động chuẩn xác, không bị đánh chặn.

### 2. Triển khai Ứng dụng Next.js (Frontend)
Hệ thống Next.js 15 tối ưu nhất khi được triển khai lên nền tảng **Vercel** hoặc bất kỳ nền tảng Node.js SSR nào hỗ trợ Next.js App Router:
1. **Kiểm tra và Build ứng dụng:**
   ```bash
   npm run build
   ```
2. **Khai báo biến môi trường trên nền tảng Deployment:**
   * `NEXT_PUBLIC_API_URL` trỏ về tên miền của API Backend (Ví dụ: `https://api.khamhoa.store`).
   * `JWT_SECRET` phải khớp 100% với giá trị `JWT_SECRET` đã khai báo ở Backend để đảm bảo Edge Middleware có thể giải mã và xác thực token offline thành công.

---

## 💎 Bản quyền & Đội ngũ Phát triển
Dự án được thiết kế độc quyền phục vụ hoạt động vận hành của thương hiệu trang sức xà cừ nghệ thuật **Khảm Hoa Store**. Mọi hành vi sao chép cấu trúc hoặc thương hiệu khi chưa được cấp phép đều vi phạm chính sách bảo mật của Khảm Hoa Store. 

* **Nhà phát triển chính:** Senior E-commerce Developer & Lead Security Architect.
* **Báo cáo an ninh chi tiết:** Xem trực tiếp tại tệp [Báo cáo Vá Lỗ Hổng Bảo Mật](file:///C:/Users/LENOVO/.gemini/antigravity-ide/brain/eccc691f-36e5-4e06-bed6-b4e513e7c905/security_audit_report.md):
# KHẢM HOA STORE — PRE-DEPLOYMENT SECURITY AUDIT REPORT
**Auditor**: Senior E-commerce Architect & Principal Security Engineer (30+ Years Experience)  
**Target Project**: Khảm Hoa Store (Next.js App Router + Node.js/Express + MongoDB)  
**Môi trường đánh giá**: Development / Pre-production  

---

## ## TÓM TẮT
* **Tổng số lỗi CRITICAL (Nguy hiểm chết người — Phải sửa ngay)**: 2
* **Tổng số lỗi HIGH (Rủi ro cao — Cần sửa trước khi deploy)**: 6
* **Tổng số lỗi WARNING (Cảnh báo — Nên sửa sớm)**: 4
* **Điểm bảo mật tổng thể (Security Score)**: **35 / 100**
* **Đánh giá tình trạng**: 🛑 **KHÔNG AN TOÀN (DO NOT DEPLOY)** — Dự án có các lỗ hổng nghiêm trọng về Logic thanh toán (Cho phép mua hàng với giá 0đ hoặc tùy chỉnh) và cơ chế Chữ ký JWT (Dùng khóa mặc định yếu). Bắt buộc phải vá các lỗi CRITICAL và HIGH trước khi triển khai lên môi trường Production.

---

## ## CRITICAL — Phải fix ngay, không deploy được

### 1. Lỗ hổng Thao túng giá sản phẩm (0đ Checkout / Client-Side Price Tampering)
* **Mô tả**: Khi tạo đơn hàng tại endpoint `POST /api/orders`, server nhận trực tiếp giá tiền (`item.price`) từ mảng `items` do client truyền lên (`req.body.items`) để tính toán tổng tiền thanh toán (`subtotal` và `totalAmount`). Server hoàn toàn **không** truy vấn lại Database để lấy giá gốc của sản phẩm trước khi tính toán.
* **File/Dòng**: [orderController.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/controllers/orderController.js#L40)
  ```javascript
  // Dòng 40
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  ```
* **Tác hại nếu bị khai thác**: Kẻ tấn công có thể chỉnh sửa payload request bằng cách gửi một sản phẩm trị giá hàng triệu đồng nhưng để `price: 0`, `price: 1` hoặc thậm chí `price: -1000000` (giá âm do Schema không chặn giá âm). Đơn hàng sẽ được tạo thành công với giá 0đ, gửi thông báo Telegram cho Admin và lưu vào DB. Kẻ tấn công có thể thanh toán COD hoặc QR với hóa đơn 0đ để chiếm đoạt tài sản.
* **Cách fix**: Tuyệt đối không tin tưởng giá tiền gửi từ Client. Phải truy vấn giá gốc từ Database thông qua `productId` của từng item và kiểm tra tồn kho tại chỗ trước khi tính tổng tiền.
  
  *Code Fix đề xuất*:
  ```javascript
  // Thay thế dòng 40 trong orderController.js bằng logic truy vấn DB:
  let subtotal = 0;
  const enrichedItems = [];

  for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
          return res.status(404).json({ success: false, message: `Sản phẩm với ID ${item.productId} không tồn tại` });
      }
      if (product.stock < item.quantity) {
          return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" không đủ tồn kho` });
      }
      
      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;
      
      // Tạo bản snapshot an toàn dựa trên data gốc từ DB
      enrichedItems.push({
          productId: product._id,
          name: product.name,
          image: product.images?.[0]?.url || '',
          price: product.price,
          quantity: item.quantity,
          subtotal: itemSubtotal
      });
  }
  
  // Gán enrichedItems thay cho items gốc
  ```
* **Thời gian fix ước tính**: 30 phút.

---

### 2. Khóa JWT bí mật mặc định quá yếu (Generic JWT Secret Vulnerability)
* **Mô tả**: Trong cấu hình biến môi trường, khóa `JWT_SECRET` được đặt là một chuỗi generic cực kỳ dễ đoán: `your_jwt_secret_here`.
* **File/Dòng**: [backend/.env](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/.env#L4)
  ```env
  JWT_SECRET=your_jwt_secret_here
  ```
* **Tác hại nếu bị khai thác**: Kẻ tấn công có thể dễ dàng đoán hoặc sử dụng brute-force ngoại tuyến trên các token JWT thu được để tìm ra khóa bí mật này. Khi đã có khóa bí mật, kẻ tấn công có thể tự ký các token JWT giả mạo với bất kỳ thông tin nào, bao gồm việc gán cho mình `role: "admin"` và `id` của bất kỳ user nào trong hệ thống. Điều này dẫn đến việc bypass hoàn toàn cơ chế phân quyền, chiếm đoạt tài khoản Admin tối cao.
* **Cách fix**: Thay đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên có độ dài tối thiểu 32 byte được mã hóa Base64 hoặc Hex, và không bao giờ lưu khóa thực tế trong mã nguồn hay các file ví dụ.
  
  *Command sinh key bảo mật cao*:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  *Thiết lập trong .env*:
  ```env
  JWT_SECRET=d9b23f21da90a18ebfca0a33118cf9456209b53112c29beea197de7718de629f
  ```
* **Thời gian fix ước tính**: 5 phút.

---

## ## HIGH — Nên fix trước khi deploy

### 3. IDOR & Khuyết thiếu cơ chế xác thực tại API thông báo thanh toán
* **Mô tả**: Route thông báo chuyển khoản chuyển khoản VietQR `POST /api/orders/:id/notify-payment` được khai báo public mà không có middleware bảo vệ `protect`. Đồng thời, controller `notifyPayment` không thực hiện bất kỳ thao tác xác minh quyền sở hữu nào giữa order và người gửi request.
* **File/Dòng**: 
  - Route: [orderRoutes.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/routes/orderRoutes.js#L36)
  - Controller: [orderController.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/controllers/orderController.js#L365)
* **Tác hại nếu bị khai thác**: Bất kỳ ai (kể cả khách vãng lai chưa đăng nhập) đều có thể gửi request thông báo thanh toán giả mạo cho bất kỳ mã đơn hàng nào trong hệ thống. Điều này cho phép kẻ phá hoại spam hàng loạt thông báo thanh toán ảo lên kênh Telegram của Admin, gây nhiễu loạn luồng vận hành, hoặc đánh lừa Admin bấm nút phê duyệt thanh toán thủ công cho các đơn hàng chưa thực sự chuyển tiền.
* **Request mẫu để Reproduce (IDOR & Auth Bypass)**:
  ```bash
  curl -X POST http://localhost:5000/api/orders/66567c8a9d0f123456789abc/notify-payment
  ```
  *(Request trên sẽ chạy thành công 200 OK mà không cần JWT token trong Header)*
* **Cách fix**: Thêm middleware `protect` vào route và bổ sung logic so sánh quyền sở hữu hoặc số điện thoại của người gửi thông báo với thông tin trên đơn hàng gốc.
  
  *Code Fix đề xuất*:
  ```javascript
  // Trong orderRoutes.js
  router.post('/:id/notify-payment', protect, notifyPayment);

  // Trong orderController.js (notifyPayment)
  const customerId = req.user.id;
  const isOwnerByUserId = order.userId && order.userId.toString() === customerId.toString();
  const isOwnerByPhone = !order.userId && order.phone === req.user.phone;

  if (!isOwnerByUserId && !isOwnerByPhone) {
      return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền gửi thông báo thanh toán cho đơn hàng này'
      });
  }
  ```
* **Thời gian fix ước tính**: 15 phút.

---

### 4. Lỗ hổng Race Condition khi sử dụng Voucher / Discount Coupon
* **Mô tả**: Khi người dùng áp dụng voucher trong API tạo đơn hàng, hệ thống thực hiện kiểm tra số lần sử dụng (`usedCount >= usageLimit`), sau đó thực hiện lưu đơn hàng và cuối cùng là tăng `usedCount` lên 1 và `save()`. Đây là cơ chế kiểm tra trước ghi sau phi tuần tự (Check-Then-Act), tạo ra rủi ro Race Condition cực kỳ nghiêm trọng.
* **File/Dòng**: [orderController.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/controllers/orderController.js#L52)
* **Tác hại nếu bị khai thác**: Kẻ tấn công có thể dùng các công cụ gửi request song song (ví dụ: Turbo Intruder hoặc công cụ benchmark) để gửi hàng chục request tạo đơn hàng có cùng 1 mã voucher trong cùng 1 mili-giây. Tại thời điểm đó, DB chưa kịp cập nhật `usedCount`, nên tất cả các luồng đều vượt qua điều kiện kiểm tra, cho phép voucher bị áp dụng vượt mức giới hạn sử dụng (ví dụ: voucher giới hạn 10 lượt dùng có thể bị áp dụng thành công 100 lần).
* **Cách fix**: Sử dụng cơ chế cập nhật nguyên tử (Atomic Update) của MongoDB với hàm `findOneAndUpdate` kết hợp toán tử `$inc` và điều kiện lọc chặt chẽ.
  
  *Code Fix đề xuất*:
  ```javascript
  // Thay thế logic kiểm tra voucher dòng 46-71 trong orderController.js bằng:
  const voucher = await Voucher.findOneAndUpdate(
      { 
          code: voucherCode.toUpperCase(), 
          isActive: true, 
          usedCount: { $lt: usageLimit },
          expiryDate: { $gt: new Date() },
          minOrderValue: { $lte: subtotal }
      },
      { $inc: { usedCount: 1 } },
      { new: true }
  );

  if (!voucher) {
      throw new Error('Mã giảm giá không hợp lệ, đã hết hạn, chưa đủ giá trị đơn hàng hoặc đã hết lượt sử dụng');
  }
  ```
* **Thời gian fix ước tính**: 20 phút.

---

### 5. Thư viện phụ thuộc chứa lỗ hổng bảo mật nghiêm trọng (Vulnerable Dependencies)
* **Mô tả**: Quá trình scan dependencies bằng `npm audit` phát hiện thư viện SDK Cloudinary được sử dụng trong backend có phiên bản lỗi thời (`cloudinary < 2.7.0`), chứa lỗ hổng tiêm tham số tùy ý cực kỳ nguy hiểm (**Arbitrary Argument Injection** - [CVE-2024-52599](https://github.com/advisories/GHSA-g4mf-96x5-5m2c)).
* **File/Dòng**: [backend/package.json](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/package.json#L17)
  ```json
  "cloudinary": "^1.41.3"
  ```
* **Tác hại nếu bị khai thác**: Kẻ tấn công có thể chèn các tham số độc hại vào quá trình sinh URL hoặc xử lý ảnh của Cloudinary, từ đó thực thi các hành vi không mong muốn hoặc truy cập trái phép tài nguyên đám mây lưu trữ ảnh của hệ thống.
* **Cách fix**: Cập nhật thư viện `cloudinary` lên phiên bản an toàn (`>= 2.7.0` hoặc v2 mới nhất) cùng với `multer-storage-cloudinary`.
  
  *Command thực hiện*:
  ```bash
  npm install cloudinary@2.10.0 multer-storage-cloudinary@4.0.0
  ```
* **Thời gian fix ước tính**: 10 phút.

---

### 6. Thiếu cơ chế giới hạn dung lượng tải tệp tin (Multer File Size Denial of Service - DoS)
* **Mô tả**: Tệp cấu hình upload ảnh qua thư viện `multer` và `multer-storage-cloudinary` không khai báo giới hạn dung lượng tệp tin tối đa (`fileSize`).
* **File/Dòng**: [cloudinary.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/config/cloudinary.js#L25)
  ```javascript
  const upload = multer({ storage: storage });
  ```
* **Tác hại nếu bị khai thác**: Kẻ tấn công có quyền tải ảnh (ví dụ: tạo đánh giá đánh giá sản phẩm có kèm ảnh hoặc admin tạo sản phẩm mới) có thể cố ý tải lên các tệp tin hình ảnh dung lượng siêu lớn (ví dụ: 100MB+ hoặc tệp tin nén zip giả dạng ảnh). Điều này sẽ làm cạn kiệt băng thông máy chủ, tiêu tốn CPU xử lý luồng mạng, làm nghẽn các tiến trình Node.js (vốn chạy đơn luồng) và dẫn đến sập web (Denial of Service).
* **Cách fix**: Bổ sung tham số `limits` của `multer` để chặn bất kỳ tệp tin nào vượt quá dung lượng quy định (ví dụ: 5MB).
  
  *Code Fix đề xuất*:
  ```javascript
  const upload = multer({ 
      storage: storage,
      limits: {
          fileSize: 5 * 1024 * 1024 // Giới hạn tối đa 5MB mỗi ảnh
      }
  });
  ```
* **Thời gian fix ước tính**: 5 phút.

---

### 7. Khuyết thiếu các Header bảo mật cơ bản (Missing Security Headers)
* **Mô tả**: Hệ thống backend Express.js hoàn toàn không thiết lập các HTTP Header bảo mật tiêu chuẩn (như `X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`).
* **File/Dòng**: [app.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/app.js)
* **Tác hại nếu bị khai thác**: Website dễ dàng bị tấn công Clickjacking (nhúng iframe trang web vào trang lừa đảo để dụ click), tấn công XSS hoặc đánh cắp token do thiếu CSP (Content Security Policy) và cơ chế phòng vệ chống sniffing MIME types.
* **Cách fix**: Cài đặt và tích hợp middleware `helmet` vào file `app.js` của backend.
  
  *Command & Code Fix*:
  ```bash
  npm install helmet
  ```
  ```javascript
  // Trong app.js
  const helmet = require('helmet');
  app.use(helmet());
  ```
* **Thời gian fix ước tính**: 5 phút.

---

### 8. Lỗ hổng khuyết thiếu giới hạn tần suất yêu cầu trên các API trọng yếu (Missing Rate Limiting)
* **Mô tả**: Mặc dù dự án có cấu hình rate limiter cho các API login/register/forgot-password, nhưng các API nhạy cảm khác như Tạo đơn hàng (`POST /api/orders`) và Gửi yêu cầu hỗ trợ (`POST /api/support`) hoàn toàn không được giới hạn.
* **File/Dòng**: [orderRoutes.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/routes/orderRoutes.js) và [supportRoutes.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/routes/supportRoutes.js)
* **Tác hại nếu bị khai thác**: Kẻ tấn công có thể spam hàng triệu đơn hàng ảo hoặc hàng triệu ticket hỗ trợ giả mạo trong thời gian ngắn, gây tràn dữ liệu DB MongoDB, làm cạn kiệt tài nguyên lưu trữ và gián đoạn hoạt động của đội ngũ hỗ trợ khách hàng.
* **Cách fix**: Áp dụng middleware giới hạn tần suất (`express-rate-limit`) riêng biệt cho luồng đặt hàng và gửi hỗ trợ (ví dụ: tối đa 5 đơn hàng / 5 phút trên một IP).
  
  *Code Fix đề xuất*:
  ```javascript
  const orderLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 phút
      max: 5, // Tối đa 5 đơn hàng từ 1 IP trong 5 phút
      message: { success: false, message: 'Bạn đang đặt hàng quá nhanh. Vui lòng đợi vài phút.' }
  });
  router.post('/', orderLimiter, createOrder);
  ```
* **Thời gian fix ước tính**: 10 phút.

---

## ## WARNING — Có thể fix sau nhưng nên làm sớm

### 9. Rủi ro phiên làm việc JWT không thể thu hồi phía Server (Stateless JWT Revocation Issue)
* **Mô tả**: Khi người dùng gọi API đăng xuất `POST /api/users/logout`, server chỉ thực hiện xóa cookie ở client (`res.clearCookie`). Phía Server hoàn toàn không lưu vết danh sách đen (Blacklist/Revocation list) của token cũ.
* **File/Dòng**: [userController.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/controllers/userController.js#L123)
* **Tác hại nếu bị khai thác**: Nếu một token JWT của quản trị viên bị lộ, kể cả khi admin bấm Đăng xuất, kẻ tấn công đã chụp lại token đó vẫn có quyền gửi request truy cập vào API của hệ thống cho đến khi token đó tự hết hạn (khoảng 15 phút hoặc 30 ngày đối với refresh token).
* **Cách fix**: Lưu trữ ID của refresh token trong database khi đăng nhập và thu hồi (delete) bản ghi đó khi người dùng logout. Đối với access token, thời gian sống ngắn (15 phút) giúp giảm thiểu rủi ro, nhưng nếu cần bảo mật tuyệt đối, có thể tích hợp Redis cache để lưu danh sách đen token bị thu hồi trước hạn.
* **Thời gian fix ước tính**: 30 phút.

---

### 10. Lỗ hổng gán thuộc tính hàng loạt gián tiếp ở API cập nhật sản phẩm (Mass Assignment in Admin Product Update)
* **Mô tả**: API cập nhật sản phẩm của Admin nhận trực tiếp đối tượng `req.body` để đẩy vào hàm cập nhật Database `findByIdAndUpdate` mà không thực hiện chọn lọc trường dữ liệu (whitelist).
* **File/Dòng**: [productController.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/controllers/productController.js#L171)
  ```javascript
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, ...);
  ```
* **Tác hại nếu bị khai thác**: Mặc dù chỉ giới hạn cho Admin, tuy nhiên nếu tài khoản admin bị chiếm quyền hoặc có quản trị viên cố ý thao túng, họ có thể gửi các thuộc tính nội bộ của hệ thống như thay đổi số lượng đã bán ảo (`sold: 99999`), đổi điểm đánh giá trung bình ảo (`rating: 5.0`) trực tiếp qua API, phá vỡ tính nhất quán của dữ liệu.
* **Cách fix**: Chỉ trích xuất các trường được phép sửa đổi từ `req.body` trước khi gọi hàm cập nhật DB.
* **Thời gian fix ước tính**: 10 phút.

---

### 11. Thiếu cơ chế kiểm soát CSRF bảo mật (Missing CSRF Protection)
* **Mô tả**: Dự án sử dụng cookie làm cơ chế lưu trữ phiên xác thực xác thực. Tuy nhiên, hệ thống không cấu hình cơ chế phòng vệ chống tấn công giả mạo yêu cầu chéo trang (CSRF).
* **File/Dòng**: [app.js](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/backend/src/app.js)
* **Tác hại nếu bị khai thác**: Nếu người dùng đang đăng nhập hệ thống và vô tình nhấn vào một đường link độc hại từ bên ngoài, trang web độc hại có thể gửi ngầm request sửa đổi dữ liệu cá nhân hoặc tạo đơn hàng ảo trên Khảm Hoa Store bằng phiên đăng nhập cookie Lax của người dùng.
* **Cách fix**: Đảm bảo thuộc tính `sameSite` của cookie luôn được cấu hình là `strict` hoặc `lax` (đã thực hiện tốt trong code của `getCookieOptions`), đồng thời cân nhắc triển khai cơ chế Double Submit Cookie hoặc token CSRF nếu mở rộng API sang các bên thứ ba.
* **Thời gian fix ước tính**: 30 phút.

---

### 12. Cơ chế Route Guard trên Next.js chỉ hoạt động ở Client-side (No Edge/Server Middleware Guard)
* **Mô tả**: Các trang thuộc phân vùng `/admin/*` ở frontend được bảo vệ bằng component Client-side `<AdminProtectedRoute>`. Hệ thống không sử dụng file `middleware.ts` ở thư mục gốc của Next.js để chặn request từ tầng máy chủ (Edge/Server SSR).
* **File/Dòng**: [AdminProtectedRoute.tsx](file:///e:/FULearning/Summer2026/EXE202/KhamHoaStore/frontend/src/components/admin/AdminProtectedRoute.tsx)
* **Tác hại nếu bị khai thác**: Kẻ tấn công có thể tắt JavaScript trên trình duyệt hoặc sử dụng các công cụ bóc tách để tải trực tiếp cấu trúc HTML layout và mã nguồn tĩnh của các trang quản trị admin, gây lộ cấu trúc giao diện điều khiển (mặc dù dữ liệu thực tế từ DB sẽ không bị lộ vì API backend đã được bảo vệ tốt).
* **Cách fix**: Di chuyển logic bảo vệ định tuyến lên tầng máy chủ bằng Next.js Middleware (`middleware.ts`).
* **Thời gian fix ước tính**: 20 phút.

---

## ## PASS — Những gì đã làm đúng
Dự án Khảm Hoa Store có nhiều điểm sáng về kiến trúc và bảo mật đã được triển khai xuất sắc:
1. **Mã hóa mật khẩu an toàn**: Password được mã hóa bằng thuật toán `bcryptjs` với độ muối 10 rounds thông qua hook `pre('save')` tự động trong Mongoose Schema. Tuyệt đối không lưu mật khẩu dạng plaintext.
2. **Cơ chế lưu trữ Session an toàn**: Sử dụng Cookie `httpOnly` kết hợp các thuộc tính `secure` và cấu hình động domain để truyền Access Token / Refresh Token, giúp phòng chống triệt để các cuộc tấn công đánh cắp token bằng XSS qua mã script độc hại.
3. **Phân quyền Admin chặt chẽ**: Toàn bộ các API nghiệp vụ quan trọng và quản trị admin tại backend đều được bọc bởi middleware `protect, authorize('admin')` rất nhất quán. Không có lỗ hổng bypass định tuyến tĩnh.
4. **Phòng chống Overselling (Bán vượt mức) bằng DB Transaction**: Hàm `confirmOrder` được viết bằng MongoDB Session Transaction nguyên tử để trừ tồn kho. Điều này bảo vệ hệ thống tuyệt đối trước rủi ro hai khách hàng đồng thời thanh toán sản phẩm duy nhất còn lại trong kho.
5. **Chống XSS tự động trên Frontend**: Toàn bộ dữ liệu hiển thị trên Next.js React không lạm dụng `dangerouslySetInnerHTML` hay `innerHTML`, loại bỏ hoàn toàn nguy cơ chèn mã HTML/JS độc hại từ người dùng.
6. **Bảo mật file .env**: Tệp `.env` chứa các thông tin nhạy cảm đã được loại trừ khỏi kho lưu trữ mã nguồn bằng khai báo chính xác trong `.gitignore`.

---

## ## THỨ TỰ ƯU TIÊN FIX

| Độ ưu tiên | Tên Lỗi Bảo Mật | Thời gian fix | Mức độ nghiêm trọng |
| :---: | :--- | :---: | :---: |
| **1** | **Fix lỗi Thao túng giá sản phẩm (0đ Checkout)** trong `orderController.js` | 30 phút | **CRITICAL** |
| **2** | **Sinh lại JWT_SECRET** độ mạnh cao ngẫu nhiên trong `.env` | 5 phút | **CRITICAL** |
| **3** | **Vá lỗi bảo mật Dependency Cloudinary** (npm install nâng phiên bản) | 10 phút | **HIGH** |
| **4** | **Bảo vệ API thông báo thanh toán `/notify-payment`** bằng `protect` | 15 phút | **HIGH** |
| **5** | **Áp dụng Atomic Update chống Race Condition cho Voucher** | 20 phút | **HIGH** |
| **6** | **Thêm limits: fileSize vào Multer** để chặn tấn công DoS tải ảnh | 5 phút | **HIGH** |
| **7** | **Cài đặt thư viện `helmet`** và kích hoạt bảo mật HTTP Headers | 5 phút | **HIGH** |
| **8** | **Áp dụng Rate Limiting** cho luồng đặt hàng và gửi hỗ trợ | 10 phút | **HIGH** |

---
*Báo cáo kết thúc đợt Audit Bảo Mật của Khảm Hoa Store. Các đề xuất sửa lỗi trên đã được tối ưu hóa theo quy chuẩn Kiến trúc Thương mại điện tử Hiện đại.*

