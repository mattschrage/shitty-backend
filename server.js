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
app.post('/event', function(req, res) {
    var name = req.body.name,
        icon = req.body.icon,
        startDate = req.body.startDate,
        endDate = req.body.endDate,
        details = req.body.details,
        hostName = req.body.hostName,
        locationBuilding = req.body.locationBuilding,
        locationRoom = req.body.locationRoom,
        locationName = locationBuilding + " " + locationRoom;
        location = req.body.location,
        color = req.body.color;

    //do some post processing ei. match up Location Name with actual geopoint

    // set color depending on icon
    switch (icon) {
      case "❤️":
        color = ""
        break;
      case "❤️":

        break;
      default:

    }

    //set geopoint depending on location
    switch (locationBuilding) {
      case "❤️":
        color = ""
        break;
      case "❤️":

        break;
      default:

    }

    console.log(name, icon, startDate, endDate, details, hostName, locationName, location, color);
    pg.connect(process.env.DATABASE_URL, function(err, client, done) {
      client.query('INSERT INTO events(name, icon, startDate, endDate, details, hostName, locationName, location, color) values($1, $2, $3, $4, $5, $6, $7, $8, $9)',[name, icon, startDate, endDate, details, hostName, locationName, location, color], function(err, result) {
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
    client.query('CREATE TABLE events ( id SERIAL PRIMARY KEY,icon TEXT, name TEXT, details TEXT, hostName TEXT,locationName TEXT,color TEXT,startDate timestamptz, endDate timestamptz,location POINT)', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send('Database (events) Initialized!'); }
    });
  });

});

app.get('/feed', function(req, res) {
  console.log("FEED");
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
//AND startDate <= (now() + interval \'7 days\')
    client.query('SELECT * FROM events WHERE startDate >= (now() - interval \'3 hours\');', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       { console.log(result["rows"]);

       //iterate to seperate into different sections
       var todayDate = new Date();
       var tomorrowThreshold = new Date(todayDate.getDate() + 1)
       var todayThreshold = tomorrowThreshold;
       todayThreshold.setHours(4,0,0,0);
       tomorrowThreshold.setHours(0,0,0,0);

       var today = [];
       var tomorrow = [];
       var upcoming = [];
       for (row in result["rows"]) {
         var timestamp = row["startDate"];
         console.log(row);
         if (timestamp <= todayThreshold.getTime() / 1000) {
            today.push(row);
         } else if (timestamp <= tomorrowThreshold.getTime() / 1000) {
            tomorrow.push(row);
         } else {
            upcoming.push(row);
         }

       }

       var payload = {"sectionTitles":["Today","Tomorrow","This Week"],"sections":[today, tomorrow, upcoming]}
         res.send(payload);
       }
    });
  });
});

app.get('/db', function (req, res) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM events WHERE startDate <= now()', function(err, result) {
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
