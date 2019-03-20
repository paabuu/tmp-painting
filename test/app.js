const fs = require('fs');
const cheerio = require('cheerio');

fs.readFile('./result_json.txt', function(err, data) {
    const json = JSON.parse(data.toString());

    fs.readFile('./white.svg', function(err, d) {
        const $ = cheerio.load(d.toString());
        $('svg').attr('width', '87px');
        $('svg').attr('height', '150px');
        $('svg path').each(function(i, element) {
            if ($(element).attr('fill') === 'white') {
                const id = $(element).attr('id');

                const color = json.result.find(r => r[0] === id)[1];
                $(element).addClass(`white color-${color}`);
            }
        });

        fs.writeFileSync('./new_svg.svg', $.html());
    })
})