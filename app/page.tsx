"use client";

import { useEffect, useRef } from "react";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const navMenuRef = useRef<HTMLUListElement>(null);
  const particlesRef = useRef<any[]>([]);

  useEffect(() => {
    // Hamburger menu toggle
    const hamburger = hamburgerRef.current;
    const navMenu = navMenuRef.current;

    if (hamburger && navMenu) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
      });

      document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => {
          hamburger.classList.remove("active");
          navMenu.classList.remove("active");
        });
      });
    }

    // Reveal scroll animations
    const revealItems = document.querySelectorAll(".reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    // Canvas particle animation
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const resizeCanvas = () => {
          canvas.width = window.innerWidth;
          const heroSection = document.querySelector(".hero");
          if (heroSection) {
            canvas.height = heroSection.clientHeight;
          }
          createParticles();
        };

        const createParticles = () => {
          particlesRef.current = [];
          const count = Math.min(
            90,
            Math.floor(window.innerWidth / 18)
          );

          for (let i = 0; i < count; i++) {
            particlesRef.current.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              z: Math.random() * 2 + 0.5,
              vx: (Math.random() - 0.5) * 0.35,
              vy: (Math.random() - 0.5) * 0.35,
              radius: Math.random() * 2 + 1,
            });
          }
        };

        const drawParticles = () => {
          if (!ctx) return;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const gradient = ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
          );
          gradient.addColorStop(0, "rgba(40, 120, 255, 0.12)");
          gradient.addColorStop(1, "rgba(0, 210, 255, 0.08)");
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          particlesRef.current.forEach((p, i) => {
            p.x += p.vx * p.z;
            p.y += p.vy * p.z;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * p.z, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(35, 112, 255, 0.35)";
            ctx.fill();

            for (let j = i + 1; j < particlesRef.current.length; j++) {
              const q = particlesRef.current[j];
              const dx = p.x - q.x;
              const dy = p.y - q.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < 130) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
                ctx.strokeStyle = `rgba(14, 165, 233, ${
                  0.16 * (1 - distance / 130)
                })`;
                ctx.lineWidth = 1;
                ctx.stroke();
              }
            }
          });

          requestAnimationFrame(drawParticles);
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        drawParticles();

        return () => {
          window.removeEventListener("resize", resizeCanvas);
        };
      }
    }
  }, []);

  return (
    <>
      <nav className="navbar">
        <div className="container nav-container">
          <div className="logo">
            <a href="#home">Top AI Tool Rank</a>
          </div>

          <ul className="nav-menu" id="navMenu" ref={navMenuRef}>
            <li>
              <a href="#home" className="nav-link">
                Home
              </a>
            </li>
            <li>
              <a href="#services" className="nav-link">
                Services
              </a>
            </li>

            <li className="nav-item-dropdown">
              <a href="#tools" className="nav-link">
                Tools
              </a>
              <ul className="dropdown">
                <li>
                  <a href="/tools/wa-sender" rel="noopener">
                    WA Sender
                  </a>
                </li>
                <li>
                  <a
                    href="javascript:void(0)"
                    className="coming-soon"
                    onClick={() => alert("Voice Rating is coming soon!")}
                  >
                    Voice Rating
                  </a>
                </li>
              </ul>
            </li>

            <li>
              <a href="/blogs/" className="nav-link">
                Blogs
              </a>
            </li>
            <li>
              <a href="#contact" className="nav-link nav-pill">
                Contact
              </a>
            </li>
          </ul>

          <button
            type="button"
            className="hamburger"
            id="hamburger"
            ref={hamburgerRef}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <main>
        <section id="home" className="hero">
          <canvas id="canvas-3d" ref={canvasRef}></canvas>

          <div className="hero-orb hero-orb-one"></div>
          <div className="hero-orb hero-orb-two"></div>

          <div className="container hero-grid">
            <div className="hero-content reveal">
              <div className="eyebrow">
                <span className="pulse-dot"></span>
                Custom AI software for ambitious businesses
              </div>

              <h1>Build the software your business actually needs.</h1>

              <p className="hero-subtitle">
                I help founders, operators, and growing teams turn messy
                workflows into clean AI-powered systems, dashboards,
                automations, and web products.
              </p>

              <div className="hero-actions">
                <a href="#contact" className="cta-button primary">
                  Discuss Your Project
                </a>
                <a href="#services" className="cta-button secondary">
                  View Services
                </a>
              </div>

              <div className="hero-proof">
                <div>
                  <strong>AI-first</strong>
                  <span>Automation, agents &amp; workflows</span>
                </div>
                <div>
                  <strong>Custom-built</strong>
                  <span>No generic templates</span>
                </div>
                <div>
                  <strong>Business-focused</strong>
                  <span>Built around real operations</span>
                </div>
              </div>
            </div>

            <div className="hero-visual reveal delay-1">
              <div className="ai-card main-ai-card">
                <div className="card-top">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                <div className="neural-core">
                  <div className="core-ring ring-one"></div>
                  <div className="core-ring ring-two"></div>
                  <div className="core-ring ring-three"></div>
                  <div className="core-center"></div>
                </div>

                <div className="system-lines">
                  <div>
                    <span>Lead workflow automation</span>
                    <b>98%</b>
                  </div>
                  <div>
                    <span>AI content engine</span>
                    <b>Live</b>
                  </div>
                  <div>
                    <span>Custom dashboard</span>
                    <b>Ready</b>
                  </div>
                </div>
              </div>

              <div className="floating-chip chip-one">AI Agents</div>
              <div className="floating-chip chip-two">Dashboards</div>
              <div className="floating-chip chip-three">Automation</div>
            </div>
          </div>
        </section>

        <section className="credibility-strip">
          <div className="container credibility-grid">
            <div>
              <span>Built for</span>
              <strong>Founders</strong>
            </div>
            <div>
              <span>Useful for</span>
              <strong>Operations Teams</strong>
            </div>
            <div>
              <span>Focused on</span>
              <strong>Speed + Clarity</strong>
            </div>
            <div>
              <span>Powered by</span>
              <strong>AI + Software</strong>
            </div>
          </div>
        </section>

        <section id="services" className="services section-padding">
          <div className="container">
            <div className="section-heading reveal">
              <span className="section-kicker">Services</span>
              <h2>What I can build for you</h2>
              <p>
                Whether you need a business tool, AI workflow, customer portal,
                internal dashboard, or MVP — I can help convert the idea into a
                working product.
              </p>
            </div>

            <div className="services-grid">
              <article className="service-card reveal">
                <div className="service-icon">01</div>
                <h3>Custom Software Development</h3>
                <p>
                  Web apps, portals, dashboards, CRMs, admin panels, and
                  workflow systems built around your exact business process.
                </p>
              </article>

              <article className="service-card reveal delay-1">
                <div className="service-icon">02</div>
                <h3>AI Automation Systems</h3>
                <p>
                  Automate repetitive work using AI agents, document
                  processing, lead qualification, content workflows, and smart
                  assistants.
                </p>
              </article>

              <article className="service-card reveal delay-2">
                <div className="service-icon">03</div>
                <h3>MVP &amp; Product Builds</h3>
                <p>
                  Turn an idea into a polished first version that can be shown
                  to customers, investors, or internal teams.
                </p>
              </article>

              <article className="service-card reveal delay-3">
                <div className="service-icon">04</div>
                <h3>Dashboards &amp; Internal Tools</h3>
                <p>
                  Centralize business data, track operations, manage teams,
                  monitor leads, and make decisions faster.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="tools" className="tools section-padding">
          <div className="container">
            <div className="section-heading reveal">
              <span className="section-kicker">Tools</span>
              <h2>Live tools and experiments</h2>
              <p>I do not just talk about software. I build, test, and ship real tools.</p>
            </div>

            <div className="tools-grid">
              <article className="tool-card reveal">
                <div>
                  <span className="tool-badge">Live</span>
                  <h3>WA Sender</h3>
                  <p>
                    A practical communication tool designed to make outreach and
                    WhatsApp-based workflows easier.
                  </p>
                </div>
                <a href="/tools/wa-sender" className="tool-link">
                  Try Tool →
                </a>
              </article>

              <article className="tool-card reveal delay-1">
                <div>
                  <span className="tool-badge muted">Coming Soon</span>
                  <h3>Voice Rating</h3>
                  <p>
                    An upcoming AI-assisted tool for collecting and analyzing
                    voice-based feedback.
                  </p>
                </div>
                <a
                  href="javascript:void(0)"
                  className="tool-link disabled"
                  onClick={() => alert("Voice Rating is coming soon!")}
                >
                  Coming Soon
                </a>
              </article>
            </div>
          </div>
        </section>

        <section id="why-us" className="why-us section-padding">
          <div className="container">
            <div className="section-heading reveal">
              <span className="section-kicker">Why work with me</span>
              <h2>
                Your homepage should prove capability. So should your software.
              </h2>
              <p>
                I combine business understanding with AI-first development so
                the final product is useful, clean, and commercially sensible.
              </p>
            </div>

            <div className="reasons-grid">
              <div className="reason-item reveal">
                <h3>Business-first thinking</h3>
                <p>
                  I focus on the workflow, user journey, and outcome before
                  writing code.
                </p>
              </div>

              <div className="reason-item reveal delay-1">
                <h3>Modern AI aesthetic</h3>
                <p>
                  Clean, premium interfaces that make your product feel
                  credible from the first click.
                </p>
              </div>

              <div className="reason-item reveal delay-2">
                <h3>Fast execution</h3>
                <p>
                  Ideal for MVPs, internal tools, proof-of-concepts, and
                  automation ideas that need speed.
                </p>
              </div>

              <div className="reason-item reveal delay-3">
                <h3>Built for real use</h3>
                <p>
                  Not demo-only pages. Systems are designed for actual business
                  operations and future scale.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="process section-padding">
          <div className="container">
            <div className="section-heading reveal">
              <span className="section-kicker">Process</span>
              <h2>From idea to working system</h2>
            </div>

            <div className="process-grid">
              <div className="process-step reveal">
                <span>1</span>
                <h3>Understand</h3>
                <p>
                  We map your workflow, users, pain points, and business
                  objective.
                </p>
              </div>

              <div className="process-step reveal delay-1">
                <span>2</span>
                <h3>Design</h3>
                <p>
                  I structure the product, screens, database, and automation
                  logic.
                </p>
              </div>

              <div className="process-step reveal delay-2">
                <span>3</span>
                <h3>Build</h3>
                <p>
                  The software is developed with a clean interface and scalable
                  architecture.
                </p>
              </div>

              <div className="process-step reveal delay-3">
                <span>4</span>
                <h3>Improve</h3>
                <p>
                  We test, refine, and prepare it for real users or internal
                  deployment.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="contact section-padding">
          <div className="container contact-grid">
            <div className="contact-copy reveal">
              <span className="section-kicker">Start a project</span>
              <h2>Have a software idea or automation requirement?</h2>
              <p>
                Send a short message with what you want to build. It can be
                rough. I'll help you shape it into a clear system.
              </p>

              <div className="contact-points">
                <div>✓ Custom software requirements</div>
                <div>✓ AI automation ideas</div>
                <div>✓ MVP or internal dashboard builds</div>
              </div>
            </div>

            <form className="contact-form reveal delay-1" id="contactForm">
              <div className="form-group">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your Name"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Your Email"
                  required
                />
              </div>

              <div className="form-group">
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell me what you want to build"
                  rows={5}
                  required
                ></textarea>
              </div>

              <button type="submit" className="cta-button primary" id="submitBtn">
                Send Message
              </button>
              <p id="formStatus"></p>
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <div>
            <h4>Top AI Tool Rank</h4>
            <p>
              Custom AI software, automation systems, dashboards, and business
              tools.
            </p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <ul>
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#services">Services</a>
              </li>
              <li>
                <a href="#tools">Tools</a>
              </li>
              <li>
                <a href="/blogs/">Blogs</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="/privacy-policy">Privacy Policy</a>
              </li>
              <li>
                <a href="/terms">Terms of Service</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>Contact</h4>
            <p>
              <a href="mailto:contact@topaitoolrank.com">
                contact@topaitoolrank.com
              </a>
            </p>
          </div>
        </div>

        <div className="container footer-bottom">
          <p>&copy; 2026 Top AI Tool Rank. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
