import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setMaterials } from "@/redux/materialSlice";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

// Live subscription to RTDB: the persisted Redux state renders instantly,
// and any change made from the admin panel flows in without a reload.
export function useMaterialsLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "group_materials"), (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      dispatch(setMaterials(Object.values(data).filter(Boolean)));
    });
    return () => unsubscribe();
  }, [dispatch]);
}
