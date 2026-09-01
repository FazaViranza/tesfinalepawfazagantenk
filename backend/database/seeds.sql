-- ===================================================
-- SEEDS DATA: UMKM.AI
-- Studi Kasus: Warung Madura
-- ===================================================

-- ===================================================
-- 1. CATEGORIES
-- ===================================================

INSERT INTO categories (id, name, description, icon) VALUES
(1, 'Rokok', 'Berbagai jenis rokok yang tersedia di warung', 'Cigarette'),
(2, 'Minuman', 'Air mineral, teh, kopi, dan minuman kemasan', 'Coffee'),
(3, 'Cemilan', 'Aneka makanan ringan dan jajanan kemasan', 'Cookie'),
(4, 'Mie Instan', 'Berbagai varian mie instan', 'Utensils'),
(5, 'Sembako', 'Kebutuhan pokok sehari-hari', 'ShoppingBasket'),
(6, 'Kebutuhan Rumah Tangga', 'Produk kebutuhan rumah tangga sehari-hari', 'Home')
ON CONFLICT (id) DO NOTHING;


-- ===================================================
-- 2. USERS
-- Password semua akun: admin123
-- ===================================================

INSERT INTO users (id, name, email, password, role, phone) VALUES
(
    1,
    'Budi Santoso',
    'owner@umkm-ai.id',
    '$2b$10$Dt4ICw76xqOKmI5zVcO61.UUmSlWlbQ2fe4wcgHo8n75oWkIIk/7e',
    'owner',
    '081234567890'
),
(
    2,
    'Siti Rahma',
    'kasir@umkm-ai.id',
    '$2b$10$Dt4ICw76xqOKmI5zVcO61.UUmSlWlbQ2fe4wcgHo8n75oWkIIk/7e',
    'cashier',
    '082198765432'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;


-- ===================================================
-- 3. PRODUCTS
-- ===================================================

INSERT INTO products
(id, category_id, name, sku, price, cost_price, stock, min_stock, unit, image_url, description)
VALUES

-- ROKOK
(1, 1, 'Sampoerna Mild', 'RKK-001', 32000, 28500, 45, 10, 'bungkus', NULL,
 'Rokok kretek mild 16 batang.'),

(2, 1, 'Djarum Super', 'RKK-002', 30000, 26500, 35, 10, 'bungkus', NULL,
 'Rokok kretek 16 batang.'),

(3, 1, 'Gudang Garam Surya', 'RKK-003', 30000, 26500, 28, 8, 'bungkus', NULL,
 'Rokok kretek filter.'),

(4, 1, 'LA Bold', 'RKK-004', 28000, 24500, 25, 8, 'bungkus', NULL,
 'Rokok kretek bold.'),

-- MINUMAN
(5, 2, 'Aqua 600ml', 'MNM-001', 4000, 2500, 80, 20, 'botol', NULL,
 'Air mineral kemasan 600ml.'),

(6, 2, 'Teh Botol Sosro', 'MNM-002', 5000, 3200, 65, 15, 'botol', NULL,
 'Minuman teh kemasan.'),

(7, 2, 'Pocari Sweat 350ml', 'MNM-003', 7000, 4800, 40, 10, 'botol', NULL,
 'Minuman isotonik.'),

(8, 2, 'Kopi ABC Susu', 'MNM-004', 2500, 1500, 70, 15, 'sachet', NULL,
 'Kopi instan sachet.'),

(9, 2, 'Indomilk Cokelat', 'MNM-005', 6000, 4000, 35, 10, 'kotak', NULL,
 'Susu cokelat kemasan.'),

-- CEMILAN
(10, 3, 'Chitato Original', 'CMN-001', 11000, 8000, 30, 8, 'pcs', NULL,
 'Keripik kentang rasa original.'),

(11, 3, 'Beng-Beng', 'CMN-002', 2500, 1700, 60, 15, 'pcs', NULL,
 'Cokelat wafer isi karamel.'),

(12, 3, 'Taro Net', 'CMN-003', 2500, 1700, 50, 15, 'pcs', NULL,
 'Snack ringan rasa rumput laut.'),

(13, 3, 'SilverQueen Mini', 'CMN-004', 8000, 6000, 25, 7, 'pcs', NULL,
 'Cokelat batangan ukuran mini.'),

-- MIE INSTAN
(14, 4, 'Indomie Goreng', 'MIE-001', 3500, 2500, 90, 20, 'pcs', NULL,
 'Mie instan goreng.'),

(15, 4, 'Indomie Soto', 'MIE-002', 3500, 2500, 70, 15, 'pcs', NULL,
 'Mie instan rasa soto.'),

(16, 4, 'Indomie Kari Ayam', 'MIE-003', 3500, 2500, 55, 15, 'pcs', NULL,
 'Mie instan rasa kari ayam.'),

(17, 4, 'Mie Sedaap Goreng', 'MIE-004', 3500, 2500, 60, 15, 'pcs', NULL,
 'Mie instan goreng.'),

-- SEMBAKO
(18, 5, 'Beras Ramos 5kg', 'SMB-001', 75000, 68000, 15, 5, 'karung', NULL,
 'Beras premium kemasan 5kg.'),

(19, 5, 'Minyak Goreng 1L', 'SMB-002', 18000, 15500, 25, 7, 'botol', NULL,
 'Minyak goreng kemasan 1 liter.'),

(20, 5, 'Gula Pasir 1kg', 'SMB-003', 18000, 15500, 20, 6, 'kg', NULL,
 'Gula pasir kemasan 1 kilogram.'),

(21, 5, 'Telur Ayam 1kg', 'SMB-004', 29000, 26000, 12, 5, 'kg', NULL,
 'Telur ayam ras per kilogram.'),

-- KEBUTUHAN RUMAH TANGGA
(22, 6, 'Sabun Mandi Lifebuoy', 'RTG-001', 4500, 3200, 30, 8, 'pcs', NULL,
 'Sabun mandi batang.'),

(23, 6, 'Pasta Gigi Pepsodent', 'RTG-002', 12000, 9000, 18, 5, 'pcs', NULL,
 'Pasta gigi ukuran standar.'),

(24, 6, 'Deterjen Rinso 800g', 'RTG-003', 18000, 14000, 15, 5, 'pcs', NULL,
 'Deterjen pakaian kemasan 800 gram.'),

(25, 6, 'Sabun Cuci Piring Sunlight', 'RTG-004', 8000, 6000, 20, 5, 'botol', NULL,
 'Sabun pencuci piring.'),

(26, 6, 'Tissue Paseo', 'RTG-005', 10000, 7500, 15, 5, 'pack', NULL,
 'Tissue rumah tangga.')

ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku,
    price = EXCLUDED.price,
    cost_price = EXCLUDED.cost_price,
    stock = EXCLUDED.stock,
    min_stock = EXCLUDED.min_stock,
    unit = EXCLUDED.unit,
    image_url = EXCLUDED.image_url,
    description = EXCLUDED.description;


-- 
-- ===================================================
-- 5. RESET SEQUENCES
-- ===================================================

SELECT setval(
    'categories_id_seq',
    COALESCE((SELECT MAX(id) FROM categories), 1)
);

SELECT setval(
    'users_id_seq',
    COALESCE((SELECT MAX(id) FROM users), 1)
);

SELECT setval(
    'products_id_seq',
    COALESCE((SELECT MAX(id) FROM products), 1)
);




-- ===================================================
-- 6. SAMPLE TRANSACTIONS
-- Generate transaksi historis 30 hari
-- ===================================================

DO $$
DECLARE
    i INTEGER;
    tx_id INTEGER;
    selected_user INTEGER;
    selected_product INTEGER;
    qty INTEGER;
    unit_price NUMERIC;
    item_subtotal NUMERIC;
    total NUMERIC;
    paid NUMERIC;
    tx_date TIMESTAMP;
BEGIN

    -- Buat 120 transaksi historis
    FOR i IN 1..120 LOOP

        selected_user := 2;


        tx_date :=
            NOW()
            - (FLOOR(random() * 30)::INTEGER || ' days')::INTERVAL
            - (FLOOR(random() * 12)::INTEGER || ' hours')::INTERVAL;

        total := 0;

        INSERT INTO transactions (
            invoice_no,
            user_id,
            total_amount,
            discount_amount,
            tax_amount,
            final_amount,
            paid_amount,
            change_amount,
            payment_method,
            status,
            created_at
        )
        VALUES (
            'SEED-' ||
            TO_CHAR(tx_date, 'YYYYMMDD') ||
            '-' ||
            LPAD(i::TEXT, 4, '0'),

            selected_user,
            0,
            0,
            0,
            0,
            0,
            0,

            CASE
                WHEN random() < 0.65 THEN 'cash'
                WHEN random() < 0.85 THEN 'qris'
                ELSE 'transfer'
            END,

            'completed',
            tx_date
        )
        RETURNING id INTO tx_id;


        -- Item pertama
        selected_product :=
            FLOOR(random() * 26 + 1)::INTEGER;

        qty :=
            CASE
                WHEN selected_product IN (1,2,3,4,18,19,20,21)
                    THEN FLOOR(random() * 2 + 1)::INTEGER
                ELSE
                    FLOOR(random() * 4 + 1)::INTEGER
            END;

        SELECT price
        INTO unit_price
        FROM products
        WHERE id = selected_product;

        item_subtotal := unit_price * qty;
        total := total + item_subtotal;

        INSERT INTO transaction_details (
            transaction_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            cost_price,
            subtotal
        )
        SELECT
            tx_id,
            id,
            name,
            qty,
            price,
            cost_price,
            item_subtotal
        FROM products
        WHERE id = selected_product;


        -- Item kedua, sekitar 70% transaksi
        IF random() < 0.70 THEN

            selected_product :=
                FLOOR(random() * 26 + 1)::INTEGER;

            qty :=
                CASE
                    WHEN selected_product IN (1,2,3,4,18,19,20,21)
                        THEN 1
                    ELSE
                        FLOOR(random() * 3 + 1)::INTEGER
                END;

            SELECT price
            INTO unit_price
            FROM products
            WHERE id = selected_product;

            item_subtotal := unit_price * qty;
            total := total + item_subtotal;

            INSERT INTO transaction_details (
                transaction_id,
                product_id,
                product_name,
                quantity,
                unit_price,
                cost_price,
                subtotal
            )
            SELECT
                tx_id,
                id,
                name,
                qty,
                price,
                cost_price,
                item_subtotal
            FROM products
            WHERE id = selected_product;

        END IF;


        -- Item ketiga, sekitar 30% transaksi
        IF random() < 0.30 THEN

            selected_product :=
                FLOOR(random() * 26 + 1)::INTEGER;

            qty := FLOOR(random() * 2 + 1)::INTEGER;

            SELECT price
            INTO unit_price
            FROM products
            WHERE id = selected_product;

            item_subtotal := unit_price * qty;
            total := total + item_subtotal;

            INSERT INTO transaction_details (
                transaction_id,
                product_id,
                product_name,
                quantity,
                unit_price,
                cost_price,
                subtotal
            )
            SELECT
                tx_id,
                id,
                name,
                qty,
                price,
                cost_price,
                item_subtotal
            FROM products
            WHERE id = selected_product;

        END IF;


        -- Pembayaran
        paid :=
            CEIL(total / 5000) * 5000;

        UPDATE transactions
        SET
            total_amount = total,
            discount_amount = 0,
            tax_amount = 0,
            final_amount = total,
            paid_amount = paid,
            change_amount = paid - total
        WHERE id = tx_id;

    END LOOP;
END $$;


-- ===================================================
-- 7. SAMPLE AI INSIGHTS
-- ===================================================

INSERT INTO ai_insights
(type, title, summary, details, score)
VALUES

(
    'demand_prediction',
    'Prediksi Permintaan Produk Akhir Pekan',
    'Beberapa produk kebutuhan harian diperkirakan mengalami peningkatan permintaan pada akhir pekan.',
    '{
        "recommended_action": "Pastikan stok minuman, mie instan, rokok, dan cemilan mencukupi sebelum akhir pekan."
    }',
    90
),

(
    'stock_alert',
    'Beberapa Produk Mendekati Stok Minimum',
    'Sistem mendeteksi beberapa produk yang stoknya berada di sekitar batas minimum.',
    '{
        "recommended_action": "Periksa kebutuhan restock berdasarkan prediksi penjualan."
    }',
    88
),

(
    'business_summary',
    'Kategori Produk dengan Kontribusi Penjualan Tinggi',
    'Data transaksi digunakan untuk menganalisis kategori produk yang memberikan kontribusi terbesar terhadap pendapatan.',
    '{
        "recommended_action": "Pertahankan ketersediaan produk dengan penjualan tinggi."
    }',
    85
)

ON CONFLICT DO NOTHING;


-- ===================================================
-- 8. FINAL SEQUENCE RESET
-- ===================================================

SELECT setval(
    'transactions_id_seq',
    COALESCE((SELECT MAX(id) FROM transactions), 1)
);

SELECT setval(
    'transaction_details_id_seq',
    COALESCE((SELECT MAX(id) FROM transaction_details), 1)
);

SELECT setval(
    'ai_insights_id_seq',
    COALESCE((SELECT MAX(id) FROM ai_insights), 1)
);