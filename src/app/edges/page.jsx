// "use client";

// import { motion } from "framer-motion";

// const edges = [
//   {
//     title: "Полиран кант с фаска 5мм",
//     description:
//       "Леко скосен и полиран ръб с фаска 5 мм, което намалява риска от отчупване и придава елегантност.",
//     image: "/assets/images/edge_types/1-2-Bevel-Edge.png", // Replace with actual image paths
//   },
//   {
//     title: "Полиран кант с минимална фаска",
//     description:
//       "Много леко заобляне или фаска, запазваща естествения вид на материала, но с омекотен ръб за безопасност.",
//     image: "/assets/images/edge_types/Mitered-Edge.png",
//   },
//   {
//     title: "Eдностранно закръгление ¼ R",
//     description:
//       "Меко закръглен ръб, който предлага баланс между елегантност и практичност.",
//     image: "/assets/images/edge_types/1-4-Rounded-Top-Bottom-R.png",
//   },
//   {
//     title: "Полирано чело с минимална фаска – подленка 20мм+20мм",
//     description:
//       "Гладко полиран ръб с леко заобляне или фаска, който съчетава издръжливост и стилен завършек.",
//     image: "/assets/images/edge_types/Eased-Edge-h4.png", // Replace with actual image paths
//   },
//   {
//     title: "Двустранно закръгление ½ R – подленка 20мм+20мм",
//     description:
//       "Гладки, заоблени ръбове от двете страни, създаващи елегантен завършек, подходящ за плотове и стълбища.",
//     image: "/assets/images/edge_types/double-rounded-h4.png",
//   },
//   {
//     title: "Едностранна фаска – подленка 20мм+20мм",
//     description:
//       "Ръб с изрязана фаска, осигуряваща остър и изчистен външен вид, често използван в съвременния дизайн.",
//     image: "/assets/images/edge_types/1-2-Bevel-Edge-h4.png",
//   },
//   {
//     title: "Едностранно закръгление ¼ R – подленка 20мм+20мм",
//     description:
//       "Едностранно заоблен ръб, който придава мекота на дизайна, като същевременно запазва модерна визия.",
//     image: "/assets/images/edge_types/single-rounded-h4.png",
//   },
// ];

// const EdgeList = () => {
//   return (
//     <section className="bg-gray-100 py-20 px-5 md:px-20 bg-[url('/assets/images/edge_types/edge_type-bg.png')]  bg-cover bg-center bg-no-repeat">
//       <h2 className="text-3xl md:text-5xl font-semibold text-center text-darkGold uppercase mb-10">
//         Видове Завършек
//       </h2>
//       <div className="max-w-6xl mx-auto space-y-16">
//         {edges.map((edge, index) => (
//           <motion.div
//             key={index}
//             initial={{ opacity: 0, y: 50 }}
//             whileInView={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.6, ease: "easeOut" }}
//             viewport={{ once: false }}
//             className="flex flex-col md:flex-row items-center md:odd:flex-row-reverse gap-10"
//           >
//             <motion.img
//               src={edge.image}
//               alt={edge.title}
//               className="w-full md:w-1/2"
//               initial={{ opacity: 0, y: 50 }}
//               whileInView={{ opacity: 1, y: 0,scale: 1.05 }}
//               transition={{ duration: 1.2, ease: "easeOut" }}
//               viewport={{ once: false }}
//             />
//             <div className="md:w-1/2 text-center md:text-left">
//               <h3 className="text-2xl font-bold subtitle">{edge.title}</h3>
//               <p className="text-gray-600 mt-3">{edge.description}</p>
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </section>
//   );
// };

// export default EdgeList;


"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";

const edges = [
    {
        title: "Полиран кант с фаска 5мм",
        description:
            "Леко скосен и полиран ръб с фаска 5 мм, което намалява риска от отчупване и придава елегантност.",
        image: "/assets/images/edge_types/1-2-Bevel-Edge.png",
    },
    {
        title: "Полиран кант с минимална фаска",
        description:
            "Много леко заобляне или фаска, запазваща естествения вид на материала, но с омекотен ръб за безопасност.",
        image: "/assets/images/edge_types/Mitered-Edge.png",
    },
    {
        title: "Eдностранно закръгление ¼ R",
        description:
            "Меко закръглен ръб, който предлага баланс между елегантност и практичност.",
        image: "/assets/images/edge_types/1-4-Rounded-Top-Bottom-R.png",
    },
    {
        title: "Полирано чело с минимална фаска – подленка 20мм+20мм",
        description:
            "Гладко полиран ръб с леко заобляне или фаска, който съчетава издръжливост и стилен завършек.",
        image: "/assets/images/edge_types/Eased-Edge-h4.png",
    },
    {
        title: "Двустранно закръгление ½ R – подленка 20мм+20мм",
        description:
            "Гладки, заоблени ръбове от двете страни, създаващи елегантен завършек, подходящ за плотове и стълбища.",
        image: "/assets/images/edge_types/double-rounded-h4.png",
    },
    {
        title: "Едностранна фаска – подленка 20мм+20мм",
        description:
            "Ръб с изрязана фаска, осигуряваща остър и изчистен външен вид, често използван в съвременния дизайн.",
        image: "/assets/images/edge_types/1-2-Bevel-Edge-h4.png",
    },
    {
        title: "Едностранно закръгление ¼ R – подленка 20мм+20мм",
        description:
            "Едностранно заоблен ръб, който придава мекота на дизайна, като същевременно запазва модерна визия.",
        image: "/assets/images/edge_types/single-rounded-h4.png",
    },
];
// bg-[url('/assets/images/edge_types/edge_type-bg.png')] 
const EdgeList = () => {
    return (
        <>
            <PageHeader
                title="Видове обработка"
                subtitle="Нашите висококачествени решения за вашите нужди"
                backgroundImage="/assets/images/services-header.jpg"
            />
            <section className="bg-gray-100 py-20 px-5 md:px-20 bg-cover bg-center bg-no-repeat">
                {/* Intro Section */}
                {/* Enhanced Heading Section */}
                <div className="max-w-6xl mx-auto text-center md:text-left mb-16 flex flex-col md:flex-row items-center gap-10">
                    {/* Text Content */}
                    <div className="md:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-semibold text-darkGold uppercase mb-6 leading-tight">
                            Изборът на завършек <br /> прави разликата
                        </h2>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Всеки детайл има значение, когато става въпрос за изработка на каменни плотове и интериорни повърхности.
                            Видът на ръбовете не само оформя цялостния дизайн, но също така влияе върху <span className="font-semibold text-darkGold">устойчивостта и безопасността</span> на материала.
                            Ние предлагаме разнообразие от завършеци, които отговарят на различни <span className="font-semibold text-darkGold">стилове и функционални нужди</span>.
                        </p>
                        <ul className="mt-6 space-y-3 text-gray-600">
                            <li className="flex items-center gap-3">
                                <img src="/assets/icons/staircase.png" alt="design icon" className="w-8 h-8" />
                                <span><span className="text-darkGold font-semibold">Естетика</span>: Персонализирайте визията си – от модерни минималистични до класически изваяни форми.</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <img src="/assets/icons/durable.png" alt="durability icon" className="w-8 h-8" />
                                <span><span className="text-darkGold font-semibold">Издръжливост</span>: Намалете риска от отчупване и повишете устойчивостта на камъка.</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <img src="/assets/icons/shield.png" alt="safety icon" className="w-8 h-8" />
                                <span><span className="text-darkGold font-semibold">Безопасност</span>: Изберете меко заоблени ръбове, особено за семейни и обществени пространства.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Image Content */}
                    <div className="md:w-1/2 flex justify-end relative">
                        <motion.img
                            src="/assets/images/edge_types/featured-edge.jpg"
                            alt="Marble edge finishes"
                            className="rounded-lg shadow-lg w-full max-w-md"
                            initial={{ opacity: 0, scale: 0.8, x: 100 }}
                            whileInView={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            viewport={{ once: true }}
                        />
                        {/* <motion.img
                        src="/assets/images/edge_types/edge-closeup.jpg"
                        alt="Close-up marble edge"
                        className="absolute -bottom-10 -right-10 rounded-lg shadow-md w-1/3 hidden md:block"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                        viewport={{ once: true }}
                    /> */}
                    </div>
                </div>


                {/* Edge Types List */}
                <div className="max-w-6xl mx-auto space-y-16 mt-10">
                    {edges.map((edge, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            viewport={{ once: false }}
                            className="flex flex-col md:flex-row items-center md:odd:flex-row-reverse gap-10"
                        >
                            <motion.img
                                src={edge.image}
                                alt={edge.title}
                                className="w-full md:w-1/2 rounded-lg"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0, scale: 1.05 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                viewport={{ once: false }}
                            />
                            <div className="md:w-1/2 text-center md:text-left">
                                <h3 className="text-2xl font-bold subtitle text-darkGold">
                                    {edge.title}
                                </h3>
                                <p className="text-gray-600 mt-3">{edge.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* CTA Section */}
                <div className="max-w-4xl mx-auto text-center mt-20 bg-white p-10 shadow-lg rounded-lg">
                    <h3 className="text-2xl font-bold text-gray-800">
                        Нуждаете се от помощ при избора на завършек?
                    </h3>
                    <p className="text-gray-700 mt-4">
                        Нашите експерти са тук, за да ви помогнат да изберете най-подходящия ръб за вашия плот, стълбище или облицовка.
                        Свържете се с нас за безплатна консултация и професионален съвет!
                    </p>
                    <Link href="/contact">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="mt-6 px-6 py-3 bg-darkGold text-white font-semibold rounded-lg shadow-md hover:bg-gold-700 transition"
                        >
                            Свържете се с нас
                        </motion.button>
                    </Link>
                </div>
            </section>
        </>
    );
};

export default EdgeList;
