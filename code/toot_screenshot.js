const puppeteer = require('puppeteer');
const fs = require("fs"); 
const { htmlToText } = require('html-to-text');

let tooturl = process.argv[2];
if (!tooturl) tooturl = "mastodon.social/@johnmu/109292050061122141";
if (!tooturl.startsWith("https://")) tooturl = "https://" + tooturl;
let outfile = process.argv[3];
if (!outfile) outfile = "screenshot.png";

let filenames = [], filesizes = [];
for (let i=0; i<5; i++) { filenames.push("image-" + i + ".png")};

(async() => {
const browser = await puppeteer.launch();
const page = await browser.newPage();
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

await page.setViewport({
    width: 1024,
    height: 2048,
    deviceScaleFactor: 1.0,
});

page
    .on('console', message => console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('requestfailed', request => console.log(`${request.failure().errorText} ${request.url()}`))
    //.on('response', response =>
    //  console.log(`${response.status()} ${response.url()}`))

var contentHtml = fs.readFileSync('toot_local_embed.html', 'utf8');
contentHtml = contentHtml.replace("https://mastodon.social/@johnmu/109292050061122141", tooturl)
contentHtml = contentHtml.replace('%%TOOTID%%', tooturl)
await page.setContent(contentHtml);
try {
    await page.waitForSelector('#content_ready' , { timeout: 20000 });
} catch (err) {
    console.log("Timed out waiting; continuing");
}

const elem = await page.$('#bounding');
const boundingBox = await elem.boundingBox();
await page.setViewport({
    width: parseInt(boundingBox.width + boundingBox.x),
    height: parseInt(boundingBox.height + boundingBox.y),
    deviceScaleFactor: 1.0,
});

// get maximum sized screenshot -- they fail randomly
for (const fn of filenames) { 
    console.log("Saving ", fn); 
    await page.screenshot({path: fn}); 
    var stats = fs.statSync(fn);
    filesizes.push(stats.size);
}; 
let i = filesizes.indexOf(Math.max(...filesizes));
fs.copyFile(filenames[i], outfile, (err) => { 
        if (err) throw err;  
        console.log("Saved to ", outfile);
        for (const fn of filenames) { 
            console.log("Removing ", fn);
            fs.unlink(fn, (err) => {if (err) throw err; }); 
        }
    });

// now fetch contents
const url_parts = tooturl.split("/");
const just_id = url_parts[url_parts.length-1];
const api_url = [url_parts[0], url_parts[1], url_parts[2]].join("/") + "/api/v1/statuses/" + just_id;
const res = await fetch(api_url);
const res_json = await res.json();
if (res_json["id"]) {
    const user_name = res_json["account"]["display_name"];
    const post_html = res_json["content"];
    const post_text = htmlToText(post_html, { 
        wordwrap: false, 
        selectors: [ { selector: 'a', options: { ignoreHref: true } }, 
                     { selector: 'img', format: 'skip' }] });
    let text_version = user_name + " posted: " + post_text;
    if (text_version.length>204) text_version = text_version.substring(0, 200) + " ...";
    text_version = text_version.replace('"', "'"); // since we wrap it in alt
    text_version = text_version.replace('<', " "); // to be safe
    text_version = text_version.replace('&', " "); // to be safe
    text_version = text_version.replace('%', " "); // to be paranoid
    fs.writeFile(outfile + ".txt", text_version, function() { });
    console.log("Wrote caption to text file: " + text_version);
} else {
    let text_version = "Unknown post.";
    fs.writeFile(outfile + ".txt", text_version, function() { });
    console.log("Wrote empty caption to text file...");
}
await browser.close();
})();
