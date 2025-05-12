/**
 * Break time management functionality
 */
const BreakManager = {
    /**
     * Timer variables
     */
    timerInterval: null,
    breakStartTime: null,
    breakEndTime: null,
    breakActive: false,
    
    /**
     * Constants
     */
    MAX_DAILY_BREAK_TIME: 45 * 60 * 1000, // 45 minutes in milliseconds
    warningShown: false,
    
    /**
     * Initialize break management system
     */
    init() {
        this.updateCurrentTime();
        // Update current time every second
        setInterval(this.updateCurrentTime.bind(this), 1000);
        
        this.setupEventListeners();
        this.loadBreakHistory();
        this.updateBreakStats();
        this.checkTotalBreakTime();
    },
    
    /**
     * Set up event listeners for break controls
     */
    setupEventListeners() {
        // Start break button
        const startBreakBtn = document.getElementById('start-break');
        if (startBreakBtn) {
            startBreakBtn.addEventListener('click', this.startBreak.bind(this));
        }
        
        // End break button
        const endBreakBtn = document.getElementById('end-break');
        if (endBreakBtn) {
            endBreakBtn.addEventListener('click', this.endBreak.bind(this));
        }
        
        // Refresh history button
        const refreshBtn = document.getElementById('refresh-history');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.loadBreakHistory.bind(this));
        }
        
        // Clear history button
        const clearBtn = document.getElementById('clear-history');
        if (clearBtn) {
            clearBtn.addEventListener('click', this.clearBreakHistory.bind(this));
        }
        
        // Date filter
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter) {
            // Set default value to today
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            dateFilter.value = `${year}-${month}-${day}`;
            
            dateFilter.addEventListener('change', () => {
                this.loadBreakHistory();
                this.updateBreakStats();
            });
        }
    },
    
    /**
     * Update the current time display
     */
    updateCurrentTime() {
        const currentTimeElement = document.getElementById('current-time');
        if (currentTimeElement) {
            const now = new Date();
            currentTimeElement.textContent = now.toLocaleTimeString();
        }
        
        // If on break, update the duration
        if (this.breakActive && this.breakStartTime) {
            this.updateBreakDuration();
        }
    },
    
    /**
     * Start a break
     */
    startBreak() {
        if (this.breakActive) {
            return;
        }
        
        // Check if employee is about to exceed daily break limit
        const currentUser = StorageUtil.getCurrentUser();
        if (currentUser) {
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const year = today.getFullYear();
            const month = (today.getMonth() + 1).toString().padStart(2, '0');
            const day = today.getDate().toString().padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            
            // Get all breaks and filter by today
            const breaks = StorageUtil.getBreaks(currentUser.id);
            const todayBreaks = breaks.filter(breakItem => breakItem.date === todayStr);
            
            // Calculate total break time today
            const totalDurationMs = todayBreaks.reduce((sum, breakItem) => sum + breakItem.duration, 0);
            
            // If already at or exceeding limit, warn before starting
            if (totalDurationMs >= this.MAX_DAILY_BREAK_TIME) {
                if (!confirm('You have already reached the daily 45-minute break limit. Are you sure you want to take another break?')) {
                    return;
                }
            } else if (totalDurationMs >= this.MAX_DAILY_BREAK_TIME * 0.8) {
                // If close to limit, show a warning
                alert(`Warning: You've already taken ${Math.floor(totalDurationMs / 60000)} minutes of breaks today. The daily limit is 45 minutes.`);
            }
        }
        
        this.breakActive = true;
        this.breakStartTime = new Date();
        this.breakEndTime = null;
        
        // Update UI
        const startBtn = document.getElementById('start-break');
        const endBtn = document.getElementById('end-break');
        const statusElement = document.getElementById('break-status');
        const currentBreakInfo = document.getElementById('current-break-info');
        const startTimeElement = document.getElementById('break-start-time');
        const currentTimeElement = document.getElementById('current-time');
        
        if (startBtn) startBtn.disabled = true;
        if (endBtn) endBtn.disabled = false;
        if (statusElement) {
            statusElement.textContent = 'Break in progress';
            statusElement.classList.add('text-success');
        }
        if (currentBreakInfo) currentBreakInfo.style.display = 'block';
        if (startTimeElement) startTimeElement.textContent = this.breakStartTime.toLocaleTimeString();
        if (currentTimeElement) currentTimeElement.classList.add('timer-active');
        
        // Start timer to update duration
        this.timerInterval = setInterval(this.updateBreakDuration.bind(this), 1000);
        
        // Immediately check and update the break time
        this.checkTotalBreakTime();
    },
    
    /**
     * End a break
     */
    endBreak() {
        if (!this.breakActive) {
            return;
        }
        
        this.breakActive = false;
        this.breakEndTime = new Date();
        
        // Calculate duration in milliseconds
        const durationMs = this.breakEndTime - this.breakStartTime;
        
        // Create break record
        const breakRecord = {
            id: Date.now().toString(),
            startTime: this.breakStartTime.toISOString(),
            endTime: this.breakEndTime.toISOString(),
            duration: durationMs,
            date: this.breakStartTime.toLocaleDateString('en-CA') // YYYY-MM-DD format
        };
        
        // Save break record
        const currentUser = StorageUtil.getCurrentUser();
        if (currentUser) {
            StorageUtil.addBreak(currentUser.id, breakRecord);
        }
        
        // Update UI
        const startBtn = document.getElementById('start-break');
        const endBtn = document.getElementById('end-break');
        const statusElement = document.getElementById('break-status');
        const currentTimeElement = document.getElementById('current-time');
        
        if (startBtn) startBtn.disabled = false;
        if (endBtn) endBtn.disabled = true;
        if (statusElement) {
            statusElement.textContent = 'Break ended';
            statusElement.classList.remove('text-success');
        }
        if (currentTimeElement) currentTimeElement.classList.remove('timer-active');
        
        // Clear timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Update break history and stats
        this.loadBreakHistory();
        this.updateBreakStats();
    },
    
    /**
     * Update the displayed break duration and check for approaching daily limit
     */
    updateBreakDuration() {
        if (!this.breakActive || !this.breakStartTime) {
            return;
        }
        
        const now = new Date();
        const durationMs = now - this.breakStartTime;
        const durationElement = document.getElementById('break-duration');
        
        if (durationElement) {
            durationElement.textContent = this.formatDuration(durationMs);
        }
        
        // Check if approaching or exceeding daily limit
        const currentUser = StorageUtil.getCurrentUser();
        if (currentUser) {
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            
            // Get all breaks and filter by today
            const breaks = StorageUtil.getBreaks(currentUser.id);
            const todayBreaks = breaks.filter(breakItem => breakItem.date === todayStr);
            
            // Calculate total break time today (excluding current break)
            const totalPreviousMs = todayBreaks.reduce((sum, breakItem) => sum + breakItem.duration, 0);
            
            // Add current break duration
            const totalWithCurrentMs = totalPreviousMs + durationMs;
            
            // Update break status with warning if needed
            const statusElement = document.getElementById('break-status');
            if (statusElement) {
                // Reset any warning classes
                statusElement.classList.remove('text-warning', 'text-danger');
                statusElement.classList.add('text-success');
                
                let statusText = 'Break in progress';
                
                // Add warning if approaching or exceeding limit
                if (totalWithCurrentMs > this.MAX_DAILY_BREAK_TIME) {
                    statusElement.classList.remove('text-success');
                    statusElement.classList.add('text-danger');
                    const overMinutes = Math.floor((totalWithCurrentMs - this.MAX_DAILY_BREAK_TIME) / 60000);
                    statusText = `Break in progress (${overMinutes}min over limit!)`;
                } else if (totalWithCurrentMs > this.MAX_DAILY_BREAK_TIME * 0.8) {
                    statusElement.classList.remove('text-success');
                    statusElement.classList.add('text-warning');
                    const minutesLeft = Math.ceil((this.MAX_DAILY_BREAK_TIME - totalWithCurrentMs) / 60000);
                    statusText = `Break in progress (${minutesLeft}min left of daily limit)`;
                }
                
                statusElement.textContent = statusText;
            }
        }
    },
    
    /**
     * Load and display break history
     */
    loadBreakHistory() {
        const currentUser = StorageUtil.getCurrentUser();
        if (!currentUser) return;
        
        const breaks = StorageUtil.getBreaks(currentUser.id);
        const historyContainer = document.getElementById('break-history');
        const dateFilter = document.getElementById('date-filter');
        
        if (!historyContainer) return;
        
        // Clear existing content
        historyContainer.innerHTML = '';
        
        // Filter breaks by date if filter is set
        let filteredBreaks = breaks;
        if (dateFilter && dateFilter.value) {
            filteredBreaks = breaks.filter(breakItem => breakItem.date === dateFilter.value);
        }
        
        // Sort by start time (newest first)
        filteredBreaks.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        // No breaks to show
        if (filteredBreaks.length === 0) {
            historyContainer.innerHTML = '<tr><td colspan="4" class="text-center">No break history available.</td></tr>';
            return;
        }
        
        // Render each break
        filteredBreaks.forEach(breakItem => {
            const startTime = new Date(breakItem.startTime);
            const endTime = new Date(breakItem.endTime);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${startTime.toLocaleDateString()}</td>
                <td>${startTime.toLocaleTimeString()}</td>
                <td>${endTime.toLocaleTimeString()}</td>
                <td>${this.formatDuration(breakItem.duration)}</td>
            `;
            
            historyContainer.appendChild(row);
        });
    },
    
    /**
     * Check if total break time exceeds the daily limit
     */
    checkTotalBreakTime() {
        const currentUser = StorageUtil.getCurrentUser();
        if (!currentUser) return;
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        // Get all breaks and filter by today
        const breaks = StorageUtil.getBreaks(currentUser.id);
        const todayBreaks = breaks.filter(breakItem => breakItem.date === todayStr);
        
        // Calculate total break time today
        const totalDurationMs = todayBreaks.reduce((sum, breakItem) => sum + breakItem.duration, 0);
        
        // Check if currently on break - add current duration
        let currentBreakDuration = 0;
        if (this.breakActive && this.breakStartTime) {
            const now = new Date();
            currentBreakDuration = now - this.breakStartTime;
        }
        
        const totalWithCurrentBreak = totalDurationMs + currentBreakDuration;
        
        // Check if exceeding maximum break time
        if (totalWithCurrentBreak > this.MAX_DAILY_BREAK_TIME && !this.warningShown) {
            // Only show warning once per session
            this.warningShown = true;
            
            // Create alert element if it doesn't exist
            let alertElement = document.getElementById('break-limit-alert');
            if (!alertElement) {
                alertElement = document.createElement('div');
                alertElement.id = 'break-limit-alert';
                alertElement.className = 'alert alert-warning alert-dismissible fade show mt-3';
                alertElement.role = 'alert';
                
                // Add close button
                const closeButton = document.createElement('button');
                closeButton.type = 'button';
                closeButton.className = 'btn-close';
                closeButton.setAttribute('data-bs-dismiss', 'alert');
                closeButton.setAttribute('aria-label', 'Close');
                
                // Set alert content
                alertElement.innerHTML = `
                    <strong>Break Time Limit Exceeded!</strong> You've taken more than 45 minutes of breaks today.
                `;
                
                alertElement.appendChild(closeButton);
                
                // Find a good place to show the alert
                const timerCard = document.querySelector('.card:has(#current-time)');
                if (timerCard) {
                    timerCard.querySelector('.card-body').appendChild(alertElement);
                } else {
                    // Fallback - add to top of container
                    const container = document.querySelector('.container');
                    if (container) {
                        container.prepend(alertElement);
                    }
                }
            }
        }
        
        // Schedule next check (every minute)
        setTimeout(() => this.checkTotalBreakTime(), 60000);
    },
    
    /**
     * Update break statistics
     */
    updateBreakStats() {
        const currentUser = StorageUtil.getCurrentUser();
        if (!currentUser) return;
        
        const breaks = StorageUtil.getBreaks(currentUser.id);
        const totalBreaksElement = document.getElementById('total-breaks');
        const totalTimeElement = document.getElementById('total-time');
        const avgDurationElement = document.getElementById('avg-duration');
        const dateFilter = document.getElementById('date-filter');
        
        // Filter breaks by date if filter is set
        let filteredBreaks = breaks;
        if (dateFilter && dateFilter.value) {
            filteredBreaks = breaks.filter(breakItem => breakItem.date === dateFilter.value);
        }
        
        // Calculate statistics
        const totalBreaks = filteredBreaks.length;
        const totalDurationMs = filteredBreaks.reduce((sum, breakItem) => sum + breakItem.duration, 0);
        const avgDurationMs = totalBreaks > 0 ? totalDurationMs / totalBreaks : 0;
        
        // Update UI
        if (totalBreaksElement) totalBreaksElement.textContent = totalBreaks;
        if (totalTimeElement) totalTimeElement.textContent = this.formatDuration(totalDurationMs);
        if (avgDurationElement) avgDurationElement.textContent = this.formatDuration(avgDurationMs);
        
        // Update break time limit indicator if we're approaching the limit
        if (dateFilter && dateFilter.value === new Date().toLocaleDateString('en-CA')) {
            const currentElement = document.getElementById('total-time');
            const progressBar = document.getElementById('break-time-progress');
            
            if (currentElement) {
                // Remove any existing classes
                currentElement.classList.remove('text-warning', 'text-danger');
                
                // Add warning color if we're approaching limit
                if (totalDurationMs > this.MAX_DAILY_BREAK_TIME * 0.8 && totalDurationMs <= this.MAX_DAILY_BREAK_TIME) {
                    currentElement.classList.add('text-warning');
                } else if (totalDurationMs > this.MAX_DAILY_BREAK_TIME) {
                    currentElement.classList.add('text-danger');
                }
            }
            
            // Update progress bar
            if (progressBar) {
                const percentage = Math.min(100, (totalDurationMs / this.MAX_DAILY_BREAK_TIME) * 100);
                progressBar.style.width = `${percentage}%`;
                progressBar.setAttribute('aria-valuenow', percentage);
                
                // Update progress bar colors
                progressBar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
                
                if (percentage < 80) {
                    progressBar.classList.add('bg-success');
                } else if (percentage <= 100) {
                    progressBar.classList.add('bg-warning');
                } else {
                    progressBar.classList.add('bg-danger');
                }
            }
        }
        
        // Update chart
        this.updateBreakChart(filteredBreaks);
        
        // Check total break time
        this.checkTotalBreakTime();
    },
    
    /**
     * Clear all break history
     */
    clearBreakHistory() {
        if (!confirm('Are you sure you want to clear all break history? This cannot be undone.')) {
            return;
        }
        
        const currentUser = StorageUtil.getCurrentUser();
        if (currentUser) {
            StorageUtil.clearBreakHistory(currentUser.id);
            this.loadBreakHistory();
            this.updateBreakStats();
        }
    },
    
    /**
     * Update the break chart with current data
     * @param {Array} breaks Array of break records
     */
    updateBreakChart(breaks) {
        // This is a stub - actual implementation is in charts.js
        if (typeof BreakCharts !== 'undefined' && BreakCharts.updateBreakDurationChart) {
            BreakCharts.updateBreakDurationChart(breaks);
        }
    },
    
    /**
     * Format duration in milliseconds to HH:MM:SS
     * @param {number} durationMs Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(durationMs) {
        const totalSeconds = Math.floor(durationMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }
};
