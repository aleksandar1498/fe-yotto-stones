"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";

import PageHeader from "@/components/common/PageHeader";
import { useMaterialsLoader } from "@/hooks/useMaterialsLoader";
import { materialImageSrc, materialDisplayName, fallbackToLocal } from "@/lib/materialImage";

const ITEMS_PER_LOAD = 6;

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
    } else {
      setMaterials([]);
      setVisibleMaterials([]);
      setLoading(false);
    }
  }, [material_group_id, materialGroups]);

  // Pick the header image once per group instead of on every render.
  const headerImage = useMemo(() => {
    const all = [...trendingMaterials, ...materials];
    if (!all.length) return "";
    return materialImageSrc(all[Math.floor(Math.random() * all.length)], material_group_id);
  }, [trendingMaterials, materials, material_group_id]);

  const loadMoreMaterials = () => {
    const newVisible = materials.slice(0, loadedItems + ITEMS_PER_LOAD);
    setVisibleMaterials(newVisible);
    setLoadedItems(newVisible.length);
  };

  const renderMaterials = (items: any[]) =>
    items.map((material: any) => (
      <Link key={material.id} href={`/materials/${material_group_id}/${material.id}`} className="block">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="bg-white shadow-lg rounded-lg overflow-hidden cursor-pointer transition-all duration-300 flip-card-container"
      >
        <img
          src={materialImageSrc(material, material_group_id)}
          onError={fallbackToLocal(material, material_group_id)}
          alt={materialDisplayName(material)}
          loading="lazy"
          decoding="async"
          className="w-full h-48 object-cover flip-card"
        />
        <div className="p-4">
          <h4 className="text-lg font-semibold">
            {materialDisplayName(material)}
          </h4>
        </div>
      </motion.div>
      </Link>
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
        backgroundImage={headerImage}
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
      </div>
    </>
  );
};

export default MaterialList;
