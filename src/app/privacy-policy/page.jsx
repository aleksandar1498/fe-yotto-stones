"use client";

import React from "react";

export default function PrivacyPolicy() {
  return (
    <main className="px-[5%] py-16 max-w-4xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Политика за поверителност</h1>

      <p className="mb-6">
        Настоящата Политика за поверителност описва как ние събираме, използваме и защитаваме вашата лична информация
        съгласно Общия регламент за защита на личните данни (GDPR).
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">1. Каква информация събираме</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Име и имейл адрес чрез контактни форми</li>
          <li>Съобщения, изпратени от вас чрез формите</li>
          <li>Данни от "бисквитки" за подобряване на потребителското изживяване</li>
          <li>Анонимни аналитични данни (ако се използва Google Analytics и др.)</li>
        </ul>
      </section>

      <section className="mb-10" id="data-usage">
        <h2 className="text-xl font-semibold mb-2">2. За какво използваме вашата информация</h2>
        <p>Вашата информация може да бъде използвана за:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Отговаряне на вашите запитвания</li>
          <li>Подобряване на нашите услуги и съдържание</li>
          <li>Изпращане на важни съобщения, ако сте дали съгласие</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">3. Съхранение и защита на данните</h2>
        <p>
          Събраните данни се съхраняват в защитена среда чрез Firebase (Google Cloud Platform), която отговаря на
          стандартите за сигурност и GDPR. Достъп до данните имат само оторизирани лица.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">4. "Бисквитки" (Cookies)</h2>
        <p>
          Използваме бисквитки, за да анализираме трафика и да подобрим вашето потребителско изживяване. При първото
          посещение на сайта ще получите известие с възможност да приемете или откажете използването на бисквитки.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">5. Вашите права</h2>
        <p>Съгласно GDPR, вие имате право да:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Достъпите личните си данни</li>
          <li>Изискате корекция на неточни данни</li>
          <li>Изискате изтриване на вашите данни („правото да бъдеш забравен“)</li>
          <li>Оттеглите съгласието си по всяко време</li>
          <li>Подадете жалба до надзорния орган (КЗЛД – Комисия за защита на личните данни)</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">6. Свържете се с нас</h2>
        <p>
          Ако имате въпроси относно тази политика или искате да упражните някое от горните си права, моля свържете се с
          нас на имейл:{" "}
          <a href="mailto:yottostones@gmail.com" className="underline text-royalGold hover:text-royalGold/70">
            yottostones@gmail.com
          </a>
          .
        </p>
      </section>

      <p className="text-sm text-gray-500 mt-10">
        Последна актуализация: {new Date().toLocaleDateString("bg-BG")}
      </p>
    </main>
  );
}
