
import { motion } from 'framer-motion';

const FeatureSection = () => {
  return (
    <section className=" py-20 px-6 md:px-16 text-grey">
      <div className="max-w-7xl mx-auto text-center">
        {/* Heading */}
        <p className='text-xl tracking-widest text-gray-500 uppercase subtitle'>  Нашите предимства </p>
        <h2 className="text-4xl font-extrabold mb-2">
         Открийте как можем да създадем вашия идеален проект
        </h2>
        <p className="text-lg mb-12">
          От избор на камъни до монтаж, ние предоставяме решения от А до Я, които отговарят на вашите нужди.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Fast Execution */}
          <motion.div
            className="bg-white text-gray-800 p-6 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* <div className="mb-4 flex justify-center items-center">
              <FaBolt className="h-12 w-12 text-yellow-500" />
            </div> */}
            <h3 className="text-xl font-semibold mb-4">ЕКСПРЕСНО ИЗПЪЛНЕНИЕ</h3>
            <p className="text-gray-600">
              Бързо и без компромиси в качеството. Ние се грижим за всеки етап от вашия проект.
            </p>
          </motion.div>

          {/* Attention to Detail */}
          <motion.div
            className="bg-white text-gray-800 p-6 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* <div className="mb-4 flex justify-center items-center">
              <FaRegSmileBeam className="h-12 w-12 text-yellow-500" />
            </div> */}
            <h3 className="text-xl font-semibold mb-4">ВНИМАНИЕ КЪМ ДЕТАЙЛА</h3>
            <p className="text-gray-600">
              Истински уникални проекти, далеч от масовото производство, с внимание към всеки детайл.
            </p>
          </motion.div>

          {/* Professional Consulting */}
          <motion.div
            className="bg-white text-gray-800 p-6 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* <div className="mb-4 flex justify-center items-center">
              <FaPhoneAlt className="h-12 w-12 text-yellow-500" />
            </div> */}
            <h3 className="text-xl font-semibold mb-4">ПРОФЕСИОНАЛНО КОНСУЛТИРАНЕ</h3>
            <p className="text-gray-600">
              Нашите експерти ще ви помогнат да изберете най-добрите материали за вашия проект.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
