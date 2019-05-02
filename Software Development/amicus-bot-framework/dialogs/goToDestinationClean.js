

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

                console.log(step.options.entities);
                if (step.options.entities.length <= 0) {
                  return await step.prompt('textPrompt', `I have nothing to work with here. Give me more context.`);
                }


                var entity = step.options.entities[0];
                var entityName = step.options.entities[0].entity.toLowerCase();
                if (entity.type === entityType.CUISINE) {
                  //I gave you a type of restaurant
                  console.log("CUISINE");

                } else if (entity.type === entityType.NAME) {
                  //I gave you a restaurant name
                  console.log("NAME");

                }

                console.log(entityName);

                var dest_entity = step.options.entities[0];//.entity;

                /***
                Get Nearby Location API:
                ============================
                */

                var chainSpecificList = new Map();
                //var chainGeneralList = new Map();

                if (step.values.chainSpecificData == null){
                    step.values.chainSpecificData  = {};

                    var directory = path.resolve("./") + "/resource/food_list.xlsx";
                    var obj = xlsx.parse(directory);


                    for (var i=1; i < obj[0]["data"].length-1; i++) {
                      var locationList = [];
                      var place = (obj[0]["data"][i][0]).toLowerCase();
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



                // var path = document.location.pathname;
                console.log(chainSpecificList);
                console.log(entityName);
                console.log(chainSpecificList.get(entityName));

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

                //step.values.conversation.push(step.result);
                return await step.prompt('choicePrompt', promptOptions);
            },

            async function (step) {

                step.values.activity = step.result.value;
                //step.values.conversation.push(step.result.value);
                await step.context.sendActivity(`Great! We will head over to "${step.result.value}!"`);


                // End the dialog, returning the user info.
                return await step.endDialog(step.values);
            }

        ]));
    }

}

module.exports.GoToDestinationClean = GoToDestinationClean;
