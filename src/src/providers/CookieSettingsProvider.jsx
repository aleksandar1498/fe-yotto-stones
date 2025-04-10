"use client";

import { createContext, useContext, useEffect, useState } from "react";

const CookieContext = createContext();

export const useCookieConsent = () => useContext(CookieContext);

const defaultConsent = {
  essential: true,
  analytics: false,
  marketing: false,
};

export default function CookieSettingsProvider({ children }) {
  const [consent, setConsent] = useState(defaultConsent);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("cookieConsent");
    if (saved) {
      setConsent(JSON.parse(saved));
    } else {
      setModalOpen(true); // show on first load
    }
  }, []);

  const updateConsent = (newConsent) => {
    setConsent(newConsent);
    localStorage.setItem("cookieConsent", JSON.stringify(newConsent));
  };

  const acceptAll = () => {
    const fullConsent = { essential: true, analytics: true, marketing: true };
    updateConsent(fullConsent);
    setModalOpen(false);
  };

  const declineAll = () => {
    const minimalConsent = { essential: true, analytics: false, marketing: false };
    updateConsent(minimalConsent);
    setModalOpen(false);
  };

  return (
    <CookieContext.Provider value={{ consent, setModalOpen }}>
      {children}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Настройки на бисквитките</h2>
            <p className="text-sm text-gray-700 mb-4">
              Избираме кои бисквитки да приемете. Можете да промените избора си по всяко време.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                updateConsent({
                  essential: true,
                  analytics: form.analytics.checked,
                  marketing: form.marketing.checked,
                });
                setModalOpen(false);
              }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="essential"
                  checked
                  disabled
                  className="mt-1 accent-royalGold"
                />
                <label htmlFor="essential" className="text-sm">
                  <strong>Необходими:</strong> Тези бисквитки са винаги активни и са нужни за функционирането на сайта.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="analytics"
                  name="analytics"
                  defaultChecked={consent.analytics}
                  className="mt-1 accent-royalGold"
                />
                <label htmlFor="analytics" className="text-sm">
                  <strong>Аналитични:</strong> Помагат ни да разбираме как използвате сайта.
                </label>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="marketing"
                  name="marketing"
                  defaultChecked={consent.marketing}
                  className="mt-1 accent-royalGold"
                />
                <label htmlFor="marketing" className="text-sm">
                  <strong>Маркетинг:</strong> Персонализирано съдържание и оферти.
                </label>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={declineAll}
                  className="text-sm px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition"
                >
                  Откажи всички
                </button>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="text-sm px-4 py-2 rounded-md bg-royalGold text-white hover:bg-royalGold/80 transition"
                  >
                    Запази избора
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </CookieContext.Provider>
  );
}
