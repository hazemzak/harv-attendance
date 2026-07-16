INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'sayed' AS teacher_id, 'أ/ السيد عبدالعزيز' AS teacher_name, 'arabic' AS subject, 'wed' AS day, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'sayed');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'salah' AS teacher_id, 'أ/ محمد صلاح' AS teacher_name, 'english' AS subject, 'sun' AS day, '13:00' AS start_time, '14:30' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'salah');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'milad-mourad' AS teacher_id, 'أ/ ميلاد مراد' AS teacher_name, 'english' AS subject, 'sun' AS day, '14:00' AS start_time, '16:30' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'milad-mourad');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'tolba' AS teacher_id, 'محمد طلبه' AS teacher_name, 'history' AS subject, 'tue' AS day, '18:00' AS start_time, '21:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'tolba');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'abdallah-ismail' AS teacher_id, 'عبدالله اسماعيل' AS teacher_name, 'history' AS subject, 'mon' AS day, '19:00' AS start_time, '21:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'abdallah-ismail');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'gioushy' AS teacher_id, 'محمد الجيوشي' AS teacher_name, 'physics' AS subject, 'fri' AS day, '14:00' AS start_time, '17:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'gioushy');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'ahmed-abdelmonem' AS teacher_id, 'احمد عبدالمنعم' AS teacher_name, 'physics' AS subject, 'sat' AS day, '10:00' AS start_time, '13:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'ahmed-abdelmonem');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'tarek' AS teacher_id, 'طارق عصام' AS teacher_name, 'chemistry' AS subject, 'tue' AS day, '14:00' AS start_time, '17:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'tarek');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'khaled-sabry' AS teacher_id, 'خالد صبري' AS teacher_name, 'chemistry' AS subject, 'fri' AS day, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'khaled-sabry');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'biology' AS teacher_id, 'علي الروبي' AS teacher_name, 'biology' AS subject, 'thu' AS day, '09:00' AS start_time, '12:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'biology');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'biology-biology' AS teacher_id, 'د/ جميلة' AS teacher_name, 'biology' AS subject, 'wed' AS day, '16:00' AS start_time, '18:30' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'biology-biology');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'magd' AS teacher_id, 'محمد مجد' AS teacher_name, 'math' AS subject, 'mon' AS day, '15:00' AS start_time, '17:00' AS end_time, NULL AS room_id, 1 AS active, 'magd-series' AS series_key
    UNION ALL
    SELECT 'magd' AS teacher_id, 'محمد مجد' AS teacher_name, 'math' AS subject, 'wed' AS day, '15:00' AS start_time, '17:00' AS end_time, NULL AS room_id, 1 AS active, 'magd-series' AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'magd');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'sabry' AS teacher_id, 'محمد صبري' AS teacher_name, 'math' AS subject, 'sun' AS day, '15:00' AS start_time, '17:30' AS end_time, NULL AS room_id, 1 AS active, 'sabry-series' AS series_key
    UNION ALL
    SELECT 'sabry' AS teacher_id, 'محمد صبري' AS teacher_name, 'math' AS subject, 'thu' AS day, '15:30' AS start_time, '17:30' AS end_time, NULL AS room_id, 1 AS active, 'sabry-series' AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'sabry');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'ezzat' AS teacher_id, 'محمد عزت' AS teacher_name, 'math' AS subject, 'sat' AS day, '13:30' AS start_time, '19:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'ezzat');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'mohamed-naguib' AS teacher_id, 'محمد نجيب' AS teacher_name, 'math' AS subject, 'mon' AS day, '16:00' AS start_time, '18:00' AS end_time, NULL AS room_id, 1 AS active, 'mohamed-naguib-series' AS series_key
    UNION ALL
    SELECT 'mohamed-naguib' AS teacher_id, 'محمد نجيب' AS teacher_name, 'math' AS subject, 'thu' AS day, '16:00' AS start_time, '18:00' AS end_time, NULL AS room_id, 1 AS active, 'mohamed-naguib-series' AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'mohamed-naguib');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'kamal-el-marakbi' AS teacher_id, 'كمال المراكبي' AS teacher_name, 'programming' AS subject, 'thu' AS day, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'kamal-el-marakbi');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'programming-programming' AS teacher_id, 'محمود عبدالحميد' AS teacher_name, 'programming' AS subject, 'thu' AS day, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'programming-programming');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'haitham' AS teacher_id, 'د/ هيثم عطيه' AS teacher_name, 'business' AS subject, 'fri' AS day, '19:00' AS start_time, '21:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'haitham');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'ahmed-tolba' AS teacher_id, 'د/ احمد طلبه' AS teacher_name, 'accounting' AS subject, 'fri' AS day, '19:00' AS start_time, '21:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'ahmed-tolba');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'ali-salah' AS teacher_id, 'علي صلاح' AS teacher_name, 'psychology' AS subject, 'fri' AS day, '18:30' AS start_time, '20:30' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'ali-salah');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'geology' AS teacher_id, 'سامح نشأت' AS teacher_name, 'geology' AS subject, 'wed' AS day, '13:00' AS start_time, '16:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'geology');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'geography' AS teacher_id, 'أحمد زهران' AS teacher_name, 'geography' AS subject, 'sun' AS day, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'geography');

INSERT INTO groups (teacher_id, teacher_name, subject, day, start_time, end_time, room_id, active, series_key)
SELECT * FROM (
    SELECT 'geography-geography' AS teacher_id, 'محمد الحلواني' AS teacher_name, 'geography' AS subject, 'sat' AS day, '16:00' AS start_time, '18:00' AS end_time, NULL AS room_id, 1 AS active, NULL AS series_key
)
WHERE NOT EXISTS (SELECT 1 FROM groups WHERE teacher_id = 'geography-geography');
