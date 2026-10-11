// Materials may carry a Firebase Storage `imageUrl` (new schema) or only an
// `imageName` that maps to a bundled asset under /public (old schema).

export function localMaterialImage(material, groupId) {
  if (!material?.imageName) return "";
  return `/assets/images/materials/${groupId}/${material.imageName}`;
}

export function materialImageSrc(material, groupId) {
  return material?.imageUrl || localMaterialImage(material, groupId);
}

// onError handler for <img>: swap a broken remote image for the local asset once.
export function fallbackToLocal(material, groupId) {
  return (event) => {
    const img = event.currentTarget;
    const local = localMaterialImage(material, groupId);
    if (local && img.dataset.fallback !== "1") {
      img.dataset.fallback = "1";
      img.src = local;
    }
  };
}

export function materialDisplayName(material) {
  if (material?.displayName) return material.displayName;
  return (material?.name || "").replace(/-/g, " ").toUpperCase();
}
