const express = require('express');
const cors = require('cors');

const config = require('./config/env');
const { testConnection } = require('./config/db');
const { errorHandler } = require('./middleware/error.middleware');

// Routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const transactionRoutes = require('./routes/transaction.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// Middleware
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(config.port, async () => {
  console.log('\n🚀 ===================================');
  console.log('   UMKM.AI Backend Server Started');
  console.log('===================================');
  console.log(`🌐 Server    : http://localhost:${config.port}`);
  console.log(`🖥️  Frontend  : ${config.frontendUrl}`);
  console.log(`🤖 AI Engine : Local Analytic + ${config.geminiApiKey ? 'Gemini API ✅' : 'Gemini API ❌ (using local fallback)'}`);
  console.log('===================================\n');

  await testConnection();
});
