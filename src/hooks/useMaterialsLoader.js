import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMaterials } from "@/redux/materialSlice";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

const STORAGE_KEY = 'storedMaterials';

export function loadMaterialsFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('Local storage corrupted', e);
    return null;
  }
}

export function saveMaterialsToLocalStorage(materials) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
  } catch (e) {
    console.warn('Failed to save materials to localStorage', e);
  }
}

export function useMaterialsLoader() {
  const dispatch = useDispatch();
  const materials = useSelector((state) => state.materials.materials);

  useEffect(() => {
    if (materials.length > 0) return;

    const cached = loadMaterialsFromLocalStorage();
    if (cached?.length) {
      dispatch(setMaterials(cached));
      return;
    }

    // Set up Firebase subscription
    const materialsRef = ref(db, "group_materials");

    const unsubscribe = onValue(materialsRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase materials data:", data);
      if (!data) return;

      const materialsArray = Object.values(data);
      saveMaterialsToLocalStorage(materialsArray);
      dispatch(setMaterials(materialsArray));
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe(); // important!
    };
  }, [materials.length, dispatch]);
}
