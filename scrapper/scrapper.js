const puppeteer = require('puppeteer');
const _ = require('lodash')
const $ = require('jquery')



const getRating = async () => {
    try {
        // const wsChromeEndpointurl = 'ws://127.0.0.1:9222/devtools/browser/58b05181-1096-470c-b9b9-a8e27578a62c';
        // const browser = await puppeteer.connect({
        //     browserWSEndpoint: wsChromeEndpointurl,
        // });
        // const browser = await puppeteer.launch({
        //     executablePath:
        //         '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
        //     //   userDataDir : '/Users/yaugor/Library/Application Support/Google/Chrome/',
        //     headless: true // 無外殼的 Chrome，有更佳的效能
        // });
        const browser = await puppeteer.launch(
            {
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            }
        );
        const page = await browser.newPage();

        await page.goto('https://chunithm.gamerch.com/CHUNITHM%20NEW%20%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7%EF%BC%88%E5%AE%9A%E6%95%B0%E9%A0%86%EF%BC%891', { waitUntil: 'networkidle2' });
        await page.waitForSelector('#js_async_main_column_text > div > table')
        await page.addScriptTag({ path: "jquery-3.5.1.min.js" })

        //test
        // await page.click('#root > div > img.btn-abs-right.hide')

        // await page.waitForSelector('#root > div > div.box > div > div.ewallet-list.mb10 > div')
        // await page.click('#root > div > div.box > div > div.ewallet-list.mb10 > div')

        // get ticket

        // let rows = await page.$$("#root > div > div.box > div > div.calendar-tree-box > div.calendar-tree-decoration > div")

        console.log('scrap...')
        let x = await page.evaluate(() => {

            const toASCII = (chars) => {
                var ascii = '';
                for (var i = 0, l = chars.length; i < l; i++) {
                    var c = chars[i].charCodeAt(0);
                    if (c >= 0xFF00 && c <= 0xFFEF) {
                        c = 0xFF & (c + 0x20);
                    }
                    ascii += String.fromCharCode(c);
                }
                return ascii.replace(/[”“]/g, '\"');;
            }

            let table = $('#js_async_main_column_text > div >table');

            // $('body').css("background-color","red")
            let list = {};

            for (i = 0; i < table.length; i++) {
                let row = table[i].getElementsByTagName('tr');
                let index = 1;
                let rate = 0;
                let diffculty = 'master';
                while (index < row.length) {
                    let _td = $(row[index]).find('td');
                    if (_td.length < 1) {
                        rate = parseFloat(row[index].innerText);
                        index++;
                    }
                    else {

                        if (_td[0].innerText === "EXP") {
                            diffculty = 'expert'
                        }
                        else if (_td[0].innerText === "MAS") {
                            diffculty = 'master'
                        }
                        else if (_td[0].innerText === "ULT") {
                            diffculty = 'ultima'
                        }

                        else {
                            let textEle = $(row[index]).find('td > a')
                            let songName = textEle[0] ? textEle[0].innerText : ''
                            let comboEle = $(row[index]).find('td')[1]
                            let combo = comboEle ? comboEle.innerText : '0'
                            let key
                            if (songName) {
                                key = toASCII(songName).replace(/[\n\s'’]/g, '')

                                if (!list[key]) {
                                    list[key] = {
                                        displayName: songName.replace(/[\n'’]/g, ''),
                                        [diffculty]: {
                                            rate: rate,
                                            combo: parseInt(combo),
                                        }
                                    }
                                }
                                else {
                                    list[key][diffculty] = {
                                        rate: rate,
                                        combo: parseInt(combo),
                                    }
                                }
                            }
                        }
                        index++
                    }
                }
            }
            // alert('finish');

            console.log(list)
            return list

        })


        // let list = {};
        // table = _.drop(table)
        // for (var i = 0; i < table.length; i++) {
        //     let row = await table[i].asElement().$$("tr")
        //     let index = 1;
        //     let rate = 0;
        //     let isMaster;
        //     while (index < row.length) {

        //         let _td = await row[index].asElement().$$('td');

        //         if (_td.length < 1) {
        //             let text = await page.evaluate(el => el.innerText, row[index])
        //             rate = parseFloat(text);
        //             isMaster = true;
        //             index++;
        //         }
        //         else {
        //             let className = await page.evaluate(el => { return el.className }, _td[0])

        //             if (!className.includes('no-min-width') && isMaster) {
        //                 let rateEl = await row[index].asElement().$$('td > a')
        //                 let rateText = await page.evaluate(el => { return el.innerText }, rateEl[0])

        //                 list[toASCII(rateText).replace(/[\n\s'’]/g, '')] = {
        //                     master: rate
        //                 }

        //             }
        //             else {
        //                 let text = await page.evaluate(el => el.innerText, _td[0])

        //                 if (text === "EXP")
        //                     isMaster = false
        //             }
        //             index++
        //         }

        //     }
        // }


        await browser.close();

        return x
    }
    catch (e) {
        console.log(e)
        // process.exit()

    }
};

// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
// const init = async () => {
//     let r = await getRating()
//     console.log(r);
// }
// init()
module.exports = { getRating }






