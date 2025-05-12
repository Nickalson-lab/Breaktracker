/**
 * Chart visualization for break data
 */
const BreakCharts = {
    /**
     * Chart instances
     */
    breakDurationChart: null,
    
    /**
     * Initialize charts
     */
    init() {
        // Set up chart defaults
        Chart.defaults.color = '#c9d1d9';
        Chart.defaults.borderColor = '#30363d';
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        
        // Create initial chart
        this.createBreakDurationChart();
    },
    
    /**
     * Create the break duration chart
     */
    createBreakDurationChart() {
        const ctx = document.getElementById('break-chart');
        if (!ctx) return;
        
        this.breakDurationChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Break Duration (minutes)',
                    data: [],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const minutes = context.raw;
                                return `${minutes.toFixed(1)} minutes`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutes'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Break #'
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Update the break duration chart with new data
     * @param {Array} breaks Array of break records
     */
    updateBreakDurationChart(breaks) {
        if (!this.breakDurationChart) {
            this.createBreakDurationChart();
            if (!this.breakDurationChart) return;
        }
        
        // Convert break durations from ms to minutes
        const chartData = breaks.map(breakItem => breakItem.duration / (1000 * 60));
        
        // Create labels (Break 1, Break 2, etc.)
        const labels = breaks.map((_, index) => `Break ${index + 1}`);
        
        // Update chart data
        this.breakDurationChart.data.labels = labels;
        this.breakDurationChart.data.datasets[0].data = chartData;
        
        // Update chart
        this.breakDurationChart.update();
    }
};
