-- Supabase SQL Editor: admin@sezondakirala.com artık site tarafında "admin" rolü taşımasın.
UPDATE kullanicilar SET rol = 'ziyaretci' WHERE email = 'admin@sezondakirala.com';
