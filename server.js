var express = require('express');
var app = express();
var pg = require('pg');
//var bodyParser = require('body-parser')

//app.use(bodyParser.json())

app.get('/feed', function(req, res) {

    res.send('Hello world');
});

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

app.listen(process.env.PORT || 4730);
