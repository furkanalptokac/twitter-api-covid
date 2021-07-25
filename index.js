const Twitter = require('twitter-lite');
const axios = require("axios");
const cron = require('node-cron');
const { JSDOM } = require('jsdom');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('./yesterday.json');
const db = low(adapter);

db.defaults({ yesterday: {} })
  .write();

require('dotenv').config();

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

const options = {
  method: 'GET',
  url: 'https://covid19.saglik.gov.tr/'
};

cron.schedule('00 21 * * *', () => {
  try {
    axios.request(options).then(response => {
      const html = response.data;

      const window = new JSDOM(html, {
        runScripts: "dangerously",
        includeNodeLocations: true,
      }).window;

      var cases = window.sondurumjson[0].gunluk_vaka.split('.').join('');
      var deaths = window.sondurumjson[0].gunluk_vefat.split('.').join('');

      var yesterdayCases = db.get('yesterday.cases').value();
      var yesterdayDeaths = db.get('yesterday.deaths').value();

      cases = Number(cases);
      deaths = Number(deaths);

      var casesGap = cases - yesterdayCases;
      var deathsGap = deaths - yesterdayDeaths;

      var casesGapStr = (casesGap < 0 ? "" : "+") + casesGap;
      var deathsGapStr = (deathsGap < 0 ? "" : "+") + deathsGap;

      client.post('statuses/update', {
        status: (
          'COVID-19 in Turkey \n'+
          '------------------------' + '\n' +
          'yesterdayCases: ' + yesterdayCases + '\n' +
          'yesterdayDeaths: ' + yesterdayDeaths + '\n' +
          '------------------------ \n' +
          'todayCases: ' + cases + '\n' +
          'todayDeaths: ' + deaths + '\n' +
          '------------------------ \n' +
          '' + casesGapStr + ' cases \n' +
          '' + deathsGapStr + ' deaths \n' +
          '------------------------' + '\n' +
          'posted with Twitter API'
        )
      }).then(result => {
        console.log('You successfully tweeted this: \n"' + result.text + '"');
      });

      db.set('yesterday.cases', cases)
        .write();
      db.set('yesterday.deaths', deaths)
        .write();
    });
  } catch (e) {}
}, {
  timeZone: "Turkey"
});
