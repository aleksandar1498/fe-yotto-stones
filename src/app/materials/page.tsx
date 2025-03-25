"use client";

import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { useEffect, useState } from "react";

export default function MaterialsClient() {
    const [materials, setMaterials] = useState<any[]>([]);

    useEffect(() => {
        console.log("Inside");
      const materialsRef = ref(db, "group_materials"); // Path in DB
      console.log(materialsRef);
   
      console.log(materialsRef.toJSON());
      // Listen for real-time updates
     const unsubscribe =  onValue(materialsRef, (snapshot) => {
        console.log("HERE");
        const data = snapshot.val();
        console.log(data);
        if (data) {
          const materialsArray:any[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setMaterials(materialsArray);
        }
      },
      (error) => {
          console.error("Error fetching data:", error);
      });
  
      return () => unsubscribe(); // Cleanup on unmount
    }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Materials</h1>
      <ul>
        {materials && (materials.map((group) => (
          <li key={group['id']}>
            <h2 className="text-xl">{group['name']}</h2>
            <p>{group['description']}</p>
          </li>
        )))}
      </ul>
    </div>
  );
}