import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, useTexture } from "@react-three/drei";
import { useState } from "react";

export default function CountertopViewer({ modelPath, textureUrl }) {
    const { scene } = useGLTF(modelPath);
    const texture = useTexture(textureUrl);

    scene.traverse((child) => {
        if (child.isMesh) {
            child.material.map = texture;
            child.material.needsUpdate = true;
        }
    });

    return (
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[2, 2, 2]} intensity={1} />
            <primitive object={scene} />
            <OrbitControls />
        </Canvas>
    );
}