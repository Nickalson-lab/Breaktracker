/**
 * Team leaderboard functionality for break wellness
 */
const LeaderboardManager = {
    // Tips to show in the leaderboard tip section
    WELLNESS_TIPS: [
        "Regular breaks help improve productivity and wellbeing!",
        "Aim for a 5-minute break every hour for optimal productivity.",
        "A 10-15 minute break after 90 minutes of work helps maintain focus.",
        "Short walks during breaks can boost creativity and energy levels.",
        "Remember to rest your eyes from the screen during breaks.",
        "Stretch during breaks to reduce muscle tension.",
        "Break consistency is more important than duration.",
        "The ideal break should disconnect you from work tasks completely."
    ],
    
    /**
     * Leaderboard categories
     */
    LEADERBOARD_CATEGORIES: [
        {
            id: 'consistency',
            name: 'Top Break Consistency',
            description: 'Employees who take regular breaks',
            scoreFunction: (metric) => metric.consistencyScore,
            displayFunction: (metric) => `${Math.round(metric.consistencyScore)}%`,
            extraInfo: (metric) => `${metric.totalBreaks} breaks`
        },
        {
            id: 'balance',
            name: 'Break Balance Champions',
            description: 'Optimal break duration & frequency',
            scoreFunction: (metric) => metric.balanceScore,
            displayFunction: (metric) => `${Math.round(metric.balanceScore)}%`,
            extraInfo: (metric) => `~${Math.round(metric.avgDuration / 60000)} min`
        },
        {
            id: 'improved',
            name: 'Most Improved',
            description: 'Greatest improvement in break habits',
            scoreFunction: (metric) => metric.improvementScore,
            displayFunction: (metric) => `+${Math.round(metric.improvementScore)}%`,
            extraInfo: (metric) => `${metric.totalBreaks} breaks`
        },
        {
            id: 'adherence',
            name: 'Best Break Adherence',
            description: 'Sticking to the 45-minute daily limit',
            scoreFunction: (metric) => metric.adherenceScore,
            displayFunction: (metric) => `${Math.round(metric.adherenceScore)}%`,
            extraInfo: (metric) => `${metric.daysUnderLimit}/${metric.totalDays} days`
        },
        {
            id: 'achievement',
            name: 'Achievement Leaders',
            description: 'Most badges & achievements',
            scoreFunction: (metric) => metric.achievementScore,
            displayFunction: (metric) => `${Math.round(metric.achievementScore)}pts`,
            extraInfo: (metric) => `${metric.achievementsUnlocked} badges`
        }
    ],
    
    /**
     * Initialize leaderboard
     */
    init() {
        this.setupEventListeners();
        this.refreshLeaderboard();
        this.showRandomTip();
        
        // Show a new tip every 30 seconds
        setInterval(this.showRandomTip.bind(this), 30000);
        
        // Initialize previous break data for improvement tracking
        this.initPreviousBreakData();
    },
    
    /**
     * Initialize previous break data for tracking improvement
     */
    initPreviousBreakData() {
        const employees = StorageUtil.getEmployees();
        const now = new Date();
        
        employees.forEach(employee => {
            const storageKey = `breaktime_previous_data_${employee.id}`;
            
            // Check if we have previous data
            if (!localStorage.getItem(storageKey)) {
                // Get current break data
                const breaks = StorageUtil.getBreaks(employee.id);
                
                // Save snapshot of current data
                const snapshot = {
                    timestamp: now.toISOString(),
                    breakCount: breaks.length,
                    totalDuration: breaks.reduce((sum, b) => sum + b.duration, 0),
                    avgDuration: breaks.length > 0 ? 
                        breaks.reduce((sum, b) => sum + b.duration, 0) / breaks.length : 0
                };
                
                localStorage.setItem(storageKey, JSON.stringify(snapshot));
            }
        });
    },
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Refresh leaderboard button
        const refreshBtn = document.getElementById('refresh-leaderboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', this.refreshLeaderboard.bind(this));
        }
        
        // Period selector
        const periodSelector = document.getElementById('leaderboard-period');
        if (periodSelector) {
            periodSelector.addEventListener('change', this.refreshLeaderboard.bind(this));
        }
        
        // Category selector
        const categorySelector = document.getElementById('leaderboard-category');
        if (!categorySelector) {
            // Create and add category selector if it doesn't exist
            this.createCategorySelector();
        } else {
            // Add event listener to existing selector
            categorySelector.addEventListener('change', this.refreshLeaderboard.bind(this));
        }
        
        // Tab changes for achievement display
        const achievementsTab = document.getElementById('achievements-tab');
        if (achievementsTab) {
            achievementsTab.addEventListener('shown.bs.tab', () => {
                // Check for new achievements when tab is shown
                if (typeof AchievementManager !== 'undefined') {
                    AchievementManager.checkAchievements();
                }
            });
        }
    },
    
    /**
     * Create category selector for leaderboard
     */
    createCategorySelector() {
        const leaderboardControls = document.querySelector('.card-header:has(#leaderboard-period)');
        if (!leaderboardControls) return;
        
        // Find the period selector
        const periodSelector = document.getElementById('leaderboard-period');
        if (!periodSelector) return;
        
        // Create category selector
        const categorySelector = document.createElement('select');
        categorySelector.id = 'leaderboard-category';
        categorySelector.className = 'form-select form-select-sm';
        
        // Add options for each category
        this.LEADERBOARD_CATEGORIES.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelector.appendChild(option);
        });
        
        // Insert category selector before period selector
        periodSelector.parentNode.insertBefore(categorySelector, periodSelector);
        
        // Add event listener
        categorySelector.addEventListener('change', this.refreshLeaderboard.bind(this));
    },
    
    /**
     * Show a random wellness tip
     */
    showRandomTip() {
        const tipElement = document.getElementById('leaderboard-tip');
        if (tipElement) {
            const randomIndex = Math.floor(Math.random() * this.WELLNESS_TIPS.length);
            tipElement.textContent = this.WELLNESS_TIPS[randomIndex];
        }
    },
    
    /**
     * Refresh the leaderboard data
     */
    refreshLeaderboard() {
        // Get all employees
        const employees = StorageUtil.getEmployees();
        if (!employees || employees.length === 0) {
            this.displayNoData();
            return;
        }
        
        // Get selected time period
        const periodSelector = document.getElementById('leaderboard-period');
        const period = periodSelector ? periodSelector.value : 'today';
        
        // Calculate start date based on period
        const startDate = this.getStartDateForPeriod(period);
        
        // Get break data for all employees and calculate metrics
        const employeeMetrics = [];
        
        for (const employee of employees) {
            const breaks = StorageUtil.getBreaks(employee.id);
            
            // Filter breaks by period
            const filteredBreaks = this.filterBreaksByDate(breaks, startDate);
            
            // Include employees with no breaks in this period for achievement leaderboard
            const metrics = this.calculateEmployeeMetrics(
                filteredBreaks.length > 0 ? filteredBreaks : [], 
                employee
            );
            employeeMetrics.push(metrics);
        }
        
        // Get selected leaderboard category
        const categorySelector = document.getElementById('leaderboard-category');
        const selectedCategory = categorySelector ? categorySelector.value : 'consistency';
        
        // Update leaderboards based on selected category
        const leaderboardContainer = document.getElementById('leaderboard-container');
        if (leaderboardContainer) {
            // Find the selected category
            const category = this.LEADERBOARD_CATEGORIES.find(c => c.id === selectedCategory) || 
                this.LEADERBOARD_CATEGORIES[0];
            
            // Update the leaderboard
            this.updateLeaderboard(employeeMetrics, category);
        } else {
            // Backward compatibility - update the original two leaderboards
            this.updateConsistencyLeaderboard(employeeMetrics);
            this.updateBalanceLeaderboard(employeeMetrics);
        }
    },
    
    /**
     * Update a leaderboard with the specified metrics and category
     * @param {Array} metrics Array of employee metrics
     * @param {Object} category Leaderboard category object
     */
    updateLeaderboard(metrics, category) {
        const leaderboardContainer = document.getElementById('leaderboard-container');
        const leaderboardTitle = document.getElementById('leaderboard-title');
        const leaderboardDescription = document.getElementById('leaderboard-description');
        
        if (!leaderboardContainer) return;
        
        if (metrics.length === 0) {
            leaderboardContainer.innerHTML = '<div class="alert alert-info">No data available for this leaderboard.</div>';
            return;
        }
        
        // Update title and description
        if (leaderboardTitle) {
            leaderboardTitle.textContent = category.name;
        }
        
        if (leaderboardDescription) {
            leaderboardDescription.textContent = category.description;
        }
        
        // Sort by category score function (highest first)
        metrics.sort((a, b) => category.scoreFunction(b) - category.scoreFunction(a));
        
        // Take top entries
        const topEntries = metrics.slice(0, 10);
        
        // Clear existing content
        leaderboardContainer.innerHTML = '';
        
        // Add employees to leaderboard
        topEntries.forEach((metric, index) => {
            const rankClass = index === 0 ? 'text-warning' : (index === 1 ? 'text-secondary' : (index === 2 ? 'text-info' : ''));
            const rankIcon = index < 3 ? 
                `<i class="bi bi-trophy-fill me-2 ${rankClass}"></i>` : 
                `<span class="me-2">${index + 1}.</span>`;
            
            const score = category.scoreFunction(metric);
            const displayScore = category.displayFunction(metric);
            const extraInfo = category.extraInfo(metric);
            
            // Skip if score is 0
            if (score <= 0) return;
            
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    ${rankIcon}
                    <span>${metric.employee.name}</span>
                </div>
                <div>
                    <span class="badge bg-primary rounded-pill">${displayScore}</span>
                    <small class="text-muted ms-2">${extraInfo}</small>
                </div>
            `;
            
            leaderboardContainer.appendChild(li);
        });
        
        // If no entries with score > 0, show message
        if (leaderboardContainer.children.length === 0) {
            leaderboardContainer.innerHTML = '<div class="alert alert-info">No data available for this leaderboard.</div>';
        }
    },
    
    /**
     * Calculate metrics for an employee
     * @param {Array} breaks Array of break records
     * @param {Object} employee Employee object
     * @returns {Object} Metrics object
     */
    calculateEmployeeMetrics(breaks, employee) {
        // Sort breaks by start time
        breaks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        // Calculate total break time
        const totalBreakTime = breaks.reduce((sum, breakItem) => sum + breakItem.duration, 0);
        
        // Calculate average break duration
        const avgDuration = totalBreakTime / breaks.length;
        
        // Calculate break frequency (breaks per day)
        const uniqueDates = new Set(breaks.map(breakItem => breakItem.date)).size;
        const frequency = breaks.length / Math.max(1, uniqueDates);
        
        // Calculate break consistency score (regular intervals)
        let consistencyScore = 0;
        if (breaks.length > 1) {
            // Group breaks by date
            const breaksByDate = {};
            breaks.forEach(breakItem => {
                if (!breaksByDate[breakItem.date]) {
                    breaksByDate[breakItem.date] = [];
                }
                breaksByDate[breakItem.date].push(breakItem);
            });
            
            // Calculate time between breaks for each date
            let totalVariance = 0;
            let pairCount = 0;
            
            Object.values(breaksByDate).forEach(dateBreaks => {
                if (dateBreaks.length < 2) return;
                
                const intervals = [];
                for (let i = 1; i < dateBreaks.length; i++) {
                    const prevEnd = new Date(dateBreaks[i-1].endTime);
                    const currStart = new Date(dateBreaks[i].startTime);
                    intervals.push(currStart - prevEnd);
                }
                
                // Calculate variance of intervals
                if (intervals.length > 0) {
                    const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
                    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
                    totalVariance += variance;
                    pairCount += 1;
                }
            });
            
            // Lower variance = more consistent
            const avgVariance = pairCount > 0 ? totalVariance / pairCount : 0;
            consistencyScore = Math.max(0, 100 - Math.min(100, avgVariance / 60000)); // Scale variance to 0-100
        }
        
        // Calculate break balance score (combination of duration, frequency, and total time)
        // Ideal: 5-15 min breaks, 3-6 times per day, total time under 45 min
        const durationScore = this.scoreBreakDuration(avgDuration);
        const frequencyScore = this.scoreBreakFrequency(frequency);
        const totalTimeScore = this.scoreTotalBreakTime(breaks);
        const balanceScore = (durationScore + frequencyScore + totalTimeScore) / 3;
        
        // Calculate improvement score
        const improvementScore = this.calculateImprovementScore(employee.id, breaks);
        
        // Calculate adherence score (sticking to the 45-minute daily limit)
        const MAX_DAILY_BREAK_TIME = 45 * 60 * 1000; // 45 minutes in ms
        let daysUnderLimit = 0;
        
        // Group breaks by date
        const breaksByDate = {};
        breaks.forEach(breakItem => {
            if (!breaksByDate[breakItem.date]) {
                breaksByDate[breakItem.date] = [];
            }
            breaksByDate[breakItem.date].push(breakItem);
        });
        
        // Count days under limit
        Object.values(breaksByDate).forEach(dayBreaks => {
            const totalDayTime = dayBreaks.reduce((sum, b) => sum + b.duration, 0);
            if (totalDayTime <= MAX_DAILY_BREAK_TIME) {
                daysUnderLimit++;
            }
        });
        
        const totalDays = Object.keys(breaksByDate).length;
        const adherenceScore = totalDays > 0 ? (daysUnderLimit / totalDays) * 100 : 0;
        
        // Get achievement score
        const achievementScore = this.getAchievementScore(employee.id);
        
        return {
            employee: employee,
            totalBreaks: breaks.length,
            totalBreakTime: totalBreakTime,
            avgDuration: avgDuration,
            frequency: frequency,
            consistencyScore: consistencyScore,
            balanceScore: balanceScore,
            improvementScore: improvementScore,
            adherenceScore: adherenceScore,
            daysUnderLimit: daysUnderLimit,
            totalDays: totalDays,
            achievementScore: achievementScore,
            achievementsUnlocked: this.getAchievementsUnlocked(employee.id)
        };
    },
    
    /**
     * Calculate improvement score based on comparison with previous data
     * @param {string} employeeId Employee ID
     * @param {Array} currentBreaks Current break data
     * @returns {number} Improvement score (0-100)
     */
    calculateImprovementScore(employeeId, currentBreaks) {
        const storageKey = `breaktime_previous_data_${employeeId}`;
        const previousDataStr = localStorage.getItem(storageKey);
        
        if (!previousDataStr || currentBreaks.length === 0) {
            return 0; // No previous data or current breaks
        }
        
        const previousData = JSON.parse(previousDataStr);
        const previousTimestamp = new Date(previousData.timestamp);
        const now = new Date();
        
        // Only calculate improvement if previous data is at least 1 day old
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (now - previousTimestamp < oneDayMs) {
            return 0;
        }
        
        // Calculate days since previous snapshot
        const daysSincePrevious = Math.max(1, Math.floor((now - previousTimestamp) / oneDayMs));
        
        // Current metrics
        const currentBreakCount = currentBreaks.length;
        const currentTotalDuration = currentBreaks.reduce((sum, b) => sum + b.duration, 0);
        const currentAvgDuration = currentBreakCount > 0 ? currentTotalDuration / currentBreakCount : 0;
        
        // Skip if no new breaks since previous
        if (currentBreakCount <= previousData.breakCount) {
            return 0;
        }
        
        // Calculate improvement metrics
        const newBreaks = currentBreakCount - previousData.breakCount;
        const breaksPerDay = newBreaks / daysSincePrevious;
        
        // Calculate improvement in average duration
        let durationImprovement = 0;
        
        // Ideal average duration is 5-15 minutes
        const idealMinDuration = 5 * 60 * 1000; // 5 min in ms
        const idealMaxDuration = 15 * 60 * 1000; // 15 min in ms
        
        // Calculate how much closer to ideal range the average duration has moved
        if (previousData.avgDuration < idealMinDuration) {
            // Previous was too short
            if (currentAvgDuration < idealMinDuration) {
                // Still too short, but improved?
                if (currentAvgDuration > previousData.avgDuration) {
                    durationImprovement = (currentAvgDuration - previousData.avgDuration) / 
                        (idealMinDuration - previousData.avgDuration);
                }
            } else if (currentAvgDuration <= idealMaxDuration) {
                // Now in ideal range
                durationImprovement = 1;
            } else {
                // Overshot ideal range
                durationImprovement = 0.5;
            }
        } else if (previousData.avgDuration > idealMaxDuration) {
            // Previous was too long
            if (currentAvgDuration > idealMaxDuration) {
                // Still too long, but improved?
                if (currentAvgDuration < previousData.avgDuration) {
                    durationImprovement = (previousData.avgDuration - currentAvgDuration) / 
                        (previousData.avgDuration - idealMaxDuration);
                }
            } else if (currentAvgDuration >= idealMinDuration) {
                // Now in ideal range
                durationImprovement = 1;
            } else {
                // Undershot ideal range
                durationImprovement = 0.5;
            }
        } else {
            // Previous was already in ideal range
            if (currentAvgDuration >= idealMinDuration && currentAvgDuration <= idealMaxDuration) {
                // Still in ideal range
                durationImprovement = 0.5; // Some credit for maintaining
            }
        }
        
        // Calculate consistency improvement
        // Group breaks by date
        const breaksByDate = {};
        currentBreaks.forEach(breakItem => {
            if (!breaksByDate[breakItem.date]) {
                breaksByDate[breakItem.date] = [];
            }
            breaksByDate[breakItem.date].push(breakItem);
        });
        
        // Calculate ideal breaks per day (3-6)
        const breaksPerDayScore = breaksPerDay >= 3 && breaksPerDay <= 6 ? 1 :
            (breaksPerDay > 0 && breaksPerDay < 3 ? breaksPerDay / 3 : 0);
        
        // Combine factors for overall improvement score
        const improvementScore = (durationImprovement * 0.4 + breaksPerDayScore * 0.6) * 100;
        
        // Update previous data for next comparison
        const newPreviousData = {
            timestamp: now.toISOString(),
            breakCount: currentBreakCount,
            totalDuration: currentTotalDuration,
            avgDuration: currentAvgDuration
        };
        
        localStorage.setItem(storageKey, JSON.stringify(newPreviousData));
        
        return improvementScore;
    },
    
    /**
     * Get achievement score for employee
     * @param {string} employeeId Employee ID
     * @returns {number} Achievement score
     */
    getAchievementScore(employeeId) {
        // Check if we have the AchievementManager available
        if (typeof AchievementManager === 'undefined') {
            return 0;
        }
        
        try {
            // Get achievement points from AchievementManager
            const unlockedAchievements = AchievementManager.getUnlockedAchievements(employeeId);
            
            // Calculate total points
            return unlockedAchievements.reduce((sum, id) => {
                const achievement = AchievementManager.ACHIEVEMENTS.find(a => a.id === id);
                return sum + (achievement ? achievement.points : 0);
            }, 0);
        } catch (error) {
            console.error('Error getting achievement score:', error);
            return 0;
        }
    },
    
    /**
     * Get number of achievements unlocked for employee
     * @param {string} employeeId Employee ID
     * @returns {number} Number of achievements unlocked
     */
    getAchievementsUnlocked(employeeId) {
        // Check if we have the AchievementManager available
        if (typeof AchievementManager === 'undefined') {
            return 0;
        }
        
        try {
            const unlockedAchievements = AchievementManager.getUnlockedAchievements(employeeId);
            return unlockedAchievements.length;
        } catch (error) {
            console.error('Error getting achievements unlocked:', error);
            return 0;
        }
    },
    
    /**
     * Score break duration on a scale of 0-100
     * Ideal: 5-15 minutes (300,000-900,000 ms)
     * @param {number} avgDurationMs Average break duration in ms
     * @returns {number} Score 0-100
     */
    scoreBreakDuration(avgDurationMs) {
        const durationMin = avgDurationMs / 60000; // Convert to minutes
        
        if (durationMin < 2) {
            return durationMin * 25; // 0-2 min: 0-50 points (too short)
        } else if (durationMin >= 2 && durationMin < 5) {
            return 50 + (durationMin - 2) * 16.67; // 2-5 min: 50-100 points (approaching ideal)
        } else if (durationMin >= 5 && durationMin <= 15) {
            return 100; // 5-15 min: 100 points (ideal)
        } else if (durationMin > 15 && durationMin <= 30) {
            return 100 - ((durationMin - 15) * 3.33); // 15-30 min: 100-50 points (too long)
        } else {
            return Math.max(0, 50 - ((durationMin - 30) * 1.25)); // >30 min: 50-0 points (much too long)
        }
    },
    
    /**
     * Score total daily break time
     * Maximum daily break time: 45 minutes
     * @param {Array} breaks Array of break records for a day
     * @returns {number} Score 0-100
     */
    scoreTotalBreakTime(breaks) {
        // Group breaks by date
        const breaksByDate = {};
        breaks.forEach(breakItem => {
            if (!breaksByDate[breakItem.date]) {
                breaksByDate[breakItem.date] = [];
            }
            breaksByDate[breakItem.date].push(breakItem);
        });
        
        // Calculate total duration for each day
        const dailyDurations = Object.values(breaksByDate).map(dateBreaks => {
            return dateBreaks.reduce((sum, breakItem) => sum + breakItem.duration, 0);
        });
        
        // Calculate the average daily total
        if (dailyDurations.length === 0) return 50; // Default score
        
        const avgDailyTotalMs = dailyDurations.reduce((sum, duration) => sum + duration, 0) / dailyDurations.length;
        const avgDailyTotalMin = avgDailyTotalMs / 60000; // Convert to minutes
        
        // Max daily break time is 45 minutes
        const MAX_DAILY_BREAK_TIME = 45;
        
        // Score based on how close to the limit
        if (avgDailyTotalMin < 15) {
            return 50 + (avgDailyTotalMin / 15) * 25; // 0-15 min: 50-75 points (too little)
        } else if (avgDailyTotalMin >= 15 && avgDailyTotalMin <= MAX_DAILY_BREAK_TIME) {
            return 75 + ((avgDailyTotalMin - 15) / (MAX_DAILY_BREAK_TIME - 15)) * 25; // 15-45 min: 75-100 points (optimal)
        } else {
            // Penalize for exceeding limit
            return Math.max(0, 100 - ((avgDailyTotalMin - MAX_DAILY_BREAK_TIME) * 5)); // >45 min: rapidly decreasing score
        }
    },
    
    /**
     * Score break frequency on a scale of 0-100
     * Ideal: 3-6 breaks per day
     * @param {number} breaksPerDay Average breaks per day
     * @returns {number} Score 0-100
     */
    scoreBreakFrequency(breaksPerDay) {
        if (breaksPerDay < 1) {
            return breaksPerDay * 30; // 0-1 breaks: 0-30 points (too few)
        } else if (breaksPerDay >= 1 && breaksPerDay < 3) {
            return 30 + (breaksPerDay - 1) * 35; // 1-3 breaks: 30-100 points (approaching ideal)
        } else if (breaksPerDay >= 3 && breaksPerDay <= 6) {
            return 100; // 3-6 breaks: 100 points (ideal)
        } else if (breaksPerDay > 6 && breaksPerDay <= 10) {
            return 100 - ((breaksPerDay - 6) * 12.5); // 6-10 breaks: 100-50 points (too many)
        } else {
            return Math.max(0, 50 - ((breaksPerDay - 10) * 5)); // >10 breaks: 50-0 points (much too many)
        }
    },
    
    /**
     * Update the consistency leaderboard
     * @param {Array} metrics Array of employee metrics
     */
    updateConsistencyLeaderboard(metrics) {
        const leaderboardElement = document.getElementById('consistency-leaderboard');
        if (!leaderboardElement) return;
        
        if (metrics.length === 0) {
            leaderboardElement.innerHTML = '<li class="list-group-item text-center">No data available</li>';
            return;
        }
        
        // Sort by consistency score (highest first)
        metrics.sort((a, b) => b.consistencyScore - a.consistencyScore);
        
        // Take top 5
        const topConsistency = metrics.slice(0, 5);
        
        // Clear existing content
        leaderboardElement.innerHTML = '';
        
        // Add employees to leaderboard
        topConsistency.forEach((metric, index) => {
            const rankClass = index === 0 ? 'text-warning' : (index === 1 ? 'text-secondary' : (index === 2 ? 'text-info' : ''));
            const rankIcon = index < 3 ? `<i class="bi bi-trophy-fill me-2 ${rankClass}"></i>` : `<span class="me-2">${index + 1}.</span>`;
            
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    ${rankIcon}
                    <span>${metric.employee.name}</span>
                </div>
                <div>
                    <span class="badge bg-success rounded-pill">${Math.round(metric.consistencyScore)}%</span>
                    <small class="text-muted ms-2">${metric.totalBreaks} breaks</small>
                </div>
            `;
            
            leaderboardElement.appendChild(li);
        });
    },
    
    /**
     * Update the balance leaderboard
     * @param {Array} metrics Array of employee metrics
     */
    updateBalanceLeaderboard(metrics) {
        const leaderboardElement = document.getElementById('balance-leaderboard');
        if (!leaderboardElement) return;
        
        if (metrics.length === 0) {
            leaderboardElement.innerHTML = '<li class="list-group-item text-center">No data available</li>';
            return;
        }
        
        // Sort by balance score (highest first)
        metrics.sort((a, b) => b.balanceScore - a.balanceScore);
        
        // Take top 5
        const topBalance = metrics.slice(0, 5);
        
        // Clear existing content
        leaderboardElement.innerHTML = '';
        
        // Add employees to leaderboard
        topBalance.forEach((metric, index) => {
            const rankClass = index === 0 ? 'text-warning' : (index === 1 ? 'text-secondary' : (index === 2 ? 'text-info' : ''));
            const rankIcon = index < 3 ? `<i class="bi bi-trophy-fill me-2 ${rankClass}"></i>` : `<span class="me-2">${index + 1}.</span>`;
            
            const formattedDuration = Math.round(metric.avgDuration / 60000);
            
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `
                <div>
                    ${rankIcon}
                    <span>${metric.employee.name}</span>
                </div>
                <div>
                    <span class="badge bg-primary rounded-pill">${Math.round(metric.balanceScore)}%</span>
                    <small class="text-muted ms-2">~${formattedDuration} min</small>
                </div>
            `;
            
            leaderboardElement.appendChild(li);
        });
    },
    
    /**
     * Display message when no data is available
     */
    displayNoData() {
        const consistencyLeaderboard = document.getElementById('consistency-leaderboard');
        const balanceLeaderboard = document.getElementById('balance-leaderboard');
        
        const noDataMessage = '<li class="list-group-item text-center">No data available</li>';
        
        if (consistencyLeaderboard) {
            consistencyLeaderboard.innerHTML = noDataMessage;
        }
        
        if (balanceLeaderboard) {
            balanceLeaderboard.innerHTML = noDataMessage;
        }
    },
    
    /**
     * Filter breaks by date range
     * @param {Array} breaks Array of break records
     * @param {Date} startDate Start date for filtering
     * @returns {Array} Filtered breaks
     */
    filterBreaksByDate(breaks, startDate) {
        if (!startDate) return breaks;
        
        return breaks.filter(breakItem => {
            const breakDate = new Date(breakItem.startTime);
            return breakDate >= startDate;
        });
    },
    
    /**
     * Get start date for specified period
     * @param {string} period Period ('today', 'week', 'month', 'all')
     * @returns {Date|null} Start date or null for all time
     */
    getStartDateForPeriod(period) {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today
        
        switch (period) {
            case 'today':
                return now;
                
            case 'week': {
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                return startOfWeek;
            }
                
            case 'month': {
                const startOfMonth = new Date(now);
                startOfMonth.setDate(1); // Start of month
                return startOfMonth;
            }
                
            case 'all':
            default:
                return null; // No filtering
        }
    }
};