

const { ActivityTypes } = require('botbuilder');

const zlib = require('zlib');
var request = require('request');
var path = require("path");
var xlsx = require('node-xlsx');

var googleMapsApiKey = 'AIzaSyCbwjE5ceMa_6AWrVl6oKc2Ax5FWOXDAEc';
const googlePlace = require("google-places-web").default; // instance of GooglePlaces Class;
const amicusEncode = require('./util/jwtManager.js');

//https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.8670522,151.1957362&radius=1500&type=restaurant&keyword=cruise&key=YOUR_API_KEY
var DISTANCE_THRESHOLD = 25;


const entityType = {
  CUISINE: 'RestaurantReservation.Cuisine',
  NAME: 'RestaurantReservation.PlaceName',
}

const PREFIX = 0;
const SUFFIX = 1;

class UtilManager {

  constructor() {
    this.chainGeneralList = null;
    this.chainSpecificList = null;
  }

  async constructOptionList(originalName, placeList, response) {
    var promptOptions = null;
    var choicesList = [];
    console.log("choices", placeList);
    for (var i = 0; i < placeList.length; ++i) {
      choicesList[i] = String(i+1) + ", " + placeList[i]["name"] + " in \""  + placeList[i]["address"] + "\"\n"
    }
    choicesList[4] = String(5) + ", " + "Others\n";

    // promptOptions = {
    //     prompt: response[PREFIX] + originalName + response[SUFFIX],
    //     choices: choicesList
    // };
    // console.log(promptOptions);


    return choicesList;
  }

  async constructChoicePrompt(originalName, placeList, response) {
    var promptOptions = null;
    var choicesList = "";
    console.log("choices", placeList);
    for (var i = 0; i < placeList.length; ++i) {
      choicesList += String(i+1) + ", " + placeList[i]["name"] + " in \""  + placeList[i]["address"] + "\"\n"
    }
    choicesList += "5, Others\n";

    // promptOptions = {
    //     prompt: response[PREFIX] + originalName + response[SUFFIX],
    //     choices: choicesList
    // };
    // console.log(promptOptions);


    return choicesList;
  }


  async getRandomResponse(responseList) {
    var reply = responseList[Math.floor(Math.random() * responseList.length)];
    return reply;
  }

  async sendGoogleRequest(url) {
    return new Promise(function (resolve, reject) {
      request(url, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve(body);
        } else {
          reject(error);
        }
      });
    });
  }

  async initializeMap(numrows, numcols) {
    var arr = [];
     for (var i = 0; i < numrows; ++i){
        var columns = [];
        for (var j = 0; j < numcols; ++j){
           columns[j] = 0;
        }
        arr[i] = columns;
      }
      return arr;
  }

  async editDistance(retrievedName, entityName){
    var editDist = await this.initializeMap(entityName.length + 1,retrievedName.length+1);
    for (var i = 1; i <= retrievedName.length; i++){
      editDist[0][i] = i;
    }

    for (var j = 1; j <= entityName.length; j++){
      editDist[j][0] = j;
    }


    for (var i = 1; i <= retrievedName.length; i++){
      for (var j = 1; j <= entityName.length; j++){
        if (retrievedName[i-1] == entityName[j-1]) {
          editDist[j][i] = editDist[j-1][i-1]
        } else {
          editDist[j][i] = Math.min(editDist[j-1][i-1], editDist[j-1][i], editDist[j][i-1]) + 1
        }
      }
    }
    return editDist[entityName.length][retrievedName.length];
  }


  async findRestaurantList(entityName, entityType, isCuisine) {
      var googlePlaceSearch = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.4419,-122.1430&radius=5000&keyword=";
      if (isCuisine) {
        googlePlaceSearch = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=37.4419,-122.1430&radius=10000&type=restaurant&keyword="
      }
      var parameters = entityName + "&key=" + googleMapsApiKey;
      googlePlaceSearch += parameters;
      var responseBody = null
      console.log(googlePlaceSearch);
      var responseBody = await this.sendGoogleRequest(googlePlaceSearch);
      var response = JSON.parse(responseBody);
      console.log(response)
      var placesList = response['results'];
      var relevantList = [];
      var counter = 0;
      for (var i = 0; i < placesList.length; i++) {
          var placeInfo = placesList[i];
          var retrievedName = placeInfo["name"];
          console.log(retrievedName, placeInfo);
          var editDis = await this.editDistance(retrievedName.toLowerCase(), entityName.toLowerCase());
          console.log("distance", editDis, DISTANCE_THRESHOLD);
          if (editDis < DISTANCE_THRESHOLD) {
            relevantList[counter] = {"name": retrievedName, "address":placeInfo["vicinity"]};
            counter += 1;
          }
          if (counter == 4) {
            break;
          }
      }
      console.log('RELECANTLIST:', relevantList);
      return relevantList;
  }



  getRestaurantSpecificList () {
      var chainSpecificList = new Map();
      //var chainGeneralList = new Map();

      if (this.chainSpecificData == null){
          var directory = path.resolve("./") + "/resource/food_list.xlsx";
          var obj = xlsx.parse(directory);
          for (var i=1; i < obj[0]["data"].length-1; i++) {
            if (obj[0]["data"][i].length == 0) {
              break;
            }
            var locationList = [];
            var place = (obj[0]["data"][i][0]);
            for (var j = 0; j < obj[0]["data"][0].length; j++) {
                if (j === 0) {
                  continue;
                }
                locationList.push(obj[0]["data"][i][j]);
            }
            chainSpecificList.set(place, locationList);
          }
      }
      return chainSpecificList;
    }
}



module.exports = new UtilManager();
