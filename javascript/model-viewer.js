import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

export function initializeModelViewer(canvas, modelPath) {
    if (!canvas) {
        console.error("Three.js canvas was not found.");
        return;
    }

    const loadingOverlay = document.getElementById("modelLoadingOverlay");
    const loadingPercent = document.getElementById("modelLoadingPercent");
    const loadingRatio = document.getElementById("modelLoadingRatio");

    if (loadingOverlay) {
        loadingOverlay.classList.remove("hidden");
    }

    if (loadingPercent) {
        loadingPercent.textContent = "0%";
    }

    if (loadingRatio) {
        loadingRatio.textContent = "0.0 MB / 0.0 MB";
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        1000
    );

    camera.position.set(0, 1.5, 5);

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.target.set(0, 0, 0);
    controls.update();

    const keys = {};
    let movementSpeed = 0.05;

    function keyDown(event) {
        keys[event.code] = true;
    }

    function keyUp(event) {
        keys[event.code] = false;
    }

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    function updateCameraMovement() {
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        const movement = new THREE.Vector3();

        camera.getWorldDirection(forward);

        forward.y = 0;
        forward.normalize();

        right.crossVectors(forward, camera.up).normalize();

        if (keys["KeyW"] || keys["ArrowUp"]) {
            movement.add(forward);
        }

        if (keys["KeyS"] || keys["ArrowDown"]) {
            movement.sub(forward);
        }

        if (keys["KeyD"] || keys["ArrowRight"]) {
            movement.add(right);
        }

        if (keys["KeyA"] || keys["ArrowLeft"]) {
            movement.sub(right);
        }

        if (movement.lengthSq() > 0) {
            movement.normalize().multiplyScalar(movementSpeed);

            camera.position.add(movement);
        }
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
    directionalLight.position.set(3, 5, 4);
    scene.add(directionalLight);

    loadModel(modelPath);

    function loadModel(path) {
        const cleanPath = path.split("?")[0];
        const extension = cleanPath.split(".").pop().toLowerCase();

        let loader;

        switch (extension) {
            case "glb":
            case "gltf":
                loader = new GLTFLoader();
                break;

            case "obj":
                loader = new OBJLoader();
                break;

            default:
                console.error(`Unsupported model format: .${extension}`);

                if (loadingPercent) {
                    loadingPercent.textContent = "Error";
                }

                if (loadingRatio) {
                    loadingRatio.textContent = "Unsupported model format";
                }

                return;
        }

        loader.load(
            path,

            (loadedFile) => {
                const model =
                    extension === "glb" || extension === "gltf"
                        ? loadedFile.scene
                        : loadedFile;

                scene.add(model);
                centerAndFitModel(model);

                if (loadingPercent) {
                    loadingPercent.textContent = "100%";
                }

                if (loadingRatio) {
                    loadingRatio.textContent = "Loaded";
                }

                /*
                    Hide the loading screen after the model
                    has been added and positioned.
                */
                if (loadingOverlay) {
                    loadingOverlay.classList.add("hidden");
                }

                console.log(`Loaded model: ${path}`);
            },

            (event) => {
                const loadedMB = event.loaded / 1024 / 1024;

                if (event.total > 0) {
                    const totalMB = event.total / 1024 / 1024;
                    const percent = (event.loaded / event.total) * 100;

                    if (loadingPercent) {
                        loadingPercent.textContent =
                            `${percent.toFixed(0)}%`;
                    }

                    if (loadingRatio) {
                        loadingRatio.textContent =
                            `${loadedMB.toFixed(1)} MB / ${totalMB.toFixed(1)} MB`;
                    }

                    console.log(
                        `Model loading: ${percent.toFixed(1)}%`
                    );
                } else {
                    /*
                        Some servers do not send Content-Length,
                        so event.total can be 0.
                    */

                    if (loadingPercent) {
                        loadingPercent.textContent = "Loading...";
                    }

                    if (loadingRatio) {
                        loadingRatio.textContent =
                            `${loadedMB.toFixed(1)} MB loaded`;
                    }
                }
            },

            (error) => {
                console.error(`Could not load model: ${path}`, error);

                if (loadingPercent) {
                    loadingPercent.textContent = "Error";
                }

                if (loadingRatio) {
                    loadingRatio.textContent = "Could not load model";
                }
            }
        );
    }

    function centerAndFitModel(model) {
        const box = new THREE.Box3().setFromObject(model);

        if (box.isEmpty()) {
            console.warn("Loaded model has no visible geometry.");
            return;
        }

        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        model.position.sub(center);

        const maxDimension = Math.max(size.x, size.y, size.z);

        if (maxDimension === 0) {
            return;
        }

        const verticalFov = THREE.MathUtils.degToRad(camera.fov);

        const cameraDistance =
            maxDimension / (2 * Math.tan(verticalFov / 2));

        camera.position.set(
            cameraDistance * 0.75,
            cameraDistance * 0.5,
            cameraDistance * 1.25
        );

        camera.near = Math.max(maxDimension / 100, 0.01);
        camera.far = maxDimension * 100;
        camera.updateProjectionMatrix();

        controls.target.set(0, 0, 0);
        controls.minDistance = maxDimension * 0.1;
        controls.maxDistance = maxDimension * 10;
        controls.update();
    }

    function handleResize() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (width === 0 || height === 0) {
            return;
        }

        const needsResize =
            canvas.width !==
                Math.floor(width * renderer.getPixelRatio()) ||
            canvas.height !==
                Math.floor(height * renderer.getPixelRatio());

        if (!needsResize) {
            return;
        }

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height, false);
    }

    let animationFrameId;

    function animate() {
        animationFrameId = requestAnimationFrame(animate);

        updateCameraMovement();
        handleResize();
        controls.update();
        renderer.render(scene, camera);
    }

    animate();

    return {
        scene,
        camera,
        renderer,
        controls,

        destroy() {
            cancelAnimationFrame(animationFrameId);

            controls.dispose();
            renderer.dispose();

            window.removeEventListener("keydown", keyDown);
            window.removeEventListener("keyup", keyUp);

            scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }

                if (object.material) {
                    const materials = Array.isArray(object.material)
                        ? object.material
                        : [object.material];

                    materials.forEach((material) => {
                        Object.values(material).forEach((value) => {
                            if (value?.isTexture) {
                                value.dispose();
                            }
                        });

                        material.dispose();
                    });
                }
            });
        }
    };
}