"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";

import PageHeader from "@/components/common/PageHeader";
import dynamic from "next/dynamic";

const ITEMS_PER_LOAD = 6; // Number of items to load each time

const BabylonScene = dynamic(() => import('@/components/animated/BabylonScene'), {
  ssr: false, // Required to prevent issues with WebGL
});

const MaterialList = () => {
  const { slug } = useParams();
  const materialGroups = useSelector(
    (state: any) => state.materials?.materials
  );

  const [materials, setMaterials] = useState<any[]>([]);
  const [visibleMaterials, setVisibleMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedItems, setLoadedItems] = useState(ITEMS_PER_LOAD);
  const [currentCategory, setCurrentCategory] = useState(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load materials from storage or API
  useEffect(() => {
    if (!slug || !materialGroups || materialGroups.length === 0) return;

    const categoryId = Number(slug);
    const currentCategory = materialGroups.find(
      (group: any) => group.id === categoryId
    );

    if (currentCategory) {
      setMaterials(currentCategory.materials);
      setVisibleMaterials(currentCategory.materials.slice(0, ITEMS_PER_LOAD));
      setLoadedItems(ITEMS_PER_LOAD);
      setLoading(false);
      setCurrentCategory(currentCategory);
      // Save to localStorage to persist data
      localStorage.setItem(
        "storedMaterials",
        JSON.stringify(currentCategory.materials)
      );
      localStorage.setItem("lastSlug", slug.toString());
    } else {
      setMaterials([]);
      setVisibleMaterials([]);
      setLoading(false);
    }
  }, [slug, materialGroups]);

  // Restore materials from localStorage if available
  useEffect(() => {
    const storedMaterials = localStorage.getItem("storedMaterials");
    const lastSlug = localStorage.getItem("lastSlug");

    if (storedMaterials && lastSlug === slug) {
      const parsedMaterials = JSON.parse(storedMaterials);
      setMaterials(parsedMaterials);
      setVisibleMaterials(parsedMaterials.slice(0, ITEMS_PER_LOAD));
      setLoadedItems(ITEMS_PER_LOAD);
      setLoading(false);
    }
  }, []);

  // Load More function
  const loadMoreMaterials = () => {
    const newVisibleMaterials = materials.slice(
      0,
      loadedItems + ITEMS_PER_LOAD
    );
    setVisibleMaterials(newVisibleMaterials);
    setLoadedItems(newVisibleMaterials.length);
  };

  // Handle modal open
  const openModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Handle modal close
  const closeModal = () => {
    setSelectedImage(null);
  };

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <h2 className="text-2xl font-bold">Loading materials...</h2>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={currentCategory && currentCategory['name']}
        subtitle={currentCategory && currentCategory['title']}
        backgroundImage={ `/assets/images/materials/${slug}/${materials[Math.floor(Math.random()*materials.length)]?.imageName}`}
      />
      <div className="container mx-auto p-6">  
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"
        >
          {visibleMaterials && visibleMaterials.map((material: any) => (
            <motion.div
              key={material.id}
              onClick={() =>
                openModal(
                  `/assets/images/materials/${slug}/${material.imageName}`
                )
              }
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white shadow-lg rounded-lg overflow-hidden cursor-pointer transition-all duration-300 flip-card-container"
            >
              <img
                src={`/assets/images/materials/${slug}/${material.imageName}`}
                alt={material.name}
                className="w-full h-48 object-cover flip-card"
              />
              <div className="p-4">
                <h4 className="text-lg font-semibold">
                  {material.name.replace(/-/g, " ").toUpperCase()}
                </h4>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Load More Button */}
        {loadedItems < materials.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMoreMaterials}
              className="px-6 py-3 bg-darkGold hover:bg-darkGoldHover text-white font-semibold rounded-lg  transition"
            >
              Зареди още
            </button>
          </div>
        )}

        <AnimatePresence>
          {selectedImage && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
            >
              {" "}
              <button
                className="absolute top-2 right-2 text-white  rounded-full py-4 px-5"
                onClick={closeModal}
              >
                ✖
              </button>
              <motion.div
                className="relative p-2 max-w-3xl mx-auto bg-white rounded-lg shadow-xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()} // Prevent click from closing modal when clicking inside
              >
                <img
                  src={selectedImage}
                  alt="Full Size"
                  className="w-full h-auto rounded-lg"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default MaterialList;
