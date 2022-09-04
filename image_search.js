require("dotenv").config();
const imageSearch = require("image-search-google");

const client = new imageSearch(process.env.SE_ID, process.env.GOOGLE_API_KEY);
let searchCount = 0;

const handleSearch = async (msg) => {
    const keyword = msg.content.split(" ")[1];
    let imageUrl = "";

    if (keyword) {
        await client.search(keyword)
        .then(response => {
            searchCount++;
            imageUrl = response.length > 0 ? response[Math.floor(Math.random() * response.length)].url : "Sori nyt ei pysty...";
            console.log("Image fetch success", "keyword: " + keyword, "image: + " + imageUrl, "search count: " + searchCount);
        })
        .catch(error => console.log(error));

        msg.reply({
            files: [{
                attachment: imageUrl,
                name: 'file.png'
            }]
        });
    } else {
        msg.reply("Virheellinen hakupyyntö! Katso apua komennolla **!help**");
    }
}

module.exports = { handleSearch };