"use client";

import { Button } from "@relume_io/relume-ui";
import React from "react";
import { RxChevronRight } from "react-icons/rx";

export default function Layout83() {
  return (
    <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-x-12 lg:gap-x-20">
          <div>
            <p className="mb-3 font-semibold md:mb-4">Статистика</p>
            <h2 className="text-5xl font-bold md:text-7xl lg:text-8xl">
              Впечатляващи факти за нашата компания
            </h2>
          </div>
          <div>
            <p className="mb-6 md:mb-8 md:text-md">
              С гордост можем да се похвалим с над 200 успешно завършени
              проекта. Нашият опит в индустрията надхвърля 15 години.
            </p>
            <div className="grid grid-cols-1 gap-6 py-2 sm:grid-cols-2">
              <div>
                <h3 className="mb-2 text-5xl font-bold md:text-7xl lg:text-8xl">
                  95%
                </h3>
                <p>Доволни клиенти, които ни се доверяват</p>
              </div>
              <div>
                <h3 className="mb-2 text-5xl font-bold md:text-7xl lg:text-8xl">
                  1000+
                </h3>
                <p>Завършени проекти, които говорят сами за себе си</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 md:mt-8">
              <Button title="Научете" variant="secondary">
                Научете
              </Button>
              <Button
                title="Свържете"
                variant="link"
                size="link"
                iconRight={<RxChevronRight />}
              >
                Свържете
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
