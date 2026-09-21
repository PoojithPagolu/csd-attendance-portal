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

  const loginTime = document.getElementById("loginTime");
  const loginDate = document.getElementById("loginDate");

  if (loginTime) {
    loginTime.textContent = india.time;
  }

  if (loginDate) {
    loginDate.textContent = india.date;
  }

  const appTime = document.getElementById("appTime");
  const appDate = document.getElementById("appDate");

  if (appTime) {
    appTime.textContent = india.time;
  }

  if (appDate) {
    appDate.textContent = india.date;
  }
}


document.addEventListener("DOMContentLoaded", function () {
  updateLiveClock();
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

  const sid =
    sessionId ||
    state.session?.session_id;

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

  selectedDate: getIndiaTime().isoDate,

  session: null,

  selectedSession: null
};


const $ = s => document.querySelector(s);

const content = $("#content");


/* =========================================================
   TOAST
   ========================================================= */

function toast(msg) {

  const t = $("#toast");

  if (!t) return;

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


if (
  localStorage.getItem("csdTheme") === "light"
) {
  document.body.classList.add("light");
}


/* =========================================================
   LOGIN CONTROLS
   ========================================================= */

if ($("#loginTheme")) {
  $("#loginTheme").onclick = theme;
}

if ($("#appTheme")) {
  $("#appTheme").onclick = theme;
}


if ($("#showPassword")) {

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

}


if ($("#languageSelect")) {

  $("#languageSelect").onchange = () =>
    toast("English interface selected");

}


/* =========================================================
   LOGIN
   ========================================================= */

if ($("#loginForm")) {

  $("#loginForm").onsubmit = async e => {

    e.preventDefault();

    const u =
      $("#username").value.trim();

    const p =
      $("#password").value;

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

      $("#loginPage")
        .classList
        .add("hidden");

      $("#appPage")
        .classList
        .remove("hidden");

      renderHome();

      toast(
        "Welcome, " +
        r.display_name
      );

    } catch (e) {

      toast(
        "Invalid username or password"
      );

    }
  };

}


/* =========================================================
   LOGOUT
   ========================================================= */

if ($("#logoutBtn")) {

  $("#logoutBtn").onclick = () => {

    $("#appPage")
      .classList
      .add("hidden");

    $("#loginPage")
      .classList
      .remove("hidden");

    $("#loginForm").reset();

    toast("Logged out safely");
  };

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

if ($("#mobileMenu")) {

  $("#mobileMenu").onclick = () =>
    $(".sidebar")?.classList.toggle("open");

}


/* =========================================================
   NAVIGATION
   ========================================================= */

document.addEventListener("click", e => {

  const action =
    e.target
      .closest("[data-action]")
      ?.dataset.action;

  if (!action) return;

  $(".sidebar")
    ?.classList
    .remove("open");


  if (action === "home") {
    renderHome();
  }


  if (action === "attendance") {

    if (!state.year) {
      renderHome();
    } else {
      renderAttendance();
    }

  }


  if (action === "history") {
    renderHistory();
  }


  if (action === "students") {
    renderStudents();
  }


  if (action === "timetable") {
    renderTimetable();
  }


  if (action === "reports") {
    renderReports();
  }

});


function nav(active) {

  document
    .querySelectorAll(".nav-item")
    .forEach(n => {

      n.classList.toggle(
        "active",
        n.dataset.action === active
      );

    });

}


function header(title, crumb = title) {

  $("#pageTitle").textContent =
    title;

  $("#pageCrumb").textContent =
    crumb;
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

          <h3>
            ${y.name}
          </h3>

          <p>
            ${y.subtitle}
          </p>

          <div class="year-sections">

            <span>
              SECTION A
            </span>

            <span>
              SECTION B
            </span>

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

              <h3>
                ${y.name}
              </h3>

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
                onclick="
                  openYear(${y.id});
                  openSection('${s}')
                "
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
    YEARS.find(
      y => y.id === id
    );

  nav("home");

  header(
    state.year.name,
    "Dashboard › " +
    state.year.name
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
          ${state.year.name}
          • SECTION-${s}
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

        <div class="icon">
          ▦
        </div>

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

        <div class="icon">
          ✓
        </div>

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

        <div class="icon">
          ◔
        </div>

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

        <div class="icon">
          ♟
        </div>

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

let TODAY_SESSIONS = [];


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
          The supplied timetable currently covers
          Years 2–4. Add the 1st-year timetable
          when available.
        </p>

      </div>

    `;

    return;
  }


  try {

    /*
      IMPORTANT:

      This loads ALL sessions for TODAY,
      not only the currently running session.
    */

    const data =
      await api(
        `/api/today-sessions?year=${y}&section=${sec}`
      );


    TODAY_SESSIONS =
      data.sessions || [];


    state.selectedDate =
      data.date ||
      getIndiaTime().isoDate;


    state.session = null;

    state.selectedSession = null;


    /* =====================================================
       NO CLASSES / SUNDAY
       ===================================================== */

    if (!TODAY_SESSIONS.length) {

      const holidayText =
        String(
          data.day_name || ""
        ).toLowerCase() === "sunday"

          ? "Sunday is a college holiday. No attendance can be taken today."

          : "There are no scheduled classes for this section today.";


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
              Today's Attendance
            </h2>


            <p>

              ${data.day_name || "Today"}

              • ${data.date || state.selectedDate}

              • Year ${y}

              • Section ${sec}

            </p>

          </div>

        </div>


        <div class="session-lock-card">

          <div class="lock-icon">
            ☀
          </div>


          <h2>
            No attendance sessions today
          </h2>


          <p>
            ${holidayText}
          </p>


          <div class="session-rule">
            The dashboard and other portal
            pages remain available.
          </div>

        </div>

      `;

      return;
    }


    /* =====================================================
       PERIOD STATUS
       ===================================================== */

    function statusFor(session) {

      if (
        session.already_submitted
      ) {

        return {
          cls: "locked",
          text: "🔒 SUBMITTED"
        };

      }


      if (
        session.can_submit
      ) {

        return {
          cls: "open",
          text: "🟢 OPEN"
        };

      }


      return {
        cls: "locked",
        text: "🔒 CLOSED"
      };

    }


    /* =====================================================
       SHOW ALL PERIODS
       ===================================================== */

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
            Today's Period Attendance
          </h2>


          <p>

            ${data.day_name || "Today"}

            • ${data.date || state.selectedDate}

            • Year ${y}

            • Section ${sec}

          </p>

        </div>

      </div>


      <div class="tt-note">

        ⏱

        <b>
          Attendance Control
        </b>

        <br>

        Today's periods are shown below.

        Unsubmitted periods can be opened
        during the college attendance window.

        Submitted periods remain locked.

        After college closes, all unsubmitted
        periods become CLOSED.

      </div>


      <div class="attendance-period-list">


        ${TODAY_SESSIONS.map(
          (session, index) => {

            const status =
              statusFor(session);


            const periods =
              (session.periods || [])
                .map(
                  p => "P" + p
                )
                .join(" + ");


            const currentClass =
              session.is_current
                ? " current-period"
                : "";


            const encodedKey =
              encodeURIComponent(
                session.session_key || ""
              );


            const clickable =
              session.can_submit ||
              session.already_submitted;


            return `

              <div

                class="tt-session${currentClass}"

                ${
                  clickable
                    ? `onclick="
                        openAttendanceSession(
                          '${encodedKey}'
                        )
                      "`
                    : ""
                }

                style="
                  cursor:
                  ${clickable
                    ? "pointer"
                    : "default"}
                "

              >


                <div class="tt-time">

                  <b>
                    Period ${index + 1}
                  </b>

                  <br>

                  ${
                    session.time_label ||
                    "Time not specified"
                  }

                </div>


                <div class="tt-subject">

                  <b>

                    ${
                      session.subject_name ||
                      "Subject"
                    }

                  </b>


                  <span>

                    ${
                      session.subject_code ||
                      ""
                    }

                    ${
                      periods
                        ? " • " + periods
                        : ""
                    }

                  </span>


                  <small>

                    👤

                    ${
                      session.faculty_name ||
                      "Faculty not specified"
                    }

                  </small>

                </div>


                <div
                  class="
                    session-status
                    ${status.cls}
                  "
                >

                  ${status.text}

                </div>


              </div>

            `;

          }
        ).join("")}


      </div>

    `;


  } catch (e) {

    console.error(e);

    toast(
      e.message ||
      "Could not load today's attendance periods"
    );

  }

}


/* =========================================================
   OPEN ONE ATTENDANCE PERIOD
   ========================================================= */

window.openAttendanceSession =
async function(encodedKey) {

  const key =
    decodeURIComponent(
      encodedKey || ""
    );


  const session =
    TODAY_SESSIONS.find(
      s =>
        s.session_key === key
    );


  if (!session) {

    toast(
      "Attendance period not found"
    );

    return;
  }


  /*
    CLOSED sessions cannot be opened.

    SUBMITTED sessions can be viewed.
    OPEN sessions can be edited.
  */

  if (
    !session.can_submit &&
    !session.already_submitted
  ) {

    toast(
      "This attendance period is closed."
    );

    return;
  }


  state.selectedSession =
    session;


  state.session =
    session;


  try {

    if (session.session_id) {

      /*
        Existing submitted session.
      */

      await loadAttendance(
        session.session_id
      );

    } else {

      /*
        New session.

        Everyone starts as absent.
        Faculty clicks students to mark present.
      */

      await loadStudents();


      state.attendance = {};


      STUDENTS.forEach(
        student => {

          state.attendance[
            student[0]
          ] = false;

        }
      );

    }


    renderAttendanceSession(
      session
    );


  } catch (e) {

    console.error(e);

    toast(
      e.message ||
      "Could not open attendance"
    );

  }

};


/* =========================================================
   ATTENDANCE STUDENT SCREEN
   ========================================================= */

function renderAttendanceSession(
  session
) {

  const locked =
    Boolean(
      session.already_submitted
    ) ||
    !Boolean(
      session.can_submit
    );


  const faculty =
    session.faculty_name ||
    "Faculty not specified";


  const records =
    STUDENTS.map(
      st => ({

        roll: st[0],

        name: st[1],

        present:
          state.attendance[
            st[0]
          ] === true

      })
    );


  content.innerHTML = `

    <div class="section-head">

      <div>

        <button
          class="back-btn"
          onclick="renderAttendance()"
        >
          ← All Today's Periods
        </button>


        <h2 style="margin-top:18px">

          ${
            session.subject_name ||
            "Attendance"
          }

        </h2>


        <p>

          ${
            session.subject_code ||
            ""
          }

          ${
            session.subject_code
              ? " • "
              : ""
          }

          ${faculty}

          •

          ${
            session.time_label ||
            ""
          }

        </p>

      </div>

    </div>


    <div
      class="live-session-card"
      style="
        --accent:
        ${state.year?.color || "#22d3ee"}
      "
    >

      <div>

        <span class="eyebrow">

          ${
            session.already_submitted

              ? "SESSION SUBMITTED"

              : locked

                ? "ATTENDANCE CLOSED"

                : "OPEN ATTENDANCE SESSION"

          }

        </span>


        <h3>

          ${
            session.time_label ||
            ""
          }

        </h3>


        <p>

          <b>

            ${
              session.subject_name ||
              "Subject"
            }

          </b>

          •

          ${faculty}

          •

          Periods

          ${
            (
              session.periods ||
              []
            ).join(", ")
          }

        </p>

      </div>


      <div
        class="
          session-status
          ${locked
            ? "locked"
            : "open"}
        "
      >

        ${
          session.already_submitted

            ? "🔒 SUBMITTED"

            : locked

              ? "🔒 CLOSED"

              : "🟢 OPEN"

        }

      </div>

    </div>


    <div class="attendance-toolbar">


      <input
        id="studentSearch"
        class="search"
        placeholder="
          ⌕ Search student by name or roll no...
        "
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

            <span>
              Roll No.
            </span>

            <span>
              Student Name
            </span>

            <span>
              Present
            </span>

          </div>


          <div id="studentRows">

            ${
              records
                .map(
                  (r, i) =>
                    rowHTML(
                      r,
                      i,
                      locked
                    )
                )
                .join("")
            }

          </div>


        </div>


        <div class="save-bar">


          <div>

            <span
              style="color:var(--green)"
            >
              Present
            </span>


            <strong>
              ${countPresent()}
            </strong>


            &nbsp;


            <span
              style="color:var(--red)"
            >
              Absent
            </span>


            <strong>

              ${
                STUDENTS.length -
                countPresent()
              }

            </strong>

          </div>


          ${
            locked

              ? `

                <div class="locked-note">

                  ${
                    session.already_submitted

                      ? "✓ Submitted once • Further submissions blocked"

                      : "🔒 Attendance window closed"

                  }

                </div>

              `

              : `

                <button
                  class="save-btn"
                  onclick="saveAttendance()"
                >

                  ▣ Submit Attendance

                </button>

              `
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

              <i
                class="dot green"
              ></i>

              Present

            </span>


            <b>
              ${countPresent()}
            </b>

          </div>


          <div>

            <span>

              <i
                class="dot red"
              ></i>

              Absent

            </span>


            <b>

              ${
                STUDENTS.length -
                countPresent()
              }

            </b>

          </div>


        </div>


        <div class="keyboard-tip">

          <b>

            ${
              session.subject_name ||
              "Subject"
            }

          </b>

          <br>


          ${
            locked

              ? "This session is locked and cannot be changed."

              : "Attendance is open for this session."

          }

        </div>


      </aside>


    </div>

  `;

}


/* =========================================================
   STUDENT ROW
   ========================================================= */

function rowHTML(
  r,
  i,
  locked = false
) {

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
        style="
          display:flex;
          align-items:center;
          gap:10px
        "
      >

        <span
          class="student-avatar"
        >

          ${
            r.name
              .split(" ")
              .map(
                x => x[0]
              )
              .join("")
              .slice(0, 2)
          }

        </span>


        ${r.name}

      </span>


      <button
        class="
          check-btn
          ${r.present
            ? "checked"
            : ""}
        "
        ${locked
          ? "disabled"
          : ""}
        onclick="
          toggleStudent('${r.roll}')
        "
      >

        ${
          r.present
            ? "✓"
            : ""
        }

      </button>


    </div>

  `;
}


/* =========================================================
   ATTENDANCE TOGGLE
   ========================================================= */

window.toggleStudent =
roll => {

  if (
    state.selectedSession
      ?.already_submitted ||

    !state.selectedSession
      ?.can_submit
  ) {

    return;
  }


  state.attendance[roll] =
    state.attendance[roll] === true
      ? false
      : true;


  renderAttendanceLocal();
};


/* =========================================================
   COUNT PRESENT
   ========================================================= */

function countPresent() {

  return STUDENTS.filter(
    s =>
      state.attendance[
        s[0]
      ] === true
  ).length;
}


/* =========================================================
   PERCENTAGE
   ========================================================= */

function percentage() {

  return STUDENTS.length

    ? Math.round(
        countPresent() /
        STUDENTS.length *
        100
      )

    : 0;
}


/* =========================================================
   UPDATE ATTENDANCE SCREEN
   ========================================================= */

function renderAttendanceLocal() {


  document
    .querySelectorAll(
      ".student-row"
    )
    .forEach(row => {

      const button =
        row.querySelector(
          ".check-btn"
        );


      if (
        !button ||
        button.disabled
      ) {
        return;
      }


      const roll =
        row.dataset.roll;


      const present =
        state.attendance[
          roll
        ] === true;


      button.classList.toggle(
        "checked",
        present
      );


      button.textContent =
        present
          ? "✓"
          : "";

    });


  const present =
    countPresent();


  const absent =
    STUDENTS.length -
    present;


  const percent =
    percentage();


  const bar =
    document.querySelector(
      ".save-bar > div:first-child"
    );


  if (bar) {

    bar.innerHTML = `

      <span
        style="color:var(--green)"
      >
        Present
      </span>


      <strong>
        ${present}
      </strong>


      &nbsp;


      <span
        style="color:var(--red)"
      >
        Absent
      </span>


      <strong>
        ${absent}
      </strong>

    `;

  }


  const summaryCard =
    document.querySelector(
      ".summary-card"
    );


  if (summaryCard) {

    const ring =
      summaryCard.querySelector(
        ".ring"
      );


    if (ring) {

      ring.style.background =
        `conic-gradient(
          var(--green) 0 ${percent}%,
          var(--red) ${percent}% 100%
        )`;


      const percentageText =
        ring.querySelector(
          "strong"
        );


      if (percentageText) {

        percentageText.textContent =
          `${percent}%`;

      }

    }


    const legend =
      summaryCard.querySelector(
        ".legend"
      );


    if (legend) {

      legend.innerHTML = `

        <div>

          <span>

            <i
              class="dot green"
            ></i>

            Present

          </span>

          <b>
            ${present}
          </b>

        </div>


        <div>

          <span>

            <i
              class="dot red"
            ></i>

            Absent

          </span>

          <b>
            ${absent}
          </b>

        </div>

      `;

    }

  }

}


/* =========================================================
   MARK ALL
   ========================================================= */

window.markAll =
val => {

  if (
    state.selectedSession
      ?.already_submitted ||

    !state.selectedSession
      ?.can_submit
  ) {

    return;
  }


  STUDENTS.forEach(
    s =>
      state.attendance[
        s[0]
      ] = val
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

window.filterStudents =
() => {

  const q =
    (
      document
        .getElementById(
          "studentSearch"
        )
        ?.value || ""
    )
      .toLowerCase()
      .trim();


  document
    .querySelectorAll(
      ".student-row"
    )
    .forEach(r => {

      r.style.display =

        (
          r.dataset.name
            .includes(q)

          ||

          r.dataset.roll
            .includes(q)

        )

          ? "grid"

          : "none";

    });

};


/* =========================================================
   SAVE ATTENDANCE
   ========================================================= */

window.saveAttendance =
async () => {

  try {

    const y =
      state.year?.id;


    const sec =
      state.section || "A";


    const session =
      state.selectedSession;


    if (
      !session?.session_key
    ) {

      throw new Error(
        "Please select an OPEN attendance period first."
      );

    }


    if (
      session.already_submitted
    ) {

      throw new Error(
        "Attendance is already submitted for this period."
      );

    }


    if (
      !session.can_submit
    ) {

      throw new Error(
        "Attendance is closed. You can no longer submit this period."
      );

    }


    await api(
      "/api/attendance",
      {

        method: "POST",


        body: JSON.stringify({

          year: y,

          section: sec,

          session_key:
            session.session_key,


          records:

            STUDENTS.map(
              s => ({

                roll_no:
                  s[0],

                status:

                  state.attendance[
                    s[0]
                  ] === true

                    ? "present"

                    : "absent"

              })
            ),


          submitted_by:
            "DATA SCIENCE"

        })

      }
    );


    toast(
      "Attendance submitted successfully • session locked"
    );


    state.selectedSession =
      null;


    state.session =
      null;


    setTimeout(
      renderAttendance,
      500
    );


  } catch (e) {

    console.error(e);


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
        (
          byDay[x.day] ??= []
        ).push(x)
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
                    x =>
                      x.day === d
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
                      class="
                        tt-session
                        ${
                          x.periods.length > 1
                            ? "lab-session"
                            : ""
                        }
                      "
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

                          ${
                            x.periods
                              .map(
                                p =>
                                  "P" + p
                              )
                              .join(" + ")
                          }

                        </span>

                      </div>


                      <div class="tt-faculty">

                        👤

                        ${
                          x.faculty_name ||
                          "Not specified"
                        }

                      </div>

                    </div>

                  `)

                  .join("")}

              </div>

            </div>

          `)

          .join("")}


        <div
          class="tt-day holiday"
        >

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


  const selectedYear =
    state.studentListYear || 0;


  const selectedSection =
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

                ? `openSection(
                    '${state.section || "A"}'
                  )`

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


      <div
        class="year-filter
        student-year-filter"
      >

        <button
          class="filter-year ${
            selectedYear === 0
              ? "selected"
              : ""
          }"
          style="--accent:#94a3b8"
          onclick="
            showStudentList(
              0,
              '${selectedSection}'
            )
          "
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
            onclick="
              showStudentList(
                ${y.id},
                '${selectedSection}'
              )
            "
          >
            ${y.name}
          </button>

        `).join("")}

      </div>


      <div
        class="
          year-filter
          student-section-filter
        "
      >

        ${[
          "ALL",
          "A",
          "B"
        ]
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
                        y.id ===
                        selectedYear
                    ).color

                  : "#94a3b8"
              }"
              onclick="
                showStudentList(
                  ${selectedYear},
                  '${sec}'
                )
              "
            >

              ${
                sec === "ALL"

                  ? "ALL SECTIONS"

                  : "SECTION " +
                    sec
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
            placeholder="
              Search name, roll no. or phone number...
            "
            oninput="
              filterStudentTable()
            "
          >

        </div>


        <table
          class="data-table"
          id="studentTable"
        >

          <thead>

            <tr>

              <th>#</th>

              <th>
                Year
              </th>

              <th>
                Section
              </th>

              <th>
                Roll No.
              </th>

              <th>
                Student
              </th>

              <th>
                Phone No.
              </th>

              <th>
                Contact
              </th>

            </tr>

          </thead>


          <tbody>

            ${rows.map(
              (r, i) => {

                const phone =
                  (
                    r.phone ||
                    ""
                  ).trim();


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

                    : status ===
                      "needs_verification"

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

                    : status ===
                      "needs_verification"

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
                            y.id ===
                            r.year
                        )?.name ||
                        r.year
                      }

                    </td>


                    <td>
                      Section
                      ${r.section}
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

              }
            ).join("")}

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


window.filterStudentTable =
() => {

  const q =
    (
      $("#studentSearch")
        ?.value || ""
    )
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

    <button
  class="primary download-excel-btn"
  onclick="downloadExcel()"
>
  📥 Download Excel
</button>

    </div>


    <div class="year-filter">

      ${YEARS.map(y => `

        <button
          class="
            filter-year
            ${
              selected === y.id
                ? "selected"
                : ""
            }
          "
          style="--accent:${y.color}"
          onclick="
            showYearReport(${y.id})
          "
        >
          ${y.name}
        </button>

      `).join("")}

    </div>


    <div id="yearReport"></div>

  `;


  showYearReport(
    selected
  );

}


window.showYearReport =
async id => {

  state.year =
    YEARS.find(
      y => y.id === id
    );


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
              a +
              Number(
                b.percentage
              ),
            0
          ) /
          rows.length

        )

      : 0;


  const above =
    rows.filter(
      r =>
        r.percentage >= 75
    ).length;


  const below =
    rows.length -
    above;


  $("#yearReport").innerHTML = `

    <div
      class="report-year-banner"
      style="
        --accent:
        ${state.year.color}
      "
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


    <div
      class="
        table-card
        report-student-table
      "
    >

      <div class="report-table-title">

        <h3>
          ${state.year.name}
          — Section ${section}
        </h3>


        <input
          class="search"
          id="reportSearch"
          placeholder="
            Search student...
          "
          oninput="
            filterReportTable()
          "
        >

      </div>


      <table
        class="data-table"
        id="reportTable"
      >

        <thead>

          <tr>

            <th>
              Roll
            </th>

            <th>
              Student
            </th>

            <th>
              Sessions
            </th>

            <th>
              Percentage
            </th>

            <th>
              Status
            </th>

          </tr>

        </thead>


        <tbody>

          ${rows.map(
            r => `

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

            `
          ).join("")}

        </tbody>

      </table>

    </div>

  `;

};


window.filterReportTable =
() => {

  const q =
    (
      $("#reportSearch")
        ?.value || ""
    )
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

          ? rows.map(
              x => {

                const pct =
                  x.total

                    ? Math.round(
                        x.present /
                        x.total *
                        100
                      )

                    : 0;


                return `

                  <div
                    class="history-item"
                  >

                    <div>

                     <div>
  <b>
    ${x.date}
  </b>

  <div style="
    font-size:12px;
    color:var(--muted);
    margin-top:5px
  ">
    Year ${x.year} • Section ${x.section}
  </div>

  <div style="
    font-size:13px;
    margin-top:8px;
    font-weight:700;
  ">
    📚 ${x.subject_name || "Subject"}
  </div>

  <div style="
    font-size:12px;
    margin-top:5px;
    color:var(--muted);
  ">
    🕐 Period ${x.periods || "-"} •
    ${x.start_time || "--:--"} – ${x.end_time || "--:--"}
  </div>
</div>


                      <div
                        style="
                          font-size:11px;
                          color:var(--muted);
                          margin-top:4px
                        "
                      >

                        Year
                        ${x.year}

                        • Section
                        ${x.section}

                      </div>

                    </div>


                    <span class="pill">
                      ${pct}% Present
                    </span>


                    <button
                      class="back-btn"
                      onclick="
                        state.year =
                          YEARS.find(
                            y =>
                              y.id ===
                              ${x.year}
                          );

                        state.section =
                          '${x.section}';

                        state.selectedDate =
                          '${x.date}';

                        renderAttendance();
                      "
                    >
                      View →
                    </button>


                  </div>

                `;

              }
            ).join("")

          : `

              <div
                class="history-item"
              >

                <b>
                  No attendance saved yet.
                </b>

              </div>

            `
      }

    </div>

  `;

}
// =========================================================
// DOWNLOAD EXCEL
// =========================================================

window.downloadExcel = function () {

  const year = state.year?.id || 2;
  const section = state.section || "A";

  const url =
    `/api/export.xlsx?year=${encodeURIComponent(year)}&section=${encodeURIComponent(section)}`;

  window.location.href = url;
};
