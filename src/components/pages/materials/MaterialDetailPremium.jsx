"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { materialImageSrc, materialDisplayName } from "@/lib/materialImage";
import PriceCalculator from "./PriceCalculator";

export default function MaterialDetailPremium({ material, groupId }) {
    return (
        <section className="bg-[#0A0A0A] text-platinum min-h-screen md:px-16 px-8 py-12">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                {/* Image Block */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden "
                >
                    <Image
                        src={materialImageSrc(material, groupId)}
                        alt={materialDisplayName(material)}
                        fill
                        className="object-cover w-full h-full py-20 rounded-xl"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </motion.div>

                {/* Info Block */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="space-y-6"
                >
                    <p className="uppercase tracking-[0.2em] text-royalGold text-sm mb-2">
                        Премиум естествен камък
                    </p>
                    <h1 className="text-4xl md:text-5xl font-semibold text-white">
                        {materialDisplayName(material)}
                    </h1>

                    <p className="text-gray-300 text-base leading-relaxed">
                        {material.description}
                    </p>

                    <div className="pt-6 border-t border-gray-700 space-y-1">
                        {[
                            ["Материал", material.material],
                            ["Произход", material.origin],
                            ["Повърхност", material.surface],
                            ["Размери", material.sizes],
                        ]
                            .filter(([, value]) => value)
                            .map(([label, value]) => (
                                <p key={label} className="text-sm text-gray-400">
                                    <span className="text-white font-medium">{label}:</span> {value}
                                </p>
                            ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        className="mt-6 inline-block px-8 py-3 rounded-full bg-royalGold text-black font-semibold text-sm uppercase tracking-wide shadow-lg hover:bg-darkGoldHover transition"
                    >
                        <Link href="/contact"> Запитване за този материал</Link>
                    </motion.button>
                </motion.div>
            </div>

            {/* Full-width row under image + details. Renders nothing unless the admin enabled the calculator. */}
            <div className="max-w-7xl mx-auto mt-12 empty:hidden">
                <PriceCalculator
                    groupId={Number(groupId)}
                    materialId={Number(material.id)}
                    materialName={materialDisplayName(material)}
                />
            </div>
        </section>
    );
}
