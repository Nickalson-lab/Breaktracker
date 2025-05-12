/**
 * Achievements and badges management for break time tracking
 */
const AchievementManager = {
    /**
     * Definition of all possible achievements
     */
    ACHIEVEMENTS: [
        {
            id: 'first_break',
            name: 'Break Starter',
            description: 'Take your first break',
            icon: 'bi-play-circle',
            color: 'info',
            condition: (userData) => userData.stats.totalBreaks >= 1,
            points: 10
        },
        {
            id: 'break_streak_3',
            name: 'Break Routine',
            description: 'Take breaks on 3 consecutive days',
            icon: 'bi-calendar3',
            color: 'primary',
            condition: (userData) => userData.stats.longestStreak >= 3,
            points: 30
        },
        {
            id: 'break_streak_7',
            name: 'Break Habit',
            description: 'Take breaks on 7 consecutive days',
            icon: 'bi-calendar-check',
            color: 'success',
            condition: (userData) => userData.stats.longestStreak >= 7,
            points: 70
        },
        {
            id: 'perfect_timing',
            name: 'Perfect Timing',
            description: 'Take a break between 5-15 minutes (ideal duration)',
            icon: 'bi-stopwatch',
            color: 'success',
            condition: (userData) => {
                const breaks = userData.breaks;
                return breaks.some(b => {
                    const durationMin = b.duration / 60000;
                    return durationMin >= 5 && durationMin <= 15;
                });
            },
            points: 20
        },
        {
            id: 'break_balance',
            name: 'Balance Master',
            description: 'Maintain break time under 45 minutes for 5 days',
            icon: 'bi-graph-up',
            color: 'warning',
            condition: (userData) => userData.stats.daysUnderLimit >= 5,
            points: 50
        },
        {
            id: 'break_regular',
            name: 'Regular Breaker',
            description: 'Take 3-6 breaks in a single day',
            icon: 'bi-alarm',
            color: 'info',
            condition: (userData) => {
                // Group breaks by date
                const breaksByDate = {};
                userData.breaks.forEach(breakItem => {
                    if (!breaksByDate[breakItem.date]) {
                        breaksByDate[breakItem.date] = [];
                    }
                    breaksByDate[breakItem.date].push(breakItem);
                });
                
                // Check if any day has 3-6 breaks
                return Object.values(breaksByDate).some(dayBreaks => 
                    dayBreaks.length >= 3 && dayBreaks.length <= 6
                );
            },
            points: 30
        },
        {
            id: 'early_bird',
            name: 'Early Bird',
            description: 'Take a break before 10:00 AM',
            icon: 'bi-sunrise',
            color: 'primary',
            condition: (userData) => {
                return userData.breaks.some(b => {
                    const startTime = new Date(b.startTime);
                    return startTime.getHours() < 10;
                });
            },
            points: 15
        },
        {
            id: 'consistency_champion',
            name: 'Consistency Champion',
            description: 'Take breaks at similar times for 3 days',
            icon: 'bi-award',
            color: 'warning',
            condition: (userData) => userData.stats.consistencyScore >= 80,
            points: 40
        },
        {
            id: 'break_expert',
            name: 'Break Expert',
            description: 'Earn 100+ achievement points',
            icon: 'bi-trophy',
            color: 'warning',
            condition: (userData) => userData.stats.achievementPoints >= 100,
            points: 50
        },
        {
            id: 'break_master',
            name: 'Break Master',
            description: 'Unlock 5+ achievements',
            icon: 'bi-stars',
            color: 'danger',
            condition: (userData) => userData.stats.achievementsUnlocked >= 5,
            points: 100
        }
    ],
    
    /**
     * Initialize achievements system
     */
    init() {
        this.checkAchievements();
        this.setupEventListeners();
    },
    
    /**
     * Set up event listeners for achievement-related elements
     */
    setupEventListeners() {
        // Badges tab click - can be dynamic if we're viewing achievements
        const badgesTab = document.getElementById('badges-tab');
        if (badgesTab) {
            badgesTab.addEventListener('click', () => {
                this.refreshAchievementDisplay();
            });
        }
    },
    
    /**
     * Check for newly unlocked achievements
     */
    checkAchievements() {
        const currentUser = StorageUtil.getCurrentUser();
        if (!currentUser) return;
        
        // Get user data including breaks and achievements
        const userData = this.getUserData(currentUser.id);
        
        // Get currently unlocked achievements
        const unlockedAchievements = this.getUnlockedAchievements(currentUser.id);
        
        // Check for newly unlocked achievements
        let newAchievements = [];
        
        this.ACHIEVEMENTS.forEach(achievement => {
            // Skip if already unlocked
            if (unlockedAchievements.includes(achievement.id)) return;
            
            // Check if condition is met
            if (achievement.condition(userData)) {
                // Unlock the achievement
                this.unlockAchievement(currentUser.id, achievement.id);
                newAchievements.push(achievement);
                
                // Update stats
                userData.stats.achievementsUnlocked++;
                userData.stats.achievementPoints += achievement.points;
            }
        });
        
        // Save updated stats
        this.saveUserStats(currentUser.id, userData.stats);
        
        // Display notification for new achievements
        if (newAchievements.length > 0) {
            this.showAchievementNotification(newAchievements);
        }
        
        // Update achievement display
        this.refreshAchievementDisplay();
    },
    
    /**
     * Get user data including breaks and stats
     * @param {string} userId User ID
     * @returns {Object} User data object
     */
    getUserData(userId) {
        // Get all breaks
        const breaks = StorageUtil.getBreaks(userId);
        
        // Get or initialize user stats
        let stats = this.getUserStats(userId);
        
        return {
            breaks: breaks,
            stats: stats
        };
    },
    
    /**
     * Get user stats or initialize if not exist
     * @param {string} userId User ID
     * @returns {Object} User stats
     */
    getUserStats(userId) {
        const key = `breaktime_user_stats_${userId}`;
        const stats = localStorage.getItem(key);
        
        if (stats) {
            return JSON.parse(stats);
        }
        
        // Calculate initial stats
        const initialStats = this.calculateUserStats(userId);
        this.saveUserStats(userId, initialStats);
        
        return initialStats;
    },
    
    /**
     * Save user stats
     * @param {string} userId User ID
     * @param {Object} stats Stats object
     */
    saveUserStats(userId, stats) {
        const key = `breaktime_user_stats_${userId}`;
        localStorage.setItem(key, JSON.stringify(stats));
    },
    
    /**
     * Calculate user statistics from break data
     * @param {string} userId User ID
     * @returns {Object} Stats object
     */
    calculateUserStats(userId) {
        const breaks = StorageUtil.getBreaks(userId);
        const unlockedAchievements = this.getUnlockedAchievements(userId);
        
        // Group breaks by date
        const breaksByDate = {};
        breaks.forEach(breakItem => {
            if (!breaksByDate[breakItem.date]) {
                breaksByDate[breakItem.date] = [];
            }
            breaksByDate[breakItem.date].push(breakItem);
        });
        
        // Count days with breaks
        const daysWithBreaks = Object.keys(breaksByDate).length;
        
        // Calculate longest streak
        const dates = Object.keys(breaksByDate).sort();
        let longestStreak = 0;
        let currentStreak = 0;
        
        for (let i = 0; i < dates.length; i++) {
            if (i === 0) {
                currentStreak = 1;
            } else {
                // Check if this date is consecutive with the previous one
                const prevDate = new Date(dates[i-1]);
                const currDate = new Date(dates[i]);
                
                // Add one day to previous date
                prevDate.setDate(prevDate.getDate() + 1);
                
                if (
                    prevDate.getFullYear() === currDate.getFullYear() &&
                    prevDate.getMonth() === currDate.getMonth() &&
                    prevDate.getDate() === currDate.getDate()
                ) {
                    // Consecutive day
                    currentStreak++;
                } else {
                    // Break in streak
                    currentStreak = 1;
                }
            }
            
            longestStreak = Math.max(longestStreak, currentStreak);
        }
        
        // Count days under limit
        const MAX_DAILY_BREAK_TIME = 45 * 60 * 1000; // 45 minutes in ms
        let daysUnderLimit = 0;
        
        Object.values(breaksByDate).forEach(dayBreaks => {
            const totalDayTime = dayBreaks.reduce((sum, b) => sum + b.duration, 0);
            if (totalDayTime <= MAX_DAILY_BREAK_TIME) {
                daysUnderLimit++;
            }
        });
        
        // Calculate consistency score
        let consistencyScore = 0;
        if (dates.length > 2) {
            // Calculate average time of day for breaks
            const breakTimesByDate = {};
            
            Object.entries(breaksByDate).forEach(([date, dayBreaks]) => {
                breakTimesByDate[date] = dayBreaks.map(b => {
                    const startTime = new Date(b.startTime);
                    // Minutes since midnight
                    return startTime.getHours() * 60 + startTime.getMinutes();
                });
            });
            
            // Compare break patterns between days
            const dateValues = Object.values(breakTimesByDate);
            let totalScore = 0;
            let comparisons = 0;
            
            for (let i = 0; i < dateValues.length; i++) {
                for (let j = i + 1; j < dateValues.length; j++) {
                    // Compare day i with day j
                    const similarityScore = this.calculateBreakPatternSimilarity(dateValues[i], dateValues[j]);
                    totalScore += similarityScore;
                    comparisons++;
                }
            }
            
            consistencyScore = comparisons > 0 ? (totalScore / comparisons) * 100 : 0;
        }
        
        return {
            totalBreaks: breaks.length,
            daysWithBreaks: daysWithBreaks,
            longestStreak: longestStreak,
            daysUnderLimit: daysUnderLimit,
            consistencyScore: Math.round(consistencyScore),
            achievementsUnlocked: unlockedAchievements.length,
            achievementPoints: unlockedAchievements.reduce((sum, id) => {
                const achievement = this.ACHIEVEMENTS.find(a => a.id === id);
                return sum + (achievement ? achievement.points : 0);
            }, 0),
            lastUpdated: new Date().toISOString()
        };
    },
    
    /**
     * Calculate similarity between two days' break patterns
     * @param {Array} day1Breaks Array of break times (minutes since midnight) for day 1
     * @param {Array} day2Breaks Array of break times (minutes since midnight) for day 2
     * @returns {number} Similarity score (0-1)
     */
    calculateBreakPatternSimilarity(day1Breaks, day2Breaks) {
        if (day1Breaks.length === 0 || day2Breaks.length === 0) {
            return 0;
        }
        
        // If break counts are very different, reduce score
        const countDiff = Math.abs(day1Breaks.length - day2Breaks.length);
        const countFactor = Math.max(0, 1 - (countDiff / Math.max(day1Breaks.length, day2Breaks.length)));
        
        // Sort both arrays
        day1Breaks.sort((a, b) => a - b);
        day2Breaks.sort((a, b) => a - b);
        
        // Find best match for each break in day1 to a break in day2
        let totalTimeDiff = 0;
        const maxAllowedDiff = 120; // 2 hours max difference
        
        for (let i = 0; i < Math.min(day1Breaks.length, day2Breaks.length); i++) {
            const timeDiff = Math.abs(day1Breaks[i] - day2Breaks[i]);
            totalTimeDiff += Math.min(timeDiff, maxAllowedDiff);
        }
        
        // Calculate average time difference
        const avgTimeDiff = totalTimeDiff / Math.min(day1Breaks.length, day2Breaks.length);
        
        // Convert to similarity score (0-1)
        const timeSimilarity = Math.max(0, 1 - (avgTimeDiff / maxAllowedDiff));
        
        // Combine factors
        return (countFactor * 0.4) + (timeSimilarity * 0.6);
    },
    
    /**
     * Get list of unlocked achievement IDs
     * @param {string} userId User ID
     * @returns {Array} Array of achievement IDs
     */
    getUnlockedAchievements(userId) {
        const key = `breaktime_achievements_${userId}`;
        const achievements = localStorage.getItem(key);
        return achievements ? JSON.parse(achievements) : [];
    },
    
    /**
     * Unlock an achievement
     * @param {string} userId User ID
     * @param {string} achievementId Achievement ID
     */
    unlockAchievement(userId, achievementId) {
        const unlockedAchievements = this.getUnlockedAchievements(userId);
        
        // Skip if already unlocked
        if (unlockedAchievements.includes(achievementId)) {
            return;
        }
        
        // Add to unlocked list
        unlockedAchievements.push(achievementId);
        
        // Save
        const key = `breaktime_achievements_${userId}`;
        localStorage.setItem(key, JSON.stringify(unlockedAchievements));
    },
    
    /**
     * Show notification for newly unlocked achievements
     * @param {Array} achievements Array of achievement objects
     */
    showAchievementNotification(achievements) {
        if (achievements.length === 0) return;
        
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            document.body.appendChild(toastContainer);
        }
        
        // Create and display toast for each achievement
        achievements.forEach(achievement => {
            const toast = document.createElement('div');
            toast.className = 'toast show';
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            toast.innerHTML = `
                <div class="toast-header bg-${achievement.color} text-white">
                    <i class="bi ${achievement.icon} me-2"></i>
                    <strong class="me-auto">Achievement Unlocked!</strong>
                    <small>just now</small>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>${achievement.name}</strong>
                            <p class="mb-0">${achievement.description}</p>
                        </div>
                        <div class="ms-3">
                            <span class="badge bg-${achievement.color}">${achievement.points}pts</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Add close button functionality
            const closeBtn = toast.querySelector('.btn-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    toast.remove();
                });
            }
            
            // Auto-remove after 5 seconds
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.remove();
            }, 5000);
        });
    },
    
    /**
     * Refresh achievement display on the UI
     */
    refreshAchievementDisplay() {
        const badgesContainer = document.getElementById('badges-container');
        if (!badgesContainer) return;
        
        const currentUser = StorageUtil.getCurrentUser();
        if (!currentUser) return;
        
        // Get unlocked achievements
        const unlockedAchievements = this.getUnlockedAchievements(currentUser.id);
        
        // Get user stats
        const stats = this.getUserStats(currentUser.id);
        
        // Update achievement points display
        const pointsDisplay = document.getElementById('achievement-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = stats.achievementPoints;
        }
        
        // Clear container
        badgesContainer.innerHTML = '';
        
        // Add all achievements (unlocked and locked)
        this.ACHIEVEMENTS.forEach(achievement => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            
            const achievementCard = document.createElement('div');
            achievementCard.className = `achievement-card col-md-4 mb-3`;
            
            achievementCard.innerHTML = `
                <div class="card h-100 ${isUnlocked ? '' : 'text-muted'}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div class="achievement-icon ${isUnlocked ? `text-${achievement.color}` : 'text-secondary'}">
                                <i class="bi ${achievement.icon} fs-3"></i>
                            </div>
                            <span class="badge ${isUnlocked ? `bg-${achievement.color}` : 'bg-secondary'}">${achievement.points}pts</span>
                        </div>
                        <h5 class="card-title">${achievement.name}</h5>
                        <p class="card-text">${achievement.description}</p>
                        ${isUnlocked ? '<div class="unlocked-badge"><i class="bi bi-check-circle-fill text-success"></i> Unlocked</div>' : ''}
                    </div>
                </div>
            `;
            
            badgesContainer.appendChild(achievementCard);
        });
    },
    
    /**
     * Update user stats based on current break data
     * Typically called after breaks are added or removed
     */
    updateUserStats() {
        const currentUser = StorageUtil.getCurrentUser();
        if (!currentUser) return;
        
        // Recalculate stats
        const updatedStats = this.calculateUserStats(currentUser.id);
        
        // Save updated stats
        this.saveUserStats(currentUser.id, updatedStats);
        
        // Check for new achievements based on updated stats
        this.checkAchievements();
    }
};