// "use client";

// import { motion } from "framer-motion";

// export default function HeroSection() {
//   return (
//     <section 
//       className="relative w-full h-[400px] md:h-[500px] lg:h-[550px] flex items-center bg-cover "
//       style={{ backgroundImage: "url('https://granitmar.bg/wp-content/uploads/marble-1116x754.jpg')" }}
//     >
//       {/* Overlay for better readability */}
//       <div className="absolute inset-0 bg-black bg-opacity-40 bg-center backdrop-blur-[1px]"></div>

//       <div className="relative container mx-auto px-6 md:px-12 lg:px-20 flex flex-col md:flex-row items-start justify-center w-full">
//         {/* Left Side - Title */}
//         <motion.div
//           initial={{ opacity: 0, x: -50 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8 }}
//           className="max-w-lg text-white"
//         >
//           <h1 className="text-3xl md:text-5xl font-bold">
//             Изкуството да сбъднем всяко желание.
//           </h1>
//           <div className="mt-2 h-[2px] w-24 bg-gray-300"></div>
//           <p className="mt-2 text-sm uppercase tracking-wider text-gray-300">
//             Уникални перспективи
//           </p>
//         </motion.div>

//         {/* Right Side - Description */}
//         <motion.div
//           initial={{ opacity: 0, x: 50 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.8, delay: 0.3 }}
//           className="max-w-1xl text-white mt-6 md:mt-0 md:px-10"
//         >
//           <p className="text-lg">
//             Yotto Stones означава гъвкавост и креативност за уникални и персонализирани продукти.
//             Клиентът е ангажиран във всички фази - от концепцията и проектирането до реализацията.
//           </p>
//         </motion.div>
//       </div>
//     </section>
//   );
// }


// V2
// import { motion } from 'framer-motion';

// const AboutUsSection = () => {
//   return (
//     <section className="bg-gray-50 py-20 px-6 md:px-16">
//       <div className="max-w-7xl mx-auto text-center">
//         {/* Heading */}
//         <h2 className="text-4xl font-extrabold text-gray-800 mb-6">
//           Yotto Stones – Фирма с дългогодишен опит в изработката на каменни изделия
//         </h2>

//         {/* Subheading */}
//         <p className="text-xl text-gray-600 mb-12">
//           Ние от Yotto Stones предлагаме високо качествени каменни изделия, включително мрамор, гранит и други естествени камъни, с които създаваме уникални и издръжливи решения за вашия дом или бизнес.
//         </p>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {/* Expertise in Stone Craftsmanship */}
//           <motion.div
//             className="bg-white p-6 rounded-lg shadow-lg"
//             initial={{ opacity: 0, y: 50 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <h3 className="text-xl font-semibold text-gray-700 mb-4">Експертиза в каменната изработка</h3>
//             <p className="text-gray-500">
//               Със своите години опит, Yotto Stones е лидер в производството и обработката на камък. Работим с най-добрите материали и осигуряваме решения, които подхождат на всякакви интериори и екстериори.
//             </p>
//           </motion.div>

//           {/* Quality Craftsmanship */}
//           <motion.div
//             className="bg-white p-6 rounded-lg shadow-lg"
//             initial={{ opacity: 0, y: 50 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.2 }}
//           >
//             <h3 className="text-xl font-semibold text-gray-700 mb-4">Качество на изпълнението</h3>
//             <p className="text-gray-500">
//               Всеки продукт, изработен от Yotto Stones, преминава през стриктни контролни тестове, за да гарантираме неговото дълготрайно и безупречно качество.
//             </p>
//           </motion.div>

//           {/* Customization and Consultation */}
//           <motion.div
//             className="bg-white p-6 rounded-lg shadow-lg"
//             initial={{ opacity: 0, y: 50 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5, delay: 0.4 }}
//           >
//             <h3 className="text-xl font-semibold text-gray-700 mb-4">Персонализирани решения и консултации</h3>
//             <p className="text-gray-500">
//               Ние предлагаме индивидуални консултации, за да ви помогнем да изберете перфектния камък и дизайн за вашите нужди. Също така предлагаме персонализирани решения, които да съответстват на вашето пространство и стил.
//             </p>
//           </motion.div>
//         </div>

//         {/* Footer CTA */}
//         <div className="mt-12">
//           <a
//             href="#contact"
//             className="bg-yellow-600 text-white py-4 px-8 rounded-full text-lg font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
//           >
//             Свържете се с нас
//           </a>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default AboutUsSection;
import { motion } from 'framer-motion';
import Link from 'next/link';

const AboutUsSection = () => {
  return (
    <section id="about-section" className="relative w-full bg-gray-900 text-white py-20 px-6 md:px-16 bg-cover bg-fixed" style={{ backgroundImage: "url('https://granitmar.bg/wp-content/uploads/marble-1116x754.jpg')" }}>
      <div className="absolute inset-0 bg-black bg-opacity-60 bg-center"></div>
      <div className=" relative max-w-5xl mx-auto flex flex-col md:flex-row items-center">
        {/* Left Section: Image + Text */}
        {/* <div className="flex-1 grid grid-cols-2 gap-8">
          <div className="text-center">
            <h3 className="text-4xl font-extrabold mb-2">25+</h3>
            <p className="text-lg text-gray-400">Години опит</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl font-extrabold mb-2">500+</h3>
            <p className="text-lg text-gray-400">Завършени проекта</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl font-extrabold mb-2">10k+</h3>
            <p className="text-lg text-gray-400">Щастливи клиенти</p>
          </div>
          <div className="text-center">
            <h3 className="text-4xl font-extrabold mb-2">5</h3>
            <p className="text-lg text-gray-400">Държави, в които работим</p>
          </div>
        </div> */}
        <div className="flex-1 mb-8 md:mb-0 md:mr-8">
          <motion.div
            className="bg-grey"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className='text-sm tracking-widest text-gray-500 uppercase subtitle'>За нас</p>
            <h2 className="text-3xl font-light mb-4">
              Yotto Stones – Вашият партньор в създаването на уникални каменни изделия
            </h2>
            <p className="text-lg text-gray-300 mb-6">
              Ние от Yotto Stones предлагаме високо качествени каменни изделия, включително мрамор, гранит и други естествени камъни, с които създаваме уникални и издръжливи решения за вашия дом или бизнес.
            </p>

            <p className="text-lg text-gray-300 mb-6">
              Със своите години опит, Yotto Stones е лидер в производството и обработката на камък. Работим с най-добрите материали и осигуряваме решения, които подхождат на всякакви интериори и екстериори.
            </p>
            <p className="text-xl text-gray-300 mb-6">
              Всеки продукт, изработен от Yotto Stones, преминава през стриктни контролни тестове, за да гарантираме неговото дълготрайно и безупречно качество.
            </p>
            <div className='animated-primary-btn relative m-w-40 py-3 px-8 rounded-sm text-white  bg-royalGold/30'>
              <Link href='/contact' className='relative text-lg font-semibold z-10 hover:scale[1.05]'>
                Свържете се с нас
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right Section: Statistics */}

      </div>
    </section>
  );
};

export default AboutUsSection;