// Minimal main script for visual effects
document.addEventListener('DOMContentLoaded', () => {
    createBackgroundElements();
});

function createBackgroundElements() {
    const container = document.getElementById('bg-animation');
    // Create some floating circles/shapes
    for (let i = 0; i < 15; i++) {
        const el = document.createElement('div');
        el.className = 'bg-ball';
        
        // Random size
        const size = Math.random() * 50 + 20;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        
        // Random position
        el.style.left = `${Math.random() * 100}vw`;
        el.style.top = `${Math.random() * 100}vh`;
        
        // Random color accent
        if (Math.random() > 0.6) {
            el.style.background = 'var(--primary-red)';
        } else {
            el.style.background = '#ffffff';
        }
        
        // Random animation delay
        el.style.animationDelay = `${Math.random() * 5}s`;
        el.style.animationDuration = `${Math.random() * 10 + 15}s`;
        
        container.appendChild(el);
    }
}
