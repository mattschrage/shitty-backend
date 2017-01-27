var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

var buildings = require('./buildings.json');

var pg = require('pg');
var pgp = require('pg-promise')();
var database_url = process.env.DATABASE_URL || 'postgres://MattSchrage@localhost:5432/peekbackend';

var db = pgp(database_url);
var moment = require('moment');



//var bodyParser = require('body-parser')

//app.use(bodyParser.json())
//query for get; body for post



app.post('/loc', function(req, res) {

  var locations = req.body.locations,
      userId = req.body.userId;

  for (var i = 0; i < locations.length; i++){
    var data = locations[i];
    var lat = data.lat,
        lon = data.lon,
        location = lat + "," + lon,
        timestamp = data.timestamp;

        pg.connect(database_url || process.env.DATABASE_URL, function(err, client, done) {

          client.query('INSERT INTO locations(location, startDate, userId) values($1, $2, $3)',[location, timestamp, userId], function(err, result) {
            done();
            if (err)
             { console.error(err); res.send("Error " + err); }
            else
             {     res.send('Inserted location into DB'); }
          });
        });
  }



});

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


function searchBuildings(name) {


    for (var i = 0; i < buildings.length; i++) {

      var building = buildings[i];
      if (building.name && building.name.substring(0, name.length).toLowerCase() === name.toLowerCase()) {
        console.log(building);
        return ""+ building.lat+" , " + building.lng;
      }
    }

    console.log("NO BUILDING FOUND FOR \""+name+"\"");

}

function toTimeZone(time, zone) {
    var format = 'YYYY/MM/DD HH:mm:ss ZZ';
    return moment(time, format).tz(zone).format(format);
}

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
        location = req.body.location;
        //convert hex to rgb
        var rgb = hexToRgb(req.body.color);
        var color  = "" + rgb.r / 255 + " " + rgb.g / 255 + " " + rgb.b / 255 + " " + 1.0;

        //startDate = toTimeZone(startDate, "EST");
        console.log(startDate);

        //startDate.setTime( startDate.getTime() + 5*60*1000 );

    //do some post processing ei. match up Location Name with actual geopoint
      //location = searchBuildings(locationBuilding);
      console.log(req.body.latitude,req.body.longitude);
      location = ""+ req.body.latitude+" , " + req.body.longitude;



    //set geopoint depending on location
    // switch (locationBuilding) {
    //   case "Thayer":
    //     location = ""
    //     break;
    //   case "Straus":
    //     location = ""
    //     break;
    //   default:
    //
    // }

    console.log(name, icon, startDate, endDate, details, hostName, locationName, location, color);
    pg.connect(process.env.DATABASE_URL || database_url , function(err, client, done) {
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

  pg.connect(process.env.DATABASE_URL || database_url, function(err, client, done) {
    client.query('CREATE TABLE locations ( id SERIAL PRIMARY KEY, startDate timestamptz, location POINT, userId TEXT)', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send('Database (events) Initialized!'); }
    });
  });

});

app.get('/hits', function(req, res) {
  res.send({"count":"1234"});
});


app.get('/feed', function(req, res) {
  console.log("FEED");
  var today = db.query('SELECT * FROM events WHERE startDate > TIMESTAMP \'today\' - interval \'4 hours\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'4 hours\' ORDER BY startDate ASC');
  var tomorrow = db.query('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' + interval \'4 hours\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'1 day\' ORDER BY startDate ASC');
  var upcoming = db.query('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' + interval \'1 day\' AND startDate < TIMESTAMP \'tomorrow\' + interval \'7 day\' ORDER BY startDate ASC');
  Promise.all([today,tomorrow,upcoming])
  .then(function(sections){
    console.log(sections);
    // connection already disposed here
    var payload = {"sectionTitles":["Today","Tomorrow","This Week"],"sections":sections}
    res.send(payload);
  })
  .catch(function(err){
    console.log("err",err);
  });


  // pg.connectAsync(database_url || process.env.DATABASE_URL)
  //   .then(function(client, done) {
  //
  //   client.query('SELECT * FROM events WHERE startDate >= (now() - interval \'3 hours\') AND startDate <= (now() + interval \'7 days\');', function(err, result) {
  //
  //     done();
  //
  //     if (err) {
  //        console.error(err);
  //       res.send("Error " + err);
  //     }
  //
  //     else {
  //       console.log(result["rows"]);
  //
  //      //iterate to seperate into different sections
  //      var todayDate = new Date();
  //      var tomorrowThreshold = new Date();
  //      tomorrowThreshold.setDate(todayDate.getDate() + 1);
  //      var todayThreshold = tomorrowThreshold;
  //      todayThreshold.setHours(4,0,0,0);
  //      tomorrowThreshold.setHours(24,0,0,0);
  //
  //      var today = [];
  //      var tomorrow = [];
  //      var upcoming = [];
  //      for (var i = 0; i < result["rows"].length; i++ ) {
  //        var row = result["rows"][i];
  //        var date = row["startdate"];
  //
  //        var timestamp = date.getTime();
  //        console.log("Timestamp:"+timestamp+", Today Threshold:"+todayThreshold.getTime());
  //        if (timestamp <= todayThreshold.getTime()) {
  //           today.push(row);
  //        } else if (timestamp <= tomorrowThreshold.getTime()) {
  //           tomorrow.push(row);
  //        } else {
  //           upcoming.push(row);
  //        }
  //
  //      }
  //
  //      var payload = {"sectionTitles":["Today","Tomorrow","This Week"],"sections":[today, tomorrow, upcoming]}
  //        res.send(payload);
  //      }
  //   });
  //});
});

app.get('/db', function (req, res) {

  pg.connect( process.env.DATABASE_URL || database_url, function(err, client, done) {

    client.query('SELECT * FROM '+req.query.name, function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       { console.log(result["rows"]);
         res.send(result.rows);}
    });
  });
});

app.get('/drop', function (req, res) {

// if (!(req.password === "matthewschrage")) {
//   res.send("You don't have permission");
//
//   return;
// }


  pg.connect(process.env.DATABASE_URL || database_url, function(err, client, done) {

    client.query('TRUNCATE '+req.query.name, function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       { console.log(result["rows"]);
         res.send(result.rows);}
    });
  });
});

app.get('/delete', function (req, res) {



  pg.connect(process.env.DATABASE_URL || database_url, function(err, client, done) {

    client.query('DELETE FROM '+req.query.name+' WHERE id = '+req.query.id, function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       { console.log(result["rows"]);
         res.send(result.rows);}
    });
  });
});

app.listen(process.env.PORT || 8000);
