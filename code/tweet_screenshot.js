const puppeteer = require('puppeteer');
const fs = require("fs"); 

let tweetid = process.argv[2];
if (!tweetid) tweetid = "1386777564392329230";
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

var contentHtml = fs.readFileSync('tweet_local_embed.html', 'utf8');
contentHtml = contentHtml.replace("%%TWEETID%%", tweetid)
await page.setContent(contentHtml);
await page.waitForTimeout(5000);

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

await browser.close();
})();
