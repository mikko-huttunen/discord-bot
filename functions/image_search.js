require("dotenv").config();
const imageSearch = require("image-search-google");

const client = new imageSearch(process.env.SE_ID, process.env.GOOGLE_API_KEY);
const imageFormats = [".gif", ".jpeg", ".jpg", ".png"];
let validImages = [];

const handleSearch = async (msg) => {
    const msgToLowerCase = msg.content.toLowerCase();
    const keyword = msgToLowerCase.slice(msgToLowerCase.indexOf(" ") + 1);

    if (msgToLowerCase === "!image " + keyword || msgToLowerCase === "!kuva " + keyword) {
        await client.search(keyword)
        .then(response => {
            if (response.length > 0) {
                response.forEach(image => {
                    var fileExt = image.url.substring(image.url.lastIndexOf("."));
                    if (imageFormats.some((format) => format === fileExt)) {
                        validImages.push(image.url);
                    }
                });

                console.log(validImages);

                const imageUrl = validImages[Math.floor(Math.random() * validImages.length)];
                validImages = [];
                console.log("keyword: " + keyword + ", imageUrl: " + imageUrl);

                const fileExt = imageUrl.substring(imageUrl.lastIndexOf("."));

                msg.reply({
                    files: [{
                        attachment: imageUrl,
                        name: "image" + fileExt
                    }]
                });
            } else {
                console.log("keyword: " + keyword, "No results");
                client.search("monkey")
                .then(response => {
                    if (response.length > 0) {
                        response.forEach(image => {
                            var fileExt = image.url.substring(image.url.lastIndexOf("."));
                            if (imageFormats.some((format) => format === fileExt)) {
                                validImages.push(image.url);
                            }
                        });

                        const imageUrl = validImages[Math.floor(Math.random() * validImages.length)];
                        validImages = [];
                        console.log("keyword: " + keyword + ", imageUrl: " + imageUrl);

                        const fileExt = imageUrl.substring(imageUrl.lastIndexOf("."));

                        msg.reply({
                            content: "En löytänyt kuvaa antamallasi hakusanalla... \nSaat kuitenkin lohdutukseksi tämän",
                            files: [{
                                attachment: imageUrl,
                                name: "image" + fileExt
                            }]
                        });
                    }
                })
                .catch(error => {
                    console.log(error);
                    msg.reply("Jotain meni pieleen...");
                });
            }
        })
        .catch(error => {
            console.log(error);
            msg.reply("Sori nyt ei pysty...");
        });
    }
}

module.exports = { handleSearch };