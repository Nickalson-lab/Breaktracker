/**
 * Daily motivational quotes functionality
 */
const QuoteManager = {
    /**
     * List of motivational quotes about breaks, wellness, and productivity
     */
    QUOTES: [
        {
            text: "Taking breaks is not a waste of time; it's an investment in your well-being and productivity.",
            author: "Anonymous"
        },
        {
            text: "The time to relax is when you don't have time for it.",
            author: "Sydney J. Harris"
        },
        {
            text: "Almost everything will work again if you unplug it for a few minutes, including you.",
            author: "Anne Lamott"
        },
        {
            text: "Rest when you're weary. Refresh and renew yourself, your body, your mind, your spirit. Then get back to work.",
            author: "Ralph Marston"
        },
        {
            text: "Sometimes the most productive thing you can do is relax.",
            author: "Mark Black"
        },
        {
            text: "Your calm mind is the ultimate weapon against your challenges. So relax.",
            author: "Bryant McGill"
        },
        {
            text: "Take rest; a field that has rested gives a bountiful crop.",
            author: "Ovid"
        },
        {
            text: "No matter how busy you are, or how busy you think you are, the work will always be there tomorrow, but your health might not be.",
            author: "Anonymous"
        },
        {
            text: "Self-care is how you take your power back.",
            author: "Lalah Delia"
        },
        {
            text: "To be at your best, you need to take regular breaks to recharge and reset.",
            author: "Anonymous"
        },
        {
            text: "Life is not about how fast you run or how high you climb, but how well you bounce.",
            author: "Vivian Komori"
        },
        {
            text: "If you get tired, learn to rest, not to quit.",
            author: "Banksy"
        },
        {
            text: "The time to relax is when you don't have time for it.",
            author: "Jim Goodwin"
        },
        {
            text: "Breaks are the bridge between burnout and sustainable productivity.",
            author: "Anonymous"
        },
        {
            text: "Sometimes the most important thing in a whole day is the rest we take between two deep breaths.",
            author: "Etty Hillesum"
        },
        {
            text: "Rest is not idleness, and to lie sometimes on the grass under trees on a summer's day, listening to the murmur of the water, or watching the clouds float across the sky, is by no means a waste of time.",
            author: "John Lubbock"
        },
        {
            text: "A good rest is half the work.",
            author: "Yugoslavian Proverb"
        },
        {
            text: "Don't underestimate the value of doing nothing, of just going along, listening to all the things you can't hear, and not bothering.",
            author: "Winnie the Pooh"
        },
        {
            text: "Your brain is like a computer. When it becomes overloaded, it crashes. Taking breaks is your system update.",
            author: "Anonymous"
        },
        {
            text: "Taking a break can lead to breakthroughs.",
            author: "Russell Eric Dobda"
        },
        {
            text: "Stop measuring days by degree of productivity and start experiencing them by degree of presence.",
            author: "Alan Watts"
        },
        {
            text: "For fast-acting relief, try slowing down.",
            author: "Lily Tomlin"
        },
        {
            text: "Rest is not a luxury, it's a necessity.",
            author: "Anonymous"
        },
        {
            text: "The work will wait while you show your child the rainbow, but the rainbow won't wait while you do the work.",
            author: "Pat Clifford"
        },
        {
            text: "Humans are not designed to run constantly. We're designed to pulse between spending and renewing energy.",
            author: "Tony Schwartz"
        },
        {
            text: "Take breaks regularly to stretch, move, and rehydrate — your brain will thank you.",
            author: "Anonymous"
        },
        {
            text: "You can't pour from an empty cup. Take care of yourself first.",
            author: "Anonymous"
        },
        {
            text: "Success is not about working harder, it's about working smarter with well-timed breaks.",
            author: "Anonymous"
        },
        {
            text: "Self-care is giving the world the best of you, instead of what's left of you.",
            author: "Katie Reed"
        },
        {
            text: "The key to productivity is not time management, but energy management through strategic breaks.",
            author: "Anonymous"
        },
        {
            text: "The quality of your recovery time determines the quality of your work time.",
            author: "Anonymous"
        },
        {
            text: "Burnout happens not because we're trying to solve problems but because we're trying to solve the same problems over and over. Take a break.",
            author: "Susan Scott"
        },
        {
            text: "Learning to take a pause is learning to find the rhythm of life.",
            author: "Anonymous"
        },
        {
            text: "The greatest weapon against stress is our ability to choose one thought over another. Choose rest.",
            author: "William James"
        },
        {
            text: "Mental breaks increase productivity, replenish attention, solidify memories, and encourage creativity.",
            author: "Anonymous"
        },
        {
            text: "The most efficient way to live reasonably is every morning to make a plan of one's day and every night to examine the results.",
            author: "Alexis Carrel"
        },
        {
            text: "The best way to pay attention to your work is to occasionally look away from it.",
            author: "Anonymous"
        },
        {
            text: "Just like your devices need to be recharged regularly, so does your mind and body.",
            author: "Anonymous"
        },
        {
            text: "A breather a day keeps the burnout away.",
            author: "Anonymous"
        },
        {
            text: "Take care of your body. It's the only place you have to live.",
            author: "Jim Rohn"
        },
        {
            text: "Breaks are not a sign of weakness but of wisdom — knowing when to pause to ultimately go further.",
            author: "Anonymous"
        },
        {
            text: "Work hard, but don't forget to pause and appreciate life's beauty.",
            author: "Anonymous"
        },
        {
            text: "Rest is not the opposite of work; it's a critical component of it.",
            author: "Anonymous"
        },
        {
            text: "Sometimes the most productive thing you can do is walk away and clear your mind.",
            author: "Anonymous"
        },
        {
            text: "In the midst of movement and chaos, keep stillness inside of you.",
            author: "Deepak Chopra"
        },
        {
            text: "Your future self will thank you for the breaks you take today.",
            author: "Anonymous"
        },
        {
            text: "When we take time to replenish our spirit, it allows us to serve others from the overflow.",
            author: "Eleanor Brown"
        },
        {
            text: "Short breaks, long impact. Take them regularly.",
            author: "Anonymous"
        },
        {
            text: "Balance is not something you find, it's something you create through mindful breaks.",
            author: "Anonymous"
        },
        {
            text: "Productivity is never an accident. It is always the result of a commitment to excellence, intelligent planning, and focused effort—punctuated by well-timed breaks.",
            author: "Paul J. Meyer (adapted)"
        }
    ],
    
    /**
     * Initialize quote display
     */
    init() {
        this.displayDailyQuote();
    },
    
    /**
     * Display today's motivational quote
     */
    displayDailyQuote() {
        const quoteContainer = document.getElementById('daily-quote-container');
        if (!quoteContainer) {
            console.error('Quote container not found in the DOM');
            return;
        }
        
        try {
            // Get today's quote based on the date
            const todayQuote = this.getTodaysQuote();
            
            // Log for debugging
            console.log('Today\'s quote:', todayQuote);
            
            // Update the quote in the UI
            quoteContainer.innerHTML = `
                <div class="quote-text">
                    <i class="bi bi-quote me-2"></i>${todayQuote.text}
                </div>
                <div class="quote-author mt-2 text-end">
                    — ${todayQuote.author}
                </div>
            `;
        } catch (error) {
            console.error('Error displaying quote:', error);
            quoteContainer.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Could not load today's inspiration. Please refresh the page.
                </div>
            `;
        }
    },
    
    /**
     * Get today's quote based on the current date
     * @returns {Object} Quote object with text and author
     */
    getTodaysQuote() {
        try {
            const today = new Date();
            // Get a simple date-based number that's consistent for all users
            // Use month and day to create a number between 0 and ~365
            const dateNumber = (today.getMonth() * 31) + today.getDate() - 1;
            
            // Use the date number to determine which quote to show (modulo to stay in range)
            const quoteIndex = dateNumber % this.QUOTES.length;
            console.log('Selected quote index:', quoteIndex, 'out of', this.QUOTES.length, 'quotes');
            
            // Fallback in case of any issues
            if (!this.QUOTES[quoteIndex]) {
                console.warn('Quote index out of range, using fallback');
                return {
                    text: "Taking breaks is not a waste of time; it's an investment in your well-being and productivity.",
                    author: "Anonymous"
                };
            }
            
            return this.QUOTES[quoteIndex];
        } catch (error) {
            console.error('Error getting today\'s quote:', error);
            // Return a fallback quote
            return {
                text: "Taking breaks is not a waste of time; it's an investment in your well-being and productivity.",
                author: "Anonymous"
            };
        }
    },
    
    /**
     * Calculate the day of the year (1-366)
     * @param {Date} date Date object
     * @returns {number} Day of year
     */
    getDayOfYear(date) {
        // More reliable implementation
        const yearStart = new Date(date.getFullYear(), 0, 1);
        // Adjust for timezone differences
        const diff = (date - yearStart) + ((yearStart.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay) + 1; // +1 because we want 1-366, not 0-365
        
        console.log('Current date:', date);
        console.log('Day of year:', dayOfYear);
        
        return dayOfYear;
    }
};