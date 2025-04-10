"use client";

import { Button } from "@relume_io/relume-ui";
import React from "react";
import { BiEnvelope, BiMap, BiPhone } from "react-icons/bi";
import { RxChevronRight } from "react-icons/rx";

export default function Contact14({ includeHeading = true }) {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        {includeHeading && (
          <div className="rb-12 mb-12 max-w-lg md:mb-18 lg:mb-20">
            <p className="mb-3 font-semibold md:mb-4">Контакт</p>
            <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-5xl">
              Свържете се
            </h2>
            <p className="md:text-md">Имаме удоволствието да чуем от вас!</p>
          </div>
        )}
        <div className="grid auto-cols-fr grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-[0.5fr_1fr] md:gap-x-20 md:gap-y-16">
          <div className="grid auto-cols-fr grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-10">
            <div>
              <div className="mb-3 md:mb-4">
                <BiEnvelope className="size-8" />
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                Имейл
              </h3>
              <p className="mb-2">Свържете се с нас</p>
              <a className="underline" href="mailto:yottostones@gmail.com">
                yottostones@gmail.com
              </a>
            </div>

            <div>
              <div className="mb-3 md:mb-4">
                <BiPhone className="size-8" />
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                Телефон
              </h3>
              <p className="mb-2">Обадете се на нас</p>
              <a className="block underline mb-1" href="tel:+359895198805">
                +359 895 19 8805
              </a>
              <a className="block underline" href="tel:+359885053680">
                +359 885 05 3680
              </a>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="mb-3 md:mb-4">
                <BiMap className="size-8" />
              </div>
              <h3 className="mb-2 text-md font-bold leading-[1.4] md:text-xl">
                Офис
              </h3>
              <p className="mb-2">ул. "Владимир Зограф" 121, 1229 София, България</p>
              <div className="mt-5 md:mt-6">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=42.7297118,23.2787518&waypoints=42.731286,23.286132"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-royalGold p-2 rounded-lg text-white group gap-2 text-primary font-medium transition-all duration-300 hover:bg-royalGold/50 focus:outline-none"
                >
                  <span className="text-base md:text-lg">Вземете указания</span>
                  <RxChevronRight
                    className="transition-transform"
                    size={20}
                  />
                </a>
              </div>
            </div>
          </div>

          <div className="justify-self-end w-full h-[400px] md:h-[516px]">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d732.6930414922546!2d23.27810806961555!3d42.729712783323414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6bc8b4d580ad28bf%3A0xc3727390f2d43953!2z0J3QsNC00LPRgNC-0LHQvdC4INC_0LDQvNC10YLQvdC40YbQuCDQuCDQutCw0LzQtdC90L7QtNC10LvRgdC60Lgg0YPRgdC70YPQs9C4IC0gWW90dG8gU3RvbmVz!5e0!3m2!1sen!2sbg!4v1743679096582!5m2!1sen!2sbg"
              className="rounded-xl shadow-md"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
