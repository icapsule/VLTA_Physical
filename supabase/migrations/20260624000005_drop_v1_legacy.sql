-- Drop the view first because it depends on the tables
DROP VIEW IF EXISTS athlete_latest_results;

-- Drop V1 Training Plan Tables
DROP TABLE IF EXISTS plan_progress CASCADE;
DROP TABLE IF EXISTS plan_assignments CASCADE;
DROP TABLE IF EXISTS training_plans CASCADE;

-- Drop V1 Testing Tables
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS test_items CASCADE;
