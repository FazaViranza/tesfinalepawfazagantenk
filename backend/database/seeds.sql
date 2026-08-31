-- ===================================================
-- SEEDS DATA: UMKM.AI
-- Data Awal Realistis untuk UMKM F&B / Coffee & Bakery
-- ===================================================

-- 1. Insert Categories
INSERT INTO categories (id, name, description, icon) VALUES
(1, 'Kopi & Minuman', 'Aneka olahan kopi espresso, manual brew, dan minuman segar kekinian', 'Coffee'),
(2, 'Makanan & Camilan', 'Menu makanan utama, pasta, dan camilan gurih pendamping kopi', 'Utensils'),
(3, 'Roti & Pastry', 'Fresh baked bakery, croissant, dan roti bakar aneka rasa', 'Croissant'),
(4, 'Biji Kopi & Merch', 'Roasted beans single origin dan tumbler official UMKM', 'Package')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users (Password: 'admin123' hashed with bcrypt)
INSERT INTO users (id, name, email, password, role, phone) VALUES
(1, 'Budi Santoso (Owner)', 'owner@umkm-ai.id', '$2b$10$Dt4ICw76xqOKmI5zVcO61.UUmSlWlbQ2fe4wcgHo8n75oWkIIk/7e', 'admin', '081234567890'),
(2, 'Siti Rahma (Kasir)', 'kasir@umkm-ai.id', '$2b$10$Dt4ICw76xqOKmI5zVcO61.UUmSlWlbQ2fe4wcgHo8n75oWkIIk/7e', 'cashier', '082198765432')
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password;

-- 3. Insert Products
INSERT INTO products (id, category_id, name, sku, price, cost_price, stock, min_stock, unit, image_url, description) VALUES
(1, 1, 'Kopi Susu Gula Aren', 'DRK-001', 18000, 7500, 45, 10, 'cup', 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=60', 'Espresso double shot dengan susu segar dan sirup gula aren murni.'),
(2, 1, 'Caffe Latte Double Shot', 'DRK-002', 22000, 9000, 30, 8, 'cup', 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=60', 'Kombinasi espresso aromatik dan microfoam susu lembut.'),
(3, 1, 'Matcha Green Tea Latte', 'DRK-003', 24000, 11000, 25, 5, 'cup', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60', 'Pure Uji matcha powder jepang dipadu dengan steamed milk.'),
(4, 1, 'Earl Grey Milk Tea', 'DRK-004', 20000, 8000, 18, 5, 'cup', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60', 'Teh earl grey beraroma citrus bergamot dengan susu manis.'),
(5, 1, 'Americano Iced', 'DRK-005', 16000, 5000, 50, 10, 'cup', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60', 'Espresso klasik disajikan dingin dengan es batu segar.'),

(6, 2, 'Mie Goreng Spesial UMKM', 'FOD-001', 25000, 12000, 20, 5, 'porsi', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60', 'Mie telur kenyal dengan bumbu rempah khas, telur mata sapi, dan sosis.'),
(7, 2, 'Rice Bowl Chicken Teriyaki', 'FOD-002', 28000, 14000, 15, 5, 'porsi', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60', 'Nasi pulen hangat dengan potongan ayam saus teriyaki gurih manis.'),
(8, 2, 'Kentang Goreng Truffle (French Fries)', 'SNK-001', 18000, 7000, 35, 8, 'porsi', 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60', 'Kentang goreng renyah dengan taburan garam laut dan aroma minyak truffle.'),
(9, 2, 'Platter Snack Gurih (Mix)', 'SNK-002', 32000, 15000, 12, 4, 'porsi', 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=60', 'Kombinasi sosis bratwurst, nugget ayam, dan french fries.'),

(10, 3, 'Butter Croissant Premium', 'BKY-001', 18000, 8000, 14, 5, 'pcs', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60', 'Pastry khas Perancis berlapis-lapis dengan aroma butter New Zealand.'),
(11, 3, 'Pain Au Chocolat', 'BKY-002', 22000, 9500, 8, 5, 'pcs', 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=500&auto=format&fit=crop&q=60', 'Croissant lezat berisi lelehan cokelat Belgian dark chocolate.'),
(12, 3, 'Roti Bakar Keju Cokelat', 'BKY-003', 20000, 8500, 22, 5, 'porsi', 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&auto=format&fit=crop&q=60', 'Roti tebal panggang dengan keju cheddar parut melimpah dan susu cokelat.'),
(13, 3, 'Cinnamon Roll', 'BKY-004', 19000, 7500, 3, 5, 'pcs', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60', 'Roti gulung beraroma kayu manis dengan cream cheese glaze.'),

(14, 4, 'Biji Kopi Arabika Gayo 250g', 'BN-001', 75000, 42000, 10, 3, 'pack', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60', 'Single origin Aceh Gayo medium roast dengan notes fruity & floral.'),
(15, 4, 'Tumbler Stainless UMKM.AI 500ml', 'MRC-001', 95000, 50000, 6, 2, 'pcs', 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=60', 'Tumbler termos tahan panas dan dingin hingga 12 jam.')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Customers
INSERT INTO customers (id, name, email, phone, address, member_tier, total_spent, total_orders) VALUES
(1, 'Andi Wijaya', 'andi.wijaya@gmail.com', '081122334455', 'Jl. Merdeka No. 10, Bandung', 'Gold', 450000, 12),
(2, 'Dewi Lestari', 'dewi.lestari@yahoo.com', '081299887766', 'Jl. Riau No. 45, Bandung', 'Silver', 280000, 8),
(3, 'Rian Pratama', 'rian.pratama@gmail.com', '081377665544', 'Jl. Dago Atas No. 12, Bandung', 'Platinum', 820000, 22),
(4, 'Maya Anggraini', 'maya.anggraini@outlook.com', '081544332211', 'Jl. Buah Batu No. 88, Bandung', 'Regular', 95000, 3),
(5, 'Fajar Ramadhan', 'fajar.ramadhan@gmail.com', '081788990011', 'Jl. Setiabudi No. 105, Bandung', 'Silver', 310000, 9),
(6, 'Customer Umum (Walk-in)', 'walkin@umkm-ai.id', '080000000000', 'Toko Langsung', 'Regular', 1450000, 40)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence tables
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- 5. Insert Sample AI Insights
INSERT INTO ai_insights (type, title, summary, details, score) VALUES
('demand_prediction', 'Lonjakan Permintaan Akhir Pekan Diprediksi Naik 28%', 'Berdasarkan tren 4 pekan terakhir, penjualan Kopi Susu Gula Aren dan Croissant meningkat signifikan setiap Sabtu & Minggu.', '{"target_products": ["Kopi Susu Gula Aren", "Butter Croissant Premium"], "expected_increase_pct": 28.5, "recommended_action": "Tingkatkan stok bahan baku susu segar 15 liter dan adonan croissant 20 pcs sebelum Jumat sore."}', 92.5),
('product_recommendation', 'Peluang Bundling: Kopi Susu + Pain Au Chocolat (Confidence 76%)', 'Sebanyak 76% pelanggan yang membeli Kopi Susu Gula Aren juga memesan varian Pastry cokelat.', '{"pair": ["Kopi Susu Gula Aren", "Pain Au Chocolat"], "bundle_name": "Paket Manis Sore", "bundle_price": 36000, "normal_price": 40000, "estimated_profit_margin_pct": 48}', 88.0),
('stock_alert', 'Peringatan Stok Rendah: Cinnamon Roll Tersisa 3 pcs', 'Stok Cinnamon Roll (3 pcs) berada di bawah batas minimum (5 pcs). Kecepatan penjualan rata-rata 4 pcs/hari.', '{"product_id": 13, "current_stock": 3, "min_stock": 5, "days_until_out": 0.75, "restock_qty": 15}', 95.0),
('business_summary', 'Kinerja Penjualan Bulan Ini: Margin Laba Kotor Sehat di 56.4%', 'Total pendapatan bulan berjalan stabil dengan produk kategori Kopi menyumbang 58% dari total omset.', '{"gross_margin_pct": 56.4, "top_category": "Kopi & Minuman", "slow_moving_alert": "Tumbler Stainless UMKM.AI memiliki perputaran lambat (>25 hari)."}', 85.0);
