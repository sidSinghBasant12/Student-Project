from flask import request, jsonify
from flask_cors import CORS
from db import app, mysql

CORS(app)


@app.route("/")
def home():
    return "Student Insight Backend Running Successfully ✅"

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


# ✅ RUN SERVER (SIRF EK JAGAH)
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
