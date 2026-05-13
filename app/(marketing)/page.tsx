import Header from "@/app/components/Header";
import ScrollReveal from "./elements/ScrollReveal";

export default function HomePage() {
  return (
    <div className="marketing-context">
      <Header />

      <ScrollReveal>
        <main id="main">
          <section id="home" className="hero">
            <div className="container hero-grid">
              <div className="hero-content reveal">
                <div className="eyebrow">
                  <span className="pulse-dot"></span>
                  Custom AI software for ambitious businesses
                </div>

                <h1>Build the software your business actually needs.</h1>

                <p className="hero-subtitle">
                  I turn your messy workflows into software that runs without you.
                </p>

                <div className="hero-actions">
                  <a href="#contact" className="cta-button primary">
                    Discuss Your Project
                  </a>
                </div>

                <a href="#services" className="hero-anchor-link">See how it works ↓</a>

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

                  <div className="dashboard-mockup">
                    <div className="mock-panel">
                      <div className="mock-title">Processing Queue</div>
                      <div className="mock-stats">
                        <div className="stat-item">156<span>Documents processed</span></div>
                      </div>
                    </div>
                    <div className="mock-panel">
                      <div className="mock-title">Active Tasks</div>
                      <div className="mock-stats">
                        <div className="stat-item">24<span>Completed</span></div>
                        <div className="stat-item">8<span>Pending</span></div>
                      </div>
                    </div>
                    <div className="mock-panel">
                      <div className="mock-title">System Health</div>
                      <div className="mock-badge online">● Online</div>
                    </div>
                  </div>
                </div>

                <div className="floating-chip chip-one">AI Agents</div>
                <div className="floating-chip chip-two">Dashboards</div>
                <div className="floating-chip chip-three">Automation</div>
              </div>
            </div>
          </section>

          <section id="services" className="problem-frame section-padding">
            <div className="container">
              <div className="problem-content reveal">
                <span className="section-kicker">The real problem</span>
                <h2>You don't need more software. You need software that fits.</h2>

                <div className="problem-cards">
                  <article className="problem-card">
                    <p>Your team uses 6 tools that don't talk to each other</p>
                  </article>

                  <article className="problem-card">
                    <p>Your ops workflow lives in spreadsheets and WhatsApp</p>
                  </article>

                  <article className="problem-card">
                    <p>You tried off-the-shelf and it's close, but not quite</p>
                  </article>
                </div>
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

          <section className="services section-padding">
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
                <article className="service-card service-primary reveal reveal-tilt">
                  <div className="service-icon">01</div>
                  <h3>Custom Software Development</h3>
                  <p>
                    Build bespoke systems that fit your exact workflow. A logistics company replaced 4 spreadsheets with one automated dashboard. Onboarding now takes 4 minutes instead of 40.
                  </p>
                </article>

                <article className="service-card service-primary reveal reveal-tilt delay-1">
                  <div className="service-icon">02</div>
                  <h3>AI Automation Systems</h3>
                  <p>
                    Reduce manual work with AI agents and document processing. A legal team automated contract review, cutting processing time from 3 hours to 12 minutes per document.
                  </p>
                </article>

                <article className="service-card reveal reveal-tilt delay-2">
                  <div className="service-icon">03</div>
                  <h3>MVP &amp; Product Builds</h3>
                  <p>
                    Polished first versions in weeks, not months. From concept to working product you can show customers or investors.
                  </p>
                </article>

                <article className="service-card reveal reveal-tilt delay-3">
                  <div className="service-icon">04</div>
                  <h3>Dashboards &amp; Internal Tools</h3>
                  <p>
                    Centralize data, visualize operations, and empower teams to make faster decisions with real-time insights.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section id="tools" className="tools section-padding">
            <div className="container">
              <div className="section-heading reveal">
                <span className="section-kicker">Proof of work</span>
                <h2>I ship working software. Here are some you can try.</h2>
              </div>

              <div className="tools-grid">
                <article className="tool-card reveal">
                  <div>
                    <span className="tool-badge">Live</span>
                    <h3>Invoice Generator</h3>
                    <p>Professional invoices with customizable templates and instant PDF export.</p>
                  </div>
                  <a href="/tools/invoice-generator" className="tool-link">
                    Try Tool &rarr;
                  </a>
                </article>

                <article className="tool-card reveal delay-1">
                  <div>
                    <span className="tool-badge">Live</span>
                    <h3>SEO Analyzer</h3>
                    <p>Analyze webpages for SEO optimization and meta tag compliance in seconds.</p>
                  </div>
                  <a href="/tools/seo-analyzer" className="tool-link">
                    Try Tool &rarr;
                  </a>
                </article>

                <article className="tool-card reveal delay-2">
                  <div>
                    <span className="tool-badge">Live</span>
                    <h3>AI Prompt Generator</h3>
                    <p>Create structured, effective prompts for AI models with business templates.</p>
                  </div>
                  <a href="/tools/ai-prompt-generator" className="tool-link">
                    Try Tool &rarr;
                  </a>
                </article>

                <article className="tool-card reveal delay-3">
                  <div>
                    <span className="tool-badge">Live</span>
                    <h3>WA Sender</h3>
                    <p>Streamline WhatsApp outreach with bulk messaging and workflow automation.</p>
                  </div>
                  <a href="/tools/wa-sender" className="tool-link">
                    Try Tool &rarr;
                  </a>
                </article>
              </div>

              <div className="tools-footer reveal">
                <a href="/tools" className="tools-all-link">See all tools →</a>
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
                  rough. I&apos;ll help you shape it into a clear system.
                </p>

                <div className="contact-points">
                  <div>&#10003; Custom software requirements</div>
                  <div>&#10003; AI automation ideas</div>
                  <div>&#10003; MVP or internal dashboard builds</div>
                </div>
              </div>

              <form className="contact-form reveal delay-1" id="contactForm" aria-label="Contact form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label sr-only">Your Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your Name"
                    required
                    aria-required="true"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label sr-only">Your Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Your Email"
                    required
                    aria-required="true"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="budget" className="form-label sr-only">Budget Range</label>
                    <select
                      id="budget"
                      name="budget"
                      aria-label="Budget Range"
                    >
                      <option value="">Budget Range</option>
                      <option value="5-10k">$5K - $10K</option>
                      <option value="10-25k">$10K - $25K</option>
                      <option value="25k-plus">$25K+</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="timeline" className="form-label sr-only">Timeline</label>
                    <select
                      id="timeline"
                      name="timeline"
                      aria-label="Timeline"
                    >
                      <option value="">Timeline</option>
                      <option value="1-2-weeks">1-2 Weeks</option>
                      <option value="1-month">1 Month</option>
                      <option value="2-3-months">2-3 Months</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="projectType" className="form-label sr-only">Project Type</label>
                    <select
                      id="projectType"
                      name="projectType"
                      aria-label="Project Type"
                    >
                      <option value="">Project Type</option>
                      <option value="custom-software">Custom Software</option>
                      <option value="ai-automation">AI Automation</option>
                      <option value="mvp">MVP/Product</option>
                      <option value="dashboard">Dashboard/Tool</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message" className="form-label sr-only">Your Message</label>
                    <textarea
                      id="message"
                      name="message"
                      placeholder="Tell me what you want to build"
                      rows={3}
                      required
                      aria-required="true"
                    ></textarea>
                  </div>
                </div>

                <button type="submit" className="cta-button primary" id="submitBtn">
                  Send Message
                </button>
                <p id="formStatus" aria-live="polite"></p>
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
      </ScrollReveal>
    </div>
  );
}
