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
        icon = req.query.icon,
        startDate = req.query.startDate,
        endDate = req.query.endDate,
        details = req.query.details,
        hostName = req.query.hostName,
        locationName = req.query.locationName,
        location = req.query.location,
        color = req.query.color;

    console.log(name, icon, startDate, endDate, details, hostName, locationName, location, color);
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('INSERT INTO events(name, icon, startDate, endDate, details, hostName, locationName, location, color) values($1, $2)',[name, icon, startDate, endDate, details, hostName, locationName, location, color], function(err, result) {
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
    client.query('CREATE TABLE events ( id SERIAL PRIMARY KEY,icon TEXT, name TEXT, details TEXT, hostName TEXT,locationName TEXT,color TEXT,startDate timestamptz, endDate timestamptz,location GEOGRAPHY(POINT,4326))', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send('Database (events) Initialized!'); }
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
       { console.log(result["rows"]);
         res.send(result.rows);}
    });
  });
});

app.listen(process.env.PORT || 4730);
