from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import sqlite3, json, os, hashlib, hmac
from datetime import datetime, date

ROOT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(ROOT, 'attendance.db')

SEED_STUDENTS = [
('101','Rahul Kumar'),('102','Priya Sharma'),('103','Arjun Reddy'),('104','Sneha Rao'),
('105','Kiran Kumar'),('106','Sai Teja'),('107','Bhavya'),('108','Charan'),
('109','Harika'),('110','Vamsi'),('111','Anusha'),('112','Naveen')]

# Timetable source: AY 2026-27, Semester I, supplied department timetables.
# A/B use their own timetable; 4th year timetable is supplied for Class IV Section A
# and is applied to both A and B as requested by the project owner.
TIME_SLOTS = [
    {'period':1,'start':'09:00','end':'09:50','label':'9:00 AM – 9:50 AM'},
    {'period':2,'start':'09:50','end':'10:40','label':'9:50 AM – 10:40 AM'},
    {'period':3,'start':'10:45','end':'11:35','label':'10:45 AM – 11:35 AM'},
    {'period':4,'start':'11:35','end':'12:25','label':'11:35 AM – 12:25 PM'},
    {'period':5,'start':'13:10','end':'14:00','label':'1:10 PM – 2:00 PM'},
    {'period':6,'start':'14:00','end':'14:45','label':'2:00 PM – 2:45 PM'},
    {'period':7,'start':'14:50','end':'15:35','label':'2:50 PM – 3:35 PM'},
    {'period':8,'start':'15:35','end':'16:20','label':'3:35 PM – 4:20 PM'},
]

SUBJECTS = {
  2: {
    'DMGT': ('Discrete Mathematics & Graph Theory','DR. R.L. MOUNIKA'),
    'UHV': ('Universal Human Values','CH.L N PRATHYUSHA'),
    'IDS': ('Introduction to Data Science','CH.SAI SIVA DURGA'),
    'ADS': ('Advanced Data Structures','DR.CM.SUVANA VARMA'),
    'JAVA': ('Object Oriented Through Java (OOP Java)','DR.V. SREENIVAS'),
    'IDS LAB': ('Data Science Lab','CH.SAI SIVA DURGA'),
    'JAVA LAB': ('Object Oriented Through Java Lab','D.SAI VENKATA GOWTHAM'),
    'PYTHON LAB': ('Python Programming Lab','V.JAYA SRI'),
    'ES': ('Environmental Studies','V.RAM BABU'),
    'ASSOC': ('Association','M.BHAGYA SRI'),
    'LIB': ('Sports & Library','D.SAI VENKATA GOWTHAM'),
    'SPORTS': ('Sports & Library','D.SAI VENKATA GOWTHAM'),
    'CERT COURSE': ('Certification Course','M.VINUTHNA'),
  },
  3: {
    'ML': ('Machine Learning','M.VINUTHNA'),
    'CN': ('Computer Networks','D.SAI VENKATA GOWTHAM'),
    'SE': ('Software Engineering','V.NAGA MEENA'),
    'CTM': ('Construction Technology & Management','B.SAI KUMAR REDDY'),
    'OOAD': ('Object Oriented Analysis & Design','M. BHAGYA SRI'),
    'ML LAB': ('Machine Learning Lab','M.VINUTHNA'),
    'CN LAB': ('Computer Networks Lab','D.S.V GOWTHAM'),
    'FULL STACK LAB': ('Full Stack Development Lab','M. BHAGYA SRI'),
    'TINKERING LAB': ('Tinkering Lab','V.JAYA SRI'),
    'SOFT SKILLS': ('Softskills','G.PRAVEEN'),
    'LIB': ('Library','N.NAGA MANI'),
    'ASSOC': ('Association','CH.SAI SIVA DURGA'),
    'SPORTS': ('Sports','B.M.RAJA SEKHAR'),
    'CERT COURSE': ('Certification Course','M. BHAGYA SRI'),
  },
  4: {
    'BCT': ('Block Chain Technology','DR.C.M. SUVARNA VARMA'),
    'COI': ('Constitution of India','B. RANGA NAGA VALLI'),
    'BDA': ('Big Data Analytics','V. JAYA SRI'),
    'SWM': ('Solid Waste Management','A. KRISHNA PRIYA'),
    'SGT': ('Smart Grid Technology','S.SANDHYA'),
    'HRM': ('Human Resource & Project Management','G. SRI LALITHA'),
    'COUNSEL LNG': ('Counselling',''),
    'NPTEL': ('NPTEL','B.M. RAJA SEKHAR'),
    'FULL STACK LAB-II': ('Full Stack Lab-II','M .BHAGYA SRI'),
    'LIB': ('Library',''),
    'MINI PROJECT': ('Mini Project',''),
  }
}

# Each day is a list of attendance sessions. Lab blocks are one session even though
# they occupy multiple timetable periods.
TT = {
  2: {
    'A': {
      'MON': [('IDS',1),('ADS',2),('JAVA',3),('JAVA',4),('PYTHON LAB',5,6,7,8)],
      'TUE': [('DMGT',1),('ADS',2),('DMGT',3),('CERT COURSE',4),('ES',5),('UHV',6),('DMGT',7),('CERT COURSE',8)],
      'WED': [('IDS LAB',1,2,3,4),('DMGT',5),('UHV',6),('JAVA',7),('JAVA',8)],
      'THU': [('IDS',1),('DMGT',2),('UHV',3),('ADS',4),('IDS',5),('JAVA',6),('ASSOC',7),('LIB',8)],
      'FRI': [('UHV',1),('ADS',2),('DMGT',3),('CERT COURSE',4),('JAVA LAB',5,6,7,8)],
      'SAT': [('ADS',1),('ES',2),('IDS',3),('JAVA',4),('ASSOC',5),('UHV',6),('ADS',7),('SPORTS',8)]
    },
    'B': {
      'MON': [('JAVA LAB',1,2,3,4),('IDS',5),('DMGT',6),('DMGT',7),('CERT COURSE',8)],
      'TUE': [('ADS',1),('IDS',2),('JAVA',3),('JAVA',4),('UHV',5),('DMGT',6),('ES',7),('ASSOC',8)],
      'WED': [('DMGT',1),('ADS',2),('JAVA',3),('IDS',4),('PYTHON LAB',5,6,7,8)],
      'THU': [('ADS',1),('UHV',2),('DMGT',3),('IDS',4),('UHV',5),('ASSOC',6),('JAVA',7),('JAVA',8)],
      'FRI': [('IDS LAB',1,2,3,4),('UHV',5),('CERT COURSE',6),('ADS',7),('LIB',8)],
      'SAT': [('DMGT',1),('ADS',2),('UHV',3),('ADS',4),('IDS',5),('ES',6),('JAVA',7),('SPORTS',8)]
    }
  },
  3: {
    'A': {
      'MON': [('CTM',1),('SE',2),('CN',3),('OOAD',4),('FULL STACK LAB',5,6,7,8)],
      'TUE': [('TINKERING LAB',1,2),('OOAD',3),('CN',4),('CTM',5),('ASSOC',6),('ML',7),('CERT COURSE',8)],
      'WED': [('ML',1),('CTM',2),('SE',3),('CERT COURSE',4),('CN',5),('OOAD',6),('ML',7),('LIB',8)],
      'THU': [('SE',1),('ML',2),('OOAD',3),('CTM',4),('ML LAB',5,6,7,8)],
      'FRI': [('CN',1),('CTM',2),('ML',3),('OOAD',4),('SOFT SKILLS',5),('SE',6),('SPORTS',7),('SPORTS',8)],
      'SAT': [('CN LAB',1,2,3,4),('CERT COURSE',5),('OOAD',6),('CN',7),('ASSOC',8)]
    },
    'B': {
      'MON': [('CN',1),('OOAD',2),('SE',3),('CTM',4),('SOFT SKILLS',5),('ML',6),('CERT COURSE',7),('CERT COURSE',8)],
      'TUE': [('CTM',1),('CN',2),('SE',3),('ML',4),('FULL STACK LAB',5,6,7,8)],
      'WED': [('SE',1),('CN',2),('CTM',3),('OOAD',4),('ML',5),('ASSOC',6),('TINKERING LAB',7,8)],
      'THU': [('CN LAB',1,2,3,4),('OOAD',5),('CN',6),('SE',7),('LIB',8)],
      'FRI': [('ML',1),('OOAD',2),('CN',3),('CTM',4),('CERT COURSE',5),('SE',6),('ML',7),('SPORTS',8)],
      'SAT': [('OOAD',1),('ASSOC',2),('CTM',3),('CERT COURSE',4),('ML LAB',5,6,7,8)]
    }
  },
  4: {
    'A': {
      'MON': [('BCT',1),('COI',2),('BDA',3),('SWM',4),('SGT',5),('HRM',6),('COUNSEL LNG',7),('NPTEL',8)],
      'TUE': [('SGT',1),('HRM',2),('BCT',3),('NPTEL',4),('SWM',5),('BDA',6),('COI',7),('NPTEL',8)],
      'WED': [('SWM',1),('HRM',2),('HRM',3),('BCT',4),('SWM',5),('SGT',6),('BDA',7),('COI',8)],
      'THU': [('FULL STACK LAB-II',1,2,3,4),('HRM',5),('BDA',6),('SGT',7),('BDA',8)],
      'FRI': [('BCT',1),('NPTEL',2),('SWM',3),('BCT',4),('SGT',5),('NPTEL',6),('LIB',7),('NPTEL',8)],
      'SAT': [('MINI PROJECT',1,2,3,4)]
    }
  }
}
TT[4]['B'] = TT[4]['A']

DAYS = ['MON','TUE','WED','THU','FRI','SAT']
DAY_NAMES = {'MON':'Monday','TUE':'Tuesday','WED':'Wednesday','THU':'Thursday','FRI':'Friday','SAT':'Saturday','SUN':'Sunday'}

def db():
    c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; c.execute('PRAGMA foreign_keys=ON'); return c

def init_db():
    c=db()
    c.executescript('''
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, display_name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS students(id INTEGER PRIMARY KEY, roll_no TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, phone_status TEXT NOT NULL DEFAULT 'verified', year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 4), section TEXT NOT NULL CHECK(section IN ('A','B')), UNIQUE(roll_no,year,section));
    CREATE INDEX IF NOT EXISTS idx_students_year_section ON students(year,section);
    CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE, attendance_date TEXT NOT NULL, present INTEGER NOT NULL CHECK(present IN (0,1)), UNIQUE(student_id,attendance_date));
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
    CREATE TABLE IF NOT EXISTS attendance_sessions(
      id INTEGER PRIMARY KEY, attendance_date TEXT NOT NULL, year INTEGER NOT NULL, section TEXT NOT NULL,
      day_code TEXT NOT NULL, session_key TEXT NOT NULL UNIQUE, subject_code TEXT NOT NULL, subject_name TEXT NOT NULL,
      faculty_name TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, periods TEXT NOT NULL,
      submitted_at TEXT NOT NULL, submitted_by TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attendance_records(
      id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE, status TEXT NOT NULL CHECK(status IN ('present','absent','late','leave')),
      UNIQUE(session_id,student_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON attendance_sessions(attendance_date,year,section);
    CREATE INDEX IF NOT EXISTS idx_records_session ON attendance_records(session_id);
    ''')
    # Keep compatibility with databases created by the earlier portal version.
    for col, ddl in [('phone','TEXT'),('phone_status',"TEXT NOT NULL DEFAULT 'verified'")]:
        try: c.execute(f'ALTER TABLE students ADD COLUMN {col} {ddl}')
        except sqlite3.OperationalError: pass
    pw=hashlib.sha256('Admin123@321'.encode()).hexdigest()
    c.execute('INSERT OR IGNORE INTO users(username,password_hash,display_name) VALUES(?,?,?)',('DATA SCIENCE',pw,'Data Science Faculty'))
    for year in (1,):
        for section in ('A','B'):
            for roll,name in SEED_STUDENTS:
                c.execute('INSERT OR IGNORE INTO students(roll_no,name,year,section) VALUES(?,?,?,?)',(roll,name,year,section))
    c.commit(); c.close()

def get_timetable(year, section, day=None):
    if year not in TT or section not in TT[year]: return []
    slots_master = TIME_SLOTS
    if year == 3:
        slots_master = [dict(x) for x in TIME_SLOTS]
        slots_master[3]['end'] = '12:35'; slots_master[3]['label'] = '11:35 AM – 12:35 PM'
    days = [day] if day else DAYS
    out=[]
    for d in days:
        for idx,item in enumerate(TT[year][section].get(d,[])):
            code=item[0]; periods=list(item[1:])
            # Handle repeated MINI PROJECT entries by treating each as its own 4-period block.
            slots=[slots_master[p-1] for p in periods]
            start=slots[0]['start']; end=slots[-1]['end']
            subj, faculty = SUBJECTS.get(year,{}).get(code,(code,''))
            out.append({'day':d,'day_name':DAY_NAMES[d],'subject_code':code,'subject_name':subj,'faculty_name':faculty,
                        'periods':periods,'period_label':' + '.join('P'+str(p) for p in periods),
                        'start_time':start,'end_time':end,'time_label':f"{start} – {end}",
                        'slot_index':idx,'session_key_base':f"{year}-{section}-{d}-{idx}"})
    return out

def current_session(year, section, now=None):
    now = now or datetime.now()
    # Sunday is a college holiday.
    day = ['MON','TUE','WED','THU','FRI','SAT','SUN'][now.weekday()]
    if day == 'SUN': return None
    hm=now.strftime('%H:%M')
    for x in get_timetable(year,section,day):
        if x['start_time'] <= hm < x['end_time']:
            return x
    return None

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=ROOT,**kwargs)
    def send_json(self,obj,status=200):
        raw=json.dumps(obj).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Cache-Control','no-store'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def body(self):
        try:
            n=int(self.headers.get('Content-Length','0')); return json.loads(self.rfile.read(n) or b'{}')
        except Exception: return {}
    def do_POST(self):
        p=urlparse(self.path); x=self.body()
        if p.path=='/api/login':
            c=db(); u=c.execute('SELECT * FROM users WHERE username=?',(str(x.get('username','')).strip(),)).fetchone(); c.close()
            ok=bool(u and hmac.compare_digest(u['password_hash'],hashlib.sha256(str(x.get('password','')).encode()).hexdigest()))
            return self.send_json({'ok':ok,'display_name':u['display_name'] if ok else None},200 if ok else 401)
        if p.path=='/api/attendance':
            try: year=int(x.get('year',0))
            except: year=0
            section=x.get('section'); records=x.get('records',[]); submitted_by=str(x.get('submitted_by','DATA SCIENCE')).strip() or 'DATA SCIENCE'
            if year not in range(2,5) or section not in ('A','B'): return self.send_json({'error':'Timetable attendance is enabled for Years 2–4 only.'},400)
            now=datetime.now(); today=now.strftime('%Y-%m-%d'); session=current_session(year,section,now)
            if not session: return self.send_json({'error':'Attendance is not open right now. Attendance can only be submitted during the scheduled timetable session.'},409)
            key=f"{today}|{year}|{section}|{session['day']}|{session['slot_index']}"
            c=db()
            try:
                exists=c.execute('SELECT id,submitted_at FROM attendance_sessions WHERE session_key=?',(key,)).fetchone()
                if exists: return self.send_json({'error':f"Attendance for {session['subject_name']} is already submitted for this session at {exists['submitted_at']}. It cannot be submitted again."},409)
                c.execute('''INSERT INTO attendance_sessions(attendance_date,year,section,day_code,session_key,subject_code,subject_name,faculty_name,start_time,end_time,periods,submitted_at,submitted_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)''',
                    (today,year,section,session['day'],key,session['subject_code'],session['subject_name'],session['faculty_name'],session['start_time'],session['end_time'],','.join(map(str,session['periods'])),now.isoformat(timespec='seconds'),submitted_by))
                sid=c.lastrowid
                for r in records:
                    st=c.execute('SELECT id FROM students WHERE roll_no=? AND year=? AND section=?',(str(r.get('roll_no')),year,section)).fetchone()
                    if st:
                        status=str(r.get('status','present' if r.get('present') else 'absent')).lower()
                        if status not in ('present','absent','late','leave'): status='absent'
                        c.execute('INSERT INTO attendance_records(session_id,student_id,status) VALUES(?,?,?)',(sid,st['id'],status))
                c.commit()
                return self.send_json({'ok':True,'session_id':sid,'subject_name':session['subject_name'],'faculty_name':session['faculty_name'],'time_label':session['time_label'],'saved':len(records),'submitted_at':now.isoformat(timespec='seconds')})
            except sqlite3.IntegrityError as e:
                c.rollback(); return self.send_json({'error':'This attendance session has already been submitted.'},409)
            finally: c.close()
        return self.send_json({'error':'Not found'},404)
    def do_GET(self):
        p=urlparse(self.path); q=parse_qs(p.query)
        if not p.path.startswith('/api/'): return super().do_GET()
        c=db()
        try:
            if p.path=='/api/students':
                year=int(q.get('year',['1'])[0]); section=q.get('section',['A'])[0]
                if year == 0 and section == 'ALL': rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students ORDER BY year,section,roll_no').fetchall()
                elif year == 0: rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students WHERE section=? ORDER BY year,roll_no',(section,)).fetchall()
                elif section == 'ALL': rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students WHERE year=? ORDER BY section,roll_no',(year,)).fetchall()
                else: rows=c.execute('SELECT roll_no,name,phone,phone_status,year,section FROM students WHERE year=? AND section=? ORDER BY roll_no',(year,section)).fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/timetable':
                year=int(q.get('year',['2'])[0]); section=q.get('section',['A'])[0]; day=q.get('day',[None])[0]
                return self.send_json({'year':year,'section':section,'holiday':'Sunday','slots':get_timetable(year,section,day)})
            if p.path=='/api/current-session':
                year=int(q.get('year',['0'])[0]); section=q.get('section',['A'])[0]
                s=current_session(year,section)
                if not s:
                    now=datetime.now(); day=['MON','TUE','WED','THU','FRI','SAT','SUN'][now.weekday()]
                    return self.send_json({'open':False,'holiday':day=='SUN','day':day,'day_name':DAY_NAMES[day]})
                today=datetime.now().strftime('%Y-%m-%d'); key=f"{today}|{year}|{section}|{s['day']}|{s['slot_index']}"
                done=c.execute('SELECT id,submitted_at,submitted_by FROM attendance_sessions WHERE session_key=?',(key,)).fetchone()
                return self.send_json({'open':not bool(done),'already_submitted':bool(done),'session':dict(s, session_id=(done['id'] if done else None), session_date=today),'submitted':dict(done) if done else None})
            if p.path=='/api/attendance':
                year=int(q.get('year',['1'])[0]); section=q.get('section',['A'])[0]; dt=q.get('date',[''])[0]
                session_id=q.get('session_id',[None])[0]
                if year >= 2 and session_id:
                    rows=c.execute('''SELECT s.roll_no,s.name,COALESCE(ar.status,'absent') status FROM students s LEFT JOIN attendance_records ar ON ar.student_id=s.id AND ar.session_id=? WHERE s.year=? AND s.section=? ORDER BY s.roll_no''',(int(session_id),year,section)).fetchall()
                elif year >= 2:
                    rows=c.execute('''SELECT s.roll_no,s.name,'absent' status FROM students s WHERE s.year=? AND s.section=? ORDER BY s.roll_no''',(year,section)).fetchall()
                else:
                    rows=c.execute('''SELECT s.roll_no,s.name,CASE WHEN a.present=1 THEN 'present' ELSE 'absent' END status FROM students s LEFT JOIN attendance a ON a.student_id=s.id AND a.attendance_date=? WHERE s.year=? AND s.section=? ORDER BY s.roll_no''',(dt,year,section)).fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/history':
                rows=c.execute('''SELECT id,attendance_date date,year,section,subject_name,faculty_name,start_time,end_time,periods,submitted_at,submitted_by,(SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id=ass.id) total,(SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id=ass.id AND ar.status='present') present FROM attendance_sessions ass ORDER BY attendance_date DESC,submitted_at DESC LIMIT 100''').fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/report':
                year=int(q.get('year',['1'])[0]); section=q.get('section',['A'])[0]
                if year >= 2:
                    rows=c.execute('''SELECT s.roll_no,s.name,COUNT(ar.id) sessions,SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) present,CASE WHEN COUNT(ar.id)=0 THEN 0 ELSE ROUND(100.0*SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END)/COUNT(ar.id)) END percentage FROM students s LEFT JOIN attendance_records ar ON ar.student_id=s.id LEFT JOIN attendance_sessions ass ON ass.id=ar.session_id WHERE s.year=? AND s.section=? AND (ar.id IS NULL OR (ass.year=? AND ass.section=?)) GROUP BY s.id ORDER BY s.roll_no''',(year,section,year,section)).fetchall()
                else:
                    rows=c.execute('''SELECT s.roll_no,s.name,COUNT(a.id) sessions,COALESCE(SUM(a.present),0) present,CASE WHEN COUNT(a.id)=0 THEN 0 ELSE ROUND(100.0*SUM(a.present)/COUNT(a.id)) END percentage FROM students s LEFT JOIN attendance a ON a.student_id=s.id WHERE s.year=? AND s.section=? GROUP BY s.id ORDER BY s.roll_no''',(year,section)).fetchall()
                return self.send_json([dict(r) for r in rows])
            if p.path=='/api/dashboard':
                out=[]
                for y in range(1,5):
                    for sec in ('A','B'):
                        if y>=2:
                            r=c.execute('''SELECT COUNT(ar.id) sessions,SUM(CASE WHEN ar.status='present' THEN 1 ELSE 0 END) present FROM attendance_records ar JOIN attendance_sessions ass ON ass.id=ar.session_id JOIN students s ON s.id=ar.student_id WHERE ass.year=? AND ass.section=?''',(y,sec)).fetchone()
                        else:
                            r=c.execute('''SELECT COUNT(a.id) sessions,COALESCE(SUM(a.present),0) present FROM attendance a JOIN students s ON s.id=a.student_id WHERE s.year=? AND s.section=?''',(y,sec)).fetchone()
                        sessions=int(r['sessions'] or 0); present=int(r['present'] or 0)
                        out.append({'year':y,'section':sec,'sessions':sessions,'present':present,'percentage':round(100*present/sessions) if sessions else 0})
                return self.send_json(out)
            return self.send_json({'error':'Not found'},404)
        finally: c.close()

if __name__=='__main__':
   import os
init_db()
port = int(os.environ.get("PORT", 8000))
print(f"CSD Attendance running on port {port}")
ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
