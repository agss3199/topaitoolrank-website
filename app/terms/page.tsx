import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Top AI Tool Rank",
  description:
    "Read the terms of service for Top AI Tool Rank, including user responsibilities and disclaimers.",
  alternates: {
    canonical: "https://topaitoolrank.com/terms",
  },
  openGraph: {
    title: "Terms of Service - Top AI Tool Rank",
    description: "Read the terms of service for Top AI Tool Rank.",
    url: "https://topaitoolrank.com/terms",
  },
};

export default function TermsPage() {
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

      <main className="legal-content">
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: January 2024</p>

        <h2>1. Agreement to Terms</h2>
        <p>
          By accessing and using the Top AI Tool Rank website and services, you
          accept and agree to be bound by the terms and provision of this
          agreement. If you do not agree to abide by the above, please do not
          use this service.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of the
          materials (information or software) on Top AI Tool Rank's website for
          personal, non-commercial transitory viewing only. This is the grant
          of a license, not a transfer of title, and under this license you may
          not:
        </p>
        <ul>
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose or for any public display</li>
          <li>
            Attempt to decompile or reverse engineer any software contained on
            the website
          </li>
          <li>
            Remove any copyright or other proprietary notations from the
            materials
          </li>
          <li>
            Transfer the materials to another person or "mirror" the materials
            on any other server
          </li>
          <li>Violate any applicable laws or regulations</li>
        </ul>

        <h2>3. Disclaimer</h2>
        <p>
          The materials on Top AI Tool Rank's website are provided on an 'as is'
          basis. Top AI Tool Rank makes no warranties, expressed or implied, and
          hereby disclaims and negates all other warranties including, without
          limitation, implied warranties or conditions of merchantability,
          fitness for a particular purpose, or non-infringement of intellectual
          property or other violation of rights.
        </p>

        <h2>4. Limitations</h2>
        <p>
          In no event shall Top AI Tool Rank or its suppliers be liable for any
          damages (including, without limitation, damages for loss of data or
          profit, or due to business interruption) arising out of the use or
          inability to use the materials on Top AI Tool Rank's website, even if
          Top AI Tool Rank or an authorized representative has been notified
          orally or in writing of the possibility of such damage.
        </p>

        <h2>5. Accuracy of Materials</h2>
        <p>
          The materials appearing on Top AI Tool Rank's website could include
          technical, typographical, or photographic errors. Top AI Tool Rank
          does not warrant that any of the materials on its website are
          accurate, complete, or current. Top AI Tool Rank may make changes to
          the materials contained on its website at any time without notice.
        </p>

        <h2>6. Links</h2>
        <p>
          Top AI Tool Rank has not reviewed all of the sites linked to its
          website and is not responsible for the contents of any such linked
          site. The inclusion of any link does not imply endorsement by Top AI
          Tool Rank of the site. Use of any such linked website is at the
          user's own risk.
        </p>

        <h2>7. Modifications</h2>
        <p>
          Top AI Tool Rank may revise these terms of service for its website at
          any time without notice. By using this website, you are agreeing to be
          bound by the then current version of these terms of service.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These terms and conditions are governed by and construed in
          accordance with the laws of the jurisdiction where Top AI Tool Rank
          is located, and you irrevocably submit to the exclusive jurisdiction
          of the courts in that location.
        </p>

        <h2>9. User Responsibilities</h2>
        <p>
          Users are responsible for maintaining the confidentiality of their
          accounts and passwords and for restricting access to their computers.
          You agree to accept responsibility for all activities that occur
          under your account or password. You agree to notify Top AI Tool Rank
          immediately of any unauthorized use of your account.
        </p>

        <h2>10. Acceptable Use</h2>
        <p>
          You agree not to use the website for any purpose that is unlawful or
          prohibited by these terms, conditions, and notices. You specifically
          agree not to:
        </p>
        <ul>
          <li>Harass or cause distress or inconvenience to any person</li>
          <li>
            Transmit obscene or offensive content or disrupt the normal flow of
            dialogue
          </li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with the normal operation of the website</li>
        </ul>

        <h2>11. Contact Us</h2>
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <p>
          Email:{" "}
          <a href="mailto:contact@topaitoolrank.com">
            contact@topaitoolrank.com
          </a>
          <br />
          Website:{" "}
          <a href="https://topaitoolrank.com">topaitoolrank.com</a>
        </p>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Top AI Tool Rank</h4>
              <p>
                Building custom software solutions for businesses worldwide.
              </p>
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
                  <a href="/blogs/">Blogs</a>
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
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Top AI Tool Rank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
