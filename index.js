require('dotenv').config();
const bodyParser = require("body-parser");
const express = require('express');
const cors = require('cors');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var validator = require('validator');

// Basic Configuration
const port = process.env.PORT || 3000;
let mongoose= require("mongoose");
const urls = [];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let urlSchema= new mongoose.Schema({
  original_url: String,
  short_url: String
})
let UrlMapper=mongoose.model('UrlMapper', urlSchema);

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// app.post('/api/shorturl', function(req, res) {
//   console.log(req.body)
//   console.log(req.body.url)


//   res.json({
//     original_url: "https://www.youtube.com/playlist?list=PLYwpaL_SFmcAjqrKO-b9UMa2AaAlzZY7D",
//     short_url: 10238
//   });
// });

app.post("/api/shorturl", async (req, res) => {
  try {
    var url = (req.body.url || '').toLowerCase();

    if(!validator.isURL(url)){
      return res.json({error: 'invalid url'})
    }

    var exists = checkIfExists(url);

    if (exists.status) {
      return res.json({ original_url: url, short_url: exists.short_url });
    }

    var shortUrl = shorterUrl();
    var saved = {
      original_url: url,
      short_url: shortUrl
    };

    urls.push(saved);

    return res.json({ original_url: url, short_url: shortUrl });
  } catch (e) {
    console.log('err', e)
  }
});

app.get("/api/shorturl/:shortUrl", function(req, res) {
  var redirectPromise = redirectToOriginalUrl(Number(req.params.shortUrl));
  redirectPromise.then(function(original_url) {
    return res.redirect(original_url);
  });
  redirectPromise.catch(function(reason) {
    return res.json({ error: "invalid URL" });
  });
});

function redirectToOriginalUrl(short_url) {
  return new Promise(function(resolve, reject) {
    const url = urls.find(u => Number(u.short_url) === short_url);

    if (!url) return reject('Not found');

    return resolve(url.original_url);
  });
}

function checkIfExists(original_url) {
  const url = urls.find(u => u.original_url === original_url);

  if (!url) return { status: false };

  return { status: true, short_url: url.short_url }
}

function shorterUrl() {
  var text = "";
  var possible =
    "0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return Number(text);
}
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
