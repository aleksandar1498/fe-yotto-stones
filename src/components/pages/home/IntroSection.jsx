"use client";
import ScrollLink from '@/components/wrappers/ScrollLink';
import styles from './IntroSection.module.css';
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function IntroSection() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const section = document.getElementById("stone-section");
            if (section) {
                const rect = section.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.75) {
                    setIsVisible(true);
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section id="stone-section" className="relative bg-gray-50  py-20 lg:pt-0 px-6 md:px-12">
            {/* BACKGROUND IMAGE OVERLAY */}
            {/* <div className="absolute top-[-80px] left-0 w-full h-[200px] bg-cover bg-center opacity-20 z-[-1]"></div> */}

            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-5 gap-10 items-center relative">
                {/* LEFT SIDE - TEXT CONTENT */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={isVisible ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="lg:col-span-2 relative z-10"
                >
                    <p className="text-sm tracking-widest text-gray-500 uppercase subtitle">Нашата визия</p>
                    <h2 className="text-4xl font-bold text-gray-900">
                        Камък <span className="text-darkGold">с характер</span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Луксозната линия на Yotto Stones подбира най-добрите мрамори и гранити
                        на пазара и създава уникални и неповторими произведения.
                    </p>
                    <button className="mt-6 bg-darkGold hover:bg-darkGoldHover text-white py-3 px-6 rounded-md text-lg font-medium flex items-center transition">
                        <ScrollLink href={"/"} sectionTag={"materials"}>Открий твоя камък</ScrollLink>
                    </button>
                </motion.div>

                {/* RIGHT SIDE - IMAGE CARDS WITH OVERLAY EFFECT */}
                <div className="lg:col-span-3 grid md:grid-cols-3 col-span-full lg:-mt-8 gap-6 relative z-20">
                    {[
                        { title: "Елегантност", img: "https://www.luxurystoneitalia.it/wp-content/uploads/2020/04/h2.jpg" },
                        { title: "Креативност", img: "https://www.luxurystoneitalia.it/wp-content/uploads/2020/04/h1.jpg" },
                        { title: "Здравина", img: "https://www.luxurystoneitalia.it/wp-content/uploads/2020/03/marble-home.jpg" },
                    ].map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 ,scale : 1.05 }}
                            // animate={isVisible ? { opacity: 1, y: 0 ,scale : 1.05} : {}}
                            transition={{ duration: 0.3, delay: index * 0.2 }}
                            viewport={{ once: false }}
                            // whileHover={{ scale: 1.05 }}
                            className="relative group overflow-hidden col-span-1 shadow-lg w-full transition-transform ease-linear"
                            style={{ transform: `translateY(${index * 30}px)` }} // Overlap effect
                        >
                            <div className={styles["vertical-number-box"]}><span className={styles["vertical-number"]}>{index + 1}</span></div>
                            <div className={`absolute inset-[-3.5rem] h-96 bg-black bg-opacity-30 bg-center z-[1000] `}>

                            </div>

                            <img src={item.img} alt={item.title} className="w-full h-96 object-cover transform transition duration-500 " />
                            <div className="absolute bottom-0 w-full bg-black bg-opacity-70 text-white text-center py-4">
                                {item.title}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
