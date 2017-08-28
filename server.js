var express = require('express');
var app = express();
var bodyParser = require('body-parser')
/////
// Token needs to be generated every 60 days https://www.slickremix.com/facebook-60-day-user-access-token-generator/
var fb_access_token    = '1417764994922669|LuV9cQ_Ew8L5k52sf81X_I6PkKM'
var fb_pages_to_scrape = ['JFKJrForum','harvardartmuseums','OCSHarvard']
var emoji_pool         = [['💬'], ['🎨','🖌','🖼'],['📊','📈','👔']]
var host_name          = ['IOP Forum', 'Harvard Art Museum', 'OCS']
var colors             = ['#2ecc71','#e74c3c','#9b59b6','#3498db','#f1c40f']
var request = require('request');


fb_pages_to_scrape.forEach(function(page, i) {
  var endpoint =  'https://graph.facebook.com/v2.10/'+page+'/events?access_token='+fb_access_token;
  request.get(endpoint,function(err,res,body){
    if(res.statusCode === 200 ) {
      //console.log(body);
      console.log(page);
      console.log(endpoint + '\n\n\n');

      var payload = JSON.parse(body).data;
      // console.log(payload);
      payload.map(function(event){
        // console.log(event.name);

        Array.prototype.randomElement = function () {
          return this[Math.floor(Math.random() * this.length)]
        }
        var postData = {};
        postData.name = event.name;
        postData.fbid = event.id
        postData.icon =  emoji_pool[i].randomElement();
        postData.color = colors.randomElement()
        postData.startDate = event.start_time;
        postData.details   = event.description
        postData.locationBuilding   = event.place.name
        if (event.place.location) {
          postData.longitude = event.place.location.longitude
          postData.latitude  = event.place.location.latitude
        }

        postData.hostName  = host_name[i]
        postData.email = 'bot@heypeek.com'

        pg.connect(database_url || process.env.DATABASE_URL, function(err, client, done) {

          client.query('SELECT * FROM events WHERE fbid = $1',[event.id], function(err, result) {
            done();
            if (err){
               console.error(err);
            } else {
               console.log('checking for fbid in db');
               if(result["rows"].length == 0){
                 console.log(postData);
                 console.log('event does not exist... creating it');
                 request({
                     url: "https://lol.com",//"https://freefood-backend.herokuapp.com/event",
                     method: "POST",
                     json: true,   // <--Very important!!!
                     body: postData
                 }, function (error, response, body){
                     // console.log(response);
                 });
               }
               else {
                 console.log('event exists... next!');
               }
             }
          });
        });



      })



    }
  });
});

// var CronJob = require('cron').CronJob;
// var CronJob = require('cron').CronJob;
// var job = new CronJob('0 0 * * *', function() {
//   /*
//    * Runs every weekday (Monday through Friday)
//    * at 11:30:00 AM. It does not run on Saturday
//    * or Sunday.
//    */
//
//    for (var i = 0; i < fb_pages_to_scrape.length; i++){
//      var page = fb_pages_to_scrape[i];
//      var endpoint =  'https://graph.facebook.com/v2.10/'+page+'/events?access_token='+fb_access_token;
//
//      // request fb page
//      request.get(endpoint,options,function(err,res,body){
//        if(res.statusCode === 200 ) {
//          console.log(body);
//          console.log(body.data)
//        }
//      });
//    }
//      //parse page
//
//      //for each event check if the id already exists in the db
//
//      // if it doesn't add it
//    }
//
//
//   }, function () {
//     /* This function is executed when the job stops */
//   },
//   true, /* Start the job right now */
//   timeZone /* Time zone of this job. */
// );

/////

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static('public'))

var buildings = require('./buildings.json');

var pg = require('pg');
var pgp = require('pg-promise')();
var database_url = process.env.DATABASE_URL || 'postgres://MattSchrage@localhost:5432/peekbackend';

var db = pgp(database_url);
var moment = require('moment');

//var bodyParser = require('body-parser')

//app.use(bodyParser.json())
//query for get; body for post

// ////////SMS NOTIFICATIONS/////////////////
// setInterval(function() {
//   // check db for reminders
// }, 1000 * 60);
// ///

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

app.post('/log', function(req, res) {
  var type = req.body.type,
      value = req.body.value,
      userId = req.body.userId;
  console.log(type, value, userId);
  //res.send(type, value, userId)
  if (type === "AppClosed") {
    res.send('Rejected');
    return;
  }
  pg.connect(process.env.DATABASE_URL || database_url , function(err, client, done) {
    client.query('INSERT INTO logs(EventType, value, userId, timestamp) values($1, $2, $3, CURRENT_TIMESTAMP)',[type, value, userId], function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {
          res.send('Inserted into DB');
         //res.redirect("http://heypeek.com");
       }
    });
  });
  //Add to analytics Database
});

app.get('/event', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  var id = req.query.id;
  pg.connect(process.env.DATABASE_URL || database_url , function(err, client, done) {
    client.query('SELECT * FROM events WHERE id = $1',[id], function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {
         res.send(result["rows"]);
       }    //; }
    });
  });

});


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
        email = req.body.email,
        fbid  = req.body.fbid;
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
      client.query('INSERT INTO events(name, icon, startDate, endDate, details, hostName, locationName, location, color, verified, email, fbid) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',[name, icon, startDate, endDate, details, hostName, locationName, location, color, false, email, fbid], function(err, result) {
        done();
        if (err)
         { console.error(err); res.send("Error " + err); }
        else
         {
           res.redirect("http://heypeek.com");
         }    //res.send('Inserted into DB'); }
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
  res.send({"count":"171"});
});

app.get('/tz', function(req, res) {
  pg.connect(database_url, function(err, client, done) {
    client.query('show timezone', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send(result); }
    });
  });
});

app.get('/est', function(req, res) {
  pg.connect(database_url, function(err, client, done) {
    client.query('SET TIME ZONE \'EST\'', function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send(result); }
    });
  });
});

app.get('/now', function(req, res) {
  pg.connect(database_url, function(err, client, done) {
    client.query('SELECT '+req.query.q, function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       {     res.send(result); }
    });
  });
});


app.get('/feed', function(req, res) {
  console.log("FEED");
  var today = db.query('SELECT * FROM events WHERE startDate > now() AT TIME ZONE \'EST\' - interval \'3 hours\' AND startDate < TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' ORDER BY startDate ASC');
  var tomorrow = db.query('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' AND startDate < TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' + interval \'1 day\' ORDER BY startDate ASC');
  var upcoming = db.query('SELECT * FROM events WHERE startDate >= TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' + interval \'1 day\' AND startDate < TIMESTAMP \'tomorrow\' AT TIME ZONE \'EST\' + interval \'7 day\' ORDER BY startDate ASC');
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

app.get('/analytics_this-is-a-dangerous-hack', function (req, res) {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  pg.connect(process.env.DATABASE_URL || database_url, function(err, client, done) {

    client.query(req.query.dbquery, function(err, result) {
      done();
      if (err)
       { console.error(err); res.send("Error " + err); }
      else
       { console.log(result["rows"]);
         res.send(result.rows);}
    });
  });
});

app.get('/updates', function(req, res){
  var fb_access_token    = '1417764994922669|LuV9cQ_Ew8L5k52sf81X_I6PkKM'
  var fb_pages_to_scrape = ['JFKJrForum','harvardartmuseums','OCSHarvard']
  var emoji_pool         = [['💬'], ['🎨','🖌','🖼'],['📊','📈','👔']]
  var host_name          = ['IOP Forum', 'Harvard Art Museum', 'OCS']
  var colors             = ['#2ecc71','#e74c3c','#9b59b6','#3498db','#f1c40f']
  var request = require('request');


  fb_pages_to_scrape.forEach(function(page, i) {
    var endpoint =  'https://graph.facebook.com/v2.10/'+page+'/events?access_token='+fb_access_token;
    request.get(endpoint,function(err,res,body){
      if(res.statusCode === 200 ) {
        //console.log(body);
        console.log(page);
        console.log(endpoint + '\n\n\n');

        var payload = JSON.parse(body).data;
        // console.log(payload);
        payload.map(function(event){
          // console.log(event.name);

          Array.prototype.randomElement = function () {
            return this[Math.floor(Math.random() * this.length)]
          }
          var postData = {};
          postData.name = event.name;
          postData.fbid = event.id
          postData.icon =  emoji_pool[i].randomElement();
          postData.color = colors.randomElement()
          postData.startDate = event.start_time;
          postData.details   = event.description
          postData.locationBuilding   = event.place.name
          if (event.place.location) {
            postData.longitude = event.place.location.longitude
            postData.latitude  = event.place.location.latitude
          }

          postData.hostName  = host_name[i]
          postData.email = 'bot@heypeek.com'

          pg.connect(database_url || process.env.DATABASE_URL, function(err, client, done) {

            client.query('SELECT * FROM events WHERE fbid = $1',[event.id], function(err, result) {
              done();
              if (err){
                 console.error(err);
              } else {
                 console.log('checking for fbid in db');
                 if(result["rows"].length == 0){
                   console.log(postData);
                   console.log('event does not exist... creating it');
                   request({
                       url: "https://lol.com",//"https://freefood-backend.herokuapp.com/event",
                       method: "POST",
                       json: true,   // <--Very important!!!
                       body: postData
                   }, function (error, response, body){
                       console.log(response);
                   });
                 }
                 else {
                   console.log('event exists... next!');
                 }
               }
            });
          });



        })



      }
    });
  });

  res.send("updating...")
});

app.listen(process.env.PORT || 8000);
