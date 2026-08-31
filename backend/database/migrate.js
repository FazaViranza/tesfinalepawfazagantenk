const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

async function runMigration() {
  console.log('🚀 Memulai proses migrasi dan seeding database UMKM.AI...');

  // Step 1: Check / Create Database if not exists
  const dbName = config.db.database;
  const adminClient = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres', // default postgres maintenance db
  });

  try {
    await adminClient.connect();
    const checkDbRes = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`📦 Database "${dbName}" belum ada. Membuat database baru...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" berhasil dibuat!`);
    } else {
      console.log(`ℹ️ Database "${dbName}" sudah ada.`);
    }
  } catch (err) {
    console.warn(`⚠️ Catatan pembuatan database: ${err.message}. Mencoba langsung koneksi...`);
  } finally {
    try {
      await adminClient.end();
    } catch (_) {}
  }

  // Step 2: Connect to the target database
  const targetPool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: dbName,
  });

  try {
    const client = await targetPool.connect();
    console.log('🔗 Berhasil terhubung ke database target.');

    // Execute schema.sql
    console.log('📄 Mengeksekusi database/schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ Schema tabel berhasil dibuat!');

    // Execute seeds.sql
    console.log('🌱 Mengeksekusi database/seeds.sql...');
    const seedsSql = fs.readFileSync(path.join(__dirname, 'seeds.sql'), 'utf-8');
    await client.query(seedsSql);
    console.log('✅ Master data (kategori, produk, user, pelanggan, insights) berhasil dimasukkan!');

    // Step 3: Generate realistic historical transactions over the past 30 days
    const txCountRes = await client.query('SELECT COUNT(*) FROM transactions');
    const existingTxCount = parseInt(txCountRes.rows[0].count, 10);

    if (existingTxCount === 0) {
      console.log('📊 Membuat data transaksi historis 30 hari terakhir untuk model AI...');
      
      const productsRes = await client.query('SELECT id, name, price, cost_price FROM products');
      const products = productsRes.rows;
      const customersRes = await client.query('SELECT id FROM customers');
      const customerIds = customersRes.rows.map(c => c.id);
      const paymentMethods = ['cash', 'qris', 'transfer', 'debit'];

      const now = new Date();
      let invoiceSeq = 1;

      // Generate 60 transactions across past 30 days
      for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
        const txDate = new Date(now);
        txDate.setDate(now.getDate() - dayOffset);

        // More transactions on weekends (Saturday/Sunday) to simulate realistic retail patterns
        const dayOfWeek = txDate.getDay();
        const numTransactionsToday = (dayOfWeek === 0 || dayOfWeek === 6) ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < numTransactionsToday; i++) {
          const hours = Math.floor(Math.random() * 12) + 9; // 09:00 - 21:00
          const minutes = Math.floor(Math.random() * 60);
          txDate.setHours(hours, minutes, 0, 0);

          const invoiceNo = `INV-${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, '0')}${String(txDate.getDate()).padStart(2, '0')}-${String(invoiceSeq++).padStart(4, '0')}`;
          const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

          // Select 1 to 4 random products for this transaction
          const itemCount = Math.floor(Math.random() * 3) + 1;
          const shuffled = [...products].sort(() => 0.5 - Math.random());
          const selectedProducts = shuffled.slice(0, itemCount);

          let totalAmount = 0;
          const itemsData = [];

          for (const prod of selectedProducts) {
            const qty = Math.floor(Math.random() * 2) + 1;
            const unitPrice = parseFloat(prod.price);
            const costPrice = parseFloat(prod.cost_price);
            const subtotal = unitPrice * qty;
            totalAmount += subtotal;

            itemsData.push({
              productId: prod.id,
              productName: prod.name,
              quantity: qty,
              unitPrice,
              costPrice,
              subtotal,
            });
          }

          const discountAmount = totalAmount > 100000 ? 5000 : 0;
          const finalAmount = totalAmount - discountAmount;
          const paidAmount = paymentMethod === 'cash' ? Math.ceil(finalAmount / 10000) * 10000 : finalAmount;
          const changeAmount = paidAmount - finalAmount;

          const txInsertRes = await client.query(
            `INSERT INTO transactions 
              (invoice_no, user_id, customer_id, total_amount, discount_amount, tax_amount, final_amount, paid_amount, change_amount, payment_method, status, notes, created_at)
             VALUES ($1, $2, $3, $4, $5, 0, $6, $7, $8, $9, 'completed', 'Transaksi otomatis demo', $10)
             RETURNING id`,
            [invoiceNo, 1, customerId, totalAmount, discountAmount, finalAmount, paidAmount, changeAmount, paymentMethod, txDate]
          );

          const newTxId = txInsertRes.rows[0].id;

          for (const item of itemsData) {
            await client.query(
              `INSERT INTO transaction_details 
                (transaction_id, product_id, product_name, quantity, unit_price, cost_price, subtotal)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [newTxId, item.productId, item.productName, item.quantity, item.unitPrice, item.costPrice, item.subtotal]
            );
          }
        }
      }
      console.log(`✅ Sukses men-generate ${invoiceSeq - 1} transaksi historis!`);
    } else {
      console.log(`ℹ️ Sudah terdapat ${existingTxCount} data transaksi di database.`);
    }

    client.release();
    console.log('🎉 Migrasi & Seeding Selesai dengan Sukses!');
  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err.message);
  } finally {
    await targetPool.end();
  }
}

runMigration();
