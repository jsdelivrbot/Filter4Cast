const express                  = require('express');
const router                   = express.Router();
const request                   = require('request-promise');
const dateformat = require('dateformat');
var fs = require('fs')
    , split = require('split')
;
//===============ROUTES=================

const UAA_URL = process.env.uaaUrl || 'https://6a1e5ff3-ab32-45b4-bf67-4548a9c2efdb.predix-uaa.run.aws-usw02-pr.ice.predix.io/oauth/token';
const CLIENT_ID = process.env.clientId || 'timeseries_client_readonly';
const CLIENT_SECRET = 'secret';
const TS_ZONE_ID = process.env.zoneId ||'067e39c4-de83-40e2-b966-2f83ea5fc292';


 

//define initial variables here --------------- //

var days_beteewn_fchange = 90;

const LONG_DAYS_PERIOD = 2000;
const SHORT_DAYS_PERIOD=1000;


//----------------------//

var resetDate_l_asDate_co2 = new Date(1499903882588 + 86400000*20)
var resetDate_l_asDate_co1 = new Date(1499903882588 + 10* 86400000)
        
function max(a,b)
{
    if(a>b) return a;
    else return b;
}
function min(a,b)
{
    if(a<b) return a;
    else return b;
}

router.get('/', function(req, res){
    res.send("inside router");
});
router.get('/', function(req, res){
    res.send("inside router");
});
// VALUES RETRIEVED FROM API
router.post('/getValues',function(req,res){

    var resetDate_l = (req.body.resetDate).getTime() / 1000;

    //var resetDate =  req.body.resetDate;
        request({
                    headers: {
                        'Content-Type': 'application/json',
                        'x-aio-key': "2880ecd4b0c447f8b2eb25c704490f61"
},
    uri: 'https://io.adafruit.com/api/v2/'+ req.body.username + '/feeds/' + req.body.feed_key+ '/data?start_time='+ req.body.start+ '&end_time=' + req.body.end,
        method: 'GET',
        json: true
}).then(data => {

    var date_voc_long = (Date.now() - LONG_DAYS_PERIOD * 86400000) / 1000; 
    var date_voc_short = (Date.now() - SHORT_DAYS_PERIOD * 86400000)/1000;

    var date_reset = resetDate_l;

    var changeRequired = true;
    var numDays = 0;

    var total_voc_long = 0;

    var total_voc_short = 0;
    var total_voc_current = 0;
    var sum_voc_long_per_day = 0;
    var sum_voc_short_per_day = 0;
    var sum_voc_current_per_day = 0;
    var date_of_record = 0;
    var prevDay = 0;

    console.log(data.length);
    for(i=0;i<data.length;i++)
    {
        if(changeRequired==true) {
            prevDay = data[i].created_epoch - 86400;
            changeRequired = false;
            total_voc_long += sum_voc_long_per_day;
            total_voc_short += sum_voc_short_per_day;
            total_voc_current += sum_voc_current_per_day;
            numDays++;
            console.log("numDays" + numDays);
        }

        if( data[i].created_epoch > prevDay && data[i].created_epoch > date_voc_long ){
            sum_voc_long_per_day+=parseInt(data[i].value);
        }
        if( data[i].created_epoch > prevDay && data[i].created_epoch > date_voc_short ){
            sum_voc_short_per_day+=parseInt(data[i].value);
        }

        if( data[i].created_epoch > prevDay && data[i].created_epoch > date_reset ){
            sum_voc_current_per_day+=parseInt(data[i].value);
        }
        if(data[i].created_epoch <= prevDay)
        {
            changeRequired = true
        }
    }
    total_voc_long += sum_voc_long_per_day;
    total_voc_short += sum_voc_short_per_day;
    total_voc_current += sum_voc_current_per_day;

    var new_long_days = min(LONG_DAYS_PERIOD,numDays );
    var new_short_days = min(SHORT_DAYS_PERIOD, numDays);

    var average_voc_long = total_voc_long/new_long_days;
    var average_voc_short = total_voc_short/new_short_days;

    var max_voc = days_beteewn_fchange * average_voc_long;  // calculating the maximal VOC amount until filter has to be changed

    console.log("" + max_voc);

    var prediction = max(0, max_voc - total_voc_current) / average_voc_short;
    console.log("" + prediction);
    res.send("" + prediction);

}).catch(err => {
        console.log('Error:', err);
});
});


// VALUES RETRIEVED FROM FILE
router.post('/getValuesFile',function(req,res) {

    //var resetDate_l = (new Date(req.body.resetDate)).getTime() / 1000;

    var resetDate_l_asDate = "";
    if(req.body.feed_key == "co1"){
        var data = JSON.parse(fs.readFileSync("app/public/co1-20170829-1050.json", 'utf8'));
        resetDate_l_asDate = resetDate_l_asDate_co1;
        var resetDate_l = (new Date(resetDate_l_asDate_co1)).getTime() / 1000
        var filterName = "Filter Lasercutter 2 (Sensor CO1)"
        }
    
    else{
        var data = JSON.parse(fs.readFileSync("app/public/co2-20170829-1048.json", 'utf8'));
        resetDate_l_asDate = resetDate_l_asDate_co2;
        var resetDate_l = (new Date(resetDate_l_asDate_co2)).getTime() / 1000
        var filterName = "Filter Lasercutter 1 (Sensor CO2)"
        }
    console.log("resetdate: " + resetDate_l_asDate );

    ;
    
    var date_voc_long = (Date.now() - LONG_DAYS_PERIOD * 86400000) / 1000;
    var date_voc_short = (Date.now() - SHORT_DAYS_PERIOD * 86400000) / 1000;

    var date_reset = resetDate_l;
    //date_reset.setDate(resetDate);
    var dateNewFormat = dateformat(resetDate_l_asDate, "dd-mm-yyyy HH:MM:ss")

    var changeRequired = true;
    var numDays = 0;

    var total_voc_long = 0;

    var total_voc_short = 0;
    var total_voc_current = 0;
    var sum_voc_long_per_day = 0;
    var sum_voc_short_per_day = 0;
    var sum_voc_current_per_day = 0;
    var date_of_record = 0;
    var nextDay = 0;

    var limit = 0;
   // if(req.body.numpoints == -1)        // no limit
     limit = data.length
     //limit = 100000
    //else
      //  limit = min(req.body.numpoints, data.length);   // chosen datapoints

    var totalSumCurrentPlot=0;
    var plotValues = [];
    var plotTimes = [];
    var datatemp = [];
    for (i = 0; i < limit; i++) { 

        if (changeRequired == true) {
            nextDay = (new Date(data[i].created_at).getTime() + 86400000) / 1000 ; // 
            changeRequired = false;
            total_voc_long += sum_voc_long_per_day;
            total_voc_short += sum_voc_short_per_day;
            total_voc_current += sum_voc_current_per_day;
            sum_voc_long_per_day = 0;
            sum_voc_short_per_day = 0;
            sum_voc_current_per_day = 0; 
            numDays++;
            console.log("numDays " + numDays);
            console.log("total_voc_long " + total_voc_long);

        }
        console.log("date_voc_long " + date_voc_long);


        currentTime = new Date(data[i].created_at).getTime() / 1000;
        console.log("currentTime " + currentTime);
        console.log("nextDay " + nextDay);
        console.log("date_voc_long " + date_voc_long);
        console.log("date_voc_short " + date_voc_short);
        console.log("date_reset " + date_reset);

        if (currentTime < nextDay && currentTime> date_voc_long) {
            sum_voc_long_per_day += parseInt(data[i].value);
        }
        if (currentTime < nextDay && currentTime > date_voc_short) {
            sum_voc_short_per_day += parseInt(data[i].value);
        }

        if (currentTime < nextDay && currentTime > date_reset) {
            sum_voc_current_per_day += parseInt(data[i].value);
            totalSumCurrentPlot+=parseInt(data[i].value);
            plotValues.push(totalSumCurrentPlot);
            plotTimes.push(currentTime);
            var val = [currentTime*1000, totalSumCurrentPlot ];
            
            datatemp.push(val);
        }
        if (currentTime >= nextDay) {
            changeRequired = true
        }
    }
    total_voc_long += sum_voc_long_per_day;
    total_voc_short += sum_voc_short_per_day;
    total_voc_current += sum_voc_current_per_day;
    console.log("numDays " + numDays);
    console.log("total_voc_long " + total_voc_long);
    console.log("total_voc_short " + total_voc_short);
    console.log("total_voc_current " + total_voc_current);

    var new_long_days = min(LONG_DAYS_PERIOD, numDays);
    var new_short_days = min(SHORT_DAYS_PERIOD, numDays);

    var average_voc_long = total_voc_long / new_long_days;
    var average_voc_short = total_voc_short / new_short_days;
    console.log("avg voc long " + average_voc_long)
    console.log("avg voc short " + average_voc_short)
    
    var max_voc = days_beteewn_fchange * average_voc_long;  // calculating the maximal VOC amount until filter has to be changed

    console.log("Max Voc " + max_voc);

    var prediction = (max(0, max_voc - total_voc_current) / (average_voc_short)).toFixed(0);
    console.log("Prediction - days until change: " + prediction );
    
    var filterpercentage = (((days_beteewn_fchange - prediction) / days_beteewn_fchange)*100).toFixed(2)
    
    plotValues.push(max_voc);
    var a= new Date(currentTime + prediction);
    var val = [a*1000, max_voc];
            
            datatemp.push(val);
    
    var data = {
        "prediction": prediction,
        "filterName": filterName,
        "lastChange": dateNewFormat,
        "filterpercentage": filterpercentage,
        "plotValues": plotValues,
        "plotTimes": plotTimes,
        "all": datatemp
        
    }
    res.send(data );
});


// Change Filter 
router.post('/changeFilter',function(req,res) {

    
    if(req.body.feed_key == "co1"){
        resetDate_l_asDate_co1 = new Date().getTime()
        var handover_date = resetDate_l_asDate_co1;
        var filterNr = "Lasercutter 2 (Sensor CO1)"
        }
    
    else{
        resetDate_l_asDate_co2 = new Date().getTime()
        var handover_date = resetDate_l_asDate_co2;
        var filterNr = "Lasercutter 1 (Sensor CO2)"
        }
     var data = {
        "handover_date": dateformat(handover_date, "dd-mm-yyyy HH:MM:ss"),
         "filterNr": filterNr
        
    }
    res.send(data );
});


module.exports = router;