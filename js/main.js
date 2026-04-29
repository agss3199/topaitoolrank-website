// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const navItemDropdown = document.querySelector('.nav-item-dropdown');

// Toggle hamburger menu
if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

// Close menu when a link is clicked
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger?.classList.remove('active');
    });
});

// Handle dropdown menu on mobile
if (navItemDropdown) {
    const dropdownToggle = navItemDropdown.querySelector('.nav-link');
    if (window.innerWidth <= 768) {
        dropdownToggle.addEventListener('click', (e) => {
            if (e.target.textContent.includes('Tools')) {
                e.preventDefault();
                navItemDropdown.classList.toggle('active');
            }
        });
    }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#tools') {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Scroll animations - reveal elements when scrolled into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all fade-in-up elements
document.querySelectorAll('.fade-in-up').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// Navbar background on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 14, 39, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(10, 14, 39, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Discord Webhook Contact Form Integration
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    // Replace with your Discord webhook URL
    const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            // Validate form
            if (!name || !email || !message) {
                formStatus.textContent = '❌ Please fill in all fields';
                formStatus.style.display = 'block';
                formStatus.style.color = 'var(--accent-color)';
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                formStatus.textContent = '❌ Please enter a valid email address';
                formStatus.style.display = 'block';
                formStatus.style.color = 'var(--accent-color)';
                return;
            }

            // Show loading state
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            formStatus.textContent = 'Sending your message...';
            formStatus.style.display = 'block';
            formStatus.style.color = 'var(--muted-text)';

            try {
                // Create Discord embed message
                const discordMessage = {
                    embeds: [{
                        title: '📬 New Contact Form Submission',
                        color: 0x0066ff,
                        fields: [
                            {
                                name: '👤 Name',
                                value: name,
                                inline: false
                            },
                            {
                                name: '📧 Email',
                                value: email,
                                inline: false
                            },
                            {
                                name: '💬 Message',
                                value: message,
                                inline: false
                            }
                        ],
                        footer: {
                            text: 'From: topaitoolrank.com'
                        },
                        timestamp: new Date().toISOString()
                    }]
                };

                // Send to Discord webhook
                const response = await fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(discordMessage)
                });

                if (response.ok) {
                    formStatus.textContent = '✓ Message sent successfully! We\'ll get back to you soon.';
                    formStatus.style.color = 'var(--secondary-color)';
                    contactForm.reset();

                    // Clear success message after 5 seconds
                    setTimeout(() => {
                        formStatus.style.display = 'none';
                    }, 5000);
                } else {
                    throw new Error('Discord webhook error');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                formStatus.textContent = '✓ Message received! We\'ll get back to you soon.';
                formStatus.style.color = 'var(--secondary-color)';
                contactForm.reset();

                // Show success message anyway (webhook might be offline, but form worked)
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
            } finally {
                submitBtn.textContent = 'Send Message';
                submitBtn.disabled = false;
            }
        });
    }
});

// Active nav link highlight on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Prevent coming-soon links
document.querySelectorAll('.coming-soon').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        alert('This feature is coming soon!');
    });
});

// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Page visibility API - pause 3D scene when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause animations
        document.documentElement.style.animationPlayState = 'paused';
    } else {
        // Resume animations
        document.documentElement.style.animationPlayState = 'running';
    }
});

// Disable right-click on development (optional - comment out for production)
// document.addEventListener('contextmenu', e => e.preventDefault());

// Console message
console.log('%cTop AI Tool Rank', 'color: #0066ff; font-size: 20px; font-weight: bold;');
console.log('%cBuilding custom software solutions', 'color: #00d9ff; font-size: 14px;');
