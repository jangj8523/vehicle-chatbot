

const { ActivityTypes } = require('botbuilder');

const zlib = require('zlib');
var request = require('request');
var path = require("path");
var xlsx = require('node-xlsx');

const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');

const entityType = {
  CUISINE: 'RestaurantReservation.Cuisine',
  NAME: 'RestaurantReservation.PlaceName',
}

class GoToDestinationClean  extends ComponentDialog {



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

                console.log(step.options.entities);
                if (step.options.entities.length <= 0) {
                  return await step.prompt('textPrompt', `I have nothing to work with here. Give me more context.`);
                }

                // console.log(GoToDestinationClean.getMatchingPlaces("YESSSS"));
                var entity = step.options.entities[0];
                var entityName = step.options.entities[0].entity;
                if (entity.type === entityType.CUISINE) {
                  //I gave you a type of restaurant
                  console.log("CUISINE");

                } else if (entity.type === entityType.NAME) {
                  //I gave you a restaurant name
                  console.log("NAME");

                }

                console.log(entityName);


                /***
                Get Nearby Location API:
                ============================
                */

                var chainSpecificList = new Map();
                var chainGeneralList = new Map();
                var chainGeneralListLength = 0;
                //var chainGeneralList = new Map();

                if (step.values.chainSpecificData == null){
                    step.values.chainSpecificData  = {};

                    var directory = path.resolve("./") + "/resource/food_list.xlsx";
                    var obj = xlsx.parse(directory);


                    for (var i=1; i < obj[0]["data"].length-1; i++) {
                      if (obj[0]["data"][i].length == 0) {
                        break;
                      }
                      var locationList = [];
                      // console.log("done: ", obj[0]["data"][i]);
                      var place = (obj[0]["data"][i][0]);
                      for (var j = 0; j < obj[0]["data"][0].length; j++) {
                          if (j === 0) {
                            continue;
                          }
                          locationList.push(obj[0]["data"][i][j]);
                      }
                      chainSpecificList.set(place, locationList);
                    }
                    step.values.chainSpecificData = chainSpecificList;
                } else {
                    chainSpecificList = step.values.chainSpecificData;
                }
                // Key: String of the Name of the location
                // Example: chainSpecificList["Starbucks"] = [Tresidder Memorial,	Stanford Shopping Center,	University Ave, Palo Alto	El Camino Real, Menlo Park]
                // Value: List of possible places for each location (size is 4)


                if (step.values.chainGeneralList == null){
                    step.values.chainGeneralList  = {};

                    var directory = path.resolve("./") + "/resource/food_list.xlsx";
                    var obj = xlsx.parse(directory);


                    for (var i=1; i < obj[1]["data"].length-1; i++) {
                      // console.log('chkasdf00');
                      if (obj[1]["data"][i].length == 0) {
                        break;
                      }
                      // console.log("CHECK: ", obj[1]["data"][i])
                      var locationList = [];
                      chainGeneralListLength+=1;
                      var place = (obj[1]["data"][i][0]);
                      for (var j = 0; j < obj[1]["data"][0].length; j++) {
                          if (j === 0) {
                            continue;
                          }
                          if (j % 2 == 0) {
                            continue
                          }
                          locationList.push(obj[1]["data"][i][j] + ": " + obj[1]["data"][i][j+1]);
                      }
                      chainGeneralList.set(place, locationList);
                    }
                    step.values.chainGeneralList = chainGeneralList;
                } else {
                    chainGeneralList = step.values.chainGeneralList;
                }


                // var path = document.location.pathname;
                // console.log(chainSpecificList);
                // console.log(entityName);
                // console.log(chainSpecificList.get(entityName));


                //Find similar sounding locations
                var dest_entity = null;
                var response = [`Sorry, but I couldn't find a single instance of "`, `". But maybe I can recommend you some places to go? How about some "`];
                var responseType = 1;
                var locationList = [];
                var suggestion = null;

                for (var key of chainSpecificList.keys()) {
                  // console.log("chainSpecificList ", key)
                  // if (!chainSpecificList.hasOwnProperty(key)|| key == null) {
                  //   continue;
                  // }
                  if (entityName.includes(key)) {
                    response = [`Ok, there are more than one "`, `". Which one are you referring to?`]
                    dest_entity = key;
                    locationList = chainSpecificList.get(key);
                  }
                }

                if (dest_entity == null) {
                  for (var key of chainGeneralList.keys()) {
                    // console.log("chaingeneralList ", key)
                    // if (!chainGeneralList.hasOwnProperty(key)) {
                    //   continue;
                    // }
                    if (entityName.includes(key)) {
                      response = [`Ok, we have some similar instance of "`, `". They might not be exact but here are some options that you might like!`]
                      dest_entity = key;
                      locationList = chainGeneralList.get(key);
                      responseType = 2;

                    }
                  }
                }

                //If we couldn't find any option, then we randomly generate
                if (dest_entity == null) {
                  dest_entity = step.options.entities;
                  var index = Math.floor(Math.random() * (chainGeneralListLength-1));
                  var counter = -1
                  for (var p of chainGeneralList.keys()){
                    // if (!chainGeneralList.hasOwnProperty(p)) {
                    //   console.log('skip');
                    //   continue;
                    // }
                    counter+=1;
                    console.log(counter, index);
                    if (counter === index){
                      suggestion = p;
                      responseType = 3;
                      locationList = chainGeneralList.get(p);
                      break;
                    }
                  }

                }

                // console.log("CHAIN: ", chainGeneralList);

                var promptOptions = null;
                if (responseType == 1) {
                    promptOptions = {
                        prompt: response[0] + dest_entity + response[1],
                        choices: [dest_entity + ': '+ locationList[0], dest_entity + ': '+ locationList[1], dest_entity + ': '+ locationList[2], dest_entity + ': '+ locationList[3]]
                    };
                } else if (responseType == 2) {
                    promptOptions = {
                        prompt: response[0] + dest_entity + response[1],
                        choices: [dest_entity + ': '+ locationList[0], dest_entity + ': '+ locationList[1], dest_entity + ': '+ locationList[2], dest_entity + ': '+ locationList[3]]
                    };
                } else {
                  promptOptions = {
                      prompt: response[0] + entityName + response[1] + suggestion + "s\"?",
                      choices: [locationList[0], locationList[1], locationList[2], locationList[3], "Others"]
                  };
                }

                //step.values.conversation.push(step.result);
                return await step.prompt('choicePrompt', promptOptions);
            },

            async function (step) {
                step.values.activity = step.result.value;
                //step.values.conversation.push(step.result.value);
                if (step.result.value == "Others") {
                  return await step.prompt('textPrompt', "Ok, would you mind telling me the place of where you would like to go? Just the place name please!");
                } else {
                  await step.context.sendActivity(`Great! We will head over to "${step.result.value}!"`);
                  return await step.endDialog(step.values);
                }
            },

            async function (step) {

              var chainSpecificList = new Map();
              var chainGeneralList = new Map();
              var chainGeneralListLength = 0;
              step.values.chainSpecificData = null;
              step.values.chainGeneralList = null;

              var entityName = step.result;
              var dest_entity = step.result;
              //var chainGeneralList = new Map();
              console.log("SECOND ITERATION");
              if (step.values.chainSpecificData == null){
                  step.values.chainSpecificData  = {};

                  var directory = path.resolve("./") + "/resource/food_list.xlsx";
                  var obj = xlsx.parse(directory);


                  for (var i=1; i < obj[0]["data"].length-1; i++) {
                    console.log("indexing");
                    if (obj[0]["data"][i].length == 0) {
                      break;
                    }
                    var locationList = [];
                    // console.log("done: ", obj[0]["data"][i]);
                    var place = (obj[0]["data"][i][0]);
                    for (var j = 0; j < obj[0]["data"][0].length; j++) {
                        if (j === 0) {
                          continue;
                        }
                        locationList.push(obj[0]["data"][i][j]);
                    }
                    chainSpecificList.set(place, locationList);
                  }
                  step.values.chainSpecificData = chainSpecificList;
              } else {
                  chainSpecificList = step.values.chainSpecificData;
              }
              // Key: String of the Name of the location
              // Example: chainSpecificList["Starbucks"] = [Tresidder Memorial,	Stanford Shopping Center,	University Ave, Palo Alto	El Camino Real, Menlo Park]
              // Value: List of possible places for each location (size is 4)


              if (step.values.chainGeneralList == null){
                  step.values.chainGeneralList  = {};

                  var directory = path.resolve("./") + "/resource/food_list.xlsx";
                  var obj = xlsx.parse(directory);

                  console.log("second indexing");

                  for (var i=1; i < obj[1]["data"].length-1; i++) {
                    // console.log('chkasdf00');
                    if (obj[1]["data"][i].length == 0) {
                      break;
                    }
                    // console.log("CHECK: ", obj[1]["data"][i])
                    var locationList = [];
                    chainGeneralListLength+=1;
                    var place = (obj[1]["data"][i][0]);
                    for (var j = 0; j < obj[1]["data"][0].length; j++) {
                        if (j === 0) {
                          continue;
                        }
                        if (j % 2 == 0) {
                          continue
                        }
                        locationList.push(obj[1]["data"][i][j] + ": " + obj[1]["data"][i][j+1]);
                    }
                    chainGeneralList.set(place, locationList);
                  }
                  step.values.chainGeneralList = chainGeneralList;
              } else {
                  chainGeneralList = step.values.chainGeneralList;
              }

                // var path = document.location.pathname;
                // console.log(chainSpecificList);
                // console.log(entityName);
                // console.log(chainSpecificList.get(entityName));


                //Find similar sounding locations
                var dest_entity = null;
                var response = [`Sorry, but I couldn't find a single instance of "`, `". But maybe I can recommend you some places to go? How about some "`];
                var responseType = 1;
                var locationList = [];
                var suggestion = null;

                for (var key of chainSpecificList.keys()) {
                  // console.log("chainSpecificList ", key)
                  // if (!chainSpecificList.hasOwnProperty(key)|| key == null) {
                  //   continue;
                  // }
                  if (entityName.includes(key)) {
                    response = [`Ok, there are more than one "`, `". Which one are you referring to? The one in: `]
                    dest_entity = key;
                    locationList = chainSpecificList.get(key);
                  }
                }

                if (dest_entity == null) {
                  for (var key of chainGeneralList.keys()) {
                    // console.log("chaingeneralList ", key)
                    // if (!chainGeneralList.hasOwnProperty(key) || key == null) {
                    //   continue;
                    // }
                    if (entityName.includes(key)) {
                      response = [`Ok, we have some similar instance of "`, `". They might not be exact but here are some options that you might like!`]
                      dest_entity = key;
                      locationList = chainGeneralList.get(key);
                      responseType = 2;

                    }
                  }
                }

                //If we couldn't find any option, then we randomly generate
                if (dest_entity == null) {
                  dest_entity = step.options.entities;
                  var index = Math.floor(Math.random() * (chainGeneralListLength-1));
                  var counter = -1
                  for (var p of chainGeneralList.keys()){
                    // if (!chainGeneralList.hasOwnProperty(p)) {
                    //   console.log('skip');
                    //   continue;
                    // }
                    counter+=1;
                    console.log(counter, index);
                    if (counter === index){
                      suggestion = p;
                      responseType = 3;
                      locationList = chainGeneralList.get(p);
                      break;
                    }
                  }

                }

                // console.log("CHAIN: ", chainGeneralList);
                console.log("response: ", response);
                console.log("chai: ", chainGeneralList);
                console.log("suge: ", suggestion);
                console.log(locationList);
                console.log('lenght: ', chainGeneralListLength);
                console.log("YES");

                var promptOptions = null;
                if (responseType == 1) {
                    promptOptions = {
                        prompt: response[0] + dest_entity + response[1],
                        choices: [locationList[0], locationList[1], locationList[2], locationList[3]]
                    };
                } else if (responseType == 2) {
                    promptOptions = {
                        prompt: response[0] + dest_entity + response[1],
                        choices: [dest_entity + ': '+ locationList[0], dest_entity + ': '+ locationList[1], dest_entity + ': '+ locationList[2], dest_entity + ': '+ locationList[3]]
                    };
                } else {
                  promptOptions = {
                      prompt: response[0] + entityName + response[1] + suggestion + "\"?",
                      choices: [locationList[0], locationList[1], locationList[2], locationList[3], "Others"]
                  };
                }

                //step.values.conversation.push(step.result);
                return await step.prompt('choicePrompt', promptOptions);
            },

            async function (step) {
                step.values.activity = step.result.value;
                //step.values.conversation.push(step.result.value);
                if (step.result.value == "Others") {
                  await step.prompt('textPrompt', "Sorry I couldn't find the right place. Maybe you should ask for Google's help! I will try to be smarter to help you.");
                } else {
                  await step.context.sendActivity(`Great! We will head over to "${step.result.value}!"`);
                }
                return await step.endDialog(step.values);
            }

        ]));
    }

}

module.exports.GoToDestinationClean = GoToDestinationClean;
