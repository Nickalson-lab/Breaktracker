import os
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, redirect, url_for, flash, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user, UserMixin
from sqlalchemy.orm import DeclarativeBase
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.middleware.proxy_fix import ProxyFix

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Create the base class for SQLAlchemy models
class Base(DeclarativeBase):
    pass

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "default_secret_key_for_development")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)  # needed for url_for to generate with https

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize SQLAlchemy
db = SQLAlchemy(model_class=Base)
db.init_app(app)

# Initialize LoginManager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"  # type: ignore

# Define models
class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    users = db.relationship('User', backref='role', lazy='dynamic')

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    is_admin = db.Column(db.Boolean, default=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    breaks = db.relationship('Break', backref='user', lazy='dynamic')
    achievements = db.relationship('UserAchievement', backref='user', lazy='dynamic')
    reports = db.relationship('Report', backref='creator', lazy='dynamic')

class Break(db.Model):
    __tablename__ = 'breaks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration = db.Column(db.Integer)  # in seconds
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Achievement(db.Model):
    __tablename__ = 'achievements'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    points = db.Column(db.Integer, default=0)
    icon = db.Column(db.String(50))  # Font awesome icon class
    
    user_achievements = db.relationship('UserAchievement', backref='achievement', lazy='dynamic')

class UserAchievement(db.Model):
    __tablename__ = 'user_achievements'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'))
    unlocked_at = db.Column(db.DateTime, default=datetime.utcnow)

class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    report_type = db.Column(db.String(50))  # 'individual', 'team', 'department'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize database and default data
# In newer Flask versions, before_first_request is removed, so we'll use an initialization function
def initialize_database():
    with app.app_context():
        db.create_all()
        
        # Check if admin role exists, if not create it
        admin_role = Role.query.filter_by(name='admin').first()
        if not admin_role:
            admin_role = Role()
            admin_role.name = 'admin'
            db.session.add(admin_role)
        
        employee_role = Role.query.filter_by(name='employee').first()
        if not employee_role:
            employee_role = Role()
            employee_role.name = 'employee'
            db.session.add(employee_role)
        
        # Create default admin user if none exists
        admin_user = User.query.filter_by(is_admin=True).first()
        if not admin_user:
            admin_user = User()
            admin_user.username = 'admin'
            admin_user.email = 'admin@example.com'
            admin_user.password_hash = generate_password_hash('admin123')
            admin_user.is_admin = True
            admin_user.role_id = admin_role.id if admin_role.id else 1
            db.session.add(admin_user)
        
        # Create default achievements
        if Achievement.query.count() == 0:
            achievement1 = Achievement()
            achievement1.name = 'Break Beginner'
            achievement1.description = 'Take your first break'
            achievement1.points = 10
            achievement1.icon = 'bi-award'
            db.session.add(achievement1)
            
            achievement2 = Achievement()
            achievement2.name = 'Break Regular'
            achievement2.description = 'Take breaks for 5 consecutive days'
            achievement2.points = 20
            achievement2.icon = 'bi-calendar-check'
            db.session.add(achievement2)
            
            achievement3 = Achievement()
            achievement3.name = 'Break Master'
            achievement3.description = 'Maintain optimal break patterns for 2 weeks'
            achievement3.points = 50
            achievement3.icon = 'bi-trophy'
            db.session.add(achievement3)
            
            achievement4 = Achievement()
            achievement4.name = 'Perfect Timer'
            achievement4.description = 'End 10 breaks at exactly the optimal duration'
            achievement4.points = 30
            achievement4.icon = 'bi-clock-history'
            db.session.add(achievement4)
            
            achievement5 = Achievement()
            achievement5.name = 'Team Player'
            achievement5.description = 'Encourage 3 team members to take regular breaks'
            achievement5.points = 25
            achievement5.icon = 'bi-people'
            db.session.add(achievement5)
        
        db.session.commit()

# Call the initialization function
initialize_database()

# Routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard_new.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if not username or not password:
            flash('Username and password are required')
            return render_template('login.html')
            
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            next_page = request.args.get('next')
            if user.is_admin:
                return redirect(next_page or url_for('admin_dashboard'))
            return redirect(next_page or url_for('dashboard'))
        flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# Employee management routes
@app.route('/admin/employee/create', methods=['GET', 'POST'])
@login_required
def create_employee():
    if not current_user.is_admin:
        flash('You do not have permission to access this page')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not username or not email or not password:
            flash('All fields are required')
            return redirect(url_for('create_employee'))
            
        # Check if username or email already exists
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return redirect(url_for('create_employee'))
            
        if User.query.filter_by(email=email).first():
            flash('Email already exists')
            return redirect(url_for('create_employee'))
        
        # Get employee role
        employee_role = Role.query.filter_by(name='employee').first()
        if not employee_role:
            flash('Employee role not found')
            return redirect(url_for('admin_employees'))
        
        # Create new employee
        new_employee = User()
        new_employee.username = username
        new_employee.email = email
        new_employee.password_hash = generate_password_hash(password)
        new_employee.is_admin = False
        new_employee.role_id = employee_role.id
        
        db.session.add(new_employee)
        db.session.commit()
        
        flash('Employee created successfully')
        return redirect(url_for('admin_employees'))
    
    return render_template('admin/create_employee.html')

@app.route('/admin/employee/<int:employee_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_employee(employee_id):
    if not current_user.is_admin:
        flash('You do not have permission to access this page')
        return redirect(url_for('dashboard'))
    
    employee = User.query.get_or_404(employee_id)
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not username or not email:
            flash('Username and email are required')
            return redirect(url_for('edit_employee', employee_id=employee_id))
        
        # Check if username already exists for a different user
        existing_user = User.query.filter_by(username=username).first()
        if existing_user and existing_user.id != employee_id:
            flash('Username already exists')
            return redirect(url_for('edit_employee', employee_id=employee_id))
        
        # Check if email already exists for a different user
        existing_email = User.query.filter_by(email=email).first()
        if existing_email and existing_email.id != employee_id:
            flash('Email already exists')
            return redirect(url_for('edit_employee', employee_id=employee_id))
        
        # Update employee details
        employee.username = username
        employee.email = email
        
        # Only update password if provided
        if password:
            employee.password_hash = generate_password_hash(password)
        
        db.session.commit()
        
        flash('Employee updated successfully')
        return redirect(url_for('admin_employees'))
    
    return render_template('admin/edit_employee.html', employee=employee, Break=Break)

@app.route('/admin/employee/<int:employee_id>/delete', methods=['POST'])
@login_required
def delete_employee(employee_id):
    if not current_user.is_admin:
        flash('You do not have permission to access this page')
        return redirect(url_for('dashboard'))
    
    employee = User.query.get_or_404(employee_id)
    
    # Don't allow deleting the admin user
    if employee.is_admin:
        flash('Cannot delete admin user')
        return redirect(url_for('admin_employees'))
    
    # Delete all related records
    Break.query.filter_by(user_id=employee_id).delete()
    UserAchievement.query.filter_by(user_id=employee_id).delete()
    
    # Delete the employee
    db.session.delete(employee)
    db.session.commit()
    
    flash('Employee deleted successfully')
    return redirect(url_for('admin_employees'))

# Admin routes
@app.route('/admin')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('You do not have permission to access the admin dashboard')
        return redirect(url_for('dashboard'))
    
    # Get some statistics for the dashboard
    total_employees = User.query.filter_by(is_admin=False).count()
    total_breaks = Break.query.count()
    
    # Get breaks for today
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    breaks_today = Break.query.filter(Break.start_time.between(today_start, today_end)).count()
    
    # Get average break time
    breaks = Break.query.filter(Break.duration.isnot(None)).all()
    avg_break_time = sum(b.duration for b in breaks) / len(breaks) if breaks else 0
    avg_break_minutes = round(avg_break_time / 60)
    
    # Get recent breaks for the dashboard
    recent_breaks = Break.query.order_by(Break.start_time.desc()).limit(10).all()
    
    return render_template('admin/dashboard.html', 
                          total_employees=total_employees,
                          total_breaks=total_breaks,
                          breaks_today=breaks_today,
                          avg_break_minutes=avg_break_minutes,
                          recent_breaks=recent_breaks)

@app.route('/admin/employees')
@login_required
def admin_employees():
    if not current_user.is_admin:
        flash('You do not have permission to access this page')
        return redirect(url_for('dashboard'))
    
    # Get all employees (non-admin users)
    employees = User.query.filter_by(is_admin=False).all()
    
    return render_template('admin/employees.html', employees=employees)

@app.route('/admin/reports', methods=['GET', 'POST'])
@login_required
def admin_reports():
    if not current_user.is_admin:
        flash('You do not have permission to access this page')
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        report_name = request.form.get('report_name')
        report_type = request.form.get('report_type')
        description = request.form.get('description')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        
        if not all([report_name, report_type, start_date, end_date]):
            flash('All fields except description are required')
            return redirect(url_for('admin_reports'))
        
        try:
            # Convert dates to datetime objects
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d')
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            
            # Create new report
            new_report = Report()
            new_report.name = report_name
            new_report.description = description
            new_report.report_type = report_type
            new_report.start_date = start_date_obj
            new_report.end_date = end_date_obj
            new_report.created_by = current_user.id
            
            db.session.add(new_report)
            db.session.commit()
            
            flash('Report created successfully')
        except ValueError:
            flash('Invalid date format')
            
        return redirect(url_for('admin_reports'))
    
    # Get all reports
    reports = Report.query.order_by(Report.created_at.desc()).all()
    
    return render_template('admin/reports.html', reports=reports)

@app.route('/admin/breaks')
@login_required
def admin_breaks():
    if not current_user.is_admin:
        flash('You do not have permission to access this page')
        return redirect(url_for('dashboard'))
    
    # Filter parameters
    user_id = request.args.get('user_id', type=int)
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    
    # Base query
    query = Break.query.join(User)
    
    # Apply filters
    if user_id:
        query = query.filter(Break.user_id == user_id)
    
    if date_from:
        date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
        query = query.filter(Break.start_time >= date_from_obj)
    
    if date_to:
        date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
        date_to_obj = date_to_obj + timedelta(days=1)  # Include the end date
        query = query.filter(Break.start_time < date_to_obj)
    
    # Get results
    breaks = query.order_by(Break.start_time.desc()).all()
    users = User.query.filter_by(is_admin=False).all()
    
    return render_template('admin/breaks.html', breaks=breaks, users=users)

@app.route('/admin/report/<int:report_id>')
@login_required
def view_report(report_id):
    if not current_user.is_admin:
        flash('You do not have permission to access this page')
        return redirect(url_for('dashboard'))
    
    report = Report.query.get_or_404(report_id)
    
    # Get breaks for the report period
    breaks = Break.query.filter(
        Break.start_time.between(report.start_date, report.end_date)
    ).order_by(Break.start_time).all()
    
    # Group breaks by user
    user_breaks = {}
    for break_item in breaks:
        if break_item.user_id not in user_breaks:
            user_breaks[break_item.user_id] = []
        user_breaks[break_item.user_id].append(break_item)
    
    # Calculate statistics
    statistics = []
    for user_id, user_break_list in user_breaks.items():
        user = User.query.get(user_id)
        total_break_time = sum(b.duration or 0 for b in user_break_list)
        avg_break_time = total_break_time / len(user_break_list) if user_break_list else 0
        
        statistics.append({
            'user': user,
            'total_breaks': len(user_break_list),
            'total_break_time': total_break_time,
            'avg_break_time': avg_break_time,
            'breaks': user_break_list
        })
    
    return render_template('admin/view_report.html', report=report, statistics=statistics)

# API routes for the front-end application
@app.route('/api/breaks', methods=['GET'])
@login_required
def get_breaks():
    # Get the user's breaks
    breaks = Break.query.filter_by(user_id=current_user.id).all()
    
    # Format the breaks for JSON response
    formatted_breaks = []
    for break_item in breaks:
        formatted_break = {
            'id': break_item.id,
            'start_time': break_item.start_time.isoformat(),
            'end_time': break_item.end_time.isoformat() if break_item.end_time else None,
            'duration': break_item.duration
        }
        formatted_breaks.append(formatted_break)
    
    return {'breaks': formatted_breaks}

@app.route('/api/breaks', methods=['POST'])
@login_required
def create_break():
    # Get break data from request
    data = request.json
    
    if not data or 'start_time' not in data:
        return {'error': 'Start time is required'}, 400
    
    # Create new break
    start_time = datetime.fromisoformat(data['start_time'])
    new_break = Break()
    new_break.user_id = current_user.id
    new_break.start_time = start_time
    
    # Set end time and duration if provided
    if 'end_time' in data and data['end_time']:
        end_time = datetime.fromisoformat(data['end_time'])
        new_break.end_time = end_time
        
        # Calculate duration in seconds
        duration = (end_time - start_time).total_seconds()
        new_break.duration = int(duration)
    
    db.session.add(new_break)
    db.session.commit()
    
    return {
        'id': new_break.id,
        'start_time': new_break.start_time.isoformat(),
        'end_time': new_break.end_time.isoformat() if new_break.end_time else None,
        'duration': new_break.duration
    }

@app.route('/api/breaks/<int:break_id>', methods=['PUT'])
@login_required
def update_break(break_id):
    # Get the break
    break_item = Break.query.get_or_404(break_id)
    
    # Check if the break belongs to the current user
    if break_item.user_id != current_user.id:
        return {'error': 'Unauthorized'}, 403
    
    # Get break data from request
    data = request.json
    
    # Update end time if provided
    if data and 'end_time' in data and data['end_time']:
        end_time = datetime.fromisoformat(data['end_time'])
        break_item.end_time = end_time
        
        # Calculate duration in seconds
        duration = (end_time - break_item.start_time).total_seconds()
        break_item.duration = int(duration)
    
    db.session.commit()
    
    return {
        'id': break_item.id,
        'start_time': break_item.start_time.isoformat(),
        'end_time': break_item.end_time.isoformat() if break_item.end_time else None,
        'duration': break_item.duration
    }

@app.route('/api/breaks/<int:break_id>', methods=['DELETE'])
@login_required
def delete_break(break_id):
    # Get the break
    break_item = Break.query.get_or_404(break_id)
    
    # Check if the break belongs to the current user
    if break_item.user_id != current_user.id and not current_user.is_admin:
        return {'error': 'Unauthorized'}, 403
    
    # Delete the break
    db.session.delete(break_item)
    db.session.commit()
    
    return {'success': True}

@app.route('/api/achievements', methods=['GET'])
@login_required
def get_achievements():
    # Get all achievements
    achievements = Achievement.query.all()
    
    # Get user's unlocked achievements
    user_achievements = UserAchievement.query.filter_by(user_id=current_user.id).all()
    unlocked_ids = [ua.achievement_id for ua in user_achievements]
    
    # Format achievements for JSON response
    formatted_achievements = []
    for achievement in achievements:
        formatted_achievement = {
            'id': achievement.id,
            'name': achievement.name,
            'description': achievement.description,
            'points': achievement.points,
            'icon': achievement.icon,
            'unlocked': achievement.id in unlocked_ids
        }
        formatted_achievements.append(formatted_achievement)
    
    return {'achievements': formatted_achievements}

# This app now combines client-side functionality with server-side admin features