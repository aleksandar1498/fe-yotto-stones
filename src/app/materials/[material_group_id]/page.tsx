"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSelector } from "react-redux";
import dynamic from "next/dynamic";

import PageHeader from "@/components/common/PageHeader";
import { useMaterialsLoader } from "@/hooks/useMaterialsLoader";

const ITEMS_PER_LOAD = 6;

const BabylonScene = dynamic(() => import("@/components/animated/BabylonScene"), {
  ssr: false,
});

const MaterialList = () => {
  useMaterialsLoader();
  const { material_group_id } = useParams();
  const materialGroups = useSelector((state: any) => state.materials?.materials);

  const [materials, setMaterials] = useState<any[]>([]);
  const [trendingMaterials, setTrendingMaterials] = useState<any[]>([]);
  const [visibleMaterials, setVisibleMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedItems, setLoadedItems] = useState(ITEMS_PER_LOAD);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"all" | "trending">("all"); // NEW

  useEffect(() => {
    if (!material_group_id || !materialGroups || materialGroups.length === 0) return;

    const categoryId = Number(material_group_id);
    const currentCategory = materialGroups.find((group: any) => group.id === categoryId);

    if (currentCategory) {
      const trending = currentCategory.materials?.filter((m: any) => m.trending === true) || [];
      const others = currentCategory.materials?.filter((m: any) => m.trending !== true) || [];

      setTrendingMaterials(trending);
      setMaterials(others);
      setVisibleMaterials(others.slice(0, ITEMS_PER_LOAD));
      setLoadedItems(ITEMS_PER_LOAD);
      setLoading(false);
      setCurrentCategory(currentCategory);

      localStorage.setItem("storedMaterials", JSON.stringify(currentCategory.materials));
      localStorage.setItem("lastmaterial_group_id", material_group_id.toString());
    } else {
      setMaterials([]);
      setVisibleMaterials([]);
      setLoading(false);
    }
  }, [material_group_id, materialGroups]);

  useEffect(() => {
    const stored = localStorage.getItem("storedMaterials");
    const lastId = localStorage.getItem("lastmaterial_group_id");

    if (stored && lastId === material_group_id) {
      const parsed = JSON.parse(stored);
      const trending = parsed.filter((m: any) => m.trending === true);
      const others = parsed.filter((m: any) => m.trending !== true);
      setTrendingMaterials(trending);
      setMaterials(others);
      setVisibleMaterials(others.slice(0, ITEMS_PER_LOAD));
      setLoadedItems(ITEMS_PER_LOAD);
      setLoading(false);
    }
  }, []);

  const loadMoreMaterials = () => {
    const newVisible = materials.slice(0, loadedItems + ITEMS_PER_LOAD);
    setVisibleMaterials(newVisible);
    setLoadedItems(newVisible.length);
  };

  const openModal = (imageUrl: string) => setSelectedImage(imageUrl);
  const closeModal = () => setSelectedImage(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const renderMaterials = (items: any[]) =>
    items.map((material: any) => (
      <motion.div
        key={material.id}
        onClick={() => openModal(`/assets/images/materials/${material_group_id}/${material.imageName}`)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-white shadow-lg rounded-lg overflow-hidden cursor-pointer transition-all duration-300 flip-card-container"
      >
        <img
          src={`/assets/images/materials/${material_group_id}/${material.imageName}`}
          alt={material.name}
          className="w-full h-48 object-cover flip-card"
        />
        <div className="p-4">
          <h4 className="text-lg font-semibold">
            {material.name.replace(/-/g, " ").toUpperCase()}
          </h4>
        </div>
      </motion.div>
    ));

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
        title={currentCategory && currentCategory["name"]}
        subtitle={currentCategory && currentCategory["title"]}
        backgroundImage={`/assets/images/materials/${material_group_id}/${[...materials, ...trendingMaterials][Math.floor(Math.random() * (materials.length + trendingMaterials.length))]?.imageName}`}
      />

      <div className="container mx-auto p-6">
        {/* Menu bar for switching views */}
        {trendingMaterials.length > 0 && (
          <div className="flex justify-center mb-6 gap-4">
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-md font-medium border ${
                viewMode === "all" ? "bg-darkGold text-white" : "bg-white text-darkGold border-darkGold"
              }`}
            >
              Всички материали
            </button>
            <button
              onClick={() => setViewMode("trending")}
              className={`px-4 py-2 rounded-md font-medium border ${
                viewMode === "trending" ? "bg-darkGold text-white" : "bg-white text-darkGold border-darkGold"
              }`}
            >
              Премиум материали
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"
        >
          {viewMode === "trending" && renderMaterials(trendingMaterials)}
          {viewMode === "all" && (
            <>
              {renderMaterials(trendingMaterials)}
              {renderMaterials(visibleMaterials)}
            </>
          )}
        </motion.div>

        {viewMode === "all" && loadedItems < materials.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMoreMaterials}
              className="px-6 py-3 bg-darkGold hover:bg-darkGoldHover text-white font-semibold rounded-lg transition"
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
              <button
                className="absolute top-2 right-2 text-white rounded-full py-4 px-5"
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
                onClick={(e) => e.stopPropagation()}
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
