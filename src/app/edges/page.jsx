"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import BabylonScene from "@/components/animated/BabylonScene";
import FullScreenModal from "@/components/common/FullScreenModal";
import { useDispatch, useSelector } from "react-redux";
import { openModal, closeModal } from "@/redux/modalSlice";
import Seo from "@/components/common/Seo";
import Image from "next/image";

const edges = [
    {
        title: "Полиран кант с фаска 5мм",
        description: "Леко скосен и полиран ръб с фаска 5 мм...",
        image: "/assets/images/edge_types/1-2-Bevel-Edge-new.png",
    },
    {
        title: "Полиран кант с минимална фаска",
        description: "Много леко заобляне или фаска, запазваща естествения вид...",
        image: "/assets/images/edge_types/Eased-Edge-new.png",
    },
    {
        title: "Eдностранно закръгление ¼ R",
        description: "Меко закръглен ръб, който предлага баланс между елегантност и практичност.",
        image: "/assets/images/edge_types/1-4-Rounded-Top-Bottom-R-new.png",
    },
    {
        title: "Полирано чело с минимална фаска – подленка 20мм+20мм",
        description: "Гладко полиран ръб с леко заобляне...",
        image: "/assets/images/edge_types/Eased-Edge-new.png",
    },
    {
        title: "Двустранно закръгление ½ R – подленка 20мм+20мм",
        description: "Гладки, заоблени ръбове от двете страни...",
        image: "/assets/images/edge_types/Full-Bullnose-U30-R-new.png",
    },
    {
        title: "Едностранна фаска – подленка 20мм+20мм",
        description: "Ръб с изрязана фаска, осигуряваща остър и изчистен външен вид...",
        image: "/assets/images/edge_types/1-2-Bevel-Edge-new-h4.png",
    },
    {
        title: "Едностранно закръгление ¼ R – подленка 20мм+20мм",
        description: "Едностранно заоблен ръб, който придава мекота на дизайна...",
        image: "/assets/images/edge_types/1-4-Rounded-Top-Bottom-R-new.png",
    },
];

export default function EdgeList() {
    const isModalOpened = useSelector((state) => state.modal.isModalOpened);
    const dispatch = useDispatch();

    return (
        <>
            <Seo
                title="Видове обработка на ръбове за изделия от естесвен камък"
                description="Открийте различните видове обработка на ръбове за мрамор, гранит и други естествени камъни. Персонализирайте визията и повишете безопасността с Yotto Stones."
                keywords="обработка на ръбове, мраморен ръб, гранитен ръб, фаска, закръглен ръб, персонализирана обработка на камък"
                structuredData={{
                    "@context": "https://schema.org",
                    "@type": "Service",
                    "serviceType": "Обработка на ръбове за каменни плотове",
                    "provider": {
                        "@type": "Organization",
                        "name": "Yotto Stones",
                        "url": "https://www.yottostones-bg.com"
                    },
                    "areaServed": {
                        "@type": "Country",
                        "name": "България"
                    },
                    "description": "Yotto Stones предлага персонализирана обработка на ръбове за мрамор, гранит и други естествени камъни с внимание към детайла и безопасността.",
                    "hasOfferCatalog": {
                        "@type": "OfferCatalog",
                        "name": "Каталог с видове обработка",
                        "itemListElement": [
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Полиран кант с фаска 5мм",
                                    "description": "Леко скосен и полиран ръб с фаска 5 мм за изискан вид."
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Полиран чело с минимална фаска",
                                    "description": "Много леко заобляне или фаска, запазваща естествения вид."
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Eдностранно закръгление ¼ R",
                                    "description": "Меко закръглен ръб за елегантност и практичност."
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Двустранно закръгление ½ R",
                                    "description": "Гладки, заоблени ръбове от двете страни."
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Едностранно закръгление ¼ R – подленка 20мм+20мм",
                                    "description": "Едностранно заоблен ръб, който придава мекота на дизайна."
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Полирано чело с минимална фаска – подленка 20мм+20мм",
                                    "description": "Гладко полиран ръб с леко заобляне."
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Едностранна фаска – подленка 20мм+20мм",
                                    "description": "Ръб с изрязана фаска, осигуряваща остър и изчистен външен вид..."
                                }
                            },
                            {
                                "@type": "Offer",
                                "itemOffered": {
                                    "@type": "Service",
                                    "name": "Двустранно закръгление ½ R – подленка 20мм+20мм",
                                    "description": "Гладки, заоблени ръбове от двете страни..."
                                }
                            }
                        ]
                    }
                }}
            />
            <PageHeader
                title="Видове обработка"
                subtitle="Нашите висококачествени решения за вашите нужди"
                backgroundImage="/assets/images/services-header.jpg"
            />

            <main className="bg-gray-100 py-20 px-5 md:px-20 bg-cover bg-no-repeat">
                {/* Intro */}
                <section className="max-w-6xl mx-auto mb-28 flex flex-col md:flex-row items-center gap-10">
                    <div className="md:w-1/2">
                        <h1 className="text-4xl md:text-5xl font-bold text-darkGold uppercase mb-6 leading-tight">
                            Изборът на завършек прави разликата
                        </h1>
                        <p className="text-lg text-gray-700 leading-relaxed">
                            Всеки детайл има значение...
                            <span className="font-semibold text-darkGold">устойчивостта и безопасността</span>.
                        </p>
                        <ul className="mt-6 space-y-4 text-gray-600">
                            {[
                                {
                                    icon: "/assets/icons/staircase.png",
                                    title: "Естетика",
                                    desc: "Персонализирайте визията си – от модерни до класически форми.",
                                },
                                {
                                    icon: "/assets/icons/durable.png",
                                    title: "Издръжливост",
                                    desc: "Намалете риска от отчупване и повишете устойчивостта.",
                                },
                                {
                                    icon: "/assets/icons/shield.png",
                                    title: "Безопасност",
                                    desc: "Изберете заоблени ръбове за по-сигурни повърхности.",
                                },
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <img
                                        src={item.icon}
                                        alt={`${item.title} иконка`}
                                        className="w-8 h-8"
                                        loading="lazy"
                                    />
                                    <span>
                                        <strong className="text-darkGold">{item.title}</strong>: {item.desc}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA */}
                        <div className="mt-10 p-6 rounded-xl bg-white shadow">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                Искате да видите как изглежда завършекът в 3D?
                            </h2>
                            <p className="text-gray-600 text-sm mb-4">
                                Персонализирайте вашия избор в реалистична среда.
                            </p>
                            <motion.button
                                initial={{ opacity: 0.8 }}
                                whileHover={{ opacity: 1 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => dispatch(openModal(true))}
                                className="w-full px-4 py-2 bg-darkGold text-white rounded-md font-semibold hover:bg-gold-700 transition"
                            >
                                Визуализирай завършек в 3D
                            </motion.button>
                        </div>
                    </div>

                    {/* Feature Image */}
                    <div className="md:w-1/2 flex justify-end">
                        <motion.img
                            src="/assets/images/edge_types/featured-edge.jpg"
                            alt="Примерен каменен ръб"
                            className="rounded-lg shadow-lg w-full max-w-md"
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            loading="lazy"
                        />
                    </div>
                </section>

                {/* Edge Types List */}
                <section className="max-w-6xl mx-auto space-y-20">
                    {edges.map((edge, index) => (
                        <motion.article
                            key={`edge-${index}`}
                            className="flex flex-col md:flex-row items-center gap-10 md:odd:flex-row-reverse"
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <img
                                src={edge.image}
                                alt={edge.title}
                                className="w-full md:w-1/2 rounded-lg"
                                loading="lazy"
                            />
                            <div className="md:w-1/2 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-darkGold mb-2">{edge.title}</h2>
                                <p className="text-gray-600">{edge.description}</p>
                            </div>
                        </motion.article>
                    ))}
                </section>

                {/* Modal for 3D scene */}
                <FullScreenModal isOpen={isModalOpened} onClose={() => dispatch(closeModal())}>
                    <BabylonScene />
                </FullScreenModal>

                {/* Contact CTA */}
                <section className="max-w-4xl mx-auto text-center mt-20 bg-white p-10 shadow-lg rounded-lg">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Нуждаете се от помощ при избора на завършек?
                    </h2>
                    <p className="text-gray-700 mt-4">
                        Нашите експерти са тук, за да ви помогнат...
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
                </section>
            </main>
        </>
    );
}
