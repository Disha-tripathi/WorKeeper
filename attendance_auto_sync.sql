
-- ===========================
-- WorkKeeper Attendance Auto Sync
-- ===========================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 1: Create or Replace Function
CREATE OR REPLACE FUNCTION update_daily_attendance()
RETURNS void AS $$
BEGIN
  WITH punch_summary AS (
    SELECT
      "EmployeeId",
      DATE("PunchDateTime") AS "Date",
      "ShiftId",
      MIN(CASE WHEN "PunchType" = 'In' THEN "PunchDateTime" END) AS "InTime",
      MAX(CASE WHEN "PunchType" = 'Out' THEN "PunchDateTime" END) AS "OutTime",
      BOOL_OR("Source" = 'hr_manual') AS "IsManual",
      MAX(CASE WHEN "PunchType" = 'Out' THEN "Source" END) AS "EditedBy"
    FROM "AttendanceInLog"
    WHERE "Status" = 'valid'
    GROUP BY "EmployeeId", DATE("PunchDateTime"), "ShiftId"
  ),
  with_hours AS (
    SELECT
      ps.*,
      ROUND(EXTRACT(EPOCH FROM ("OutTime" - "InTime")) / 3600.0, 2) AS "TotalHours"
    FROM punch_summary ps
  ),
  with_shift AS (
    SELECT
      wh.*,
      s."StartTime",
      s."ExpectedHours",
      s."BreakDuration"
    FROM with_hours wh
    JOIN "Shifts" s ON wh."ShiftId" = s."Id"
  ),
  final_data AS (
    SELECT
      *,
      (CASE WHEN "InTime"::time > ("StartTime" + INTERVAL '15 minutes') THEN TRUE ELSE FALSE END) AS "IsLate",
      (CASE WHEN "TotalHours" < 4 THEN TRUE ELSE FALSE END) AS "IsHalfDay",
      (CASE WHEN "TotalHours" > ("ExpectedHours" + 0.5) THEN TRUE ELSE FALSE END) AS "IsOvertime"
    FROM with_shift
  )

  INSERT INTO "Attendance" (
    "EmployeeId", "Date", "ShiftId", "InTime", "OutTime", "Status", 
    "IsManual", "TotalHours", "CreatedAt", "EditedBy", "PunchStatus"
  )
  SELECT
    "EmployeeId",
    "Date",
    "ShiftId",
    "InTime",
    "OutTime",
    'Present',
    "IsManual",
    "TotalHours",
    NOW(),
    "EditedBy",
    CASE 
      WHEN "IsHalfDay" AND "IsLate" THEN 'HalfDay + Late'::punch_status
      WHEN "IsHalfDay" THEN 'HalfDay'::punch_status
      WHEN "IsLate" AND "IsOvertime" THEN 'Late + Overtime'::punch_status
      WHEN "IsLate" THEN 'Late'::punch_status
      WHEN "IsOvertime" THEN 'Overtime'::punch_status
      ELSE 'OnTime'::punch_status
    END
  FROM final_data
  ON CONFLICT ("EmployeeId", "Date") DO UPDATE
  SET
    "InTime" = EXCLUDED."InTime",
    "OutTime" = EXCLUDED."OutTime",
    "TotalHours" = EXCLUDED."TotalHours",
    "Status" = EXCLUDED."Status",
    "IsManual" = EXCLUDED."IsManual",
    "EditedBy" = EXCLUDED."EditedBy",
    "PunchStatus" = EXCLUDED."PunchStatus",
    "CreatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 2: Fill Absent/Holiday/Weekend
WITH all_days AS (
  SELECT 
    e."Id" AS "EmployeeId",
    d::date AS "Date"
  FROM 
    "Employee" e,
    generate_series(
      (SELECT MIN("PunchDateTime")::date FROM "AttendanceInLog"),
      CURRENT_DATE,
      interval '1 day'
    ) d
),
existing_attendance AS (
  SELECT "EmployeeId", "Date" FROM "Attendance"
)
INSERT INTO "Attendance" (
  "EmployeeId", "Date", "Status", "CreatedAt"
)
SELECT 
  ad."EmployeeId",
  ad."Date",
  CASE
    WHEN EXTRACT(ISODOW FROM ad."Date") IN (6,7) THEN 'Weekend'
    WHEN ad."Date" IN (SELECT "Date" FROM "Holiday") THEN 'Holiday'
    ELSE 'Absent'
  END AS "Status",
  NOW()
FROM all_days ad
LEFT JOIN existing_attendance ea ON ea."EmployeeId" = ad."EmployeeId" AND ea."Date" = ad."Date"
WHERE ea."EmployeeId" IS NULL;

-- Step 3: Schedule it using pg_cron (runs every day at 2 AM)
SELECT cron.schedule(
  'daily_attendance_sync',
  '0 2 * * *',
  $$ CALL update_daily_attendance(); $$
);
