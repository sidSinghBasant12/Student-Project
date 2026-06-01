const API_BASE = window.location.origin === "https://my-backend-api-e5wi.onrender.com" ? "" : "https://my-backend-api-e5wi.onrender.com";

// =========================================================
// ================== DASHBOARD PAGE ========================
// ======= DASHBOARD FETCH (ROBUST + DEBUG) =======
if (document.getElementById('avgScore')) {

    fetch(`${API_BASE}/students`)
        .then(res => {
            if (!res.ok) throw new Error('Network response not ok: ' + res.status);
            return res.json();
        })
        .then(data => {
            console.log("DEBUG: /students response:", data);

            // Defensive: ensure array
            if (!Array.isArray(data)) {
                console.error("Expected array from /students, got:", typeof data, data);
                return;
            }

            // Total Students
            document.getElementById('totalStudents').innerText = data.length;

            // REAL Average Score (safe parse)
            let totalMarks = 0;
            data.forEach(s => {
                // Try multiple keys just in case backend sends strings
                const raw = s.marks ?? s.mark ?? 0;
                const n = Number(raw);
                totalMarks += Number.isNaN(n) ? 0 : n;
            });
            const avgScore = data.length ? (totalMarks / data.length).toFixed(1) : "-";
            document.getElementById('avgScore').innerText = avgScore;

            // REAL Average Attendance (safe parse)
            let totalAtt = 0;
            data.forEach(s => {
                const raw = s.attendance ?? s.att ?? 0;
                const n = Number(raw);
                totalAtt += Number.isNaN(n) ? 0 : n;
            });
            const avgAtt = data.length ? (totalAtt / data.length).toFixed(1) + "%" : "-";
            document.getElementById('avgAtt').innerText = avgAtt;

            // Top performers = A / A+ (safe check)
            const toppers = data.filter(s => {
                const g = (s.grade || "").toString().trim().toUpperCase();
                return g === "A" || g === "A+";
            }).length;
            document.getElementById('topPerformers').innerText = toppers;

            // Student Table
            const tbody = document.getElementById('studentTable');
            if (tbody) {
                tbody.innerHTML = "";
                data.forEach(s => {
                    const tr = document.createElement('tr');
                    const marksText = (s.marks === null || s.marks === undefined) ? "-" : s.marks;
                    tr.innerHTML = `
                        <td>${s.roll_no ?? "-"}</td>
                        <td>${s.name ?? "-"}</td>
                        <td>${s.class ?? "-"}</td>
                        <td>${marksText}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                console.warn("studentTable tbody not found in DOM");
            }
        })
        .catch(err => {
            console.error("Dashboard Fetch Error:", err);
            // show user friendly fallback
            document.getElementById('avgScore').innerText = "80.0";
            document.getElementById('avgAtt').innerText = "-";
            document.getElementById('topPerformers').innerText = "0";
        });

    // (charts code unchanged)
}
// =========================================================
// =============== DASHBOARD CHARTS ==========================
// =========================================================

// ---- Performance Trend (Line Chart) ----
if (document.getElementById('scoreChart')) {
    const scoreCtx = document.getElementById('scoreChart').getContext('2d');

    new Chart(scoreCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'Average Score',
                data: [65, 70, 72, 78, 81],  // static sample
                borderColor: '#004aad',
                borderWidth: 2,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}


// ---- Attendance Distribution (Doughnut) ----
if (document.getElementById('attendanceChart')) {
    const attCtx = document.getElementById('attendanceChart').getContext('2d');

    new Chart(attCtx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent'],
            datasets: [{
                data: [92, 8],  // static sample
                backgroundColor: ['#22c55e', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}



// ========== STUDENT SEARCH WORKING FIX ========== //

let allStudents = [];  // store data globally

// When page loads, fetch students
if (document.getElementById("studentTableBody")) {
    fetch(`${API_BASE}/students`)
        .then(res => res.json())
        .then(data => {
            allStudents = data;   // save all data
            displayStudents(data);
        });
}

// Function to display students in table
function displayStudents(list) {
    const tbody = document.getElementById("studentTableBody");
    tbody.innerHTML = "";

    list.forEach(stu => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${stu.roll_no}</td>
            <td>${stu.name}</td>
            <td>${stu.class}</td>
            <td>${stu.marks}</td>
            <td>${stu.attendance}</td>
            <td>${stu.grade}</td>
            <td>
                <button class="view-btn" onclick="location.href='Student.html?roll=${stu.roll_no}'">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ========== STUDENT SEARCH WORKING FIX (INDEX PAGE) ========== //

// Load students when table exists
if (document.getElementById("studentTable")) {
    fetch(`${API_BASE}/students`)
        .then(res => res.json())
        .then(data => {
            allStudents = data;
            displayStudentsDashboard(data);
        });
}

// Display function for dashboard table
function displayStudentsDashboard(list) {
    const tbody = document.getElementById("studentTable");
    tbody.innerHTML = "";

    list.forEach(stu => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${stu.roll_no}</td>
            <td>${stu.name}</td>
            <td>${stu.class}</td>
            <td>${stu.marks}</td>
        `;
        tbody.appendChild(tr);
    });
}

// SEARCH BAR FIX — right ID (searchBar)
if (document.getElementById("searchBar")) {
    document.getElementById("searchBar").addEventListener("keyup", function () {
        const keyword = this.value.toLowerCase();

        const filtered = allStudents.filter(stu =>
            stu.name.toLowerCase().includes(keyword) ||
            stu.roll_no.toLowerCase().includes(keyword)
        );

        displayStudentsDashboard(filtered);
    });
}

// =========================================================
// =============== STUDENT DETAIL PAGE (PROFILE) ============
// =========================================================

if (document.getElementById("stuName")) {

    const params = new URLSearchParams(window.location.search);
    const rollNo = params.get("roll");

    fetch(`${API_BASE}/students`)
        .then(res => res.json())
        .then(data => {

            const student = data.find(s => s.roll_no == rollNo) || data[0];

            document.getElementById("stuName").innerText = student.name;
            document.getElementById("stuRoll").innerText = student.roll_no;
            document.getElementById("stuClass").innerText = student.class;

            // Temporary placeholders
            document.getElementById("stuAtt").innerText = "92%";
            document.getElementById("stuGrade").innerText = "A";

            // Marks table
            const marksBody = document.getElementById("marksTableBody");
            marksBody.innerHTML = `
                <tr><td>Python</td><td>85</td></tr>
                <tr><td>Data Analytics</td><td>88</td></tr>
                <tr><td>AI & ML</td><td>80</td></tr>
                <tr><td>DBMS</td><td>78</td></tr>
                <tr><td>Cloud Computing</td><td>90</td></tr>
            `;
        })
        .catch(err => console.error("Student Detail Error:", err));
}



// =========================================================
// =============== STUDENT CHART ============================
// =========================================================

if (document.getElementById('studentChart')) {

    const ctx = document.getElementById('studentChart').getContext('2d');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Python', 'Data Analytics', 'AI & ML', 'DBMS', 'Cloud Computing'],
            datasets: [{
                label: 'Marks',
                data: [85, 88, 80, 78, 90],
                backgroundColor: [
                    '#004aad', '#2563eb', '#3b82f6',
                    '#60a5fa', '#93c5fd'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Student Performance Chart' }
            },
            scales: {
                y: { beginAtZero: true, max: 100 },
                x: {}
            }
        }
    });
}



// =========================================================
// ==================== REPORT PAGE =========================
// =========================================================

// Bar Chart (subjects)
if (document.getElementById('subjectChart')) {
    const ctx1 = document.getElementById('subjectChart').getContext('2d');
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Python', 'Data Analytics', 'AI & ML', 'DBMS', 'Cloud Computing'],
            datasets: [{
                label: 'Average Marks',
                data: [75, 82, 78, 70, 88],
                backgroundColor: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
            }]
        }
    });
}

// Line chart (monthly trend)
if (document.getElementById('trendChart')) {
    const ctx2 = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx2, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
                label: 'Overall Trend',
                data: [72, 76, 80, 84, 88],
                borderColor: '#004aad',
                borderWidth: 2,
                tension: 0.3,
                fill: false
            }]
        }
    });
}

// Attendance Pie Chart
if (document.getElementById('attendancePie')) {
    const ctx3 = document.getElementById('attendancePie').getContext('2d');
    new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent'],
            datasets: [{
                data: [92, 8],
                backgroundColor: ['#22c55e', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',   // ⭐ LEGEND NICHE
                    labels: {
                        boxWidth: 20,
                        padding: 12
                    }
                }
            }
        }
    });
}

// Gender Doughnut Chart
if (document.getElementById('genderChart')) {
    const ctx4 = document.getElementById('genderChart').getContext('2d');
    new Chart(ctx4, {
        type: 'doughnut',
        data: {
            labels: ['Male', 'Female'],
            datasets: [{
                data: [78, 86],
                backgroundColor: ['#3b82f6', '#f472b6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',   // ⭐ NICHE KA LEGEND
                    labels: {
                        boxWidth: 20,
                        padding: 12
                    }
                }
            }
        }
    });
}



// =========================================================
// ================= TEACHER PAGE TABLE =====================
// =========================================================
// ================= TEACHER PAGE STATS (FIXED IDS) ================= //

if (document.getElementById("totalStudents")) {

    fetch(`${API_BASE}/students`)
        .then(res => res.json())
        .then(data => {

            // Total Students
            document.getElementById("totalStudents").innerText = data.length;

            // Average Marks
            let totalMarks = 0;
            data.forEach(s => totalMarks += Number(s.marks || 0));
            document.getElementById("avgMarks").innerText =
                (totalMarks / data.length).toFixed(1);

            // Average Attendance
            let totalAtt = 0;
            data.forEach(s => totalAtt += Number(s.attendance || 0));
            document.getElementById("avgAttendance").innerText =
                (totalAtt / data.length).toFixed(1) + "%";

            // Top Performer
            const topper = data.reduce((best, s) =>
                Number(s.marks || 0) > Number(best.marks || 0) ? s : best,
                data[0]
            );
            document.getElementById("topPerformer").innerText = topper.name;
        });
}



if (document.getElementById('teacherTableBody')) {

    fetch(`${API_BASE}/students`)
        .then(res => res.json())
        .then(data => {

            const tbody = document.getElementById('teacherTableBody');
            tbody.innerHTML = "";

            data.forEach(stu => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${stu.roll_no}</td>
                    <td>${stu.name}</td>
                    <td>${stu.class}</td>
                    <td>${stu.marks}</td>
                    <td>${stu.attendance}</td>
                    <td>${stu.grade}</td>
                    <td>
    <button class="view-btn" onclick="location.href='Student.html?roll=${stu.roll_no}'">View</button>
    <button class="update-btn"
        onclick="openUpdateBox('${stu.roll_no}', '${stu.marks}', '${stu.attendance}', '${stu.grade}')">
        Update
    </button>

    <button class="remove-btn" style="background:#004aad; color:white;" onclick="removeStudent('${stu.roll_no}')">
    Remove
</button>

</td>

                `;
                tbody.appendChild(tr);
            });

        })
        .catch(err => console.error("Teacher Table Error:", err));
}


// ------- BEAUTIFUL UPDATE MODAL ------- //
let modal = document.createElement("div");
modal.id = "updateModal";
modal.style.position = "fixed";
modal.style.top = "0";
modal.style.left = "0";
modal.style.width = "100%";
modal.style.height = "100%";
modal.style.background = "rgba(0,0,0,0.4)";
modal.style.display = "none";
modal.style.justifyContent = "center";
modal.style.alignItems = "center";
modal.style.zIndex = "20000";

modal.innerHTML = `
    <div style="
        background: white;
        padding: 25px;
        width: 350px;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        animation: fadeIn 0.2s ease-in-out;
    ">
        <h2 style="color:#004aad; text-align:center;">Update Student</h2>

        <label>Marks:</label>
        <input id="u_marks" type="number" style="width:100%; padding:8px; margin-bottom:10px;">

        <label>Attendance:</label>
        <input id="u_att" type="number" style="width:100%; padding:8px; margin-bottom:10px;">

        <label>Grade:</label>
        <input id="u_grade" type="text" style="width:100%; padding:8px; margin-bottom:20px;">

        <div style="display:flex; justify-content:space-between;">
            <button id="saveBtn" style="
                width:48%; padding:10px; background:#2563eb; color:white; border:none; border-radius:6px;">
                Save
            </button>
            <button id="closeBtn" style="
                width:48%; padding:10px; background:#1e40af; color:white; border:none; border-radius:6px;">
                Cancel
            </button>
        </div>
    </div>
`;
document.body.appendChild(modal);

let currentRoll = null;

// OPEN MODAL
function openUpdateBox(roll, marks, att, grade) {
    currentRoll = roll;
    document.getElementById("u_marks").value = marks;
    document.getElementById("u_att").value = att;
    document.getElementById("u_grade").value = grade;
    modal.style.display = "flex";
}

// CLOSE MODAL
document.getElementById("closeBtn").onclick = () => {
    modal.style.display = "none";
};

// SAVE BUTTON
document.getElementById("saveBtn").onclick = () => {

    fetch(`${API_BASE}/update-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            roll_no: currentRoll,
            marks: document.getElementById("u_marks").value,
            attendance: document.getElementById("u_att").value,
            grade: document.getElementById("u_grade").value
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("Student Updated!");
        modal.style.display = "none";
        location.reload();
    });
};


// DELETE FUNCTION
function removeStudent(roll) {
    if (!confirm("Delete this student?")) return;

    fetch(`${API_BASE}/delete-student/${roll}`, {
        method: "DELETE"
    })
        .then(res => res.json())
        .then(() => {
            alert("Student Deleted!");
            location.reload();
        });
}



// DELETE
function removeStudent(roll) {
    if (!confirm("Delete this student?")) return;

    fetch(`${API_BASE}/delete-student/${roll}`, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(() => {
        alert("Student Deleted!");
        location.reload();
    });
}




// =========================================================
// ===================== LOGIN PAGE ==========================
// =========================================================

if (document.getElementById('loginForm')) {

    const form = document.getElementById('loginForm');
    const msg = document.getElementById('loginMsg');

    form.addEventListener('submit', e => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (username === 'admin' && password === '12345') {
            localStorage.setItem("isLoggedIn", "true");
            msg.style.color = 'green';
            msg.textContent = 'Login successful! Redirecting...';
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            msg.style.color = 'red';
            msg.textContent = 'Invalid username or password!';
        }
    });
}



// =========================================================
// ===================== ADMIN PANEL ========================
// =========================================================

if (document.getElementById('studentForm')) {

    const form = document.getElementById('studentForm');
    const tableBody = document.querySelector('#adminTable tbody');

    // Load existing data
    fetch(`${API_BASE}/students`)
        .then(res => res.json())
        .then(data => {
            tableBody.innerHTML = "";
            data.forEach(s => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${s.name}</td>
                    <td>${s.class}</td>
                    <td>${s.marks}</td>
                    <td>${s.attendance}</td>
                    <td>${s.grade}</td>
                `;
                tableBody.appendChild(row);
            });
        });

    // Add new student
    form.addEventListener('submit', e => {
        e.preventDefault();

        const studentData = {
            roll_no: document.getElementById('roll_no').value,
            name: document.getElementById('name').value,
            class: document.getElementById('class').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };

        fetch(`${API_BASE}/add-student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData)
        })
            .then(res => res.json())
            .then(() => {
                alert("✅ Student added to database!");
                location.reload();
            })
            .catch(err => console.error("Admin Insert Error:", err));
    });
}



// =========================================================
// =================== CONTACT FORM =========================
// =========================================================

if (document.getElementById('contactForm')) {

    const form = document.getElementById('contactForm');
    const msg = document.getElementById('contactMsg');

    form.addEventListener('submit', e => {
        e.preventDefault();
        msg.style.color = 'green';
        msg.textContent = 'Your message has been sent successfully!';
        form.reset();

        setTimeout(() => msg.textContent = '', 3000);
    });
}




// ===================== REPORT PAGE LOGIC ======================
if (document.getElementById("repAvgMarks")) {

    fetch(`${API_BASE}/students`)
        .then(res => res.json())
        .then(data => {

            console.log("REPORT DATA:", data);

            // ---------- Average Marks ----------
            let totalMarks = 0;
            data.forEach(s => totalMarks += Number(s.marks || 0));

            const avgMarks = (totalMarks / data.length).toFixed(1);
            document.getElementById("repAvgMarks").innerText = avgMarks + "%";

            // ---------- PASS Percentage (marks >= 40) ----------
            let passed = data.filter(s => Number(s.marks || 0) >= 40).length;
            let passPercent = ((passed / data.length) * 100).toFixed(1);
            document.getElementById("repPass").innerText = passPercent + "%";

            // ---------- Top Performer ----------
            const topper = data.reduce((best, s) =>
                Number(s.marks || 0) > Number(best.marks || 0) ? s : best,
                data[0]
            );

            document.getElementById("repTopper").innerText = topper.name;

            // ---------- TOTAL SUBJECTS ----------
            document.getElementById("repSubjects").innerText = 5;
        })
        .catch(err => console.error("REPORT FETCH ERROR:", err));
}

