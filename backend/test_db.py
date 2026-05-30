from db import mysql, app

with app.app_context():
    cur = mysql.connection.cursor()
    cur.execute("SELECT COUNT(*) FROM students")
    print(cur.fetchall())
    cur.close()
