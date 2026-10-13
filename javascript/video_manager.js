// Select your video element
const video = document.querySelector("video");
const asset_map = await fetchJSONData();
console.log(asset_map.movies[0].header_shots[0])


let start_pos = Math.trunc(asset_map.movies[0].header_shots.length * Math.random())
let total_length = asset_map.movies[0].header_shots.length;
let current_position = start_pos
replace_video(current_position);

console.log(total_length -1)


video.addEventListener("ended", (event) => {
    console.log("The video has finished playing.");
    replace_video(get_next_src())
});

function get_next_src()
{
    if(current_position == total_length-1)
    {
        console.log("Reset")
        current_position = 0;
    }
    else
    {
        console.log("Incremented")
        current_position = current_position + 1;
    }
    console.log("Value at exit: " + current_position)

    return current_position;
}

function replace_video(new_src)
{
    console.log("Next Video playing is: " + new_src)
    video.src = asset_map.movies[0].header_shots[new_src];   
}





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




