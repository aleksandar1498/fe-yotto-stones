'use client';

import * as BABYLON from '@babylonjs/core';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';


function setupLights(scene, camera, sunMode = "auto") {
    // First: clear previous lights if any
    scene.lights.forEach(light => light.dispose());

    // Define base colors
    const darkBg = new BABYLON.Color3(0.04, 0.04, 0.07);
    const brightBg = new BABYLON.Color3(0.933, 0.933, 0.933);

    if (sunMode === "day") {
        // === 1. Top angled daylight (now from behind the bevel)
        const topLight = new BABYLON.HemisphericLight("topLight", new BABYLON.Vector3(-0.5, .75, -1.5), scene);
        topLight.intensity = 2.6;
        topLight.diffuse = new BABYLON.Color3(1.0, 0.94, 0.85); // ☀️ warm light
        topLight.specular = new BABYLON.Color3(1.0, 0.9, 0.8);
        topLight.groundColor = new BABYLON.Color3(0.4, 0.35, 0.3); // subtle warm bounce

        // === 2. Upward bounce (cooler for contrast)
        const bottomLight = new BABYLON.HemisphericLight("bottomLight", new BABYLON.Vector3(0, -1, 0), scene);
        bottomLight.intensity = 0.25;
        bottomLight.diffuse = new BABYLON.Color3(0.8, 0.85, 0.95);
        bottomLight.specular = new BABYLON.Color3(0.5, 0.5, 0.5);
        bottomLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);

        // === 3. Main directional sunlight (warm, angled)
        const directionalLight = new BABYLON.DirectionalLight("dirLightMain", new BABYLON.Vector3(-2, -1.5, -1), scene);
        directionalLight.position = new BABYLON.Vector3(3, 4, 3);
        directionalLight.intensity = 1.6;
        directionalLight.diffuse = new BABYLON.Color3(1.0, 0.85, 0.6);
        directionalLight.specular = new BABYLON.Color3(1.0, 0.9, 0.75);

        // === Opposite directional light to light the bevel area
        const bevelLight = new BABYLON.DirectionalLight("dirLightBevel", new BABYLON.Vector3(0, -.25, -1), scene);
        bevelLight.position = new BABYLON.Vector3(-2, .25, 3); // positioned behind countertop
        bevelLight.intensity = 3.0;
        bevelLight.diffuse = new BABYLON.Color3(1.0, 0.8, 0.6);
        bevelLight.specular = new BABYLON.Color3(1.0, 0.9, 0.75);

        scene.clearColor = brightBg;
    } else if (sunMode === "night") {
        scene.clearColor = new BABYLON.Color3(0.07, 0.08, 0.12); // refined deep blue


        const whiteTopLight = new BABYLON.HemisphericLight("whiteTopLight", new BABYLON.Vector3(-0.5, 0.75, -1.5), scene);
        whiteTopLight.intensity = .15; // slightly reduced from your 2.6 for balance
        whiteTopLight.diffuse = new BABYLON.Color3(0.95, 0.95, 1.0); // soft cool white
        whiteTopLight.specular = new BABYLON.Color3(1.0, 1.0, 1.0); // clean speculars
        whiteTopLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.35); // subtle cool bounce

        // 🌌 Low ambient light with cold tint
        const ambient = new BABYLON.HemisphericLight("nightAmbient", new BABYLON.Vector3(0, 1, 0), scene);
        ambient.intensity = 0.15;
        ambient.diffuse = new BABYLON.Color3(0.2, 0.25, 0.35);
        ambient.groundColor = new BABYLON.Color3(0.1, 0.1, 0.15);

        // 💡 Soft directional fill from top-left
        const dir1 = new BABYLON.DirectionalLight("dirNightA", new BABYLON.Vector3(-1, -1, -1), scene);
        dir1.position = new BABYLON.Vector3(2, 4, 2);
        dir1.intensity = 0.4;
        dir1.diffuse = new BABYLON.Color3(0.6, 0.65, 0.75);
        dir1.specular = new BABYLON.Color3(0.4, 0.4, 0.5);

        // 💡 Soft directional fill from opposite back-right
        const dir2 = new BABYLON.DirectionalLight("dirNightB", new BABYLON.Vector3(1, -1, 1), scene);
        dir2.position = new BABYLON.Vector3(-2, 4, -2);
        dir2.intensity = 0.35;
        dir2.diffuse = new BABYLON.Color3(0.5, 0.55, 0.65);
        dir2.specular = new BABYLON.Color3(0.3, 0.3, 0.4);

        // Optional: third very soft overhead light for structure
        const dir3 = new BABYLON.DirectionalLight("dirNightTop", new BABYLON.Vector3(0, -1, 0), scene);
        dir3.position = new BABYLON.Vector3(0, 3.5, 0);
        dir3.intensity = 0.15;
        dir3.diffuse = new BABYLON.Color3(0.3, 0.3, 0.4);

        const bevelLight = new BABYLON.DirectionalLight("dirLightBevel", new BABYLON.Vector3(0, -.25, -1), scene);
        bevelLight.position = new BABYLON.Vector3(-4, .25, 3); // positioned behind countertop
        bevelLight.intensity = 3.0;
        bevelLight.diffuse = new BABYLON.Color3(1.0, 0.8, 0.6);
        bevelLight.specular = new BABYLON.Color3(1.0, 0.9, 0.75);

    } else {
        // 🌤️ AUTO: Soft lights from multiple angles for always-even view

        const topLight = new BABYLON.HemisphericLight("topLight", new BABYLON.Vector3(0.5, 1, -0.5), scene); // angled downlight
        topLight.intensity = 1.8;
        topLight.diffuse = new BABYLON.Color3(1, 1, 1);
        topLight.specular = new BABYLON.Color3(1, 1, 1);
        topLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5); // softer base bounce

        // === 2. Upward bounce light ===
        const bottomLight = new BABYLON.HemisphericLight("bottomLight", new BABYLON.Vector3(0, -1, 0), scene);
        bottomLight.intensity = 0.3;
        bottomLight.diffuse = new BABYLON.Color3(1, 1, 1);
        bottomLight.specular = new BABYLON.Color3(0.6, 0.6, 0.6);
        bottomLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3); // subtle tone

        // === 3. Side directional light (stronger, for specular shine) ===
        const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1.5, -1), scene);
        directionalLight.position = new BABYLON.Vector3(3, 4, 3);
        directionalLight.intensity = 1.6;
        directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
        directionalLight.specular = new BABYLON.Color3(1, 1, 1);

        scene.clearColor = brightBg;
    }

    // Allow runtime control later if needed
    scene.metadata = {
        sunMode,
    };
}

function createMaterial(scene, finishType) {
    const material = new BABYLON.StandardMaterial("mat", scene);
    const texture = new BABYLON.Texture("/assets/textures/main-texture.jpg", scene);
    material.diffuseTexture = texture;
    material.backFaceCulling = false;

    switch (finishType) {
        case "glowing":
            material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            material.emissiveTexture = texture;
            break;
        case "matte":
            material.specularColor = new BABYLON.Color3(0, 0, 0);
            material.emissiveColor = BABYLON.Color3.Black();
            break;
        case "bush":
            material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            material.bumpTexture = new BABYLON.Texture("/assets/textures/bush-hammered-2.jpg", scene);
            break;
        case "skin":
            material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            material.bumpTexture = new BABYLON.Texture("/assets/textures/bush-hammered.avif", scene);
            break;
        default:
            break;
    }

    return material;
}


const createScene = async (canvas, bevelType, dripTrayType, sunmode, finishType) => {
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.forceNormalsForward = true;


    scene.clearColor = new BABYLON.Color3(0.933, 0.933, 0.933); // exact match for #eeeeee

    const camera = new BABYLON.ArcRotateCamera("camera", Math.PI - 0.4, Math.PI / 2.3, 2.8, new BABYLON.Vector3(0, 0.02, 0), scene);

    // const camera = new BABYLON.ArcRotateCamera("camera", Math.PI, Math.PI / 2.2, 2.5, new BABYLON.Vector3(0, 0.025, 0));
    camera.attachControl(canvas, true);

    camera.minZ = 0.1; // allows close-up rendering
    // Zoom limits
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 4.5;


    // Smooth scroll
    camera.wheelPrecision = 70;

    setupLights(scene, camera, sunmode);

    const material = createMaterial(scene, finishType); // Default to glowing finish
    // UNCOMMENT FROM HERE 
    // const material = new BABYLON.StandardMaterial("mat", scene);
    // const texture = new BABYLON.Texture("/assets/textures/main-texture.jpg", scene);
    // // ✨ Emissive glow: boost brightness
    // material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5); // medium glow
    // // For strong glow use: new Color3(0.9, 0.9, 0.9)



    // // 💡 Optional: use same texture for glow mapping (uniform glow)
    // material.emissiveTexture = material.diffuseTexture;

    // // Optional: add soft specular if you want shiny spots
    // material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    // material.specularPower = 64;

    // // Smooth rendering
    // material.backFaceCulling = false;



    // material.diffuseTexture = texture;
    // material.diffuseTexture.hasAlpha = false;

    const faceUV = [];

    const baseFaseUv = new BABYLON.Vector4(0, 0, 1, 1);
    faceUV[4] = baseFaseUv;
    faceUV[5] = baseFaseUv; // To

    // // Reuse same Y-scale as top, but narrow X to extend texture directionally
    const sideUV = new BABYLON.Vector4(0, 0, 1, 0.1); // flatten height scaling

    // // Apply same to all other faces
    faceUV[0] = sideUV;
    faceUV[1] = sideUV;
    faceUV[2] = sideUV;
    faceUV[3] = sideUV;

    //TO HERE

    const base = BABYLON.MeshBuilder.CreateBox("countertop", {
        width: 2.5,
        height: 0.05,
        depth: 1,
        faceUV: faceUV,
        wrap: true,
    }, scene);

    base.position.y = 0.025;
    base.scaling.z = 0.9;
    base.position.z = -0.05;



    let finalMesh = base;

    // Bevel handling
    if (bevelType) {
        await BABYLON.InitializeCSG2Async();

        const csgBase = BABYLON.CSG2.FromMesh(base);

        let bevel;
        switch (bevelType) {
            case '45deg':
            case '45deg-h4':
            case '45deg-min':
            case '45deg-min-h4':
                bevel = BABYLON.MeshBuilder.CreateBox("bevel", { width: 2.5, height: 0.05, depth: 0.1 }, scene);
                bevel.rotation.x = Math.PI / 4;
                bevel.position.y = bevelType.includes("min") ? 0.052 : 0.04;
                bevel.position.z = 0.425;


                const csgBevel45Deg = BABYLON.CSG2.FromMesh(bevel);

                let subBevelCsg;

                if (bevelType.endsWith('-h4')) {
                    const subBevelFinishing = BABYLON.MeshBuilder.CreateBox("bevel", {
                        width: 2.5,                  // Same width as the countertop
                        height: bevelType.endsWith('-h4') ? 0.075 : 0.025,             // Thin bevel height
                        depth: bevelType.endsWith('-h4') ? 0.045 : 0.025,
                        // Small depth for the bevel
                    }, scene);
                    subBevelFinishing.position.y = -0.0325;      // Vertically centered
                    subBevelFinishing.position.z = 0.3775;     // Position it at the front of the countertop

                    subBevelCsg = BABYLON.CSG2.FromMesh(subBevelFinishing);

                    finalMesh = csgBase.add(subBevelCsg).subtract(csgBevel45Deg).toMesh("beveled", scene, {
                        materialToUse: material,
                    });
                    base.dispose(); bevel.dispose(); subBevelFinishing.dispose();
                } else {
                    finalMesh = csgBase.subtract(csgBevel45Deg).toMesh("beveled", scene, {
                        materialToUse: material,
                    });
                    base.dispose(); bevel.dispose();
                }
                break;

            case 'full-rounded':

                bevel = BABYLON.MeshBuilder.CreateCylinder("rounded", {
                    diameterTop: 0.05,
                    diameterBottom: 0.05,
                    height: 2.5,
                    // arc: 0.5, // half cylinder
                    tessellation: 64
                }, scene);

                bevel.rotation.z = Math.PI / 2;
                bevel.rotation.x = Math.PI / 1; // rotate to align with the top edge
                bevel.position.y = 0.025;
                bevel.position.z = 0.40;


                const fullRoundedBevelCsg = BABYLON.CSG2.FromMesh(bevel);

                finalMesh = csgBase.add(fullRoundedBevelCsg).toMesh("finalCountertop", scene, {
                    materialToUse: material,
                });


                base.dispose(); bevel.dispose();

                // finalMesh = BABYLON.Mesh.MergeMeshes([base, bevel], true, true, undefined, false, false);
                break;

            case 'semi-rounded':
            case 'semi-rounded-h4':
                // Step 2: Create the cone for the tapered front edge
                bevel = BABYLON.MeshBuilder.CreateCylinder("coneFront", {
                    diameterTop: 0.05,
                    diameterBottom: 0.05,  // adjust to control the taper
                    height: 2.5,
                    // arc: .25,           // match the countertop width
                    tessellation: 64,
                }, scene);

                bevel.rotation.x = Math.PI / 2;
                // Step 3: Rotate and position it to align with the front edge
                bevel.rotation.z = Math.PI / 2;    // stand it up horizontally
                bevel.position.y = 0.025;          // vertically centered
                bevel.position.z = 0.40;           // at the front

                // Step 4: Create the bevel finishing (a small box)
                const subBevelFinishing = BABYLON.MeshBuilder.CreateBox("bevel", {
                    width: 2.5,                  // Same width as the countertop
                    height: bevelType.endsWith('-h4') ? 0.075 : 0.025,             // Thin bevel height
                    depth: bevelType.endsWith('-h4') ? 0.045 : 0.025,
                    // Small depth for the bevel
                }, scene);

                if (bevelType.endsWith('-h4')) {
                    subBevelFinishing.position.y = -0.0125;      // Vertically centered
                    // subBevelFinishing.position.z = frontZ - 0.025;     // Position it at the front of the countertop
                    subBevelFinishing.position.z = 0.4025;
                } else {
                    subBevelFinishing.position.y = 0.0125;      // Vertically centered
                    // subBevelFinishing.position.z = frontZ - 0.025;     // Position it at the front of the countertop
                    subBevelFinishing.position.z = 0.4125;     // Position it at the front of the countertop

                }


                const semiRoundedBevelCsg = BABYLON.CSG2.FromMesh(bevel);

                const subBevelFinishingCsg = BABYLON.CSG2.FromMesh(subBevelFinishing);

                finalMesh = csgBase.add(semiRoundedBevelCsg).add(subBevelFinishingCsg).toMesh("finalCountertop", scene, {});

                base.dispose(); bevel.dispose(); subBevelFinishing.dispose();
        }
    }




    // Drip Tray (CSG subtraction on top)
    if (dripTrayType === 'one') {
        const tray = BABYLON.MeshBuilder.CreateBox("dripTray", {
            width: 2.5,
            height: 0.03,      // very shallow groove
            depth: 0.02
        }, scene);

        // Properly align tray inside the countertop surface
        if (typeof bevelType === 'undefined' || bevelType === '') {
            tray.position.y = -0.0;         // almost top surface (countertop is 0.05 tall, centered at y=0.025)
            tray.position.z = 0.35;
        } else {
            tray.position.y = -0.025;         // almost top surface (countertop is 0.05 tall, centered at y=0.025)
            tray.position.z = 0.40;
        }


        // Perform CSG subtraction
        const csgMain = BABYLON.CSG2.FromMesh(finalMesh);
        const csgCut = BABYLON.CSG2.FromMesh(tray);

        const resultMesh = csgMain.subtract(csgCut).toMesh("finalWithDrip", scene, {});
        resultMesh.convertToFlatShadedMesh();
        resultMesh.position = finalMesh.position.clone();
        resultMesh.material = finalMesh.material;

        // Cleanup
        finalMesh.dispose();
        tray.dispose();
        finalMesh = resultMesh;
    } else if (dripTrayType === 'two') {
        const trayOne = BABYLON.MeshBuilder.CreateBox("dripTray", {
            width: 2.5,
            height: 0.03,      // very shallow groove
            depth: 0.02
        }, scene);

        // Properly align tray inside the countertop surface


        const trayTwo = BABYLON.MeshBuilder.CreateBox("dripTrayTwo", {
            width: 2.5,
            height: 0.03,      // very shallow groove
            depth: 0.02
        }, scene);

        if (typeof bevelType === 'undefined' || bevelType === '') {
            trayOne.position.y = -0.0;         // almost top surface (countertop is 0.05 tall, centered at y=0.025)
            trayOne.position.z = 0.35;
            trayTwo.position.y = -0.0;         // almost top surface (countertop is 0.05 tall, centered at y=0.025)
            trayTwo.position.z = -0.45;
        } else {
            trayOne.position.y = -0.025;         // almost top surface (countertop is 0.05 tall, centered at y=0.025)
            trayOne.position.z = 0.40;
            trayTwo.position.y = -0.025;         // almost top surface (countertop is 0.05 tall, centered at y=0.025)
            trayTwo.position.z = -0.40;
        }

        // Perform CSG subtraction
        const csgMain = BABYLON.CSG.FromMesh(finalMesh);
        const csgTrayOne = BABYLON.CSG.FromMesh(trayOne);
        const csgTrayTwo = BABYLON.CSG.FromMesh(trayTwo);

        const firstCut = csgMain.subtract(csgTrayOne);
        const finalCSG = firstCut.subtract(csgTrayTwo);

        const resultMesh = finalCSG.toMesh("finalWithDrip", finalMesh.material, scene)
        // resultMesh.convertToFlatShadedMesh();
        resultMesh.position = finalMesh.position.clone();
        resultMesh.material = finalMesh.material;

        // Cleanup
        finalMesh.dispose();
        trayOne.dispose();
        trayTwo.dispose();
        finalMesh = resultMesh;
    }
    // BABYLON.VertexData.ComputeNormals(finalMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind), finalMesh.getIndices(), finalMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind));

    // Create new UVs to simulate planar projection from the top
    const positions = finalMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const normals = finalMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    const uvs = [];

    const bbox = finalMesh.getBoundingInfo().boundingBox;
    const minX = bbox.minimumWorld.x;
    const maxX = bbox.maximumWorld.x;
    const minY = bbox.minimumWorld.y;
    const maxY = bbox.maximumWorld.y;
    const minZ = bbox.minimumWorld.z;
    const maxZ = bbox.maximumWorld.z;

    const width = maxX - minX;
    const height = maxY - minY;
    const depth = maxZ - minZ;

    const sliceVStart = 0.0;
    const sliceVEnd = 0.1;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const z = positions[i + 2];

        const nx = normals[i];
        const ny = normals[i + 1];
        const nz = normals[i + 2];

        let u = 0, v = 0;

        if (Math.abs(ny) >= Math.abs(nx) && Math.abs(ny) >= Math.abs(nz)) {
            // ✅ Top face (project from XZ) - stretch over full texture
            u = (x - minX) / width;
            v = (z - minZ) / depth;
        } else if (Math.abs(nx) >= Math.abs(ny) && Math.abs(nx) >= Math.abs(nz)) {
            // ✅ Side face (project from YZ) - use vertical slice of texture
            u = (z - minZ) / depth;
            const relY = (y - minY) / height;
            v = sliceVStart + relY * (sliceVEnd - sliceVStart);
        } else {
            // ✅ Front/back face (project from XY) - also use vertical slice
            u = (x - minX) / width;
            const relY = (y - minY) / height;
            v = sliceVStart + relY * (sliceVEnd - sliceVStart);
        }

        uvs.push(u, v);
    }

    finalMesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvs, true);
    finalMesh.material = material;

    engine.runRenderLoop(() => {
        scene.render();
    });

    return { engine, scene };
};



export default function BabylonScene() {
    const canvasRef = useRef(null);
    const dropdownRef = useRef(null);
    const engineRef = useRef(null);
    const menuRef = useRef(null);

    const [bevel, setBevel] = useState('');
    const [finishType, setFinishType] = useState('');
    const [dripTray, setDripTray] = useState('');
    const [dripTrayDisabled, setDripTrayDisabled] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null); // 'chamfer' | 'driptray' | 'finishing'
    const [sunMode, setSunMode] = useState("day");

    const handleBevelChange = (e) => {
        const selectedBevel = e.target.value;
        if (selectedBevel.endsWith('-h4')) {
            setDripTray('');
            setDripTrayDisabled(true);
        } else {
            setDripTrayDisabled(false);
        }
        setBevel(selectedBevel);
    };

    const toggleMenu = (menu) => {
        setActiveMenu(activeMenu === menu ? null : menu);
    };

    const clearOption = (e, menu) => {
        e.stopPropagation(); // Prevent the click from propagating to the button

        if (activeMenu === menu) {
            setActiveMenu(null);
        }

        if (menu === 'chamfer') {
            setBevel('');
            if (dripTrayDisabled) {
                setDripTrayDisabled(false);
            }
        }
        if (menu === 'driptray') setDripTray('');

        if (menu === 'finishing') setFinishType('');
        // handle other categories here
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            const isInsideDropdown = dropdownRef.current?.contains(event.target);
            const isInsideMenu = menuRef.current?.contains(event.target);

            if (!isInsideDropdown && !isInsideMenu) {
                console.log('Clicked outside — closing menu');
                setActiveMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e) => e.preventDefault();
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        let engineInstance;
        const init = async () => {
            const { engine } = await createScene(canvas, bevel, dripTray, sunMode, finishType);
            engineRef.current = engine;
            engineInstance = engine;
        };
        init();

        return () => {
            if (engineInstance) engineInstance.dispose();
        };
    }, [bevel, dripTray, sunMode, finishType]);

    const dropdownVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 10 }
    };

    return (
        <div className="w-full h-screen relative">
            {/* Dropdown Menu (Above icons) */}
            <AnimatePresence>
                {activeMenu && (
                    <motion.div
                        ref={dropdownRef}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={dropdownVariants}
                        transition={{ duration: 0.25 }}
                        className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-md px-4 py-3 z-20"
                    >

                        {activeMenu === 'chamfer' && (
                            <div>
                                <p
                                    onClick={() => toggleMenu('chamfer')}
                                    className="absolute top-1 right-1 bg-gray-200 p-0.5 rounded-full cursor-pointer"
                                >
                                    <X size={14} />
                                </p>
                                <label className="block text-sm font-semibold mb-1">Фаска</label>
                                <select
                                    value={bevel}
                                    onChange={handleBevelChange}
                                    className="border rounded p-1 text-sm"
                                >
                                    <option value="">Без</option>
                                    <option value="45deg">Фаска 45°</option>
                                    <option value="45deg-h4">Фаска 45° - Подлепка</option>
                                    <option value="45deg-min">Минимална Фаска 45°</option>
                                    <option value="45deg-min-h4">Минимална Фаска 45° - Подлепка</option>
                                    <option value="full-rounded">Двустранно заобляне</option>
                                    <option value="semi-rounded">Заобляне</option>
                                    <option value="semi-rounded-h4">Заобляне - Подлепка</option>
                                </select>
                            </div>
                        )}

                        {activeMenu === 'driptray' && (
                            <div>
                                <p
                                    onClick={() => toggleMenu('driptray')}
                                    className="absolute top-1 right-1 bg-gray-200 p-0.5 rounded-full cursor-pointer"
                                >
                                    <X size={14} />
                                </p>
                                <label className="block text-sm font-semibold mb-1">Капкобран</label>
                                <select
                                    value={dripTray}
                                    disabled={dripTrayDisabled}
                                    onChange={(e) => setDripTray(e.target.value)}
                                    className="border rounded p-1 text-sm"
                                >
                                    <option value="">Без</option>
                                    <option value="one">Едностранен</option>
                                    <option value="two">Двустранен</option>
                                </select>
                            </div>
                        )}

                        {activeMenu === 'finishing' && (
                            <div>
                                <p
                                    onClick={() => toggleMenu('finishing')}
                                    className="absolute top-1 right-1 bg-gray-200 p-0.5 rounded-full cursor-pointer"
                                >
                                    <X size={14} />
                                </p>
                                <label className="block text-sm font-semibold mb-1">Завършек</label>
                                <select
                                    value={finishType}
                                    onChange={(e) => setFinishType(e.target.value)}
                                    className="border rounded p-1 text-sm min-w-[150px]"
                                >
                                    <option value="glowing">Гланц</option>
                                    <option value="matte">Матиран</option>
                                    <option value="bush">Бучардисан</option>
                                    <option value="skin">Кожа</option>
                                </select>
                            </div>
                        )}

                        {activeMenu === 'sunlight' && (
                            <div >
                                <p
                                    onClick={() => toggleMenu('sunlight')}
                                    className="absolute top-1 right-0 bg-gray-200 p-0.5 rounded-full cursor-pointer"
                                >
                                    <X size={14} />
                                </p>
                                <label className="block text-sm font-semibold mb-1">Светлина</label>
                                <select
                                    value={sunMode}
                                    onChange={(e) => setSunMode(e.target.value)}
                                    className="border rounded p-1 text-sm min-w-[150px]"
                                >
                                    {/* <option value="auto">Автоматично</option> */}
                                    <option value="day">Ден</option>
                                    <option value="night">Нощ</option>
                                </select>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Icon Menu */}
            <div ref={menuRef} className="fixed bottom-[clamp(1rem,5vh,2rem)] left-1/2 transform -translate-x-1/2 bg-white rounded-xl px-6 py-3 shadow-md flex gap-6 z-[2001] items-center">
                {/* Finishing */}
                <div className="relative flex flex-col items-center hover:bg-slate-400 hover:bg-opacity-30 rounded-lg p-2 transition duration-200">
                    <button onClick={() => toggleMenu('finishing')} className="flex flex-col items-center relative">
                        <Image src="/assets/icons/finishing.svg" alt="Завършек" width={24} height={24} />
                        <span className="text-xs">Завършек</span>
                        {finishType && (
                            <p
                                onClick={(e) => clearOption(e, 'finishing')}
                                className="absolute top-0 right-0 bg-gray-200 p-0.5 rounded-full hover:bg-red-500 hover:bg-opacity-80 transition duration-200"
                            >
                                <X size={10} />
                            </p>
                        )}
                    </button>
                </div>

                {/* Drip tray */}
                <div
                    className={`relative flex flex-col items-center rounded-lg p-2 transition duration-200
        ${dripTrayDisabled ? 'opacity-30 pointer-events-none' : 'hover:bg-slate-400 hover:bg-opacity-30'}
    `}
                >
                    <button
                        onClick={() => toggleMenu('driptray')}
                        disabled={dripTrayDisabled}
                        className="flex flex-col items-center relative"
                    >
                        <Image src="/assets/icons/drip-tray.svg" alt="Капкобран" width={24} height={24} />
                        <span className="text-xs">Капкобран</span>

                        {dripTray && !dripTrayDisabled && (
                            <p
                                onClick={(e) => clearOption(e, 'driptray')}
                                className="absolute top-0 right-0 bg-gray-200 p-0.5 rounded-full hover:bg-red-500 hover:bg-opacity-80 transition duration-200"
                            >
                                <X size={10} />
                            </p>
                        )}
                    </button>
                </div>

                {/* Chamfer */}
                <div className="relative flex flex-col items-center  hover:bg-slate-400 hover:bg-opacity-30 rounded-lg p-2 transition duration-200">
                    <button onClick={() => toggleMenu('chamfer')} className="flex flex-col items-center relative">
                        <Image src="/assets/icons/chamfer.svg" alt="Фаски" width={24} height={24} />
                        <span className="text-xs">Фаски</span>
                        {bevel && (
                            <p
                                onClick={(e) => clearOption(e, 'chamfer')}
                                className="absolute top-0 right-0 bg-gray-200 p-0.5 rounded-full hover:bg-red-500 hover:bg-opacity-80 transition duration-200"
                            >
                                <X size={10} />
                            </p>
                        )}
                    </button>
                </div>

                <div className={`relative flex flex-col items-center ${sunMode === 'day' ? 'bg-yellow-200 bg-opacity-50 hover:bg-opacity-30' : 'bg-blue-800 bg-opacity-50 hover:bg-opacity-30'} rounded-lg p-2 transition duration-200`}>
                    <button onClick={() => toggleMenu('sunlight')} className="flex flex-col items-center relative">
                        <Image src="/assets/icons/day-and-night.svg" alt="Светлина" width={30} height={30} />
                        <span className="text-xs">Светлина</span>
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <canvas ref={canvasRef} className="w-full h-full touch-none" />
        </div>
    );
}