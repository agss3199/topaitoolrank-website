/**
 * QR Code Generator for WhatsApp Link Generator
 *
 * Uses qrcode.js library to generate QR codes from URLs
 */

export async function generateQRCode(
  url: string,
  options?: {
    size?: number;
    color?: string;
    background?: string;
  }
): Promise<string> {
  // Dynamic import of qrcode library
  // This is loaded at runtime, not during build
  const QRCode = (await import("qrcode")).default;

  const size = options?.size || 200;
  const color = options?.color || "#000000";
  const background = options?.background || "#ffffff";

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      type: "image/png",
      quality: 0.95,
      margin: 1,
      width: size,
      color: {
        dark: color,
        light: background,
      },
    });

    return dataUrl;
  } catch (error) {
    console.error("QR code generation failed:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Download QR code image
 */
export function downloadQRCode(dataUrl: string, filename: string = "whatsapp-qr.png"): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy QR code to clipboard (as image data)
 * Note: Not all browsers support copying images directly
 */
export async function copyQRCodeToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = await fetch(dataUrl).then((res) => res.blob());
    const item = new ClipboardItem({ "image/png": blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch (error) {
    console.error("Copy QR code failed:", error);
    return false;
  }
}
