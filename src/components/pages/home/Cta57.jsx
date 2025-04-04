// "use client";

// import { Button } from "@relume_io/relume-ui";
// import { motion } from "framer-motion";
// import React from "react";

// export default function Cta57() {
//   return (
//     <section id="relume" className="px-[5%] py-16 md:py-24 lg:py-28">
//       <div className="container">
//         <div className="mx-auto w-full max-w-lg text-center">
//           <h1>
//             <motion.span
//               initial={{ x: "-50%" }}
//               animate={{ x: "0%" }}
//               transition={{ type: "spring", bounce: 0 }}
//               className="block text-6xl font-bold md:text-9xl lg:text-10xl"
//             >
//               Medium length CTA
//             </motion.span>
//           </h1>
//           <h1>
//             <motion.span
//               initial={{ x: "50%" }}
//               animate={{ x: "0%" }}
//               transition={{ type: "spring", bounce: 0 }}
//               className="mb-5 block text-6xl font-bold md:mb-6 md:text-9xl lg:text-10xl"
//             >
//               heading goes here
//             </motion.span>
//           </h1>
//           <p className="md:text-md">
//             Свържете се с нас за безплатна консултация и открийте уникалните
//             решения за вашия проект.
//           </p>
//           <div className="mt-6 flex items-center justify-center gap-x-4 md:mt-8">
//             <Button title="Запитване">Запитване</Button>
//             <Button title="Консултация" variant="secondary">
//               Консултация
//             </Button>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }

// components/CTASection.js

// components/CTASection.js

// import React from 'react';

// const CTASection = () => {
//   return (
//     <section className="bg-white mt-10 py-28 px-6 md:px-16 rounded-lg shadow-xl">
//       <div className="max-w-5xl mx-auto text-center space-y-8">
//         <h2 className="text-4xl font-extrabold text-[#4B3C2B] mb-4">
//           Готови ли сте да започнем?
//         </h2>
//         <p className="text-xl text-[#6A5C42] mb-6">
//           Вашите идеи заслужават най-доброто внимание. Нека направим първата стъпка заедно – обадете ни се или ни изпратете имейл сега!
//         </p>
//         <div className="flex justify-center gap-8">
//           {/* Phone Call Button */}
//           <a
//             href="tel:+359123456789"
//             className="bg-gradient-to-r from-[#D4A566] to-[#8E6A3D] text-white py-4 px-8 rounded-full text-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl pulse-animation flex items-center space-x-3"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" className="text-white" viewBox="0 0 24 24" strokeWidth="2">
//               <path d="M6.62 10.79c.93-.93 1.51-2.31 1.51-3.79V5c0-1.1-.9-2-2-2h-3C1.9 3 1 3.9 1 5v7c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-2.79c0-.68.27-1.32.75-1.8l3.72-3.72c.48-.48 1.12-.75 1.8-.75h.79c1.1 0 2 .9 2 2v3.5c0 1.48-.58 2.86-1.51 3.79l-3.72 3.72c-.48.48-.75 1.12-.75 1.8v3.09c0 1.1.9 2 2 2h3c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v.79c0 .68-.27 1.32-.75 1.8l-3.72 3.72c-.48.48-1.12.75-1.8.75h-.79c-1.1 0-2-.9-2-2V8.5c0-1.48.58-2.86 1.51-3.79z" />
//             </svg>
//             <span>Обадете се</span>
//           </a>

//           {/* Email Button */}
//           <a
//             href="mailto:info@yottostones.com"
//             className="bg-gradient-to-r from-[#D4A566] to-[#8E6A3D] text-white py-4 px-8 rounded-full text-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl pulse-animation flex items-center space-x-3"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" className="text-white" viewBox="0 0 24 24" strokeWidth="2">
//               <path d="M21 4H3c-1.1 0-1.99.9-1.99 2L1 18c0 1.1.89 2 1.99 2H21c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 12H4V8h16v8zm-2-9H6V5h12v2z" />
//             </svg>
//             <span>Изпратете имейл</span>
//           </a>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default CTASection;

// components/CTASection.js

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
            href="tel:+359123456789"
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

