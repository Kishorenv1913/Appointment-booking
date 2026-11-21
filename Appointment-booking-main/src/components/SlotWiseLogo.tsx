import { useState } from "react";
import { SLOTWISE_LOGO_URL } from "../data/providers";

interface SlotWiseLogoProps {
  className?: string;
}

export function SlotWiseLogo({ className = "h-8 w-8" }: SlotWiseLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imgFailed) {
    return (
      <div
        className={`${className} rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-sm shrink-0`}
        aria-label="SlotWise Logo"
      >
        <svg viewBox="0 0 24 24" className="w-[62%] h-[62%] fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="4" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="m13 13-2.5 3.5h3L11 20" className="stroke-secondary-fixed" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={SLOTWISE_LOGO_URL}
      alt="SlotWise Logo"
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${className} rounded-lg object-contain shrink-0`}
    />
  );
}
