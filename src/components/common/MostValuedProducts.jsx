"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import useEmblaCarousel from "embla-carousel-react";
import { useMediaQuery } from "react-responsive";
import Link from "next/link";

export default function MostValuedProducts() {
  const { materials: group_materials } = useSelector((state) => state.materials);

  const products = group_materials?.flatMap((group) =>
    group.materials?.filter((m) => m.trending).map((m) => ({
      group_id: group.id,
      ...m,
    })) ?? []
  ) ?? [];

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    dragFree: false,
    skipSnaps: false,
  });

  const [scrollProgress, setScrollProgress] = useState(0);

  const slideCount = products.length;

  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      const progress = emblaApi.scrollProgress();
      setScrollProgress(progress);
    };

    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onScroll);
    onScroll();
  }, [emblaApi]);

  const slideWidth = isMobile ? "w-[220px]" : "w-[220px] md:w-[240px]";

  const getRelativeDistance = (index) => {
    if (!emblaApi) return 0;

    const scrollSnapList = emblaApi.scrollSnapList();
    const currentScroll = emblaApi.scrollProgress();
    const fromCenter = scrollSnapList[index] - currentScroll;

    // Handle loop wrapping manually
    const adjusted = Math.abs(fromCenter) > 0.5
      ? fromCenter > 0
        ? fromCenter - 1
        : fromCenter + 1
      : fromCenter;

    return adjusted * slideCount;
  };

  return (
    <section className="bg-[#595858] text-white py-16 px-4 md:px-12 ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* SVG Icon */}
        <div className="flex justify-center mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C8A45B"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-royalGold"
          >
            <path d="M12 2L20 12L12 22L4 12L12 2Z" />
            <path d="M12 6L17 12L12 18L7 12L12 6Z" />
          </svg>
        </div>

        {/* Subtitle */}
        <p className="text-sm tracking-[0.25em] uppercase text-royalGold mb-4">
          Луксозна селекция от естествени камъни
        </p>

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-light leading-snug text-white mb-6">
          Най-ценените камъни за бутикови интериори, луксозни жилища и дизайнерски проекти
        </h2>

        {/* Description */}
        <p className="text-sm md:text-base text-gray-400 leading-relaxed mb-2">
          Внимателно подбрани от един блок за пълна естетическа хармония, предоставени с грижа от <span className="text-royalGold font-medium">Yotto Stones</span>.
        </p>
        <p className="text-sm md:text-base text-gray-400 leading-relaxed">
          Подходящи за: подови настилки, стенни облицовки, стълбища и декоративни панели.
        </p>
      </motion.div>

      <div className="max-w-7xl mx-auto overflow-hidden relative">
        <button
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute top-1/2 -translate-y-1/2 left-2 z-30 w-10 h-10 rounded-full border border-[#9F7E46] flex items-center justify-center hover:bg-[#9F7E46]/20 transition backdrop-blur-md"
        >
          <svg className="w-4 h-4 text-[white]" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => emblaApi?.scrollNext()}
          className="absolute top-1/2 -translate-y-1/2 right-2 z-30 w-10 h-10 rounded-full border border-[#9F7E46] flex items-center justify-center hover:bg-[#9F7E46]/20 transition backdrop-blur-sm"
        >
          <svg className="w-4 h-4 text-[white]" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div className="embla py-16 relative" ref={emblaRef}>

          <div className="embla__container flex gap-6">

            {products.map((product, index) => {
              const distance = getRelativeDistance(index);

              // More distance = smaller scale and more tilt
              const scale = 1 - Math.min(Math.abs(distance), 3) * 0.15;
              const opacity = 1 - Math.min(Math.abs(distance), 3) * 0.25;
              const brightness = 1 - Math.min(Math.abs(distance), 3) * 0.2;
              const translateY = Math.abs(distance) * 15;
              const rotateY = distance * 15; // Tilt like a carousel
              const isCenter = Math.abs(distance) < 0.01;

              return (
                <div
                  key={product.id}
                  className={`embla__slide shrink-0 ${slideWidth} h-[420px] relative select-none`}
                >
                  <div
                    className={`relative group w-full h-full rounded-lg   transition-transform duration-300 ease-out
    ${isCenter ? "ring-4 ring-yellow-400/80 ring-offset-2" : ""}
  `}
                    style={{
                      transform: `
      perspective(1000px)
      scale(${scale})
      translateY(${translateY}px)
      rotateY(${rotateY}deg)
    `,
                      opacity,
                      boxShadow: "rgba(0, 0, 0, 0.6) 0px 32px 26px",
                      zIndex: 100 - Math.round(Math.abs(distance) * 10),
                    }}
                  >
                    {/* Image that scales on hover */}
                    <div className="w-full h-full overflow-hidden rounded-lg">
                      <Image
                        src={`/assets/images/materials/${product.group_id}/${product.imageName}`}
                        alt={product.name}
                        width={400}
                        height={400}
                        className={`object-cover w-full h-full transition-transform duration-500 ease-in-out overflow-hidden  ${isCenter ? "group-hover:scale-110" : ""}`}
                      />
                    </div>

                    {/* Title */}

                    <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1    text-[22px]  z-20 w-full">
                      <p
                        className="text-white font-light uppercase tracking-widest text-center"
                        style={{ textShadow: "1px 2px 4px black" }}
                      >
                        {product.name.replace(/-/g, " ")}
                      </p>
                    </div>

                    {/* CTA Overlay */}
                    {isCenter &&
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500 ease-in-out flex items-center justify-center z-30">
                        <Link href={`/materials/${product.group_id}/${product.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <span className="bg-white text-black px-6 py-2 rounded-full text-sm font-medium hover:scale-105 hover:shadow-lg transition">
                            Виж детайли
                          </span>
                        </Link>
                      </div>
                    }


                  </div>


                </div>

              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
