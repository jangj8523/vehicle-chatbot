const apiKey = 'AIzaSyAuPYGjxn_FBJk2WMPsJ9wdd4Le42obkSU';
const googleMapsClient = require('@google/maps').createClient({
  key: apiKey
});

const zlib = require('zlib');
var request = require('request');


class MapApi {
    constructor() {
        let NearbyMapsApi = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
        NearbyMapsApi += "location=-33.8670522,151.1957362&radius=1500&type=restaurant&keyword=cruise&key="
        NearbyMapsApi += apiKey 
    }

    

}

module.exports.MapApi = MapApi;
