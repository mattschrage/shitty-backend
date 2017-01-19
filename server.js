var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var pg = require('pg');
//var bodyParser = require('body-parser')

//app.use(bodyParser.json())
//query for get; body for post
app.get('/event', function(req, res) {
    var name = req.query.name,
        boolean = req.query.color;
    console.log(name, boolean);
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('INSERT INTO test_events(text, complete) values($1, $2)',[name,boolean], function(err, result) {
        done();
        if (err)
         { console.error(err); res.send("Error " + err); }
        else
         {     res.send('Inserted into DB'); }
      });
    });
    // ...
});

app.get('/init', function(req, res) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('CREATE TABLE test_events(id SERIAL PRIMARY KEY, text VARCHAR(40) not null, complete BOOLEAN)', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send('Database (test_events) Initialized!'); }
    });
  });

});

app.get('/feed', function(req, res) {

    res.send('Hello world');
});

app.get('/db', function (req, res) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_events', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       { res.send('pages/db', {results: result.rows} ); }
    });
  });
});

app.listen(process.env.PORT || 4730);
