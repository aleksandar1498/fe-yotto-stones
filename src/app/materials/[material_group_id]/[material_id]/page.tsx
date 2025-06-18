"use client";

import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import MaterialDetailPremium from "@/components/pages/materials/MaterialDetailPremium";
import PageHeader from "@/components/common/PageHeader";
import { useMaterialsLoader } from "@/hooks/useMaterialsLoader";

const MaterialDetailPage = () => {

  useMaterialsLoader();
  const { material_group_id, material_id } = useParams();
  const allGroups = useSelector((state: any) => state.materials?.materials);
  const [material, setMaterial] = useState<any>(null);
  const [currentCategory, setCurrentCategory] = useState<any>(null);

  useEffect(() => {
    if (!material_group_id || !material_id || !allGroups) return;

    console.log("Fetching material with material_group_id:", material_group_id, "and material_id:", material_id);
    console.log("All groups:", allGroups);
    const group = allGroups.find((g: any) => g.id.toString() === material_group_id);
    console.log("Found group:", group);
    if (!group) return;

    setCurrentCategory(group);

    const match = group.materials.find(
      (m: any) => m.id.toString() === material_id
    );

    if (match) {
      setMaterial({ ...match, group_id: material_group_id });
      console.log("Material found:", match);
    }
  }, [material_group_id, material_id, allGroups]);

  if (!material) {
    return <div className="text-white p-6">Материалът не беше намерен...</div>;
  }

  return <>
   <PageHeader
          title={currentCategory && currentCategory['name']}
          subtitle={currentCategory && currentCategory['title']}
          backgroundImage= {`/assets/images/materials/${material_group_id}/${material.imageName}`}
        />
  <MaterialDetailPremium material={material} groupId={material_group_id} />;
  </>;
};

export default MaterialDetailPage;
