const nodemailer = require('nodemailer');

/**
 * Gửi email khôi phục mật khẩu hoặc thông báo qua SMTP
 * @param {Object} options - Tham số gửi thư
 * @param {string} options.email - Địa chỉ email người nhận
 * @param {string} options.subject - Tiêu đề email
 * @param {string} options.otpCode - Mã OTP khôi phục 6 chữ số
 */
const sendEmail = async ({ email, subject, otpCode }) => {
    // 1. Tạo Transporter kết nối đến Gmail SMTP bằng tài khoản người dùng cấp
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // Cổng 587 sử dụng TLS nên để secure = false
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2. Thiết kế giao diện HTML Email mang tính thượng lưu, tinh xảo của Khảm Hoa Store
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
            body {
                background-color: #FAF8F6;
                margin: 0;
                padding: 40px 15px;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
            }
            .container {
                max-width: 500px;
                margin: 0 auto;
                background-color: #ffffff;
                border: 1px solid #E8E3DA;
                border-radius: 16px;
                padding: 40px 30px;
                box-shadow: 0 10px 30px -10px rgba(201, 161, 92, 0.08);
            }
            .header {
                text-align: center;
                border-bottom: 1px solid #F1EEE8;
                padding-bottom: 25px;
                margin-bottom: 30px;
            }
            .brand-name {
                font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
                font-size: 28px;
                font-weight: bold;
                letter-spacing: 0.15em;
                color: #d8a39d;
                text-transform: uppercase;
                margin: 0;
            }
            .brand-slogan {
                font-size: 9px;
                letter-spacing: 0.25em;
                color: #999999;
                text-transform: uppercase;
                margin: 6px 0 0 0;
                font-weight: 600;
            }
            .content {
                font-size: 14px;
                line-height: 1.6;
                color: #333333;
            }
            .salutation {
                font-size: 15px;
                font-weight: 600;
                color: #2B2B2B;
                margin-bottom: 15px;
            }
            .otp-box {
                background-color: #FAF8F6;
                border: 1px solid #E8E3DA;
                border-radius: 12px;
                padding: 18px 0;
                text-align: center;
                margin: 30px 0;
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.01);
            }
            .otp-code {
                font-family: 'Courier New', Courier, monospace;
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 0.25em;
                color: #c9a15c;
                margin-left: 0.25em; /* bù khoảng trống letter-spacing */
            }
            .warning {
                font-size: 11px;
                color: #777777;
                background-color: #F1EEE8/30;
                padding: 12px 15px;
                border-left: 2px solid #c9a15c;
                border-radius: 4px;
                margin-top: 25px;
                line-height: 1.5;
            }
            .footer {
                margin-top: 40px;
                border-top: 1px solid #F1EEE8;
                padding-top: 20px;
                text-align: center;
                font-size: 10px;
                color: #999999;
                line-height: 1.5;
            }
            .signature {
                margin-top: 25px;
                font-size: 13px;
                font-style: italic;
                color: #555555;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header Thương hiệu -->
            <div class="header">
                <h1 class="brand-name">KHẢM HOA</h1>
                <p class="brand-slogan">Tinh Hoa Nghệ Thuật Khảm Đương Đại</p>
            </div>

            <!-- Nội dung thư -->
            <div class="content">
                <p class="salutation">Xin kính chào Quý khách,</p>
                <p>
                    Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với địa chỉ email này trên hệ thống **Khảm Hoa Store**.
                </p>
                <p>
                    Vui lòng sử dụng mã xác thực (OTP) dưới đây để tiến hành thiết lập mật khẩu mới:
                </p>
                
                <!-- Khung hiển thị OTP nổi bật -->
                <div class="otp-box">
                    <span class="otp-code">${otpCode}</span>
                </div>

                <div class="warning">
                    <strong>* Lưu ý bảo mật:</strong> Mã OTP này có hiệu lực trong vòng <strong>10 phút</strong>. Vì sự an toàn của tài khoản, tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nếu quý khách không gửi yêu cầu này, xin vui lòng bỏ qua email này.
                </div>

                <div class="signature">
                    Trân trọng kính thư,<br>
                    <strong>Đội ngũ Khảm Hoa Store</strong>
                </div>
            </div>

            <!-- Chân trang -->
            <div class="footer">
                Bản quyền © 2026 Khảm Hoa Store. Bảo lưu mọi quyền.<br>
                Email: kotenthjsao2k4@gmail.com | Hotline: 0965 491 328
            </div>
        </div>
    </body>
    </html>
    `;

    // 3. Cấu hình chi tiết thư gửi đi
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM || 'Khảm Hoa Store'}" <${process.env.EMAIL_USERNAME}>`,
        to: email,
        subject: subject,
        html: htmlContent
    };

    // 4. Thực thi hành động gửi thư
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
