"use client";
import { FaPhoneVolume } from "react-icons/fa";
import { useState } from "react";

export default function CallButton() {
    const [hovered, setHovered] = useState(false);

    return (
        <div className="fixed bottom-6 right-6 z-[2000]">
            <button
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onTouchStart={() => setHovered(true)}
                onTouchEnd={() => setHovered(false)}
                onBlur={() => setHovered(false)}
                onClick={() => (window.location.href = "tel:+359895198805")}
                className={`relative flex items-center justify-center bg-royalGold text-white px-5 py-4 rounded-full shadow-lg transition-all duration-300 hover:bg-royalGold/90 focus:outline-none overflow-hidden group`}
                aria-label="Свържи се"
            >
                {/* Ripple */}
                <span className="absolute inset-0 rounded-full bg-white opacity-0 " />

                {/* Icon */}
                <FaPhoneVolume className="relative z-10 text-2xl" />

                {/* Label Reveal on hover */}
                <span
                    className={`absolut right-10 top-0 z-10 text-base font-semibold transition-all duration-700 ${hovered ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0"
                        } overflow-hidden whitespace-nowrap`}
                >
                    Свържи се
                </span>
            </button>
        </div>
    );
}
