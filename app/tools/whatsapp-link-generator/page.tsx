"use client";

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

/**
 * WhatsApp Link Generator + QR Code
 *
 * Generate WhatsApp links and QR codes for quick access
 * Features: Phone number validation, message encoding, QR code generation
 */

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import Footer from "../lib/Footer";
import styles from "./styles.css";
import { validatePhoneNumber } from "./lib/phone-validator";
import { generateQRCode, downloadQRCode } from "./lib/qr-generator";
import { copyToClipboard, downloadAsFile, loadFromlocalStorage, saveTolocalStorage } from "./lib/utils";
import { cls } from "../lib/css-module-safe";
import { ArticleSection } from "../lib/ArticleSection";

const LOCALSTORAGE_PHONE_KEY = "wlg-phone";
const LOCALSTORAGE_MESSAGE_KEY = "wlg-message";

export default function WhatsAppLinkGeneratorPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [waLink, setWaLink] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [articleContent, setArticleContent] = useState<string>("");
  const [articleLoading, setArticleLoading] = useState(true);
  const [articleError, setArticleError] = useState<string>("");
  const [copyMessage, setCopyMessage] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const savedPhone = loadFromlocalStorage(LOCALSTORAGE_PHONE_KEY);
    const savedMessage = loadFromlocalStorage(LOCALSTORAGE_MESSAGE_KEY);
    if (savedPhone) setPhone(savedPhone);
    if (savedMessage) setMessage(savedMessage);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    saveTolocalStorage(LOCALSTORAGE_PHONE_KEY, phone);
  }, [phone]);

  useEffect(() => {
    saveTolocalStorage(LOCALSTORAGE_MESSAGE_KEY, message);
  }, [message]);
  // Load article content
  useEffect(() => {
    const loadArticle = async () => {
      try {
        const res = await fetch('/api/tools/article?tool=whatsapp-link-generator');
        if (res.ok) {
          const data = await res.json();
          setArticleContent(data.content || '');
          setArticleError('');
        } else {
          setArticleError('Failed to load article: ' + (res.statusText || 'Unknown error'));
          setArticleContent('');
        }
      } catch (error) {
        console.error('Failed to load article:', error);
        setArticleError('Unable to load article. Please refresh the page.');
        setArticleContent('');
      } finally {
        setArticleLoading(false);
      }
    };
    loadArticle();
  }, []);

  // Generate WhatsApp link
  const generateLink = async () => {
    setPhoneError("");
    setQrCode(null);

    const validation = validatePhoneNumber(phone);
    if (!validation.valid) {
      setPhoneError(validation.error || "Invalid phone number");
      return;
    }

    setLoading(true);

    try {
      // Build WhatsApp link
      const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
      const link = `https://wa.me/${validation.formatted.replace("+", "")}${encodedMessage}`;
      setWaLink(link);

      // Generate QR code
      const qr = await generateQRCode(link);
      setQrCode(qr);
    } catch (error) {
      setPhoneError("Failed to generate QR code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!waLink) return;
    const success = await copyToClipboard(waLink);
    if (success) {
      setCopyMessage("✓ Link copied!");
      setTimeout(() => setCopyMessage(""), 3000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCode) return;
    downloadQRCode(qrCode, "whatsapp-qr.png");
  };

  return (
    <>
      <Header />
      <div className={cls(styles, "whatsapp-link-generator")}>
        <header className={cls(styles, "whatsapp-link-generator__header")}>
          <h1>WhatsApp Link Generator + QR Code</h1>
          <p>Generate WhatsApp links and QR codes instantly</p>
        </header>

        <main className={cls(styles, "whatsapp-link-generator__main")}>
        {/* Input section */}
        <div className={cls(styles, "whatsapp-link-generator__section")}>
          <h2>Details</h2>

          <div className={cls(styles, "whatsapp-link-generator__field")}>
            <label className={cls(styles, "whatsapp-link-generator__label")}>
              Phone Number <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="tel"
              className={cls(styles, "whatsapp-link-generator__input")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (234) 567-8900"
            />
            {phoneError && (
              <div className={cls(styles, "whatsapp-link-generator__error")}>
                {phoneError}
              </div>
            )}
            <small className={cls(styles, "whatsapp-link-generator__hint")}>
              Include country code (e.g., +1 for US)
            </small>
          </div>

          <div className={cls(styles, "whatsapp-link-generator__field")}>
            <label className={cls(styles, "whatsapp-link-generator__label")}>
              Message (Optional)
            </label>
            <textarea
              className={cls(styles, "whatsapp-link-generator__textarea")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message to pre-fill the chat..."
              rows={4}
            />
          </div>

          <button
            className={cls(styles, "whatsapp-link-generator__button")}
            onClick={generateLink}
            disabled={!phone || loading}
          >
            {loading ? "Generating..." : "Generate Link & QR"}
          </button>

          {copyMessage && (
            <div className={cls(styles, "whatsapp-link-generator__success")}>
              {copyMessage}
            </div>
          )}
        </div>

        {/* Output section */}
        {waLink && (
          <div className={cls(styles, "whatsapp-link-generator__section")}>
            <h2>Your WhatsApp Link</h2>

            {qrCode && (
              <div className={cls(styles, "whatsapp-link-generator__qr-container")}>
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className={cls(styles, "whatsapp-link-generator__qr-image")}
                />
              </div>
            )}

            <div className={cls(styles, "whatsapp-link-generator__link-box")}>
              <code>{waLink}</code>
            </div>

            <div className={cls(styles, "whatsapp-link-generator__button-group")}>
              <button
                className={cls(styles, "whatsapp-link-generator__button")}
                onClick={handleCopyLink}
              >
                📋 Copy Link
              </button>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className={cls(styles, "whatsapp-link-generator__button")}
              >
                💬 Open Chat
              </a>
              {qrCode && (
                <button
                  className={cls(styles, "whatsapp-link-generator__button")}
                  onClick={handleDownloadQR}
                >
                  ⬇️ Download QR
                </button>
              )}
            </div>
          </div>
        )}

        <footer className={cls(styles, "whatsapp-link-generator__footer")}>
          <p>
            <small>
              Free tool by{" "}
              <a href="/" className={cls(styles, "whatsapp-link-generator__link")}>
                topaitoolrank.com
              </a>
            </small>
          </p>
        </footer>
      </main>
    </div>
    {/* Article Section */}
      {articleError && (
        <div className={cls(styles, "whatsapp-link-generator__article-error")}>
          <p>{articleError}</p>
        </div>
      )}
      {!articleLoading && articleContent && (
        <div className={cls(styles, "whatsapp-link-generator__article-container")}>
          <ArticleSection content={articleContent} />
        </div>
      )}
    <Footer />
    </>
  );
}

