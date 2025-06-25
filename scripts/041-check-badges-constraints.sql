-- Cek constraint yang ada di badges table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'badges'::regclass 
AND contype = 'c';

-- Cek data yang ada di badges table
SELECT requirement_type, COUNT(*) 
FROM badges 
GROUP BY requirement_type;

-- Insert sample badges HANYA dengan requirement_type yang VALID
-- Kita cek dulu apa yang valid, baru insert
