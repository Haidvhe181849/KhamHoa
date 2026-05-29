const https = require('https');

/**
 * Gửi thông báo đến Telegram Admin
 * @param {string} message - Nội dung tin nhắn
 */
exports.sendTelegramMessage = (message) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId || !message || message.trim() === '') {
        return;
    }

    const data = JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${token}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = https.request(options, (res) => {
        res.on('data', () => {}); // Consuming response
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ Thông báo Telegram đã được gửi.');
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Lỗi gửi Telegram:', error.message);
    });

    req.write(data);
    req.end();
};
