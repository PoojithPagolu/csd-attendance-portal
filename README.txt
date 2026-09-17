CSD Attendance Portal - Database Version

How to run (Windows):
1. Install Python 3 if it is not already installed.
2. Extract this ZIP to a folder.
3. Double-click start.bat OR open Command Prompt in the folder and run: python server.py
4. Open http://localhost:8000 in Chrome/Edge.

Login:
Username: DATA SCIENCE
Password: Admin123@321

Database:
- attendance.db (SQLite)
- Stores users, students, and attendance records.
- Attendance is saved separately by academic year, section, and date.
- Reports and history are calculated from saved database records.

Important:
Do NOT open index.html directly. Run server.py/start.bat so the database API works.

TIMETABLE-CONTROLLED ATTENDANCE (NEW)
--------------------------------------
- AY 2026-2027 Semester I timetables have been added for 2nd A/B, 3rd A/B and 4th A/B.
- Subject shortcut codes are expanded to the full subject names shown in the supplied timetable documents.
- Exact timetable times are used. The 3rd-year P4 slot uses 11:35 AM-12:35 PM as shown in its source timetable.
- Lab/project blocks spanning multiple periods are treated as ONE attendance session for that continuous block.
- Attendance for Years 2-4 opens only when the current time falls inside the scheduled session.
- A submitted session is permanently locked against duplicate submission for that date/year/section/session.
- Each attendance record stores subject, faculty, periods, time, submission timestamp and submitting user.
- Sunday is treated as a college holiday and attendance is closed.
- 1st-year timetable was not supplied, so timetable-controlled attendance remains disabled for Year 1 until its timetable is provided.
