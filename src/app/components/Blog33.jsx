"use client";

import { Button } from "@relume_io/relume-ui";
import React from "react";

export default function Blog33() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mb-12 md:mb-18 lg:mb-20">
          <div className="mx-auto w-full max-w-lg text-center">
            <h2 className="rb-5 mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
              Разнообразие от материали
            </h2>
            <p className="md:text-md">
              Открийте красотата на каменните материали
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 md:gap-y-12 lg:grid-cols-3">
          <div>
            <a href="#" className="mb-6 inline-block w-full max-w-full">
              <div className="w-full overflow-hidden">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Relume placeholder image 1"
                  className="aspect-[3/2] size-full object-cover"
                />
              </div>
            </a>
            <a
              href="#"
              className="mb-2 mr-4 inline-block max-w-full text-sm font-semibold"
            >
              Материали
            </a>
            <a href="#" className="mb-2 block max-w-full">
              <h5 className="text-xl font-bold md:text-2xl">
                Гранит: Силата на природата
              </h5>
            </a>
            <p>
              Гранитът е изключително здрав и подходящ за всякакви приложения.
            </p>
          </div>
          <div>
            <a href="#" className="mb-6 inline-block w-full max-w-full">
              <div className="w-full overflow-hidden">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Relume placeholder image 1"
                  className="aspect-[3/2] size-full object-cover"
                />
              </div>
            </a>
            <a
              href="#"
              className="mb-2 mr-4 inline-block max-w-full text-sm font-semibold"
            >
              Материали
            </a>
            <a href="#" className="mb-2 block max-w-full">
              <h5 className="text-xl font-bold md:text-2xl">
                Мрамор: Лукс и елегантност
              </h5>
            </a>
            <p>Мраморът придава уникален стил на всяко пространство.</p>
          </div>
          <div>
            <a href="#" className="mb-6 inline-block w-full max-w-full">
              <div className="w-full overflow-hidden">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Relume placeholder image 1"
                  className="aspect-[3/2] size-full object-cover"
                />
              </div>
            </a>
            <a
              href="#"
              className="mb-2 mr-4 inline-block max-w-full text-sm font-semibold"
            >
              Материали
            </a>
            <a href="#" className="mb-2 block max-w-full">
              <h5 className="text-xl font-bold md:text-2xl">
                Варовик: Природна красота
              </h5>
            </a>
            <p>Варовикът е идеален за външни и вътрешни приложения.</p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <Button
            title="Вижте всички"
            variant="secondary"
            className="mt-10 md:mt-14 lg:mt-16"
          >
            Вижте всички
          </Button>
        </div>
      </div>
    </section>
  );
}
