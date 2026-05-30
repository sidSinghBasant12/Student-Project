import sqlite3
import os
from flask import Flask, g
from flask_cors import CORS

app = Flask(__name__)

# Database Configurations (use environment variables for production)
app.config['MYSQL_HOST'] = os.environ.get('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.environ.get('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD', 'rohan')
app.config['MYSQL_DB'] = os.environ.get('MYSQL_DB', 'student_insight')

class CursorWrapper:
    def __init__(self, cursor, is_sqlite):
        self.cursor = cursor
        self.is_sqlite = is_sqlite

    def execute(self, query, params=None):
        if self.is_sqlite:
            # Replace %s with ? for SQLite placeholders
            query = query.replace('%s', '?')
        
        if params is not None:
            self.cursor.execute(query, params)
        else:
            self.cursor.execute(query)

    def fetchall(self):
        return self.cursor.fetchall()

    def close(self):
        self.cursor.close()

class ConnectionWrapper:
    def __init__(self, get_conn_fn, is_sqlite):
        self.get_conn_fn = get_conn_fn
        self.is_sqlite = is_sqlite

    def cursor(self):
        conn = self.get_conn_fn()
        return CursorWrapper(conn.cursor(), self.is_sqlite)

    def commit(self):
        conn = self.get_conn_fn()
        conn.commit()

class DatabaseManager:
    def __init__(self, app=None):
        self.db_type = 'sqlite' # Default fallback
        self.sqlite_db_path = os.environ.get('SQLITE_DB_PATH', os.path.join(os.path.dirname(__file__), 'student_insight.db'))
        if app:
            self.init_app(app)

    def init_app(self, app):
        # 1. Determine DB type (check if MySQL is running)
        self.db_type = 'sqlite'
        try:
            import pymysql
            # Try to connect to MySQL
            conn = pymysql.connect(
                host=app.config['MYSQL_HOST'],
                user=app.config['MYSQL_USER'],
                password=app.config['MYSQL_PASSWORD'],
                database=app.config['MYSQL_DB'],
                connect_timeout=2
            )
            conn.close()
            self.db_type = 'mysql'
            print("Successfully connected to MySQL database! Using MySQL backend.")
        except Exception as e:
            print(f"Could not connect to MySQL ({e}). Using SQLite database fallback.")
            self.db_type = 'sqlite'
            self._init_sqlite_db()

        # Register teardown
        @app.teardown_appcontext
        def close_connection(exception):
            db_conn = getattr(g, '_database_conn', None)
            if db_conn is not None:
                try:
                    db_conn.close()
                except Exception:
                    pass

    def _init_sqlite_db(self):
        # Create table and insert mock data if it doesn't exist
        conn = sqlite3.connect(self.sqlite_db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS students (
                roll_no INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                class TEXT NOT NULL,
                marks INTEGER DEFAULT 0,
                attendance INTEGER DEFAULT 0,
                grade TEXT DEFAULT '',
                email TEXT,
                phone TEXT
            )
        """)
        # Insert mock data if empty
        cursor.execute("SELECT COUNT(*) FROM students")
        if cursor.fetchone()[0] == 0:
            mock_students = [
                (101, "Aarav Sharma", "Class 10", 85, 92, "A", "aarav@example.com", "9876543210"),
                (102, "Ishaan Verma", "Class 10", 72, 88, "B", "ishaan@example.com", "9876543211"),
                (103, "Ananya Iyer", "Class 10", 94, 96, "A+", "ananya@example.com", "9876543212"),
                (104, "Kabir Mehta", "Class 10", 61, 80, "C", "kabir@example.com", "9876543213"),
                (105, "Diya Patel", "Class 10", 88, 91, "A", "diya@example.com", "9876543214")
            ]
            cursor.executemany("""
                INSERT INTO students (roll_no, name, class, marks, attendance, grade, email, phone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, mock_students)
            conn.commit()
        cursor.close()
        conn.close()

    def _get_conn(self):
        if not hasattr(g, '_database_conn'):
            if self.db_type == 'mysql':
                import pymysql
                g._database_conn = pymysql.connect(
                    host=app.config['MYSQL_HOST'],
                    user=app.config['MYSQL_USER'],
                    password=app.config['MYSQL_PASSWORD'],
                    database=app.config['MYSQL_DB']
                )
            else:
                g._database_conn = sqlite3.connect(self.sqlite_db_path)
        return g._database_conn

    @property
    def connection(self):
        return ConnectionWrapper(self._get_conn, self.db_type == 'sqlite')

mysql = DatabaseManager(app)
