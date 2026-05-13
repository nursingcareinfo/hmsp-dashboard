---
description: Staff status management and bulk editing
agent: frontend
subtask: true
---
Manage staff statuses and bulk edit staff details.

Usage: /staff <action> [options]

Actions:
  status LIST        Show all staff with current status filter
  status UPDATE      Change staff status (Active/Inactive/On Duty/Available/Blacklisted)
  status ON_DUTY     Mark selected staff as On Duty
  status AVAILABLE   Mark selected staff as Available
  status BLACKLIST   Blacklist staff (blocks assignments)
  edit ID FIELD VAL  Edit single staff field (e.g. /staff edit NC-KHI-0001 shift_rate 3500)
  bulk FIELD VAL     Bulk update multiple staff by filter (e.g. /staff bulk shift_rate 3000 --category Nurse)
  export            Export filtered staff list to CSV
  import CSV         Import staff from CSV (Google Contacts format)

Examples:
  /staff status                    # list all staff with current status
  /staff status UPDATE NC-KHI-0001 Active    # set single staff to Active
  /staff status ON_DUTY --ids NC-KHI-0001,NC-KHI-0002    # mark multiple as On Duty
  /staff status BLACKLIST --designation Attendant --district "Karachi South"  # bulk by filter
  /staff edit NC-KHI-0001 shift_rate 4000  # update one field
  /staff bulk salary 2500 --filter '{"category":"Nurse"}'  # bulk salary update
  /staff export --status Active > active_staff.csv
  /staff import contacts.csv

Status values (use exact strings):
  Active         — Can be assigned to shifts (default)
  Inactive       — Not available for assignments (hidden from shift picker)
  On Duty        — Currently working a shift (auto-set by duty completion)
  Available      — Available but not currently assigned (ready for duty)
  Blacklisted    — Never assign (blocks all future assignments)

Filters (apply to bulk/status/list):
  --category "Nurse"
  --designation "R/N"
  --district "Karachi South"
  --status "Active"
  --search "text" (matches name, contact, CNIC)

How it works:
1. Single update: direct Supabase PATCH to staff(id) with {status}
2. Bulk update: WHERE clause with filter criteria → UPDATE staff SET status = $1
3. On Duty status: Set automatically when duty_assignment.status='completed' (DB trigger handles this)
4. Available status: Manually set for staff who are Active but not currently working
5. Blacklisted: Prevents dutyService from creating assignments (guard added in dutyService.ts)

UI Integration:
- StaffModule card badge shows current status with color coding
- Filter dropdowns include all 5 statuses
- ShiftAssignmentModal excludes Inactive and Blacklisted staff

Note: Status changes are immediate and sync to all connected clients via Supabase realtime.

Related: /shift, /duty, /attendance
