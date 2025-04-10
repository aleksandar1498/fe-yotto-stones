import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchEntityName } from "../../lib/breadcumbHelper";
import Link from "next/link";
import dynamic from "next/dynamic";

// Define a PageHeader Component
const PageHeader = ({
  title,
  subtitle,
  backgroundImage = "/assets/images/wallpaper.jfif",
}) => {
  const pathname = usePathname();
  const [pathSegments, setPathSegments] = useState([]);
  const [resolvedSegments, setResolvedSegments] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (pathname !== "/") {
      const segments = pathname
        .split("/")
        .filter((segment) => segment.length > 0);
      setPathSegments(segments);

      if (segments.length > 1) {
        const entityType = segments[0]; // First segment (e.g., "material", "services")
        const entityId = segments[1]; // Second segment (e.g., "2")

        if (!isNaN(Number(entityId))) {
          fetchEntityName(entityType, entityId).then((path) => {
            const updatedSegments = path.split("/");
            setResolvedSegments(updatedSegments);
          });
        } else {
          setResolvedSegments(segments); // No ID, just use the normal segment
        }
      } else {
        fetchEntityName(segments[0]).then((path) => {
          const updatedSegments = path.split("/").slice(0, 1);
          setResolvedSegments(updatedSegments);
        });
      }
    }
  }, [pathname]);

  if (!isMounted || pathname === "/") return null;

  return (
    <header
      className="relative w-full h-[300px] flex items-center justify-center text-white mt-20"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 text-center px-5">
        <h1 className="text-4xl font-bold uppercase">{title}</h1>
        {subtitle && <p className="text-lg mt-2 text-gray-300">{subtitle}</p>}

        {/* Breadcrumbs */}
        <nav className="mt-4">
          <ul className="flex items-center justify-center space-x-2 text-sm text-gray-300">
            <li>
              <Link href="/" className="hover:text-white transition">
                Начало
              </Link>
            </li>
            {resolvedSegments.map((segment, index) => {
              const isLast = index === resolvedSegments.length - 1;
              const href = "/" + pathSegments.slice(0, index + 1).join("/");
              const formattedSegment = segment.replace(/-/g, " ").toUpperCase();

              return (
                <li key={index} className="flex items-center">
                  <span className="mx-2">/</span>
                  {isLast ? (
                    <span className="text-gray-400 cursor-default">{formattedSegment}</span>
                  ) : (
                    <Link href={href} className="hover:text-white transition text-royalGold-300">
                      {formattedSegment}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
};

// Prevents Next.js from trying to SSR this component
export default dynamic(() => Promise.resolve(PageHeader), { ssr: false });
