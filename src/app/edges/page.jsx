"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import BabylonScene from "@/components/animated/BabylonScene";
import FullScreenModal from "@/components/common/FullScreenModal";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "@/redux/modalSlice";

const edges = [
    {
        title: "Полиран кант с фаска 5мм",
        description:
            "Леко скосен и полиран ръб с фаска 5 мм, което намалява риска от отчупване и придава елегантност.",
        image: "/assets/images/edge_types/1-2-Bevel-Edge-new.png",
    },
    {
        title: "Полиран кант с минимална фаска",
        description:
            "Много леко заобляне или фаска, запазваща естествения вид на материала, но с омекотен ръб за безопасност.",
        image: "/assets/images/edge_types/Eased-Edge-new.png",
    },
    {
        title: "Eдностранно закръгление ¼ R",
        description:
            "Меко закръглен ръб, който предлага баланс между елегантност и практичност.",
        image: "/assets/images/edge_types/1-4-Rounded-Top-Bottom-R-new.png",
    },
    {
        title: "Полирано чело с минимална фаска – подленка 20мм+20мм",
        description:
            "Гладко полиран ръб с леко заобляне или фаска, който съчетава издръжливост и стилен завършек.",
        image: "/assets/images/edge_types/Eased-Edge-new.png",
    },
    {
        title: "Двустранно закръгление ½ R – подленка 20мм+20мм",
        description:
            "Гладки, заоблени ръбове от двете страни, създаващи елегантен завършек, подходящ за плотове и стълбища.",
        image: "/assets/images/edge_types/Full-Bullnose-U30-R-new.png",
    },
    {
        title: "Едностранна фаска – подленка 20мм+20мм",
        description:
            "Ръб с изрязана фаска, осигуряваща остър и изчистен външен вид, често използван в съвременния дизайн.",
        image: "/assets/images/edge_types/1-2-Bevel-Edge-new-h4.png",
    },
    {
        title: "Едностранно закръгление ¼ R – подленка 20мм+20мм",
        description:
            "Едностранно заоблен ръб, който придава мекота на дизайна, като същевременно запазва модерна визия.",
        image: "/assets/images/edge_types/1-4-Rounded-Top-Bottom-R-new.png",
    },
];

const EdgeList = () => {
    const isModalOpened = useSelector((state) => state.modal.isModalOpened);
    const dispatch = useDispatch();

    
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
                {/* Intro Section with Integrated 3D CTA */}
                <div className="max-w-6xl mx-auto text-center md:text-left mb-28 flex flex-col md:flex-row items-center gap-10">
                    {/* Left: Text Content */}
                    <div className="md:w-1/2">
                        <h2 className="text-3xl md:text-5xl font-semibold text-darkGold uppercase mb-6 leading-tight">
                            Изборът на завършек <br /> прави разликата
                        </h2>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Всеки детайл има значение, когато става въпрос за изработка на каменни плотове и интериорни повърхности.
                            Видът на ръбовете не само оформя цялостния дизайн, но също така влияе върху <span className="font-semibold text-darkGold">устойчивостта и безопасността</span> на материала.
                        </p>
                        <ul className="mt-6 space-y-3 text-gray-600">
                            <li className="flex items-center gap-3">
                                <img src="/assets/icons/staircase.png" alt="design icon" className="w-8 h-8" />
                                <span><span className="text-darkGold font-semibold">Естетика</span>: Персонализирайте визията си – от модерни до класически форми.</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <img src="/assets/icons/durable.png" alt="durability icon" className="w-8 h-8" />
                                <span><span className="text-darkGold font-semibold">Издръжливост</span>: Намалете риска от отчупване и повишете устойчивостта на камъка.</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <img src="/assets/icons/shield.png" alt="safety icon" className="w-8 h-8" />
                                <span><span className="text-darkGold font-semibold">Безопасност</span>: Изберете заоблени ръбове за по-сигурни повърхности.</span>
                            </li>
                        </ul>

                        {/* CTA Button Below Text */}
                        <div className="mt-10 rounded-xl  p-6 ">
                            <h4 className="text-xl font-semibold text-gray-800 mb-2">
                                Искате да видите как изглежда завършекът в 3D?
                            </h4>
                            <p className="text-gray-600 text-sm mb-4">
                                Персонализирайте вашия избор в реалистична среда.
                            </p>
                            <motion.button
                                initial={{ opacity: .6 }}
                                whileHover={{ opacity: 1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsModalOpen(true)}
                                className="w-full px-4 py-2 bg-darkGold text-white rounded-md font-semibold hover:bg-gold-700 transition"
                            >
                                Визуализирай завършек в 3D
                            </motion.button>
                        </div>
                    </div>

                    {/* Right: Feature Image */}
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
                

                {/* Modal with BabylonScene */}
                <FullScreenModal isOpen={typeof isModalOpened !== 'undefined' && isModalOpened } onClose={() => dispatch(closeModal())}>
                    <BabylonScene />
                </FullScreenModal>
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
