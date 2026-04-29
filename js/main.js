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

// Scroll animations are handled by inline script in index.html
// (IntersectionObserver observes .reveal elements and adds .visible class on scroll)
// This keeps animation logic centralized and avoids duplicate observers

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
// NOTE: This runs after DOMContentLoaded has already fired (script loaded at end of body)
// so we don't wrap in DOMContentLoaded event listener
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

// Replace with your Discord webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1498899447621484695/XHuvCQ3ekVJxPDnQlZtz8VKE8ebj4appxuVQQeTaLyv1Xkepg18nckK1S7EJ-n1H43rM';

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
                    console.log('Contact form submitted successfully');

                    // Clear success message after 5 seconds
                    setTimeout(() => {
                        formStatus.style.display = 'none';
                    }, 5000);
                } else {
                    // Log the actual error response for debugging
                    const errorText = await response.text();
                    console.error(`Discord webhook error: ${response.status}`, errorText);
                    throw new Error(`Webhook failed with status ${response.status}`);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                formStatus.textContent = '❌ Error sending message. Please try again or email contact@topaitoolrank.com';
                formStatus.style.color = 'var(--accent-color)';
                // DO NOT reset form on error - keep user's message so they can retry
            } finally {
                submitBtn.textContent = 'Send Message';
                submitBtn.disabled = false;
            }
        });
    }

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
