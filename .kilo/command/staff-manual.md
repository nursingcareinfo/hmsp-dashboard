---
description: Manually edit staff details, change status, and verify data integrity
agent: frontend
subtask: true
---
Complete staff record management: view, edit, status change, and data verification.

Usage: /staff-manual <action> [arguments]

Actions:
  list [--status Active] [--designation "Nurse"]   List staff with optional filters
  show STAFF_ID                                   Show full staff record details
  edit STAFF_ID FIELD VALUE                       Update single field (e.g. /staff-manual edit NC-KHI-0001 status Active)
  bulk FIELD VALUE --filter '{"status":"Inactive"}'  Bulk update by filter criteria
  status STAFF_ID NEW_STATUS                      Change staff status (Active/Inactive/On Duty/Available/Blacklisted)
  verify STAFF_ID                                 Check staff record integrity (CNIC format, phone format, required fields)
  find --field contact_1 --value "03xx-xxxxxxx"   Find staff by field value
  export [--field id,full_name,designation,status]  Export as CSV
  history STAFF_ID                               Show employee's assignment and attendance history

Examples:
  /staff-manual list                          # list all 1321 staff (be cautious)
  /staff-manual list --status Active          # only Active staff
  /staff-manual show NC-KHI-0001              # full record with all 40+ fields
  /staff-manual edit NC-KHI-0001 status On Duty  # set status
  /staff-manual edit NC-KHI-0001 shift_rate 3500  # update salary
  /staff-manual bulk status Blacklisted --filter '{"district":"Karachi West"}'
  /staff-manual verify NC-KHI-0001            # check CNIC/phone format, required fields
  /staff-manual find --field cnic --value "42101-1234567-1"
  /staff-manual export --field id,full_name,designation,status,contact_1 > staff.csv

Status values (must match database ENUM):
  Active         — Default. Staff can be assigned to shifts.
  Inactive       — Cannot be assigned. Hidden from shift picker.
  On Duty        — Currently working a shift (auto-set by duty completion).
  Available      — Active and available (not currently assigned to any shift today).
  Blacklisted    — Permanently blocked from assignments.

Filter syntax (JSON):
  /staff-manual list --filter '{"category":"Nurse","district":"Karachi South","status":"Active"}'
Fields filterable: category, designation, district, status, gender, availability

Bulk update safety:
- Confirms count of matching records before executing
- Shows sample records (first 5) before commit
- Requires explicit confirmation (y/n)

Verification checks:
- CNIC format: xxxxx-xxxxxxx-x (13 digits with dashes)
- Phone format: +92 3XX XXXXXXX or 03xx-xxxxxxx
- Required fields: full_name, designation, category, district
- Duplicate detection: same CNIC or phone across records

Data integrity:
- Duplicate CNIC check: SELECT cnic, COUNT(*) FROM staff GROUP BY cnic HAVING COUNT(*) > 1
- Duplicate phone check: same for contact_1
- Invalid district: check against allowed districts list
- Missing shift_rate: flag staff without salary set

Integration with dutyService:
- dutyService.assignStaffToShifts() checks staff.status === 'Active' before allowing assignment
- Blacklisted/Inactive staff filtered out in ShiftAssignmentModal automatically
- On Duty status set automatically when shift marked completed (DB trigger)

Related UI:
- StaffModule → StaffCard displays status badge (color-coded)
- Staff Quick Edit modal → edits salary/category/designation/district/status
- HR Management → Compensation tab → bulk salary editing

Note: Changes made via /staff-manual reflect immediately in the UI via Supabase real-time subscriptions. No page reload needed.
