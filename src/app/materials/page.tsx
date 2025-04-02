"use client";

import Materials from "@/components/common/Materials";
import PageHeader from "@/components/common/PageHeader";
import { motion } from "framer-motion";
import { GiStoneCrafting, GiDiamondHard, GiShinyEntrance } from "react-icons/gi";

export default function MaterialsClient() {
  return (
    <div>
      <PageHeader
        title="Материали"
        subtitle="Красотата на природата в нашите ръце"
        backgroundImage="/assets/images/services-header.jpg"
      />
       <section className="max-w-6xl mx-auto text-center px-6 py-20 bg-white">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl md:text-5xl font-bold text-darkGold mb-6"
      >
        Изборът на правилния камък прави всяко пространство уникално 
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed"
      >
        Подходящият <strong className="text-darkGold">естествен камък</strong> е ключов за създаване на изискани и трайни решения както в интериора, така и в екстериора.
        Независимо дали става въпрос за <strong className="text-darkGold">мрамор</strong>, <strong className="text-darkGold">гранит</strong>, <strong className="text-darkGold">варовик</strong> или <strong className="text-darkGold">оникс</strong>,
        всеки материал носи със себе си уникални свойства и стил.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto mt-6"
      >
        Изберете подходящия камък според функционалност, устойчивост и визия – и се насладете на естетика, която остава във времето.
      </motion.p>

      {/* Benefits Row */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <GiDiamondHard className="text-4xl text-darkGold mb-4" />
          <h4 className="text-xl font-semibold text-gray-800 mb-2">Издръжливост</h4>
          <p className="text-gray-600">
            Камъкът е устойчив на натоварвания, влага и износване – подходящ за всякакви условия.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <GiStoneCrafting className="text-4xl text-darkGold mb-4" />
          <h4 className="text-xl font-semibold text-gray-800 mb-2">Естетика</h4>
          <p className="text-gray-600">
            Богат избор от текстури, цветове и шарки – от класически до модерни визии.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="p-6 bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition"
        >
          <GiShinyEntrance className="text-4xl text-darkGold mb-4" />
          <h4 className="text-xl font-semibold text-gray-800 mb-2">Луксозно усещане</h4>
          <p className="text-gray-600">
            Камъкът създава усещане за престиж, класа и устойчиво качество във всяка среда.
          </p>
        </motion.div>
      </div>
    </section>
      <Materials includeTitle={false} />
    </div>
  );
}
