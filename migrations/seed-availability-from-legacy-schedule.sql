INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'sayed' AS teacher_id, 'wed' AS day_of_week, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'sayed');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'salah' AS teacher_id, 'sun' AS day_of_week, '13:00' AS start_time, '14:30' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'salah');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'milad-mourad' AS teacher_id, 'sun' AS day_of_week, '14:00' AS start_time, '16:30' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'milad-mourad');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'tolba' AS teacher_id, 'tue' AS day_of_week, '18:00' AS start_time, '21:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'tolba');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'abdallah-ismail' AS teacher_id, 'mon' AS day_of_week, '19:00' AS start_time, '21:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'abdallah-ismail');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'gioushy' AS teacher_id, 'fri' AS day_of_week, '14:00' AS start_time, '17:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'gioushy');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'ahmed-abdelmonem' AS teacher_id, 'sat' AS day_of_week, '10:00' AS start_time, '13:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'ahmed-abdelmonem');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'tarek' AS teacher_id, 'tue' AS day_of_week, '14:00' AS start_time, '17:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'tarek');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'khaled-sabry' AS teacher_id, 'fri' AS day_of_week, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'khaled-sabry');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'biology' AS teacher_id, 'thu' AS day_of_week, '09:00' AS start_time, '12:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'biology');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'biology-biology' AS teacher_id, 'wed' AS day_of_week, '16:00' AS start_time, '18:30' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'biology-biology');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'magd' AS teacher_id, 'mon' AS day_of_week, '15:00' AS start_time, '17:00' AS end_time, NULL AS room_id
    UNION ALL
    SELECT 'magd' AS teacher_id, 'wed' AS day_of_week, '15:00' AS start_time, '17:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'magd');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'sabry' AS teacher_id, 'sun' AS day_of_week, '15:00' AS start_time, '17:30' AS end_time, NULL AS room_id
    UNION ALL
    SELECT 'sabry' AS teacher_id, 'thu' AS day_of_week, '15:30' AS start_time, '17:30' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'sabry');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'ezzat' AS teacher_id, 'sat' AS day_of_week, '13:30' AS start_time, '19:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'ezzat');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'mohamed-naguib' AS teacher_id, 'mon' AS day_of_week, '16:00' AS start_time, '18:00' AS end_time, NULL AS room_id
    UNION ALL
    SELECT 'mohamed-naguib' AS teacher_id, 'thu' AS day_of_week, '16:00' AS start_time, '18:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'mohamed-naguib');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'kamal-el-marakbi' AS teacher_id, 'thu' AS day_of_week, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'kamal-el-marakbi');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'programming-programming' AS teacher_id, 'thu' AS day_of_week, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'programming-programming');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'haitham' AS teacher_id, 'fri' AS day_of_week, '19:00' AS start_time, '21:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'haitham');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'ahmed-tolba' AS teacher_id, 'fri' AS day_of_week, '19:00' AS start_time, '21:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'ahmed-tolba');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'ali-salah' AS teacher_id, 'fri' AS day_of_week, '18:30' AS start_time, '20:30' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'ali-salah');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'geology' AS teacher_id, 'wed' AS day_of_week, '13:00' AS start_time, '16:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'geology');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'geography' AS teacher_id, 'sun' AS day_of_week, '17:00' AS start_time, '19:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'geography');

INSERT INTO teacher_availability (teacher_id, day_of_week, start_time, end_time, room_id)
SELECT * FROM (
    SELECT 'geography-geography' AS teacher_id, 'sat' AS day_of_week, '16:00' AS start_time, '18:00' AS end_time, NULL AS room_id
)
WHERE NOT EXISTS (SELECT 1 FROM teacher_availability WHERE teacher_id = 'geography-geography');
