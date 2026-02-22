/**
 * SCRIPT.JS
 * --------------------------------------------------------
 * Primarily used for the functionality of index.html.
 */

const default_hash = '#about';
const fade_in_delay = 27; // lower values makes the elements show faster on site loading and while changing tabs

document.addEventListener('DOMContentLoaded', function() {
    // ADD: SMALL DELAY TO ENSURE ELEMENTS ARE LOADED BEFORE SCROLLING
    setTimeout(function() {
        const currentHash = location.hash || default_hash;
        const targetElement = document.getElementById(currentHash.slice(1));
        
        if (targetElement) {
            targetElement.scrollIntoView();
        }
    }, 100);
});



location.hash = location.hash || default_hash;
changeTab(location.hash.slice(1));

window.addEventListener('hashchange', function() {
    changeTab(location.hash.slice(1));
});

function changeTab(tab) {
    try {
        // Hide all visible elements
        document.querySelectorAll('.fade-in.visible').forEach(element => {
            element.classList.remove('visible');
            element.classList.remove('fade-in-anim');
        });

        // Remove active tab class from all tab_switchers
        document.querySelectorAll('.tab_switcher').forEach(element => { 
            element.classList.remove('tab_active'); 
        });

        // Activate the selected tab
        document.getElementById(tab + '_tab').classList.add('tab_active');

        // Update indicator dots active state
        document.querySelectorAll('.indicator-dot').forEach(dot => {
            if (dot.dataset.tab === tab) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Reset scroll position of the active tab box
        document.getElementById(tab).scrollTop = 0;
        
        setTimeout(function() {
            document.getElementById(tab).scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 100);
        
        // Show elements of the selected tab
        let elements = document.getElementById(tab).querySelectorAll('*');
        
        let delay = 0;
        Array.from(elements).forEach(element => {
            element.classList.add('fade-in');
            setTimeout(function() {
                element.classList.add('visible');
                element.classList.add('fade-in-anim');
                
                // Trigger text scramble on H2 headings inside tabs
                if (element.tagName === 'H2' && element.closest('.tabs')) {
                    if (!element.dataset.scrambleInit) {
                        element.dataset.original = element.textContent.trim();
                        element.dataset.scrambleInit = 'true';
                    }
                    const fx = new TextScramble(element);
                    fx.setText(element.dataset.original);
                }
            }, delay);
            delay += fade_in_delay;
        });
    } catch {
        location.hash = default_hash;
    }
}

/**
 * HAMBURGER / NAVBAR
 */
function toggleMenu() {
    const menu = document.getElementById("nav_tabs");
    const hamburger = document.getElementById("hamburger-menu");
    
    menu.classList.toggle("active");
    hamburger.classList.toggle("active"); 
}

const menuItems = document.querySelectorAll("#nav_tabs li a");
menuItems.forEach(item => {
    item.addEventListener("click", () => {
        toggleMenu();
    });
});

// Close the menu if the user clicks anywhere outside the navbar or hamburger
document.addEventListener('click', function(event) {
    const menu = document.getElementById("nav_tabs");
    const hamburger = document.getElementById("hamburger-menu");
    
    if (menu && hamburger) {
        if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
            if (menu.classList.contains("active")) {
                toggleMenu();
            }
        }
    }
});

class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }
    setText(newText) {
        const oldText = this.el.innerText || '';
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40) + 20;
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }
    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

function loadAsciiArt() {
    const artWrapper = document.querySelector('.about-art-wrapper');
    if (artWrapper) {
        fetch('/src/assets/svg/portrait.svg')
            .then(res => {
                if (res.ok) return res.text();
                throw new Error('Failed to load portrait SVG');
            })
            .then(svgText => {
                artWrapper.innerHTML = svgText;
                
                // Trigger the progressive top-to-down scan animation on initial reload if on #about tab
                const currentHash = location.hash || '#about';
                if (currentHash === '#about') {
                    const svg = artWrapper.querySelector('.portrait-svg');
                    if (svg) {
                        const textElements = svg.querySelectorAll('text');
                        let delay = 0;
                        
                        // Hide all lines initially
                        textElements.forEach(el => {
                            el.classList.add('fade-in');
                        });
                        
                        // Stagger the fade-in of each line
                        textElements.forEach(el => {
                            setTimeout(() => {
                                el.classList.add('visible');
                                el.classList.add('fade-in-anim');
                            }, delay);
                            delay += fade_in_delay; // 27ms
                        });
                    }
                }
            })
            .catch(err => console.warn('Dynamic portrait load failed, using static fallback:', err));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadAsciiArt();
    
    // Initialize navbar text scramble
    const navLinks = document.querySelectorAll('#nav_tabs a:not(.nav-icon-link)');
    navLinks.forEach(link => {
        const target = link.querySelector('.scramble-target') || link;
        const fx = new TextScramble(target);
        const originalText = target.textContent.trim();
        link.addEventListener('mouseenter', () => {
            fx.setText(originalText);
        });
    });

    // Initialize indicator dot click handlers
    const dots = document.querySelectorAll('.indicator-dot');
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const targetTab = dot.dataset.tab;
            location.hash = '#' + targetTab;
        });
    });
});

// Swipe gesture navigation for mobile
let touchStartX = 0;
let touchStartY = 0;
const swipeThreshold = 75; // minimum distance in pixels

document.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

document.addEventListener('touchend', function(e) {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    // Check if swipe is horizontal and exceeds the threshold
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
        const tabs = ['about', 'experience', 'projects', 'skills'];
        const currentTab = location.hash.slice(1) || 'about';
        const currentIndex = tabs.indexOf(currentTab);
        
        if (currentIndex !== -1) {
            if (diffX < 0) {
                // Swipe Left (finger moves left) -> Next Tab
                if (currentIndex < tabs.length - 1) {
                    location.hash = '#' + tabs[currentIndex + 1];
                }
            } else {
                // Swipe Right (finger moves right) -> Previous Tab
                if (currentIndex > 0) {
                    location.hash = '#' + tabs[currentIndex - 1];
                }
            }
        }
    }
}, { passive: true });

// Text scramble logic initialized.

// Active swipe navigation initialized.

// TextScramble engine initialized.

// Mobile hamburger dropdown initialized.

// Mobile swipe handlers bound.

// Pointer-events rules bound to scramblers.

// TextScramble engine initialized.
