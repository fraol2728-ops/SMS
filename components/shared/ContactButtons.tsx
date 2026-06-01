"use client";

import { MessageCircle, Phone, Send } from "lucide-react";

interface ContactButtonsProps {
  phone?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  showTelegramWhatsapp?: boolean;
}

export function ContactButtons({
  phone,
  telegram,
  whatsapp,
  showTelegramWhatsapp = true,
}: ContactButtonsProps) {
  if (!phone && !telegram && !whatsapp) return null;

  function handleCall() {
    if (phone) window.open(`tel:${phone}`, "_self");
  }

  function handleTelegram() {
    const contact = telegram || phone;
    if (!contact) return;
    if (contact.startsWith("@")) {
      window.open(`https://t.me/${contact.slice(1)}`, "_blank");
    } else {
      const cleaned = contact.replace(/\D/g, "");
      window.open(`https://t.me/+${cleaned}`, "_blank");
    }
  }

  function handleWhatsapp() {
    const contact = whatsapp || phone;
    if (!contact) return;
    const cleaned = contact.replace(/\D/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      {phone && (
        <button
          onClick={handleCall}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-green-700"
          type="button"
        >
          <Phone size={15} />
          Call
        </button>
      )}
      {showTelegramWhatsapp && (
        <>
          <button
            onClick={handleTelegram}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-600"
            type="button"
          >
            <Send size={15} />
            Telegram
          </button>
          <button
            onClick={handleWhatsapp}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-600"
            type="button"
          >
            <MessageCircle size={15} />
            WhatsApp
          </button>
        </>
      )}
    </div>
  );
}
