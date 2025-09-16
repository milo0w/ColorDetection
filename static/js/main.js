// Color Detection Frontend Logic
class ColorDetectionApp {
    constructor() {
        this.detectionActive = true;
        this.stats = { red: 0, yellow: 0, total_frames: 0 };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startStatsUpdate();
        this.setupVideoErrorHandling();
    }

    setupEventListeners() {
        // Toggle detection button
        const toggleBtn = document.getElementById('toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleDetection());
        }

        // Refresh stats button
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshStats());
        }

        // Video stream error handling
        const videoStream = document.getElementById('video-stream');
        if (videoStream) {
            videoStream.addEventListener('error', () => this.handleVideoError());
            videoStream.addEventListener('load', () => this.handleVideoLoad());
        }
    }

    async toggleDetection() {
        const toggleBtn = document.getElementById('toggle-btn');
        const btnText = toggleBtn.querySelector('.btn-text');
        const btnIcon = toggleBtn.querySelector('.btn-icon');
        const statusIndicator = document.getElementById('status-indicator');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');

        // Show loading state
        btnText.textContent = 'Loading...';
        btnIcon.innerHTML = '<div class="loading"></div>';
        toggleBtn.disabled = true;

        try {
            const response = await fetch('/toggle_detection');
            const data = await response.json();
            
            this.detectionActive = data.status === 'active';
            
            if (this.detectionActive) {
                btnText.textContent = 'Pause Detection';
                btnIcon.textContent = '⏸️';
                toggleBtn.className = 'control-btn primary';
                statusDot.className = 'status-dot active';
                statusText.textContent = 'Detection Active';
            } else {
                btnText.textContent = 'Resume Detection';
                btnIcon.textContent = '▶️';
                toggleBtn.className = 'control-btn secondary';
                statusDot.className = 'status-dot';
                statusText.textContent = 'Detection Paused';
            }

            this.showNotification(`Detection ${this.detectionActive ? 'resumed' : 'paused'}`, 'success');
        } catch (error) {
            console.error('Error toggling detection:', error);
            this.showNotification('Failed to toggle detection', 'error');
        } finally {
            toggleBtn.disabled = false;
        }
    }

    async refreshStats() {
        const refreshBtn = document.getElementById('refresh-btn');
        const btnText = refreshBtn.querySelector('.btn-text');
        const btnIcon = refreshBtn.querySelector('.btn-icon');

        // Show loading state
        const originalText = btnText.textContent;
        btnText.textContent = 'Refreshing...';
        btnIcon.innerHTML = '<div class="loading"></div>';
        refreshBtn.disabled = true;

        try {
            await this.updateStats();
            this.showNotification('Statistics refreshed', 'success');
        } catch (error) {
            console.error('Error refreshing stats:', error);
            this.showNotification('Failed to refresh statistics', 'error');
        } finally {
            setTimeout(() => {
                btnText.textContent = originalText;
                btnIcon.textContent = '🔄';
                refreshBtn.disabled = false;
            }, 1000);
        }
    }

    async updateStats() {
        try {
            const response = await fetch('/stats');
            const newStats = await response.json();
            
            this.animateStatUpdate('red-count', this.stats.red, newStats.red);
            this.animateStatUpdate('yellow-count', this.stats.yellow, newStats.yellow);
            this.animateStatUpdate('total-frames', this.stats.total_frames, newStats.total_frames);
            
            this.stats = newStats;
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    animateStatUpdate(elementId, oldValue, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (oldValue !== newValue) {
            element.style.transform = 'scale(1.1)';
            element.style.color = 'var(--accent-green)';
            
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
                element.style.color = 'var(--primary-pink)';
            }, 150);
        }
    }

    startStatsUpdate() {
        // Update stats every 2 seconds
        setInterval(() => {
            if (this.detectionActive) {
                this.updateStats();
            }
        }, 2000);
    }

    setupVideoErrorHandling() {
        const videoStream = document.getElementById('video-stream');
        let retryCount = 0;
        const maxRetries = 3;

        const retryVideo = () => {
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    retryCount++;
                    videoStream.src = videoStream.src + '?t=' + Date.now();
                }, 2000);
            }
        };

        videoStream.addEventListener('error', retryVideo);
    }

    handleVideoError() {
        const statusIndicator = document.getElementById('status-indicator');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        statusDot.className = 'status-dot';
        statusDot.style.background = 'var(--accent-red)';
        statusText.textContent = 'Camera Error';
        
        this.showNotification('Camera connection lost', 'error');
    }

    handleVideoLoad() {
        const statusIndicator = document.getElementById('status-indicator');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (this.detectionActive) {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'Detection Active';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            fontSize: '0.9rem',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: 'var(--accent-green)',
            error: 'var(--accent-red)',
            info: 'var(--primary-pink)'
        };
        notification.style.background = colors[type] || colors.info;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ColorDetectionApp();
});

// Add some interactive animations
document.addEventListener('DOMContentLoaded', () => {
    // Animate stat cards on hover
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.control-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Add CSS animation for ripple effect
    if (!document.getElementById('ripple-animation')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation';
        style.textContent = `
            @keyframes ripple {
                0% { transform: scale(0); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
});