"use client";

import { Button } from "@relume_io/relume-ui";
import React from "react";
import { RxChevronRight } from "react-icons/rx";

export default function Portfolio6() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mx-auto mb-12 max-w-lg text-center md:mb-18 lg:mb-20">
          <p className="mb-3 font-semibold md:mb-4">Портфолио</p>
          <h2 className="mb-5 text-5xl font-bold md:mb-6 md:text-7xl lg:text-8xl">
            Нашите проекти
          </h2>
          <p className="md:text-md">Открийте нашите уникални каменни решения</p>
        </div>
        <div className="columns-1 after:block md:columns-2 md:gap-x-8 lg:gap-x-12">
          <article className="mb-12 break-inside-avoid">
            <div className="mb-5 md:mb-6">
              <a href="#">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  className="w-full object-cover"
                  alt="Relume placeholder image"
                />
              </a>
            </div>
            <h3 className="mb-2 text-xl font-bold md:text-2xl">
              <a href="#">Луксозен мрамор</a>
            </h3>
            <p>Изключителен мрамор за вашите интериори и екстериори.</p>
            <ul className="mt-3 flex flex-wrap gap-2 md:mt-4">
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Мраморен проект
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Луксозен дизайн
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Класически стил
                </a>
              </li>
            </ul>
            <Button
              title="Разгледайте проекта"
              variant="link"
              size="link"
              iconRight={<RxChevronRight />}
              className="mt-5 md:mt-6"
            >
              <a href="#">Разгледайте проекта</a>
            </Button>
          </article>
          <article className="mb-12 break-inside-avoid">
            <div className="mb-5 md:mb-6">
              <a href="#">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  className="w-full object-cover"
                  alt="Relume placeholder image"
                />
              </a>
            </div>
            <h3 className="mb-2 text-xl font-bold md:text-2xl">
              <a href="#">Гранитни стълбища</a>
            </h3>
            <p>
              Стълбища от гранит, които впечатляват с елегантност и здравина.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 md:mt-4">
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Гранитен проект
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Съвременен стил
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Висококачествени материали
                </a>
              </li>
            </ul>
            <Button
              title="Разгледайте проекта"
              variant="link"
              size="link"
              iconRight={<RxChevronRight />}
              className="mt-5 md:mt-6"
            >
              <a href="#">Разгледайте проекта</a>
            </Button>
          </article>
          <article className="mb-12 break-inside-avoid">
            <div className="mb-5 md:mb-6">
              <a href="#">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image.svg"
                  className="w-full object-cover"
                  alt="Relume placeholder image"
                />
              </a>
            </div>
            <h3 className="mb-2 text-xl font-bold md:text-2xl">
              <a href="#">Варовикови облицовки</a>
            </h3>
            <p>
              Облицовки от варовик, които добавят стил и изтънченост на всяко
              пространство.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 md:mt-4">
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Варовиков проект
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Ексклузивен дизайн
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Качествени решения
                </a>
              </li>
            </ul>
            <Button
              title="Разгледайте проекта"
              variant="link"
              size="link"
              iconRight={<RxChevronRight />}
              className="mt-5 md:mt-6"
            >
              <a href="#">Разгледайте проекта</a>
            </Button>
          </article>
          <article className="mb-12 break-inside-avoid">
            <div className="mb-5 md:mb-6">
              <a href="#">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  className="w-full object-cover"
                  alt="Relume placeholder image"
                />
              </a>
            </div>
            <h3 className="mb-2 text-xl font-bold md:text-2xl">
              <a href="#">Каменни плотове</a>
            </h3>
            <p>Плотове от камък, идеални за всяка кухня или баня.</p>
            <ul className="mt-3 flex flex-wrap gap-2 md:mt-4">
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Каменен проект
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Функционален стил
                </a>
              </li>
              <li className="flex">
                <a
                  href="#"
                  className="bg-background-secondary px-2 py-1 text-sm font-semibold"
                >
                  Качествени материали
                </a>
              </li>
            </ul>
            <Button
              title="Разгледайте проекта"
              variant="link"
              size="link"
              iconRight={<RxChevronRight />}
              className="mt-5 md:mt-6"
            >
              <a href="#">Разгледайте проекта</a>
            </Button>
          </article>
        </div>
        <div className="mt-12 flex justify-center md:mt-18 lg:mt-20">
          <Button title="Разгледайте всички" variant="secondary" size="primary">
            Разгледайте всички
          </Button>
        </div>
      </div>
    </section>
  );
}
