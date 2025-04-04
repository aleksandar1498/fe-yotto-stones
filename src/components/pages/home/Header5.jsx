"use client";

import React from "react";
import Slider from "react-slick";
import "./slideshow.css";
import ScrollLink from "@/components/wrappers/ScrollLink";
import Link from "next/link";

// Moved outside component to avoid re-creation on each render
const images = [
  "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b",
  "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Froom.webp?alt=media&token=fa47db56-5f4b-42bc-b0d6-443ddb8af209",
];

export default function Header5() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 1500,
    fade: true,
    cssEase: "linear",
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false, // Arrows are not used, so we can disable them
  };

  return (
    <section className="relative flex items-center justify-center min-h-screen px-6 md:px-12 lg:px-24 bg-black overflow-hidden">
      {/* Background Carousel */}
      <Slider {...settings} className="absolute inset-0 z-0 h-100">
        {images.map((image, index) => (
          <div key={index} className="image-slide">
            <img
              src={image}
              alt={`Slide ${index + 1}`}
              className="h-100"
              loading="lazy" // lazy-load images for performance
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[0px]" />
          </div>
        ))}
      </Slider>

      {/* Content */}
      <div className="relative z-10 text-center text-white max-w-3xl">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
          Изберете качество и елегантност за вашия дом
        </h1>
        <p className="mt-4 md:mt-6 text-lg md:text-xl opacity-90 font-extralight">
          Открийте уникалната красота на природния камък. Нашите луксозни решения ще преобразят вашето пространство.
        </p>
        <div className="mt-6 md:mt-8 flex justify-center gap-4">
          <ScrollLink  href="/" sectionTag="about-section">
            <button className="px-6 py-3 text-lg font-semibold rounded-lg text-white hover:bg-white/20 shadow-lg">
              Научи повече
            </button>
          </ScrollLink>
          <Link href="/contact">
            <button className="px-6 py-3 text-lg font-semibold bg-royalGold/30 hover:bg-royalGold/60 text-white rounded-lg backdrop-blur-lg">
              Свържи се
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
