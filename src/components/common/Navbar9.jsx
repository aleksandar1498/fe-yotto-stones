
"use client";

import "./navbar.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { HiCubeTransparent } from "react-icons/hi"; // For “Видове завършек”
import { TbHexagon } from "react-icons/tb";
import { LuWand } from "react-icons/lu";
import Link from "next/link";
import ScrollLink from "../wrappers/ScrollLink";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "@/redux/modalSlice";
import { motion, AnimatePresence } from "framer-motion";

const slideVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};


export default function Navbar() {

  const dispatch = useDispatch();
  const { materials } = useSelector((state) => state.materials);
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef();
  const dropdownEdgesRef = useRef();

  const materialDropdown = useMemo(() => (
    <AnimatePresence>
      {activeDropdown === 'materials' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[8rem] left-0 w-full bg-white shadow-lg py-6 z-40 hidden lg:block"
        >
          <div className="container mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 px-6">
            {materials?.map((material, idx) => (
              <Link key={idx} href={"/materials/" + material['id']} onClick={() => setActiveDropdown(null)}>
                <img src={material.mainImageUrl} className="w-full h-24 object-cover rounded-lg mb-2" />
                <p>{material.name}</p>
              </Link>
              // <Link key={index} href={`/materials/${material.id}`} className="block text-center py-4 hover:text-gray-700">
              //   {material.name}
              // </Link>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [activeDropdown, materials]);

  const edgesDropdown = useMemo(() => (
    <AnimatePresence>
      {activeDropdown === 'edges' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-[8rem] left-0 w-full bg-white shadow-lg py-6 z-40 hidden lg:block"
        >
          <div className="container mx-auto flex flex-row gap-8 px-6 justify-center text-center">

            <Link
              href="/edges/"
              onClick={() => setActiveDropdown(null)}
              className="flex flex-col items-center gap-2 text-gray-800 hover:text-darkGold transition"
            >
              <LuWand className="text-3xl" />
              <span className="text-base font-medium">Видове завършек</span>
            </Link>

            <Link
              href={{ pathname: "/edges" }}
              onClick={() => {
                dispatch(openModal(true));
                setActiveDropdown(null);
              }}
              className="flex flex-col items-center gap-2 text-gray-800 hover:text-darkGold transition"
            >
              <HiCubeTransparent className="text-3xl" />
              <span className="text-base font-medium">3D Визуализация</span>
            </Link>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [activeDropdown, dispatch]);

  // useEffect(() => {
  //   function handleClickOutside(event) {
  //     console.log(activeDropdown);
  //     if ((dropdownRef.current && !dropdownRef.current.contains(event.target) && dropdownEdgesRef.current && !dropdownEdgesRef.current.contains(event.target))) {
  //       console.log("Clicked outside");
  //       setActiveDropdown(null);
  //     }
  //   }
  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  return (
    <>
      <nav className="bg-white text-black w-screen top-0 z-50 py-4 shadow-md left-0 right-0">

        <div className="container mx-auto flex flex-col items-center">

          <div className="flex  w-full px-6 justify-start sm:justify-center">
            {/* <button className="absolute top-2 left-2 hover:underline hover:text-darkGoldHover text-royalGold px-4 my-2 leading-10 rounded-2xl hidden lg:block justify-end">
              <a href={`tel:${+3590895198805}`}>тел. 0895198805</a>
            </button> */}
            {/* Centered Logo */}
            <div className="text-3xl font-bold tracking-wide uppercase text-center justify-center">
              <Link href="/">
                <div className="flex flex-row justify-start font-thin">
                  <img src="/assets/images/logo-2.svg" className="max-w-[250px] sm:max-w-[350px] " />
                  {/*                   
                  YOTTO ST<span><svg version="1.0" style={{ height: "1.4em", marginBottom: "0.3em", width: "1.5em" }} xmlns="http://www.w3.org/2000/svg" width="512.000000pt" height="512.000000pt" viewBox="0 0 512.000000 512.000000" preserveAspectRatio="xMidYMid meet">
                  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="#000" stroke="#000" strokeWidth="60">
                    <path d="M2788 4972 c-73 -54 -282 -209 -465 -344 -182 -136 -344 -253 -360
-261 -15 -8 -226 -99 -468 -201 -242 -103 -446 -193 -453 -199 -12 -12 -342
-2122 -342 -2188 0 -30 308 -1166 330 -1216 7 -17 138 -87 501 -269 l493 -246
835 91 c696 76 839 95 853 109 9 9 134 210 279 447 l262 430 83 685 c46 377
84 703 84 725 0 22 -72 384 -160 805 -88 420 -160 768 -160 772 0 6 -1025 867
-1114 936 -16 12 -37 22 -46 22 -10 0 -78 -44 -152 -98z m89 -798 c-2 -2 -680
157 -721 169 -5 2 155 125 355 274 l364 270 3 -355 c1 -195 1 -356 -1 -358z
m621 291 c250 -208 456 -384 459 -390 4 -12 -437 -924 -447 -924 -3 -1 -119
214 -257 476 l-253 477 0 390 0 389 23 -20 c12 -11 226 -190 475 -398z m-1085
-307 c213 -51 386 -96 385 -99 -2 -4 -220 -190 -485 -413 l-483 -406 -123 128
c-431 444 -516 537 -499 545 121 55 791 336 802 337 8 0 189 -41 403 -92z
m760 -639 c144 -273 245 -475 240 -480 -5 -5 -359 -159 -786 -343 l-777 -333
0 46 c0 25 7 197 16 381 l16 335 26 22 c15 12 245 207 512 432 267 225 490
409 495 410 6 0 122 -211 258 -470z m977 -241 c71 -337 128 -614 127 -614 -1
-1 -153 81 -337 182 -197 108 -335 189 -335 198 0 17 408 857 413 851 2 -2 62
-280 132 -617z m-2666 148 l276 -289 0 -51 c-1 -82 -37 -777 -41 -781 -9 -8
-881 -426 -884 -423 -3 4 284 1877 291 1897 6 17 -18 41 358 -353z m2037 -613
c24 -65 163 -444 309 -843 147 -399 265 -727 264 -729 -2 -2 -403 96 -891 219
l-888 223 -215 274 c-118 151 -216 277 -217 281 -2 6 1566 688 1588 691 4 1
26 -52 50 -116z m461 -127 c170 -92 310 -171 313 -175 3 -6 -115 -1020 -128
-1091 -2 -14 -537 1434 -537 1454 0 4 10 2 23 -6 12 -8 160 -90 329 -182z
m-1987 -789 l226 -288 -16 -417 c-10 -229 -18 -418 -19 -418 -8 -6 -1053 -121
-1057 -116 -14 15 -300 1075 -292 1082 12 13 917 449 925 447 4 -1 109 -132
233 -290z m1214 -562 c471 -119 864 -219 873 -223 14 -6 -18 -65 -208 -377
-124 -203 -227 -371 -228 -372 -2 -3 -1330 398 -1335 403 -4 4 15 542 25 692
3 50 8 92 12 92 3 0 391 -97 861 -215z m-419 -841 c305 -92 558 -170 562 -173
4 -4 -288 -38 -649 -78 l-657 -71 -375 188 c-207 104 -369 189 -361 190 8 1
213 25 455 54 242 30 447 54 455 55 8 1 265 -74 570 -165z"></path>
                  </g>

                </svg></span>NES */}


                </div>
              </Link>
            </div>
            {/* CTA Button */}
            <button className="absolute top-2 right-2 bg-royalGold hover:bg-royalGold/50 text-white px-4 my-2 leading-10 rounded-2xl hidden lg:block justify-end">
              <Link href="/contact">Поискай оферта</Link>
            </button>
          </div>

          {/* Navigation Links */}
          <div className="w-full border-t mt-4 pt-4">
            <div className="hidden lg:flex justify-center space-x-6 uppercase text-sm font-light">
              <ScrollLink href="/" sectionTag="about-section" className="hover:text-gray-400 nav-link">За нас</ScrollLink>
              <ScrollLink href="/" sectionTag="offerings" className="hover:text-gray-400 nav-link">Услуги</ScrollLink>
              <button className="flex items-center space-x-1 nav-link" onClick={() => setActiveDropdown(activeDropdown === 'edges' ? null : 'edges')}>
                <span className="uppercase">Обработки</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {/* <Link href="/edges" className="hover:text-gray-400 nav-link">Обработки</Link> */}
              <button className="flex items-center space-x-1 nav-link" onClick={() => setActiveDropdown(activeDropdown === 'materials' ? null : 'materials')}>
                <span className="uppercase">Материали</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <Link href="/contact" className="hover:text-gray-400 nav-link">Контакти</Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="lg:hidden absolute right-6 top-4 py-4 z-[2000" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6 " /> : <Menu className="w-6 h-6" />}
          </button>

          {isOpen && (
            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Backdrop Blur Layer */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[1990] bg-black/30 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                  />
                  <style jsx global>{`
        body {
          overflow: hidden;
          touch-action: none;
        }
      `}</style>
                  {/* Slide-in Menu Panel */}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    transition={{ type: "tween", duration: 0.4 }}
                    className="fixed top-0 right-0 z-[2000] h-full w-full max-w-xs bg-white shadow-lg p-6 overflow-y-auto lg:hidden"
                  >
                    <ScrollLink
                      href="/"
                      sectionTag="about-section"
                      className="block hover:text-gray-400 py-4 pt-12"
                      onClick={() => setIsOpen(false)}
                    >
                      За нас
                    </ScrollLink>

                    <ScrollLink
                      href="/"
                      sectionTag="offerings"
                      className="block hover:text-gray-400 py-4"
                      onClick={() => setIsOpen(false)}
                    >
                      Услуги
                    </ScrollLink>

                    {/* Обработки Dropdown */}
                    <div className="py-4">
                      <button
                        className="flex items-center w-full justify-between"
                        onClick={() =>
                          setActiveDropdown(activeDropdown === "edges" ? null : "edges")
                        }
                      >
                        <span>Обработки</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {activeDropdown === "edges" && (
                        <div className="mt-2">
                          <Link
                            href="/edges"
                            className="block px-4 py-1 text-gray-600 hover:text-gray-900"
                            onClick={() => setIsOpen(false)}
                          >
                            Видове Обработки
                          </Link>
                          <Link
                            href="/edges"
                            className="block px-4 py-1 text-gray-600 hover:text-gray-900"
                            onClick={() => {
                              dispatch(openModal(true));
                              setActiveDropdown(null);
                              setIsOpen(false);
                            }}
                          >
                            3D Визуализация
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Материали Dropdown */}
                    <div className="py-4">
                      <button
                        className="flex items-center w-full justify-between"
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === "materials" ? null : "materials"
                          )
                        }
                      >
                        <span>Материали</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      {activeDropdown === "materials" && (
                        <div className="mt-2">
                          {materials?.map((material, idx) => (
                            <Link
                              key={idx}
                              href={`/materials/${material.id}`}
                              className="block px-4 py-1 text-gray-600 hover:text-gray-900"
                              onClick={() => setIsOpen(false)}
                            >
                              {material.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link
                      href="/contact"
                      className="block hover:text-gray-400 py-4"
                      onClick={() => setIsOpen(false)}
                    >
                      Контакти
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}
        </div>
      </nav>

      {/* Full-Width Dropdown Below Navbar */}

      <div ref={dropdownRef}>{materialDropdown}</div>
      <div ref={dropdownEdgesRef}>{edgesDropdown}</div>


    </>
  );
}
