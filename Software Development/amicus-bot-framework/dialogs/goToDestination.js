

const { ActivityTypes } = require('botbuilder');
var geolocation = require('geolocation')
const apiKey = 'AIzaSyAuPYGjxn_FBJk2WMPsJ9wdd4Le42obkSU';
const googleMapsClient = require('@google/maps').createClient({
  key: apiKey
});
const zlib = require('zlib');
var request = require('request');
var path = require("path");
var xlsx = require('node-xlsx');

const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');

class GoToDestination  extends ComponentDialog {
    async getMatchingPlaces(location) {
      console.log("YES");
      return null;
    }
    constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new ChoicePrompt('choicePrompt'));
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [

            async function (step) {




                var dest_entity = step.options.entities[0].entity;



                let currretLocationApi = "https://www.googleapis.com/geolocation/v1/geolocate?key="
                currretLocationApi += apiKey

                /***
                Get Current Location API:
                ============================
                */

                // var locationBody = request(currretLocationApi, function(err, response, body) {
                //     console.log(body);
                //     console.log("");
                //     console.log(response);
                //     console.log("");
                //     return body;
                // });

                // console.log(locationBody)
                // var onSuccess = function(position) {
                //     return [position.coords.latitude, position.coords.longitude];
                // }

                // function onError(error) {
                //     console.log('code: '    + error.code    + '\n' +
                //           'message: ' + error.message + '\n');
                // }

                // location = geolocation.getCurrentPosition(onSuccess, onError);
                // console.log(location);

                // async findNearbyLocation (destination) {
                let NearbyMapsApi = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
                NearbyMapsApi += "location=-33.8670522,151.1957362&radius=1500&&keyword= " + dest_entity +"&key="
                NearbyMapsApi += apiKey


                /***
                Get Nearby Location API:
                ============================
                */

                // var responseBody = request(NearbyMapsApi, function(err, response, body) {
                //     console.log(body);
                //     return body;
                // });
                var results = null;
                var responseBody = null;
                if (responseBody !== null) {
                    results = responseBody.results;
                }

                var locationList = []
                if (results !== null && typeof(results) !== "undefined") {
                    for (var i = 0; i < results.length; i++) {
                        console.log(results[i].name);
                    }
                }


                // Check if location data exists
                var locationDataExists = true;
                // Clear the user information and prompt for the user's name.
                if (step.values.conversation == null){
                    step.values.conversation = []
                }
                var chainSpecificList = new Map();
                var chainGeneralList = new Map();

                if (step.values.chainSpecificData == null){
                    step.values.chainSpecificData  = {};
                    step.values.chainGeneralData = {};
                    locationDataExists = false;
                } else {
                  chainSpecificList = step.values.chainSpecificData;
                }


                // Key: String of the Name of the location
                // Example: chainSpecificList["Starbucks"] = [Tresidder Memorial,	Stanford Shopping Center,	University Ave, Palo Alto	El Camino Real, Menlo Park]
                // Value: List of possible places for each location (size is 4)

                if (locationDataExists !== false) {
                  var directory = path.resolve("./") + "/resource/food_list.xlsx";
                  var obj = xlsx.parse(directory);


                  for (var i=1; i < obj[0]["data"].length-1; i++) {
                    var  locationList = [];
                    var place = obj[0]["data"][i][0];
                    for (var j = 0; j < obj[0]["data"][0].length; j++) {
                        if (j === 0) {
                          continue;
                        }
                        locationList.push(obj[0]["data"][i][j]);
                    }
                    chainSpecificList.set(place, locationList);
                  }
                  step.values.chainSpecificData = chainSpecificList;

                }
                // var path = document.location.pathname;




                var promptOptions = null;
                if (locationList.length == 0) {
                    promptOptions = {
                        prompt: `Ok, there are more than one "` + dest_entity + `". Which one are you referring to?`,
                        choices: [dest_entity +": Mt View Office", dest_entity + ": PA Bimmer", "Stevens Creek: " + dest_entity, "Peter Pan: " + dest_entity]
                    };
                } else {
                    promptOptions = {
                        prompt: `Ok, there are more than one "` + dest_entity + `". Which one are you referring to?`,
                        choices: locationList
                    };
                }


                // var destination = this.findNearbyLocation(dest_entity);


                step.values.conversation.push(step.result);
                return await step.prompt('choicePrompt', promptOptions);
            },

            async function (step) {

                step.values.activity = step.result.value;
                step.values.conversation.push(step.result.value);
                await step.context.sendActivity(`Great! We will head over to "${step.result.value}!"`);


                // End the dialog, returning the user info.
                return await step.endDialog(step.values);
            }

        ]));
    }




}

module.exports.GoToDestination = GoToDestination;

// async function (step) {
    //     // Clear the user information and prompt for the user's name.
    //     step.values.userInfo = {};
    //     // result.send("Might be nice to destress and enjoy your favorites!?");
    //     await step.context.sendActivity("Might be nice to destress and enjoy your favorites!?")
    //     const promptOptions = {
    //         prompt: `Here's a list. What about Rubiano’s, the Italian place from last week?`,
    //         choices: ["Rubiano’s", "Pompous", "Izakaya", "Nola", "Circles"]
    //     };
    //     return await step.prompt('choicePrompt', promptOptions);
    // }

    // async function (step) {
    //     // Save the name and prompt for the room number.
    //     step.values.userInfo.userName = step.result;
    //     return await step.prompt('textPrompt', `Hi ${step.result}. What would you like to do?`);
    // },
