/**
 * Authentication management
 */
const AuthManager = {
    /**
     * Initialize authentication system
     */
    init() {
        this.checkAuthStatus();
        this.setupEventListeners();
    },
    
    /**
     * Check if a user is logged in and redirect accordingly
     */
    checkAuthStatus() {
        const currentUser = StorageUtil.getCurrentUser();
        const isLoginPage = window.location.pathname === '/' || window.location.pathname === '/index.html';
        
        if (currentUser) {
            // User is logged in
            if (isLoginPage) {
                window.location.href = '/dashboard';
            } else {
                // Update UI with user information
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = currentUser.name;
                }
            }
        } else {
            // User is not logged in
            if (!isLoginPage) {
                window.location.href = '/';
            }
        }
    },
    
    /**
     * Set up event listeners for login/logout
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    },
    
    /**
     * Handle login form submission
     * @param {Event} e Form submit event
     */
    handleLogin(e) {
        e.preventDefault();
        
        const idInput = document.getElementById('employee-id');
        const nameInput = document.getElementById('employee-name');
        const errorElement = document.getElementById('login-error');
        const successElement = document.getElementById('login-success');
        
        // Reset error and success messages
        errorElement.classList.add('d-none');
        successElement.classList.add('d-none');
        
        // Validate inputs
        const id = idInput.value.trim();
        const name = nameInput.value.trim();
        
        if (!id || !name) {
            errorElement.textContent = 'Please enter both your ID and name.';
            errorElement.classList.remove('d-none');
            return;
        }
        
        // Check if employee exists
        const existingEmployee = StorageUtil.getEmployeeById(id);
        
        if (existingEmployee) {
            // Employee exists, verify name
            if (existingEmployee.name.toLowerCase() !== name.toLowerCase()) {
                errorElement.textContent = 'The ID and name do not match our records.';
                errorElement.classList.remove('d-none');
                return;
            }
            
            // Login successful for existing employee
            StorageUtil.setCurrentUser(existingEmployee);
            successElement.textContent = 'Login successful! Redirecting...';
            successElement.classList.remove('d-none');
            
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
            
        } else {
            // New employee registration
            const employees = StorageUtil.getEmployees();
            
            if (employees.length >= 30) {
                errorElement.textContent = 'Maximum number of employees (30) reached. Please contact your administrator.';
                errorElement.classList.remove('d-none');
                return;
            }
            
            // Create new employee
            const newEmployee = { id, name };
            const saved = StorageUtil.saveEmployee(newEmployee);
            
            if (saved) {
                StorageUtil.setCurrentUser(newEmployee);
                successElement.textContent = 'Account created! Redirecting...';
                successElement.classList.remove('d-none');
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1000);
            } else {
                errorElement.textContent = 'Failed to create account. Please try again.';
                errorElement.classList.remove('d-none');
            }
        }
    },
    
    /**
     * Handle logout button click
     * @param {Event} e Click event
     */
    handleLogout(e) {
        e.preventDefault();
        StorageUtil.clearCurrentUser();
        window.location.href = '/';
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});
