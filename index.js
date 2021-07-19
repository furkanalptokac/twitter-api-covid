const Twitter = require('twitter-lite');
var axios = require("axios").default;

require('dotenv').config();

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

const options = {
  method: 'GET',
  url: 'https://coronavirus-19-api.herokuapp.com/countries'
};

axios.request(options).then((response) => {
  const data = response.data;
  data.forEach(key => {
    if (key.country === 'Turkey') {
      client.post('statuses/update', {
        status: (
          'COVID-19 in ' + key.country + '\n' +
          '------------------------' + '\n' +
          'todayCases: ' + key.todayCases + '\n' +
          'todayDeaths: ' + key.todayDeaths + '\n' +
          '------------------------' + '\n' +
          'posted with Twitter API'
        )
      }).then(result => {
        console.log('You successfully tweeted this: \n"' + result.text + '"');
      }).catch(console.error);
    }
  })
}).catch((error) => {
	console.error(error);
});
