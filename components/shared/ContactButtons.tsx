"use client";

import { MessageCircle, Phone, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContactButtonsProps {
  phone?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  showTelegramWhatsapp?: boolean;
  className?: string;
}

const contactBtnClass =
  "flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white transition-all";

export function ContactButtons({
  phone,
  telegram,
  whatsapp,
  showTelegramWhatsapp = true,
  className,
}: ContactButtonsProps) {
  if (!phone && !telegram && !whatsapp) return null;

  const showTelegram = showTelegramWhatsapp && (telegram || phone);
  const showWhatsapp = showTelegramWhatsapp && (whatsapp || phone);
  const count = [phone, showTelegram, showWhatsapp].filter(Boolean).length;

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
    <div
      className={cn(
        "grid w-full gap-2",
        count === 3 && "grid-cols-3",
        count === 2 && "grid-cols-2",
        count === 1 && "grid-cols-1",
        className,
      )}
    >
      {phone ? (
        <button
          onClick={handleCall}
          className={cn(contactBtnClass, "bg-green-600 hover:bg-green-700")}
          type="button"
        >
          <Phone size={15} />
          Call
        </button>
      ) : null}
      {showTelegram ? (
        <button
          onClick={handleTelegram}
          className={cn(contactBtnClass, "bg-blue-500 hover:bg-blue-600")}
          type="button"
        >
          <Send size={15} />
          Telegram
        </button>
      ) : null}
      {showWhatsapp ? (
        <button
          onClick={handleWhatsapp}
          className={cn(contactBtnClass, "bg-emerald-500 hover:bg-emerald-600")}
          type="button"
        >
          <MessageCircle size={15} />
          WhatsApp
        </button>
      ) : null}
    </div>
  );
}
