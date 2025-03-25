"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";

export default function Materials() {

  const { materials } = useSelector((state) => state['materials']);

  return (
    <section id="materials" className="px-[5%] py-16 md:py-24 lg:py-28">
      <div className="container">
        <div className="mb-12 md:mb-18 lg:mb-20">
          <div className="mx-auto w-full max-w-lg text-center">
            <h2 className="rb-5 mb-5 text-3xl font-bold md:mb-6 md:text-7xl lg:text-4xl">
              Разнообразие от материали
            </h2>
            <p className="md:text-md">
              Открийте красотата на каменните материали
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 md:gap-y-12 lg:grid-cols-4">
          {materials && materials.map((material, index) => (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0, scale: 1.05 }}
              // animate={isVisible ? { opacity: 1, y: 0 ,scale : 1.05} : {}}
              transition={{ duration: 0.4, delay: index * 0.2 }}
              viewport={{ once: false }}
              key={material['id']}>
              <div className="mb-6 inline-block w-full max-w-full">
                <div className="w-full overflow-hidden">
                  <img
                    src={material['mainImageUrl']}
                    alt="Relume placeholder image 1"
                    className="aspect-[3/2] size-full object-cover"
                  />
                </div>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                // animate={isVisible ? { opacity: 1, y: 0 ,scale : 1.05} : {}}
                transition={{ duration: .8, delay: index * 0.2 }}
                className="mb-2 mr-4 inline-block max-w-full text-sm font-semibold">
                {material['name']}
              </motion.p>
              <motion.h5
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                // animate={isVisible ? { opacity: 1, y: 0 ,scale : 1.05} : {}}
                transition={{ duration: 1, delay: index * 0.2 }} className="mb-2 block max-w-full text-xl font-bold md:text-2xl">
                {/* <h5 className=""> */}
                  {material['title']}
                {/* </h5> */}
              </motion.h5>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                // animate={isVisible ? { opacity: 1, y: 0 ,scale : 1.05} : {}}
                transition={{ duration: 1.2, delay: index * 0.2 }}>{material['shortDescription']}</motion.p>

              <div className="mt-4">
                <Link href={"/materials/" + material['id']} className="text-royalGold hover:text-darkGoldHover hover:underline">
                  Прочети повече →
                </Link>
              </div>
            </motion.div>
          ))}

          {/* <div>
            <a href="#" className="mb-6 inline-block w-full max-w-full">
              <div className="w-full overflow-hidden">
                <img
                  src="https://d22po4pjz3o32e.cloudfront.net/placeholder-image-landscape.svg"
                  alt="Relume placeholder image 1"
                  className="aspect-[3/2] size-full object-cover"
                />
              </div>
            </a>
            <a
              href="#"
              className="mb-2 mr-4 inline-block max-w-full text-sm font-semibold"
            >
              Материали
            </a>
            <a href="#" className="mb-2 block max-w-full">
              <h5 className="text-xl font-bold md:text-2xl">
                Варовик: Природна красота
              </h5>
            </a>
            <p>Варовикът е идеален за външни и вътрешни приложения.</p>
          </div> */}
        </div>
      </div>
    </section>
  );
}
