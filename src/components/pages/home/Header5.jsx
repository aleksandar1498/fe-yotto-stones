"use client";

import React, { useEffect, useState } from "react";
import Slider from 'react-slick';
import './slideshow.css';
import { ChevronLeft, ChevronRight } from "lucide-react";
import ScrollLink from "@/components/wrappers/ScrollLink";
import Link from "next/link";

const images = [
  "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Fstairs.webp?alt=media&token=1680693e-1b76-45e5-9653-4711e086903b",
  "https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fbase%2Froom.webp?alt=media&token=fa47db56-5f4b-42bc-b0d6-443ddb8af209",
];

export default function Header5() {
  const settings = {
    dots: true, // Show navigation dots
    infinite: true, // Infinite loop sliding
    speed: 1500, // Transition speed
    fade: true, // Enable fade transition
    cssEase: 'linear', // Linear transition effect
    autoplay: true, // Auto-slide
    autoplaySpeed: 5000, // Delay before auto-slide
  };

  return (
    <section className="relative flex items-center justify-center min-h-screen px-6 md:px-12 lg:px-24 bg-black overflow-hidden">
      {/* Background Image Carousel */}

      <Slider {...settings} className="absolute inset-0 z-0 transfrom h-100">
        {images.map((image, index) => (
          <div key={index} className="image-slide">
            <img
              className="h-100"
              // key={currentIndex}
              // style={{ display: (index === currentIndex) ? "block" : "none" }}
              src={image}

              alt="Background"
            />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[0px]" />
          </div>
        ))}
      </Slider>

      {/* Content */}
      <div className="relative z-10 text-center text-gradient-grey max-w-3xl">
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight  text-white "
        >
          Изберете качество и елегантност за вашия дом
        </h1>
        <p className="mt-4 md:mt-6 text-lg md:text-xl opacity-90 font-extralight text-white">
          Открийте уникалната красота на природния камък. Нашите луксозни решения ще преобразят вашето пространство.
        </p>
        <div className="mt-6 md:mt-8 flex justify-center gap-4">
          <button className="px-6 py-3 text-lg font-semibold rounded-lg text-white hover:bg-white/20 shadow-lg">
            <ScrollLink href="/" sectionTag="about-section">
              Научи повече
            </ScrollLink>
          </button>
          <button className="px-6 py-3 text-lg font-semibold bg-royalGold/30 hover:bg-royalGold/60 text-white rounded-lg backdrop-blur-lg">
            <Link href="contact"> Свържи се</Link>
          </button>
        </div>
      </div>
    </section>
  );
}