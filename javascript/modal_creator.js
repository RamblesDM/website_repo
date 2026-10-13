import { initializeModalSelectors } from "./modal_selector.js";

async function fetchJSONData() {
    try {
        const response = await fetch("./javascript/asset_map.json");

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Failed to fetch data:", error);
        return null;
    }
}

const pageConfig = {
    "index.html": {
        json: "./javascript/featured_projects.json",
        limit: 5
    },

    "artworks.html": {
        json: "./javascript/asset_map.json",
        limit: Infinity
    }
};


async function loadProjects() {
    const asset_map = await fetchJSONData();
    let html_string = "";
    console.log(window.location.pathname.split("/").pop());
    let current_file = window.location.pathname.split("/").pop();
    console.log(current_file);
    
    if(current_file === "")
    {
        current_file = "index.html"
    }

    if (!asset_map) {
        return;
    }

    if (current_file == "index.html") {
        let projectGrid = document.getElementById("project_row");

        let html_string = "";

        for (let i = 0; i < asset_map.header_projects.length; i++) {
            html_string += createProjectCard(
                asset_map.header_projects[i],
                asset_map.color_tags
            );
        }
        projectGrid.innerHTML = html_string;

    }
    else {
        let projectGrid = document.getElementById("project_grid");
        let html_string = "";

        for (let i = 0; i < asset_map.projects.length; i++) {
            html_string += createProjectCard(
                asset_map.projects[i],
                asset_map.color_tags
            );
        }
        projectGrid.innerHTML = html_string;

        let scene_grid = document.getElementById("projects_scenes");
        html_string = "";

        for (let i = 0; i < asset_map.projects_scenes.length; i++) {
            html_string += createProjectCard(
                asset_map.projects_scenes[i],
                asset_map.color_tags
            );
        }

        scene_grid.innerHTML = html_string;
    }

    initializeModalSelectors();
}

function createProjectCard(project, color_tags) {
    return `
        <div class="project_box cursor-pointer modal-trigger"
             data-title="${project.title}" 
             data-asset="${project.asset_link}">

            ${inline_type_dictator(project.thumbnail_link, project.title)}

            <h3 class="pl-[10px]">${project.title}</h3>

            <ul>
                <h1>${project.date}</h1>

                <ul class="flex flex-wrap gap-2 mt-3 justify-start self-start !px-0">
                    ${createTags(project.tags, color_tags)}
                </ul>
            </ul>

            <p class="project_text">
                ${project.description}
            </p>
        </div>
    `;
}

function isObjectFormat(path) {
    const modelTypes = ["obj", "gltf", "glb", "fbx", "stl", "dae", "3ds", "ply"];
    if (modelTypes.includes(getFileType(path))) {
        return true;
    }
    else {
        return false;
    }
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

function createTags(tags, color_tags) {
    if (!tags) return "";

    const colors = color_tags?.[0] || {};

    return tags.map(tag => {
        const color = colors[tag] || "#7E817B";

        return `
            <li
                class="project_tag px-2 py-1 rounded-lg text-sm"
                style="
                    color: ${color};
                    border: 1px solid ${color};
                    background-color: ${color}20;
                "
            >
                ${tag}
            </li>
        `;
    }).join("");
}

function getFileType(path) {
    return path.split(".").pop().toLowerCase();
}
function inline_type_dictator(link, title) {
    if (isObjectFormat(link)) {
        console.log("3D Model")
        return `<canvas id="object_canvas" alt="${title}"></canvas>`
    }
    else if(isVideoFormat(link)) {
        console.log("Video")
        console.log(link)
        return `<video id="modalVideo" src="${link}" aria-label="${title}" controls playsinline></video>`    
    }
    else {
        console.log("Img")

        return `<img src="${link}" alt="${title}">`
    }
}

loadProjects();
