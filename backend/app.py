import os
from flask import request, jsonify
from flask_cors import CORS
from db import app, mysql

# Determine frontend folder path (relative to this file)
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend_static")

allowed_origins = os.environ.get("CORS_ORIGINS", "http://127.0.0.1:5000,http://localhost:5000").split(",")
CORS(app, origins=allowed_origins)


@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve_frontend(path):
    # Never intercept API routes
    if path in ("students", "add-student", "update-marks") or path.startswith("delete-student"):
        return {"error": "Not found"}, 404
    filepath = os.path.join(FRONTEND_DIR, path)
    if not os.path.exists(filepath) or os.path.isdir(filepath):
        filepath = os.path.join(FRONTEND_DIR, "index.html")
    if not os.path.exists(filepath):
        return "Student Insight Backend Running Successfully ✅"
    ext = os.path.splitext(filepath)[1]
    mime = {"": "text/html", ".html": "text/html", ".css": "text/css", ".js": "application/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon"}
    with open(filepath, "r" if ext in ("", ".html", ".css", ".js", ".svg") else "rb") as f:
        data = f.read()
    ct = mime.get(ext, "application/octet-stream")
    if isinstance(data, str):
        return data, 200, {"Content-Type": ct}
    return data, 200, {"Content-Type": ct}

@app.route("/students", methods=["GET"])
def get_students():
    cur = mysql.connection.cursor()

    cur.execute("""
        SELECT 
            roll_no,
            name,
            class,
            marks,
            attendance,
            grade,
            email,
            phone
        FROM students
    """)

    rows = cur.fetchall()
    cur.close()

    students = []
    for r in rows:
        students.append({
            "roll_no": r[0],
            "name": r[1],
            "class": r[2],
            "marks": int(r[3]) if r[3] is not None else 0,
            "attendance": int(r[4]) if r[4] is not None else 0,
            "grade": r[5],
            "email": r[6],
            "phone": r[7]
        })

    return jsonify(students)


# ✅ ADD STUDENT
@app.route('/add-student', methods=['POST'])
def add_student():
    data = request.json

    cur = mysql.connection.cursor()
    cur.execute("""
        INSERT INTO students (roll_no, name, class, email, phone)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        data['roll_no'],
        data['name'],
        data['class'],
        data['email'],
        data['phone']
    ))

    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Student added successfully!"})


# ✅ UPDATE MARKS
@app.route('/update-marks', methods=['POST'])
def update_marks():
    data = request.json

    cur = mysql.connection.cursor()
    cur.execute("""
        UPDATE students 
        SET marks=%s, attendance=%s, grade=%s
        WHERE roll_no=%s
    """, (
        data['marks'],
        data['attendance'],
        data['grade'],
        data['roll_no']
    ))

    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Student updated successfully"})


# ✅ DELETE STUDENT
@app.route('/delete-student/<int:roll_no>', methods=['DELETE'])
def delete_student(roll_no):
    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM students WHERE roll_no=%s", (roll_no,))
    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Student deleted successfully"})


# ✅ RUN SERVER
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
