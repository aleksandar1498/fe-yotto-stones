'use client;'

import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import 'babylonjs-materials';
import 'babylonjs-procedural-textures';
import 'babylonjs-gui';
import 'babylonjs-serializers';

import { useEffect, useRef } from 'react';
import { createScene } from '../hooks/useBabylonEngine';


const createScene = async (canvas) => {
    const engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: false,
    });

    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(1, 3, 0), scene);
    camera.setTarget(BABYLON.Vector3.Zero());
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 6, height: 6 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial('Ground Material', scene);
    groundMaterial.diffuseColor = BABYLON.Color3.Red();
    ground.material = groundMaterial;

    const checkerTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/checkerboard_basecolor.png', scene);
    groundMaterial.diffuseTexture = checkerTexture;

    await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        'https://assets.babylonjs.com/meshes/',
        'Yeti.glb',
        scene
    ).then((result) => {
        result.meshes[0].scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
    });

    engine.runRenderLoop(() => {
        if (scene.activeCamera) {
            scene.render();
        }
    });

    return { engine, scene };
};

export default function BabylonScene() {
    const canvasRef = useRef(null);
    const engineRef = useRef(null);

    useEffect(() => {
        const initBabylon = async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const { engine, scene } = await createScene(canvas);
            engineRef.current = engine;

            // Resize listener
            const handleResize = () => engine.resize();
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                scene.dispose();
                engine.dispose();
            };
        };

        initBabylon();
    }, []);

    return (
        <div className="w-full h-screen">
            <canvas id="renderCanvas" ref={canvasRef} className="w-full h-full touch-none" />
        </div>
    );
};