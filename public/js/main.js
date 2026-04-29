// NOTE: Hamburger menu and reveal animations are already handled by
// the inline script in index.html. This file contains form handling
// and additional scroll event listeners.

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

// Discord API Route Contact Form Integration
// NOTE: This runs after DOMContentLoaded has already fired (script loaded at end of body)
// so we don't wrap in DOMContentLoaded event listener
const contactForm = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

if (contactForm) {
    console.log('✓ Form element found, attaching submit handler');
    contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('✓ Form submitted, preventing default');

            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();
            console.log('Form values:', { name, email, messageLength: message.length });

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
                // Send to Discord API route (server-side)
                console.log('Sending to /api/discord...');

                const response = await fetch('/api/discord', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'contact',
                        name: name,
                        email: email,
                        message: message
                    })
                });

                console.log('Discord API response status:', response.status, response.statusText);

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
                    console.error(`Discord API error: ${response.status}`, errorText);
                    throw new Error(`Request failed with status ${response.status}`);
                }
            } catch (error) {
                console.error('Form submission error:', error);
                console.error('Error stack:', error.stack);
                formStatus.textContent = '❌ Error sending message. Please check browser console (F12) for details and try again.';
                formStatus.style.color = 'var(--accent-color)';
                // DO NOT reset form on error - keep user's message so they can retry
            } finally {
                console.log('Form submission handler complete');
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
