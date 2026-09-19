/* =========================================================
   LIVE VIJAYAWADA / IST DATE & TIME
   CSD ATTENDANCE PORTAL
   ========================================================= */

function getIndiaTime() {
  const now = new Date();

  const time = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).format(now);

  const date = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(now);

  const isoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  return {
    time: time,
    date: date,
    isoDate: isoDate
  };
}


function updateLiveClock() {

  const india = getIndiaTime();

  /* Login page clock */
  const loginTime = document.getElementById("loginTime");
  const loginDate = document.getElementById("loginDate");

  if (loginTime) {
    loginTime.textContent = india.time;
  }

  if (loginDate) {
    loginDate.textContent = india.date;
  }


  /* Main application clock */
  const appTime = document.getElementById("appTime");
  const appDate = document.getElementById("appDate");

  if (appTime) {
    appTime.textContent = india.time;
  }

  if (appDate) {
    appDate.textContent = india.date;
  }
}


/* Start live clock */
document.addEventListener("DOMContentLoaded", function () {

  updateLiveClock();

  /* Update every second */
  setInterval(updateLiveClock, 1000);

});


/* =========================================================
   CSD ATTENDANCE PORTAL DATA
   ========================================================= */

const YEARS = [
  {
    id: 1,
    name: "1st Year",
    color: "#22d3ee",
    subtitle: "Foundation & Core",
    sections: ["A", "B"]
  },
  {
    id: 2,
    name: "2nd Year",
    color: "#ec4899",
    subtitle: "Intermediate Level",
    sections: ["A", "B"]
  },
  {
    id: 3,
    name: "3rd Year",
    color: "#f59e0b",
    subtitle: "Advanced Learning",
    sections: ["A", "B"]
  },
  {
    id: 4,
    name: "4th Year",
    color: "#22c55e",
    subtitle: "Final Year & Projects",
    sections: ["A", "B"]
  }
];


let STUDENTS = [];


async function api(url, options = {}) {

  const r = await fetch(url, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const data = await r.json();

  if (!r.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}


async function loadStudents() {

  const y = state.year?.id || 1;
  const sec = state.section || "A";

  const rows = await api(
    `/api/students?year=${y}&section=${sec}`
  );

  STUDENTS = rows.map(r => [
    r.roll_no,
    r.name,
    r.phone || "",
    r.year,
    r.section
  ]);
}


async function loadAttendance(sessionId = null) {

  const y = state.year?.id || 2;
  const sec = state.section || "A";

  const sid = sessionId || state.session?.session_id;

  const url = sid
    ? `/api/attendance?year=${y}&section=${sec}&date=${state.selectedDate}&session_id=${sid}`
    : `/api/attendance?year=${y}&section=${sec}&date=${state.selectedDate}`;

  const rows = await api(url);

  STUDENTS = rows.map(r => [
    r.roll_no,
    r.name
  ]);

  state.attendance = {};

  rows.forEach(r => {
    state.attendance[r.roll_no] =
      r.status === "present";
  });
}


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
  year: null,
  section: null,
  view: "home",
  attendance: {},

  /* Vijayawada / IST date */
  selectedDate: getIndiaTime().isoDate,

  session: null
};


const $ = s => document.querySelector(s);

const content = $("#content");


/* =========================================================
   TOAST
   ========================================================= */

function toast(msg) {

  const t = $("#toast");

  t.textContent = msg;

  t.classList.add("show");

  clearTimeout(window._toast);

  window._toast = setTimeout(
    () => t.classList.remove("show"),
    2200
  );
}


/* =========================================================
   THEME
   ========================================================= */

function theme() {

  document.body.classList.toggle("light");

  localStorage.setItem(
    "csdTheme",
    document.body.classList.contains("light")
      ? "light"
      : "dark"
  );
}


if (localStorage.getItem("csdTheme") === "light") {
  document.body.classList.add("light");
}


/* =========================================================
   LOGIN CONTROLS
   ========================================================= */

$("#loginTheme").onclick = theme;

$("#appTheme").onclick = theme;


$("#showPassword").onclick = () => {

  const p = $("#password");

  p.type =
    p.type === "password"
      ? "text"
      : "password";

  $("#showPassword").textContent =
    p.type === "password"
      ? "◉"
      : "◌";
};


$("#languageSelect").onchange = () =>
  toast("English interface selected");


/* =========================================================
   LOGIN
   ========================================================= */

$("#loginForm").onsubmit = async e => {

  e.preventDefault();

  const u = $("#username").value.trim();

  const p = $("#password").value;

  try {

    const r = await api(
      "/api/login",
      {
        method: "POST",
        body: JSON.stringify({
          username: u,
          password: p
        })
      }
    );

    $("#loginPage").classList.add("hidden");

    $("#appPage").classList.remove("hidden");

    renderHome();

    toast(
      "Welcome, " + r.display_name
    );

  } catch (e) {

    toast(
      "Invalid username or password"
    );
  }
};


/* =========================================================
   LOGOUT
   ========================================================= */

$("#logoutBtn").onclick = () => {

  $("#appPage").classList.add("hidden");

  $("#loginPage").classList.remove("hidden");

  $("#loginForm").reset();

  toast("Logged out safely");
};


/* =========================================================
   MOBILE MENU
   ========================================================= */

$("#mobileMenu").onclick = () =>
  $(".sidebar").classList.toggle("open");


/* =========================================================
   NAVIGATION
   ========================================================= */

document.addEventListener("click", e => {

  const action =
    e.target.closest("[data-action]")
      ?.dataset.action;

  if (action) {

    $(".sidebar")?.classList.remove("open");

    if (action === "home")
      renderHome();

    if (action === "attendance") {

      if (!state.year)
        renderHome();
      else
        renderAttendance();
    }

    if (action === "history")
      renderHistory();

    if (action === "students")
      renderStudents();

    if (action === "timetable")
      renderTimetable();

    if (action === "reports")
      renderReports();
  }
});


function nav(active) {

  document
    .querySelectorAll(".nav-item")
    .forEach(n =>
      n.classList.toggle(
        "active",
        n.dataset.action === active
      )
    );
}


function header(title, crumb = title) {

  $("#pageTitle").textContent = title;

  $("#pageCrumb").textContent = crumb;
}


/* =========================================================
   HOME
   ========================================================= */

function renderHome() {

  state.view = "home";

  nav("home");

  header(
    "CSD Attendance",
    "Dashboard"
  );

  content.innerHTML = `

  <div class="section-head">

    <div>

      <span class="eyebrow">
        ACADEMIC CONTROL CENTER
      </span>

      <h2>
        Choose Academic Year
      </h2>

      <p>
        Select a year to open Section A or B
        and manage attendance, timetable,
        percentage and student list.
      </p>

    </div>

  </div>


  <div class="year-grid">

    ${YEARS.map(y => `

      <article
        class="year-card"
        style="--accent:${y.color}"
        onclick="openYear(${y.id})"
      >

        <span class="year-no">
          YEAR 0${y.id}
        </span>

        <h3>${y.name}</h3>

        <p>${y.subtitle}</p>

        <div class="year-sections">

          <span>SECTION A</span>

          <span>SECTION B</span>

        </div>

        <div class="year-arrow">
          →
        </div>

      </article>

    `).join("")}

  </div>


  <div class="dashboard-blocks">

    ${YEARS.map(y => `

      <div
        class="dashboard-year"
        style="--accent:${y.color}"
      >

        <div class="dashboard-year-head">

          <div>

            <span class="year-no">
              YEAR 0${y.id}
            </span>

            <h3>${y.name}</h3>

          </div>

          <button
            class="back-btn"
            onclick="openYear(${y.id})"
          >
            Open Year →
          </button>

        </div>


        <div class="dashboard-section-row">

          ${y.sections.map(s => `

            <button
              class="dashboard-section"
              onclick="openYear(${y.id});openSection('${s}')"
            >

              <b>
                SECTION ${s}
              </b>

              <span>
                Attendance • Time Table •
                Percentage • Students
              </span>

            </button>

          `).join("")}

        </div>

      </div>

    `).join("")}

  </div>

  `;
}


/* =========================================================
   OPEN YEAR
   ========================================================= */

window.openYear = id => {

  state.year =
    YEARS.find(y => y.id === id);

  nav("home");

  header(
    state.year.name,
    "Dashboard › " + state.year.name
  );


  content.innerHTML = `

    <div class="section-head">

      <div>

        <button
          class="back-btn"
          onclick="renderHome()"
        >
          ← Back to Years
        </button>

        <h2 style="margin-top:18px">
          ${state.year.name}
        </h2>

        <p>
          Choose Section A or Section B.
          All blocks use the
          ${state.year.name} theme.
        </p>

      </div>

    </div>


    <div
      class="section-grid year-themed"
      style="--accent:${state.year.color}"
    >

      ${["A", "B"].map((s, i) => `

        <article
          class="section-card"
          style="--accent:${state.year.color}"
          onclick="openSection('${s}')"
        >

          <span class="tag">
            SECTION-${s}
          </span>

          <div class="icon">
            ${i ? "◆" : "●"}
          </div>

          <h3>
            SECTION-${s}
          </h3>

          <p>
            Open attendance, timetable,
            student percentage and student list.
          </p>

        </article>

      `).join("")}

    </div>

  `;
};


/* =========================================================
   OPEN SECTION
   ========================================================= */

window.openSection = s => {

  state.section = s;

  header(
    `${state.year.name} • SECTION-${s}`,
    "Dashboard › " +
    state.year.name +
    " › Section-" +
    s
  );


  content.innerHTML = `

  <div class="section-head">

    <div>

      <button
        class="back-btn"
        onclick="openYear(${state.year.id})"
      >
        ← Back
      </button>

      <h2 style="margin-top:18px">
        ${state.year.name} • SECTION-${s}
      </h2>

      <p>
        All controls are grouped
        for quick faculty access.
      </p>

    </div>

  </div>


  <div
    class="section-grid"
    style="--accent:${state.year.color}"
  >

    <article
      class="section-card action-card"
      style="--accent:${state.year.color}"
      onclick="renderTimetable()"
    >

      <div class="icon">▦</div>

      <h3>
        TIME TABLE
      </h3>

      <p>
        View periods, subjects,
        rooms and faculty schedule.
      </p>

    </article>


    <article
      class="section-card action-card"
      style="--accent:${state.year.color}"
      onclick="renderAttendance()"
    >

      <div class="icon">✓</div>

      <h3>
        ATTENDANCE
      </h3>

      <p>
        Mark present or absent
        with fast one-click attendance.
      </p>

    </article>


    <article
      class="section-card action-card"
      style="--accent:${state.year.color}"
      onclick="renderReports()"
    >

      <div class="icon">◔</div>

      <h3>
        STUDENT PERCENTAGE
      </h3>

      <p>
        View subject-wise and
        overall attendance percentage.
      </p>

    </article>


    <article
      class="section-card action-card"
      style="--accent:${state.year.color}"
      onclick="renderStudents()"
    >

      <div class="icon">♟</div>

      <h3>
        STUDENT LIST
      </h3>

      <p>
        Search and review every
        student in this section.
      </p>

    </article>

  </div>

  `;
};


/* =========================================================
   ATTENDANCE
   ========================================================= */

async function renderAttendance() {

  nav("attendance");

  state.view = "attendance";

  const y =
    state.year?.id || 2;

  const sec =
    state.section || "A";

  header(
    "Period Attendance",
    `${state.year?.name || "Year"} › Section-${sec}`
  );


  if (y === 1) {

    content.innerHTML = `

      <div class="empty-card">

        <h2>
          Timetable not configured
        </h2>

        <p>
          The supplied timetable currently
          covers Years 2–4. Add the 1st-year
          timetable when available.
        </p>

      </div>

    `;

    return;
  }


  try {

    const info =
      await api(
        `/api/current-session?year=${y}&section=${sec}`
      );


    state.session =
      info.session || null;


    const sid =
      info.session?.session_id || null;


    await loadAttendance(sid);


    const s =
      info.session;


    if (!s) {

      const msg =
        info.holiday
          ? "Sunday is a college holiday. No attendance can be taken today."
          : "There is no scheduled class at this time.";


      content.innerHTML = `

        <div class="section-head">

          <div>

            <button
              class="back-btn"
              onclick="openSection('${sec}')"
            >
              ← Back
            </button>

            <h2 style="margin-top:18px">
              Attendance Locked
            </h2>

            <p>
              ${msg}
            </p>

          </div>

        </div>


        <div class="session-lock-card">

          <div class="lock-icon">
            🔒
          </div>

          <h2>
            Attendance is currently closed
          </h2>

          <p>
            Attendance opens automatically only
            during the timetable period assigned to
            <b>Year ${y} • Section ${sec}</b>.
          </p>

          <div class="session-rule">
            One scheduled session → one submission per day
          </div>

        </div>

      `;

      return;
    }


    const records =
      STUDENTS.map((st, i) => ({
        roll: st[0],
        name: st[1],
        present:
          state.attendance[st[0]] === true
      }));


    const locked =
      Boolean(info.already_submitted);


    const faculty =
      s.faculty_name ||
      "Faculty not specified";


    content.innerHTML = `

      <div class="section-head">

        <div>

          <button
            class="back-btn"
            onclick="openSection('${sec}')"
          >
            ← Back
          </button>

          <h2 style="margin-top:18px">
            ${s.subject_name}
          </h2>

          <p>
            ${s.subject_code} • ${faculty}
          </p>

        </div>

      </div>


      <div
        class="live-session-card"
        style="--accent:${state.year.color}"
      >

        <div>

          <span class="eyebrow">
            ${locked
              ? "SESSION SUBMITTED"
              : "LIVE ATTENDANCE SESSION"}
          </span>

          <h3>
            ${s.time_label}
          </h3>

          <p>
            <b>${s.subject_name}</b>
            • ${faculty}
            • Periods ${s.periods.join(", ")}
          </p>

        </div>


        <div
          class="session-status ${locked ? "locked" : "open"}"
        >
          ${locked
            ? "🔒 Locked"
            : "● OPEN NOW"}
        </div>

      </div>


      <div class="attendance-toolbar">

        <input
          id="studentSearch"
          class="search"
          placeholder="⌕ Search student by name or roll no..."
          oninput="filterStudents()"
          ${locked ? "disabled" : ""}
        >


        <button
          class="tool-btn present-all"
          onclick="markAll(true)"
          ${locked ? "disabled" : ""}
        >
          ✓ Select All Present
        </button>


        <button
          class="tool-btn absent-all"
          onclick="markAll(false)"
          ${locked ? "disabled" : ""}
        >
          × Mark All Absent
        </button>

      </div>


      <div class="attendance-layout">

        <div>

          <div class="attendance-card">

            <div class="attendance-head">

              <span>#</span>

              <span>Roll No.</span>

              <span>Student Name</span>

              <span>Present</span>

            </div>


            <div id="studentRows">

              ${records
                .map((r, i) =>
                  rowHTML(r, i, locked)
                )
                .join("")}

            </div>

          </div>


          <div class="save-bar">

            <div>

              <span style="color:var(--green)">
                Present
              </span>

              <strong>
                ${countPresent()}
              </strong>

              &nbsp;

              <span style="color:var(--red)">
                Absent
              </span>

              <strong>
                ${STUDENTS.length - countPresent()}
              </strong>

            </div>


            ${
              locked

                ? `<div class="locked-note">
                    ✓ Submitted once • Further submissions blocked
                   </div>`

                : `<button
                     class="save-btn"
                     onclick="saveAttendance()"
                   >
                     ▣ Submit Attendance
                   </button>`
            }

          </div>

        </div>


        <aside class="summary-card">

          <b>
            Session Summary
          </b>


          <div class="ring">

            <div>

              <strong>
                ${percentage()}%
              </strong>

              <span>
                Present
              </span>

            </div>

          </div>


          <div class="legend">

            <div>

              <span>
                <i class="dot green"></i>
                Present
              </span>

              <b>
                ${countPresent()}
              </b>

            </div>


            <div>

              <span>
                <i class="dot red"></i>
                Absent
              </span>

              <b>
                ${STUDENTS.length - countPresent()}
              </b>

            </div>

          </div>


          <div class="keyboard-tip">

            <b>
              Controlled by timetable
            </b>

            <br>

            Only the scheduled faculty session
            can submit attendance. Duplicate
            submissions for the same day/session
            are blocked by the database.

          </div>

        </aside>

      </div>

    `;

  } catch (e) {

    toast(
      e.message ||
      "Database connection failed"
    );
  }
}


/* =========================================================
   STUDENT ROW
   ========================================================= */

function rowHTML(r, i, locked = false) {

  return `

    <div
      class="student-row"
      data-name="${r.name.toLowerCase()}"
      data-roll="${r.roll}"
    >

      <span>
        ${i + 1}
      </span>


      <span>
        ${r.roll}
      </span>


      <span
        style="display:flex;align-items:center;gap:10px"
      >

        <span class="student-avatar">
          ${r.name
            .split(" ")
            .map(x => x[0])
            .join("")
            .slice(0, 2)}
        </span>

        ${r.name}

      </span>


      <button
        class="check-btn ${r.present ? "checked" : ""}"
        ${locked ? "disabled" : ""}
        onclick="toggleStudent('${r.roll}')"
      >
        ${r.present ? "✓" : ""}
      </button>

    </div>

  `;
}


/* =========================================================
   ATTENDANCE TOGGLE
   ========================================================= */

window.toggleStudent = roll => {

  /*
    The buttons are already disabled when
    the session is locked.

    Therefore we simply toggle the student.
  */

  state.attendance[roll] =
    state.attendance[roll] === true
      ? false
      : true;

  renderAttendanceLocal();
};


function countPresent() {

  return STUDENTS.filter(
    s => state.attendance[s[0]] === true
  ).length;
}


function percentage() {

  return STUDENTS.length
    ? Math.round(
        countPresent() /
        STUDENTS.length *
        100
      )
    : 0;
}


function renderAttendanceLocal() {

  /* Update student check buttons */
  document.querySelectorAll(".student-row").forEach(r => {

    const b = r.querySelector(".check-btn");

    if (!b || b.disabled) return;

    const v = state.attendance[r.dataset.roll] === true;

    b.classList.toggle("checked", v);
    b.textContent = v ? "✓" : "";
  });

  /* Update Present / Absent counts in the bottom bar */
  const bar = document.querySelector(".save-bar > div");

  if (bar) {
    bar.innerHTML = `
      <span style="color:var(--green)">
        Present
      </span>

      <strong>
        ${countPresent()}
      </strong>

      &nbsp;

      <span style="color:var(--red)">
        Absent
      </span>

      <strong>
        ${STUDENTS.length - countPresent()}
      </strong>
    `;
  }

  /* Update Session Summary */
  const summaryCard = document.querySelector(".summary-card");

  if (summaryCard) {

    const present = countPresent();
    const absent = STUDENTS.length - present;
    const percent = percentage();

    /* Update circular percentage ring */
    const ring = summaryCard.querySelector(".ring");

    if (ring) {

      ring.style.background =
        `conic-gradient(
          var(--green) 0 ${percent}%,
          var(--red) ${percent}% 100%
        )`;

      const strong = ring.querySelector("strong");

      if (strong) {
        strong.textContent = `${percent}%`;
      }
    }

    /* Update Session Summary numbers */
    const legend = summaryCard.querySelector(".legend");

    if (legend) {

      legend.innerHTML = `
        <div>
          <span>
            <i class="dot green"></i>
            Present
          </span>

          <b>${present}</b>
        </div>

        <div>
          <span>
            <i class="dot red"></i>
            Absent
          </span>

          <b>${absent}</b>
        </div>
      `;
    }
  }
}

  document
    .querySelectorAll(".student-row")
    .forEach(r => {

      const b =
        r.querySelector(".check-btn");

      if (b.disabled)
        return;

      const v =
        state.attendance[
          r.dataset.roll
        ] === true;

      b.classList.toggle(
        "checked",
        v
      );

      b.textContent =
        v ? "✓" : "";
    });


  const bar =
    document.querySelector(
      ".save-bar div"
    );


  if (bar) {

    bar.innerHTML = `

      <span style="color:var(--green)">
        Present
      </span>

      <strong>
        ${countPresent()}
      </strong>

      &nbsp;

      <span style="color:var(--red)">
        Absent
      </span>

      <strong>
        ${STUDENTS.length - countPresent()}
      </strong>

    `;
  }
}


/* =========================================================
   MARK ALL
   ========================================================= */

window.markAll = val => {

  STUDENTS.forEach(
    s =>
      state.attendance[s[0]] =
        val
  );

  renderAttendanceLocal();

  toast(
    val
      ? "All students marked Present"
      : "All students marked Absent"
  );
};


/* =========================================================
   FILTER STUDENTS
   ========================================================= */

window.filterStudents = () => {

  const q =
    ($("#studentSearch")?.value || "")
      .toLowerCase();


  document
    .querySelectorAll(".student-row")
    .forEach(r => {

      r.style.display =
        (
          r.dataset.name.includes(q) ||
          r.dataset.roll.includes(q)
        )
          ? "grid"
          : "none";
    });
};


/* =========================================================
   SAVE ATTENDANCE
   ========================================================= */

window.saveAttendance = async () => {

  try {

    const y =
      state.year?.id;

    const sec =
      state.section || "A";


    const info =
      await api(
        `/api/current-session?year=${y}&section=${sec}`
      );


    if (!info.open)

      throw new Error(
        info.already_submitted
          ? "Attendance is already submitted for this session."
          : "Attendance is not open right now."
      );


    state.session =
      info.session;


    await api(
      "/api/attendance",
      {
        method: "POST",

        body: JSON.stringify({

          year: y,

          section: sec,

          records:
            STUDENTS.map(s => ({

              roll_no: s[0],

              status:
                state.attendance[s[0]] === true
                  ? "present"
                  : "absent"

            })),

          submitted_by:
            "DATA SCIENCE"

        })
      }
    );


    toast(
      "Attendance submitted successfully • session locked"
    );


    setTimeout(
      renderAttendance,
      500
    );


  } catch (e) {

    toast(
      e.message ||
      "Could not submit attendance"
    );
  }
};


/* =========================================================
   TIMETABLE
   ========================================================= */

function renderTimetable() {

  nav("timetable");

  state.view = "timetable";

  const y =
    state.year?.id || 2;

  const sec =
    state.section || "A";


  header(
    "Time Table",
    `${state.year?.name || "Year"} › Section-${sec}`
  );


  if (y === 1) {

    content.innerHTML = `

      <div class="empty-card">

        <h2>
          1st Year timetable not available
        </h2>

        <p>
          The timetable files supplied for
          this upgrade cover Years 2–4.
        </p>

      </div>

    `;

    return;
  }


  api(
    `/api/timetable?year=${y}&section=${sec}`
  )

  .then(data => {

    const byDay = {};

    data.slots.forEach(
      x =>
        (byDay[x.day] ??= []).push(x)
    );


    content.innerHTML = `

      <div class="section-head">

        <div>

          <button
            class="back-btn"
            onclick="openSection('${sec}')"
          >
            ← Back
          </button>

          <h2 style="margin-top:18px">
            Weekly Time Table
          </h2>

          <p>
            ${state.year.name}
            • Section ${sec}
            • AY 2026–2027
            • Semester I
          </p>

        </div>

      </div>


      <div class="tt-note">

        ⏱
        <b>
          Attendance follows this timetable.
        </b>

        Regular subjects open for their
        scheduled period; labs/projects are
        treated as one continuous attendance
        session across their full block.
        Sunday is a college holiday.

      </div>


      <div class="timetable-week">

        ${[
          "MON",
          "TUE",
          "WED",
          "THU",
          "FRI",
          "SAT"
        ]
        .map(d => `

          <div class="tt-day">

            <div class="tt-day-head">

              ${
                data.slots.find(
                  x => x.day === d
                )?.day_name ||

                ({
                  MON: "Monday",
                  TUE: "Tuesday",
                  WED: "Wednesday",
                  THU: "Thursday",
                  FRI: "Friday",
                  SAT: "Saturday"
                }[d])
              }

            </div>


            <div class="tt-list">

              ${(byDay[d] || [])
                .map(x => `

                  <div
                    class="tt-session ${
                      x.periods.length > 1
                        ? "lab-session"
                        : ""
                    }"
                  >

                    <div class="tt-time">
                      ${x.time_label}
                    </div>


                    <div class="tt-subject">

                      <b>
                        ${x.subject_name}
                      </b>

                      <span>
                        ${x.subject_code}
                        •
                        ${x.periods
                          .map(p => "P" + p)
                          .join(" + ")}
                      </span>

                    </div>


                    <div class="tt-faculty">

                      👤
                      ${x.faculty_name ||
                        "Not specified"}

                    </div>

                  </div>

                `)
                .join("")}

            </div>

          </div>

        `)
        .join("")}


        <div class="tt-day holiday">

          <div class="tt-day-head">
            Sunday
          </div>

          <div class="holiday-box">

            ☀

            <b>
              College Holiday
            </b>

            <span>
              No attendance
            </span>

          </div>

        </div>

      </div>

    `;

  })

  .catch(() =>
    toast(
      "Could not load timetable"
    )
  );
}


/* =========================================================
   STUDENT LIST
   ========================================================= */

async function renderStudents() {

  nav("students");

  state.view = "students";

  header(
    "Student List",
    "Students › All Years"
  );


  let selectedYear =
    state.studentListYear || 0;

  let selectedSection =
    state.studentListSection || "ALL";


  try {

    const rows =
      await api(
        `/api/students?year=${selectedYear}&section=${selectedSection}`
      );


    content.innerHTML = `

      <div class="section-head">

        <div>

          <button
            class="back-btn"
            onclick="${
              state.year
                ? `openSection('${state.section || "A"}')`
                : `renderHome()`
            }"
          >
            ← Back
          </button>

          <h2 style="margin-top:18px">
            Student List
          </h2>

          <p>
            View and contact students across
            1st, 2nd, 3rd and 4th years.
          </p>

        </div>

      </div>


      <div class="year-filter student-year-filter">

        <button
          class="filter-year ${
            selectedYear === 0
              ? "selected"
              : ""
          }"
          style="--accent:#94a3b8"
          onclick="showStudentList(0,'${selectedSection}')"
        >
          ALL YEARS
        </button>


        ${YEARS.map(y => `

          <button
            class="filter-year ${
              selectedYear === y.id
                ? "selected"
                : ""
            }"
            style="--accent:${y.color}"
            onclick="showStudentList(${y.id},'${selectedSection}')"
          >
            ${y.name}
          </button>

        `).join("")}

      </div>


      <div class="year-filter student-section-filter">

        ${["ALL", "A", "B"]
          .map(sec => `

            <button
              class="filter-year ${
                selectedSection === sec
                  ? "selected"
                  : ""
              }"
              style="--accent:${
                selectedYear
                  ? YEARS.find(
                      y =>
                        y.id === selectedYear
                    ).color
                  : "#94a3b8"
              }"
              onclick="showStudentList(${selectedYear},'${sec}')"
            >
              ${
                sec === "ALL"
                  ? "ALL SECTIONS"
                  : "SECTION " + sec
              }
            </button>

          `)
          .join("")}

      </div>


      <div class="table-card">

        <div class="report-filter-bar">

          <input
            class="search"
            id="studentSearch"
            placeholder="Search name, roll no. or phone number..."
            oninput="filterStudentTable()"
          >

        </div>


        <table
          class="data-table"
          id="studentTable"
        >

          <thead>

            <tr>

              <th>#</th>
              <th>Year</th>
              <th>Section</th>
              <th>Roll No.</th>
              <th>Student</th>
              <th>Phone No.</th>
              <th>Contact</th>

            </tr>

          </thead>


          <tbody>

            ${rows.map((r, i) => {

              const phone =
                (r.phone || "").trim();

              const digits =
                phone.replace(
                  /[^0-9+]/g,
                  ""
                );

              const status =
                r.phone_status ||
                "verified";


              const phoneCell =
                phone

                  ? `<span class="phone-value">
                       ${phone}
                     </span>`

                  : status === "needs_verification"

                    ? `<span class="phone-warning">
                         Needs verification
                       </span>`

                    : `<span class="muted-text">
                         Not provided
                       </span>`;


              const contactCell =
                phone

                  ? `<a
                       class="contact-btn"
                       href="tel:${digits}"
                     >
                       ☎ Call
                     </a>`

                  : status === "needs_verification"

                    ? `<span class="muted-text">
                         Verify first
                       </span>`

                    : `<span class="muted-text">
                         No number
                       </span>`;


              return `

                <tr>

                  <td>
                    ${i + 1}
                  </td>

                  <td>
                    ${
                      YEARS.find(
                        y =>
                          y.id === r.year
                      )?.name || r.year
                    }
                  </td>

                  <td>
                    Section ${r.section}
                  </td>

                  <td>
                    ${r.roll_no}
                  </td>

                  <td class="subject">
                    ${r.name}
                  </td>

                  <td>
                    ${phoneCell}
                  </td>

                  <td>
                    ${contactCell}
                  </td>

                </tr>

              `;

            }).join("")}

          </tbody>

        </table>

      </div>

    `;

  } catch (e) {

    toast(
      "Database connection failed"
    );
  }
}


window.showStudentList =
  (year, section) => {

    state.studentListYear =
      year;

    state.studentListSection =
      section;

    renderStudents();
  };


window.filterStudentTable = () => {

  const q =
    ($("#studentSearch")?.value || "")
      .toLowerCase();


  document
    .querySelectorAll(
      "#studentTable tbody tr"
    )
    .forEach(r => {

      r.style.display =
        r.textContent
          .toLowerCase()
          .includes(q)
          ? ""
          : "none";

    });
};


/* =========================================================
   REPORTS
   ========================================================= */

function renderReports() {

  const selected =
    state.year?.id || 1;


  header(
    "Student Percentage",
    "Reports › Attendance"
  );


  content.innerHTML = `

    <div class="section-head">

      <div>

        <h2>
          Attendance Reports
        </h2>

        <p>
          Live percentages calculated
          from saved database sessions.
        </p>

      </div>

    </div>


    <div class="year-filter">

      ${YEARS.map(y => `

        <button
          class="filter-year ${
            selected === y.id
              ? "selected"
              : ""
          }"
          style="--accent:${y.color}"
          onclick="showYearReport(${y.id})"
        >
          ${y.name}
        </button>

      `).join("")}

    </div>


    <div id="yearReport"></div>

  `;


  showYearReport(selected);
}


window.showYearReport =
  async id => {

    state.year =
      YEARS.find(y => y.id === id);

    const section =
      state.section || "A";

    let rows = [];


    try {

      rows =
        await api(
          `/api/report?year=${id}&section=${section}`
        );

    } catch (e) {

      toast(
        "Database connection failed"
      );

      return;
    }


    const avg =
      rows.length

        ? Math.round(
            rows.reduce(
              (a, b) =>
                a + Number(b.percentage),
              0
            ) / rows.length
          )

        : 0;


    const above =
      rows.filter(
        r => r.percentage >= 75
      ).length;


    const below =
      rows.length - above;


    $("#yearReport").innerHTML = `

      <div
        class="report-year-banner"
        style="--accent:${state.year.color}"
      >

        <div>

          <span>
            DATABASE REPORT
          </span>

          <h2>
            ${state.year.name}
          </h2>

          <p>
            Section ${section}
            • ${rows.length} students
          </p>

        </div>


        <button
          class="back-btn"
          onclick="renderHome()"
        >
          Dashboard →
        </button>

      </div>


      <div class="report-grid">

        <div class="report-card">

          <span>
            Overall Attendance
          </span>

          <div class="big">
            ${avg}%
          </div>

          <small>
            ${state.year.name}
          </small>

          <div class="progress">

            <i
              style="width:${avg}%"
            ></i>

          </div>

        </div>


        <div class="report-card">

          <span>
            Above 75%
          </span>

          <div class="big">
            ${above}
          </div>

          <small>
            Students in good standing
          </small>

        </div>


        <div class="report-card">

          <span>
            Below 75%
          </span>

          <div class="big">
            ${below}
          </div>

          <small>
            Needs faculty attention
          </small>

        </div>

      </div>


      <div class="table-card report-student-table">

        <div class="report-table-title">

          <h3>
            ${state.year.name}
            — Section ${section}
          </h3>

          <input
            class="search"
            id="reportSearch"
            placeholder="Search student..."
            oninput="filterReportTable()"
          >

        </div>


        <table
          class="data-table"
          id="reportTable"
        >

          <thead>

            <tr>

              <th>Roll</th>
              <th>Student</th>
              <th>Sessions</th>
              <th>Percentage</th>
              <th>Status</th>

            </tr>

          </thead>


          <tbody>

            ${rows.map(r => `

              <tr>

                <td>
                  ${r.roll_no}
                </td>

                <td class="subject">
                  ${r.name}
                </td>

                <td>
                  ${r.sessions}
                </td>

                <td>
                  <b>
                    ${r.percentage}%
                  </b>
                </td>

                <td
                  class="${
                    r.percentage < 75
                      ? "danger-text"
                      : "success-text"
                  }"
                >
                  ${
                    r.sessions === 0
                      ? "No records"
                      : r.percentage < 75
                        ? "Needs attention"
                        : "On track"
                  }
                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

    `;
  };


window.filterReportTable = () => {

  const q =
    ($("#reportSearch")?.value || "")
      .toLowerCase();


  document
    .querySelectorAll(
      "#reportTable tbody tr"
    )
    .forEach(r => {

      r.style.display =
        r.textContent
          .toLowerCase()
          .includes(q)
          ? ""
          : "none";

    });
};


/* =========================================================
   ATTENDANCE HISTORY
   ========================================================= */

async function renderHistory() {

  nav("history");

  header(
    "Attendance History",
    "History"
  );


  let rows = [];


  try {

    rows =
      await api(
        "/api/history"
      );

  } catch (e) {

    toast(
      "Database connection failed"
    );

    return;
  }


  content.innerHTML = `

    <div class="section-head">

      <div>

        <h2>
          Attendance History
        </h2>

        <p>
          Saved attendance sessions
          from the database.
        </p>

      </div>

    </div>


    <div class="history-list">

      ${
        rows.length

          ? rows.map(x => {

              const pct =
                x.total
                  ? Math.round(
                      x.present /
                      x.total *
                      100
                    )
                  : 0;


              return `

                <div class="history-item">

                  <div>

                    <b>
                      ${x.date}
                    </b>

                    <div
                      style="
                        font-size:11px;
                        color:var(--muted);
                        margin-top:4px
                      "
                    >
                      Year ${x.year}
                      • Section ${x.section}
                    </div>

                  </div>


                  <span class="pill">
                    ${pct}% Present
                  </span>


                  <button
                    class="back-btn"
                    onclick="
                      state.year=YEARS.find(
                        y=>y.id===${x.year}
                      );
                      state.section='${x.section}';
                      state.selectedDate='${x.date}';
                      renderAttendance()
                    "
                  >
                    View →
                  </button>

                </div>

              `;

            }).join("")

          : `

            <div class="history-item">

              <b>
                No attendance saved yet.
              </b>

            </div>

          `
      }

    </div>

  `;
}
