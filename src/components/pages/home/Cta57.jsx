import React from 'react';
import { FaPhoneVolume } from "react-icons/fa6";


const CTASection = () => {
  return (
    <section className="bg-[#313131] py-16 px-6 md:px-16 shadow-xl">
      <div className="max-w-5xl mx-auto text-center space-y-8">
        <h2 className="text-xl font-extralight text-white mb-4 subtitle">
          НЕКА СЪЗДАДЕМ ВАШИЯ ИДЕАЛЕН ПРОЕКТ
        </h2>
        <p className="text-2xl text-gray-300 mb-6">
          Вашите идеи заслужават най-доброто внимание. Нека направим първата стъпка заедно – обадете ни се ,за да създадем нещо наистина уникално!
        </p>
        <div className="flex justify-center gap-8">
          {/* Phone Call Button (Primary) */}
          <a
            href="tel:+359895198805"
            className="bg-darkGold  text-white py-4 px-8 rounded-full text-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:bg-darkGoldHover hover:shadow-xl pulse-animation flex items-center space-x-3"
          >
            <FaPhoneVolume />
            <span>Обадете се</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;

