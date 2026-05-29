require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Initialize Socket.IO live chat module
const { initSocket } = require('./src/socket/index');
initSocket(server);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`❌ Lỗi nghiêm trọng: ${err.message}`);
    // Trong môi trường dev, chúng ta không nên exit(1) để dễ debug
    // server.close(() => process.exit(1));
});
