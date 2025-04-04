"use client";

import { Button, Input } from "@relume_io/relume-ui";
import { useCookieConsent } from "@/providers/CookieSettingsProvider";
import Link from "next/link";
import React, { useState } from "react";
import {
  BiLogoFacebookCircle,
  BiLogoInstagram,
  BiLogoLinkedinSquare,
  BiLogoYoutube,
} from "react-icons/bi";
import { FaXTwitter } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { openModal } from "@/redux/modalSlice";
import ScrollLink from "../wrappers/ScrollLink";

const useForm = () => {
  const [email, setEmail] = useState("");
  const handleSetEmail = (event) => {
    setEmail(event.target.value);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log({ email });
  };
  return {
    email,
    handleSetEmail,
    handleSubmit,
  };
};

export default function Footer1() {
  const { setModalOpen } = useCookieConsent();
  const { materials } = useSelector((state) => state.materials);
  const dispatch = useDispatch();
  const formState = useForm();
  return (
    <footer className="px-[5%] py-12 md:py-18 lg:py-20">
      <div className="container">
        <div className="grid grid-cols-1 gap-x-[8vw] gap-y-12 pb-12 md:gap-y-16 md:pb-18 lg:grid-cols-[0.75fr_1fr] lg:gap-y-4 lg:pb-20">
          <div className="flex flex-col text-center">
            <a href="#" className="mb-5 md:mb-6">
              <img
                src="/assets/images/logo-2.svg"
                alt="Logo image"
                className="inline-block max-w-[250px] sm:max-w-[350px]"
              />
            </a>
            <p className="mb-5 md:mb-6">
              Присъединете се към нашия бюлетин за новини и актуализации.
            </p>
            <div className="w-full max-w-md">
              <form
                className="mb-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-[1fr_max-content] md:gap-y-4"
                onSubmit={formState.handleSubmit}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="Въведете имейл"
                  className="p-2"
                  value={formState.email}
                  onChange={formState.handleSetEmail}
                />
                <Button title="Абонирай се" variant="secondary" size="sm">
                  Абонирай се
                </Button>
              </form>
              <p className="text-xs">
                С абонамента се съгласявате с нашата Политика за
                конфиденциалност.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 items-start gap-y-10 sm:grid-cols-3 sm:gap-x-6 md:gap-x-8 md:gap-y-4">

            <div className="flex flex-col items-start justify-end">
              <h2 className="mb-3 font-semibold md:mb-4">Материали</h2>
              <ul>

                {materials?.map((material, idx) => (
                  <li key={idx} className="py-2 text-sm">
                    <Link href={"/materials/" + material['id']} className={"flex items-center gap-3"}>
                      <span> {material.name}</span>
                    </Link>
                  </li>
                  // <Link key={index} href={`/materials/${material.id}`} className="block text-center py-2 hover:text-gray-700">
                  //   {material.name}
                  // </Link>
                ))}
              </ul>

            </div>
            <div className="flex flex-col items-start justify-end text-align-end">
              <h2 className="mb-3 font-semibold md:mb-4">Обработки</h2>
              <ul>
                <li className="py-2 text-sm">
                  <Link href={"/edges/"} className={"flex items-center gap-3"}>Видове Обработки</Link>
                </li>
                <li className="py-2 text-sm">
                  <Link href={"/edges"} className={"flex items-center gap-3"} onClick={() => {
                    dispatch(openModal(true));
                  }
                  } > 3D Визуализация</Link>
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-start justify-end text-align-end">
              <h2 className="mb-3 font-semibold md:mb-4">Бързи връзки</h2>
              <ul>
                <li className="py-2 text-sm">
                  <ScrollLink href={"/"} sectionTag={"about-section"} className={"flex items-center gap-3"}>За нас</ScrollLink>
                </li>
                <li className="py-2 text-sm">
                  <Link href="/contact" className={"flex items-center gap-3"}>Контакти</Link>
                </li>
                <li className="py-2 text-sm">
                  <ScrollLink href={"/"} sectionTag={"offerings"} className={"flex items-center gap-3"}>Услуги</ScrollLink>
                </li>
              </ul>
            </div>
            {/* <div className="flex flex-col items-start justify-start"> */}
            {/* <h2 className="mb-3 font-semibold md:mb-4">Следвайте ни</h2>
              <ul className="flex flex-col items-start">
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3">
                    <BiLogoFacebookCircle className="size-6" />
                    <span>Facebook</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3">
                    <BiLogoInstagram className="size-6" />
                    <span>Instagram</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3">
                    <FaXTwitter className="size-6 p-0.5" />
                    <span>X</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3">
                    <BiLogoLinkedinSquare className="size-6" />
                    <span>LinkedIn</span>
                  </a>
                </li>
                <li className="py-2 text-sm">
                  <a href="#" className="flex items-center gap-3">
                    <BiLogoYoutube className="size-6" />
                    <span>Youtube</span>
                  </a>
                </li>
              </ul> */}
            {/* </div> */}
          </div>
        </div>
        <div className="h-px w-full bg-black" />
        <div className="flex flex-col-reverse items-start justify-between pb-4 pt-6 text-sm md:flex-row md:items-center md:pb-0 md:pt-8">
          <p className="mt-6 md:mt-0">© {new Date().getFullYear()} AS Tech. Всички права запазени.</p>
          <ul className="grid grid-flow-row grid-cols-[max-content] justify-center gap-y-4 text-sm md:grid-flow-col md:gap-x-6 md:gap-y-0">
            <li className="underline">
              <Link href="/privacy-policy">Политика за поверителност</Link>
            </li>
            <li className="underline">
              <ScrollLink href="/privacy-policy" sectionTag={"data-usage"}>Условия за ползване</ScrollLink>
            </li>
            <li >
              <button href="/privacy-policy" onClick={() => setModalOpen(true)}><span className="underline">Настройки на бисквитки</span></button>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
