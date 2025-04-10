"use client";

import CookieConsent from "react-cookie-consent";
import Link from "next/link";

export default function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      cookieName="siteCookieConsent"
      buttonText="Разбрах"
      declineButtonText="Откажи"
      enableDeclineButton
      // Disable default inline styles
      style={{}}
      buttonStyle={{
        background: "#7d6741", // royalGold
        color: "#fff",
        fontWeight: "600",
        padding: "0.5rem 1.25rem",
        borderRadius: "0.375rem",
        fontSize: "14px",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      declineButtonStyle={{
        background: "#f3f4f6", // Tailwind gray-100
        color: "#111827", // Tailwind gray-900
        fontWeight: "600",
        padding: "0.5rem 1.25rem",
        borderRadius: "0.375rem",
        fontSize: "14px",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      containerClasses="bg-gray-800 text-white p-4 text-sm flex flex-col md:flex-row items-center justify-between gap-4 z-50"
      expires={365}
    >
      Използваме бисквитки за да подобрим вашето изживяване.
      <Link
        href="/privacy-policy"
        className="underline text-white hover:text-royalGold ml-1"
      >
        Научете повече
      </Link>
    </CookieConsent>
  );
}
