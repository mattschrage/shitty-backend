var express = require('express');
var app = express();
var bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/feed', function(req, res) {

    res.send('Hello world');
});

app.listen(process.env.PORT || 4730);
