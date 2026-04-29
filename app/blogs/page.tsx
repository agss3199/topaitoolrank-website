import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Top AI Tool Rank",
  description:
    "Read our latest articles about custom software development, AI integration, and digital transformation.",
  canonical: "https://topaitoolrank.com/blogs/",
  openGraph: {
    title: "Blog - Top AI Tool Rank",
    description:
      "Read our latest articles about custom software development, AI integration, and digital transformation.",
    url: "https://topaitoolrank.com/blogs/",
  },
};

export default function BlogsPage() {
  return (
    <>
      <nav className="navbar">
        <div className="container nav-container">
          <div className="logo">
            <a href="/">Top AI Tool Rank</a>
          </div>
          <ul className="nav-menu">
            <li>
              <a href="/#home" className="nav-link">
                Home
              </a>
            </li>
            <li>
              <a href="/#services" className="nav-link">
                Services
              </a>
            </li>
            <li className="nav-item-dropdown">
              <a href="/#tools" className="nav-link">
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
                    Voice Rating (Coming Soon)
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
              <a href="/#contact" className="nav-link">
                Contact
              </a>
            </li>
          </ul>
          <div className="hamburger">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      <section className="coming-soon-section">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">📝</div>
          <h1>Blog Coming Soon</h1>
          <p>
            We're working on some amazing content about custom software
            development, AI integration, and digital transformation.
          </p>
          <p style={{ color: "var(--muted-text)", fontSize: "1rem", marginBottom: "2rem" }}>
            Subscribe to be notified when we publish our first article.
          </p>

          <p style={{ color: "var(--muted-text)", fontSize: "0.95rem", marginTop: "2rem" }}>
            📧 Or email us at:{" "}
            <a
              href="mailto:contact@topaitoolrank.com?subject=Notify%20me%20about%20blog%20updates"
              style={{ color: "var(--secondary-color)", textDecoration: "none" }}
            >
              contact@topaitoolrank.com
            </a>
          </p>
        </div>
      </section>

      <footer className="footer" style={{ marginTop: "4rem" }}>
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Top AI Tool Rank</h4>
              <p>Building custom software solutions for businesses worldwide.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <a href="/">Home</a>
                </li>
                <li>
                  <a href="/#services">Services</a>
                </li>
                <li>
                  <a href="/#tools">Tools</a>
                </li>
                <li>
                  <a href="/blogs/">Blog</a>
                </li>
              </ul>
            </div>
            <div className="footer-section">
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
            <div className="footer-section">
              <h4>Contact</h4>
              <p>
                Email:{" "}
                <a href="mailto:contact@topaitoolrank.com">
                  contact@topaitoolrank.com
                </a>
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Top AI Tool Rank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
