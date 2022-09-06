require("dotenv").config();
const imageSearch = require("image-search-google");

const client = new imageSearch(process.env.SE_ID, process.env.GOOGLE_API_KEY);
let searchCount = 0;

const handleSearch = async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const keyword = msgToLowerCase.slice(msgToLowerCase.indexOf(' ') + 1);
    let imageUrl = "";

    if (msgToLowerCase === `!image ${keyword}` || msgToLowerCase === `!kuva ${keyword}`) {
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
                name: 'image.png'
            }]
        });
    } else {
        msg.reply("Virheellinen hakupyyntö! Katso apua komennolla **!help**");
    }
}

module.exports = { handleSearch };