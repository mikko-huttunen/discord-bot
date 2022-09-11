require("dotenv").config();
const imageSearch = require("image-search-google");

const client = new imageSearch(process.env.SE_ID, process.env.GOOGLE_API_KEY);
const imageFormats = ["bmp", "gif", "jpeg", "jpg", "png", "webp", "svg"]
let searchCount = 0;

const handleSearch = async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const keyword = msgToLowerCase.slice(msgToLowerCase.indexOf(' ') + 1);
    let imageUrl = "";

    if (msgToLowerCase === `!image ${keyword}` || msgToLowerCase === `!kuva ${keyword}`) {
        await client.search(keyword)
        .then(response => {
            searchCount++;

            if (!response.length) {
                msg.reply("Sori nyt ei pysty...");
            } else {
                imageUrl = response[Math.floor(Math.random() * response.length)].url;
                console.log("Image fetch success", "keyword: " + keyword, "image: " + imageUrl, "search count: " + searchCount);
            }
        })
        .catch(error => console.log(error));

        if (imageFormats.some((format) => imageUrl.endsWith(format))) {
            msg.reply({
                files: [{
                    attachment: imageUrl,
                    name: 'image.png'
                }]
            });
        }
    }
}

module.exports = { handleSearch };