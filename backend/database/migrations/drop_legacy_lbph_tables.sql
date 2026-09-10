-- ====================================================================
-- SAFE MIGRATION: DROP OBSOLETE LBPH & MULTI-IMAGE DATASET TABLES
-- ====================================================================
-- The Smart Attendance System now uses 128-D face recognition with
-- single reference image and encoding stored in the `face_data` table.
--
-- The following tables are no longer used by any backend service:
-- 1. `face_dataset`: Old 30-image binary crop storage for LBPH training.
-- 2. `recognition_models`: Old LBPH model binary weights & label mappings.
--
-- Run this script in MySQL Workbench, Aiven Console, or MySQL CLI:
-- ====================================================================

USE smart_attendance;

-- Drop obsolete LBPH model binary store
DROP TABLE IF EXISTS recognition_models;

-- Drop obsolete 30-image face dataset store
DROP TABLE IF EXISTS face_dataset;

-- Verify remaining active tables
SHOW TABLES;
-- Expected active tables:
-- 1. attendance
-- 2. face_data
-- 3. students
-- 4. system_settings
