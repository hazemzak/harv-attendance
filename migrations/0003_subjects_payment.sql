-- Subject preferences (comma-joined slugs) + payment method, so a clerk
-- "processing" a pending registration records how the registration+first-class
-- fee was paid (cash / instapay / vodafone_cash) before the student's QR
-- is allowed to grant entry at /scan.
ALTER TABLE students ADD COLUMN subjects TEXT;
ALTER TABLE students ADD COLUMN payment_method TEXT;
