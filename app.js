/**
 * Main application initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    const isDashboard = document.getElementById('break-chart') !== null;
    
    if (isDashboard) {
        // Initialize break management
        BreakManager.init();
        
        // Initialize charts
        BreakCharts.init();
        
        // Initialize daily quote with slight delay to ensure all scripts are loaded
        setTimeout(() => {
            try {
                console.log('Initializing QuoteManager...');
                
                if (typeof QuoteManager === 'undefined') {
                    console.error('QuoteManager is undefined');
                    
                    // Try to display a fallback quote if manager is unavailable
                    const quoteContainer = document.getElementById('daily-quote-container');
                    if (quoteContainer) {
                        quoteContainer.innerHTML = `
                            <div class="quote-text">
                                <i class="bi bi-quote me-2"></i>Taking breaks is not a waste of time; it's an investment in your well-being and productivity.
                            </div>
                            <div class="quote-author mt-2 text-end">
                                — Anonymous
                            </div>
                        `;
                    }
                } else {
                    // Set the current date for the quote
                    const quoteDate = document.getElementById('quote-date');
                    if (quoteDate) {
                        const today = new Date();
                        quoteDate.textContent = today.toLocaleDateString(undefined, { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        });
                    }
                    
                    // Initialize quote manager
                    QuoteManager.init();
                    console.log('QuoteManager initialized successfully');
                }
            } catch (error) {
                console.error('Error initializing QuoteManager:', error);
                
                // Display fallback quote in case of error
                const quoteContainer = document.getElementById('daily-quote-container');
                if (quoteContainer) {
                    quoteContainer.innerHTML = `
                        <div class="quote-text">
                            <i class="bi bi-quote me-2"></i>Every day is a fresh beginning. Take a deep breath and start again.
                        </div>
                        <div class="quote-author mt-2 text-end">
                            — Anonymous
                        </div>
                    `;
                }
            }
        }, 100); // Small delay to ensure all scripts are loaded
        
        // Initialize achievements
        if (typeof AchievementManager !== 'undefined') {
            AchievementManager.init();
            
            // Hook up break events to check for achievements
            const originalEndBreak = BreakManager.endBreak;
            BreakManager.endBreak = function() {
                // Call original function
                originalEndBreak.apply(this, arguments);
                
                // Check for new achievements
                AchievementManager.updateUserStats();
            };
        }
    }
    
    // Log application startup
    console.log('BreakTime Manager application initialized');
});
