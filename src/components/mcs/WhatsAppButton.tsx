"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/919866344866?text=Hi%2C%20I%20would%20like%20to%20book%20an%20appointment."
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-lg whatsapp-pulse transition-colors"
    >
      <MessageCircle className="h-6 w-6 fill-current" />
      <span className="hidden sm:inline font-semibold text-sm">
        Chat Now
      </span>
    </a>
  );
}
