const fs = require('fs');
const path = require('path');
const { Client, Pool } = require('pg');
const config = require('../config/env');

const schemaPath = path.join(__dirname, 'schema.sql');
const seedsPath = path.join(__dirname, 'seeds.sql');

async function createDatabaseIfNeeded() {
  const dbName = config.db.database;
  const adminClient = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: 'postgres',
  });

  try {
    await adminClient.connect();

    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (result.rowCount === 0) {
      console.log(`📦 Database "${dbName}" belum ada. Membuat database...`);
      await adminClient.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
      console.log(`✅ Database "${dbName}" berhasil dibuat.`);
    } else {
      console.log(`ℹ️ Database "${dbName}" sudah ada.`);
    }
  } finally {
    await adminClient.end().catch(() => {});
  }
}

async function runMigration() {
  console.log('🚀 Memulai migrasi database UMKM.AI...');

  await createDatabaseIfNeeded();

  const pool = new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('📄 Mengeksekusi schema.sql...');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schemaSql);
    console.log('✅ Schema berhasil diterapkan.');

    console.log('🌱 Mengeksekusi seeds.sql...');
    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    await client.query(seedsSql);
    console.log('✅ Seed data berhasil diterapkan.');

    await client.query('COMMIT');
    console.log('🎉 Migrasi & seeding UMKM.AI selesai.');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Migrasi gagal:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(() => {
  process.exitCode = 1;
});
