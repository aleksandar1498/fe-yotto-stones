'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const ScrollLink = ({ href, sectionTag, children, className = "" , onClick}) => {

    const router = useRouter();
    const pathname = usePathname();

    const handleClick = (e) => {
        e.preventDefault();
        onClick && onClick();

        // SAME PAGE case
        if (href === pathname) {
            const element = document.getElementById(sectionTag);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } 
        // DIFFERENT PAGE case
        else {
            if (sectionTag) {
                sessionStorage.setItem('scrollTarget', sectionTag);
            }
            router.push(href);
        }
    };

    return (
        <Link href={href} onClick={handleClick} className={className}>
            {children}
        </Link>
    );
};

export default ScrollLink;
