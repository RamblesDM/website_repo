import { initializeModelViewer } from "./model-viewer.js";

let currentViewer = null;

export function initializeModalSelectors() {
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modalImg");
    const canvas = document.getElementById("object_canvas");
    const closeButton = document.getElementById("closeModal");

    document.querySelectorAll(".modal-trigger").forEach((card) => {
        card.addEventListener("click", () => {
            const assetPath = card.dataset.asset;

            console.log("Selected Box:");
            console.log(card.dataset.title);
            console.log(assetPath);

            const title = card.querySelector("h3")?.textContent || "";
            const date = card.querySelector("h1")?.textContent || "";

            const desc =
                card.querySelector(".project_text")?.textContent || "";

            document.getElementById("modalTitle").textContent = title;
            document.getElementById("modalDate").textContent = date;
            document.getElementById("modalDesc").textContent = desc;


            // Copy colored tags into modal
            const modalTags = document.getElementById("modalTags");
            const tags = card.querySelectorAll(".project_tag");

            modalTags.innerHTML = "";

            tags.forEach(tag => {
                modalTags.appendChild(tag.cloneNode(true));
            });

            // Destroy the previous Three.js viewer.
            if (currentViewer) {
                currentViewer.destroy();
                currentViewer = null;
            }

            if (isObjectFormat(assetPath)) {
                modalImg.classList.add("hidden");
                modalVideo.classList.add("hidden");
                canvas.classList.remove("hidden");
            }
            else if (isVideoFormat(assetPath)) {
                modalImg.classList.add("hidden");
                canvas.classList.add("hidden");
                modalVideo.classList.remove("hidden");

                modalVideo.src = assetPath;
            }
            else {
                canvas.classList.add("hidden");
                modalVideo.classList.add("hidden");
                modalImg.classList.remove("hidden");

                modalImg.src = assetPath;
            }

            // The modal must be visible before Three.js measures the canvas.
            modal.classList.remove("hidden");
            modal.classList.add("flex");
            document.body.classList.add("overflow-hidden");

            if (isObjectFormat(assetPath)) {
                requestAnimationFrame(() => {
                    currentViewer = initializeModelViewer(
                        canvas,
                        assetPath
                    );
                });
            }
        });
    });

    function closeModal() {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        document.body.classList.remove("overflow-hidden");
        if (currentViewer) {
            currentViewer.destroy();
            currentViewer = null;
        }
    }

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}

function getFileType(path) {
    return path
        .split("?")[0]
        .split(".")
        .pop()
        .toLowerCase();
}

function isObjectFormat(path) {
    // These are the formats currently supported by model-viewer.js.
    const supportedModelTypes = ["obj", "gltf", "glb"];

    return supportedModelTypes.includes(getFileType(path));
}

function isVideoFormat(path) {
    const videoTypes = ["mp4", "webm", "ogg"];
    if (videoTypes.includes(getFileType(path))) {
        return true;
    }
    else {
        return false;
    }
}