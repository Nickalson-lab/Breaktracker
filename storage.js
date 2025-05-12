/**
 * Storage utility for managing employee and break data in localStorage
 */
const StorageUtil = {
    /**
     * Keys used for localStorage
     */
    KEYS: {
        EMPLOYEES: 'breaktime_employees',
        CURRENT_USER: 'breaktime_current_user',
        BREAK_DATA: 'breaktime_break_data_'
    },
    
    /**
     * Initialize storage with default values if not already set
     */
    init() {
        if (!localStorage.getItem(this.KEYS.EMPLOYEES)) {
            localStorage.setItem(this.KEYS.EMPLOYEES, JSON.stringify([]));
        }
    },
    
    /**
     * Get all registered employees
     * @returns {Array} Array of employee objects
     */
    getEmployees() {
        const employees = localStorage.getItem(this.KEYS.EMPLOYEES);
        return employees ? JSON.parse(employees) : [];
    },
    
    /**
     * Save the employee list
     * @param {Array} employees Array of employee objects
     */
    saveEmployees(employees) {
        localStorage.setItem(this.KEYS.EMPLOYEES, JSON.stringify(employees));
    },
    
    /**
     * Get an employee by ID
     * @param {string} id Employee ID to look up
     * @returns {Object|null} Employee object or null if not found
     */
    getEmployeeById(id) {
        const employees = this.getEmployees();
        return employees.find(emp => emp.id === id) || null;
    },
    
    /**
     * Add or update an employee
     * @param {Object} employee Employee object with id and name
     * @returns {boolean} True if successful
     */
    saveEmployee(employee) {
        if (!employee || !employee.id || !employee.name) {
            return false;
        }
        
        const employees = this.getEmployees();
        const index = employees.findIndex(emp => emp.id === employee.id);
        
        if (index >= 0) {
            employees[index] = employee;
        } else {
            // Check if we've reached the maximum number of employees (30)
            if (employees.length >= 30) {
                return false;
            }
            employees.push(employee);
        }
        
        this.saveEmployees(employees);
        return true;
    },
    
    /**
     * Set the current logged in user
     * @param {Object} user User object with id and name
     */
    setCurrentUser(user) {
        localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
    },
    
    /**
     * Get the current logged in user
     * @returns {Object|null} Current user or null if not logged in
     */
    getCurrentUser() {
        const user = localStorage.getItem(this.KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },
    
    /**
     * Clear the current user (logout)
     */
    clearCurrentUser() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
    },
    
    /**
     * Get all breaks for a specific employee
     * @param {string} employeeId Employee ID
     * @returns {Array} Array of break objects
     */
    getBreaks(employeeId) {
        const breaks = localStorage.getItem(`${this.KEYS.BREAK_DATA}${employeeId}`);
        return breaks ? JSON.parse(breaks) : [];
    },
    
    /**
     * Save all breaks for a specific employee
     * @param {string} employeeId Employee ID
     * @param {Array} breaks Array of break objects
     */
    saveBreaks(employeeId, breaks) {
        localStorage.setItem(`${this.KEYS.BREAK_DATA}${employeeId}`, JSON.stringify(breaks));
    },
    
    /**
     * Add a new break for an employee
     * @param {string} employeeId Employee ID
     * @param {Object} breakData Break object with startTime, endTime, and duration
     */
    addBreak(employeeId, breakData) {
        const breaks = this.getBreaks(employeeId);
        breaks.push(breakData);
        this.saveBreaks(employeeId, breaks);
    },
    
    /**
     * Clear all break history for an employee
     * @param {string} employeeId Employee ID
     */
    clearBreakHistory(employeeId) {
        this.saveBreaks(employeeId, []);
    }
};

// Initialize storage
StorageUtil.init();
