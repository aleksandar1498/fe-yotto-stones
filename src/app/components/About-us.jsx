"use client";

import React from "react";

export default function AboutUs() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container max-w-lg text-center">
        <div className="flex flex-col items-center justify-start">
          <div className="rb-5 mb-5 md:mb-6">
            <img
              src="https://d22po4pjz3o32e.cloudfront.net/relume-icon.svg"
              className="size-12"
              alt="Relume logo"
            />
          </div>
          <h3 className="text-3xl font-bold leading-[1] md:text-5xl lg:text-5xl">
            Луксозни решения за обработка на камък с изключително качество и
            стил.
          </h3>
          <p className="mt-5 md:mt-6 md:text-md">
            Нашата компания предлага уникални и иновативни решения за обработка
            на мрамор, гранит и варовик. Съсредоточени сме върху детайлите и
            качеството, за да удовлетворим нуждите на нашите клиенти.
          </p>
        </div>
      </div>
    </section>
  );
}
