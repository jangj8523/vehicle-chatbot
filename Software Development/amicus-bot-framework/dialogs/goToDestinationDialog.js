

const { ActivityTypes } = require('botbuilder');

const zlib = require('zlib');
var request = require('request');
var path = require("path");
var xlsx = require('node-xlsx');
const utilManager = require("../utilManager.js")
const { ResponseList } = require('../constant.js')
const amicusEncode = require('../util/jwtManager.js');


const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');

const entityType = {
  CUISINE: 'RestaurantReservation.Cuisine',
  NAME: 'RestaurantReservation.PlaceName',
}

const PREFIX = 0;
const SUFFIX = 1;

// Handles the GoToDestination dialog to navigate a user to a specified
// restaurant destination by capturing the appropriate user intent
// suggesting a list of restaurants within the scope of the user suggested
// criteria, and confirming a final location
// Integrated with Google Maps API
class goToDestinationDialog  extends ComponentDialog {
    constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new ChoicePrompt('choicePrompt'));
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            this.startRestaurantConvo.bind(this),
            this.confirmRestaurantChoice.bind(this),
            this.startRestaurantConvo.bind(this),
            this.finalConfirmChoice.bind(this),
          ]));
      }

    async responseRetrieval(step, restaurantList, place, type) {
      if (restaurantList.length === 0) {
        var response = `Unfortunately, I can't find any ${place} nearby.`
        let encodedAmicus = amicusEncode(response, "negative");
        await step.context.sendActivity(encodedAmicus);
        step.values.gracefulFailure = true;
        return step.endDialog(step.values);
      }

      var response = null;
      if (type == entityType.NAME) {
        response = await utilManager.getRandomResponse(ResponseList["FOUND_RESTAURANT_RESPONSE"]);
      } else {
        response = await utilManager.getRandomResponse(ResponseList["RESTAURANT_RECOMMENDATION_RESPONSE"]);
      }
      var choicesList = await utilManager.constructChoicePrompt(place, restaurantList, response);
      var optionList = await utilManager.constructOptionList (place, restaurantList, response);

      var response = response[PREFIX] + place + response[SUFFIX] + "\n";
      response += choicesList;

      let encodedAmicus = amicusEncode(response, "neutral");
      step.values.optionsList = optionList;
      return await step.prompt('textPrompt', encodedAmicus);
    }

    async startRestaurantConvo(step) {
      step.values.gracefulFailure = false;
      if (step.values.conversation == null){
          step.values.conversation = []
      }
      if (step.context.activity.text === null && step.options.entities.length <= 0) {
        step.values.gracefulFailure = true;
        return await step.endDialog(step.values);
      }
      console.log("STEP ", step);
      step.values.close = true;
      step.values.skip_intro = false;
      //The first ranking entity of user's query...
      var type = step._info.options.entities[0].type;
      var place = step._info.options.entities[0].entity;

      if (type == null) {
        place = step.context.activity.text;
      }
      //WE change the user's choice of destination with their most recent input
      // if (step.context.activity.text !== null && step.context.activity.text !== undefined) { place = step.context.activity.text; }
      step.values.place = place;

      var restaurantList = null;
      restaurantList = await utilManager.findRestaurantList(place, type, (type === entityType.NAME));
      console.log("RESU", restaurantList);
      return this.responseRetrieval(step, restaurantList, place, type);
    }

    async getChoiceNumber(userChoice) {
      var number = 5;
      if (userChoice === "1" || userChoice === "one" || userChoice === "first") {
        number = 1;
      } else if (userChoice === "2" || userChoice === "two" || userChoice === "second") {
        number = 2
      } else if (userChoice === "3" || userChoice === "three" || userChoice === "third") {
        number = 3
      } else if (userChoice === "4" || userChoice === "four" || userChoice === "fourth") {
        number = 4
      } else if (userChoice === "others" || userChoice === "fifth" || userChoice === "five" || userChoice === "5") {
        number = 5
      }
      return number;
    }

    async confirmRestaurantChoice(step) {
        var userChoice = step.context.activity.text.toLowerCase();
        console.log("CHEKC OUT ", step);
        var optionList = step._info.values.optionsList;
        console.log("PL", optionList);
        step.values.conversation.push(userChoice);
        var choiceNumber = await this.getChoiceNumber(userChoice);
        if (choiceNumber == 5 || choiceNumber > optionList.length) {
          var response = await utilManager.getRandomResponse(ResponseList["RESTAURANT_QUERY_CLARIFICATION_RESPONSE"]);
          let encodedAmicus = amicusEncode(response[PREFIX], "negative");
          step._info.options.entities[0].type = null;
          step._info.options.entities[0].entity = null;
          return await step.prompt('textPrompt', encodedAmicus);
        } else {
          var choiceNumber = await this.getChoiceNumber(userChoice);
          var preferPlace = optionList[choiceNumber-1]
          var response = `Sounds great; let's head over to option ${preferPlace}!"`
          let encodedAmicus = amicusEncode(response, "positive");
          await step.context.sendActivity(encodedAmicus);
          return await step.endDialog(step.values);
        }
    }

    async finalConfirmChoice(step) {
        var userChoice = step.context.activity.text.toLowerCase();
        var optionList = step._info.values.optionsList;
        var choiceNumber = await this.getChoiceNumber(userChoice);
        step.values.conversation.push(userChoice);
        if (choiceNumber == 5 || choiceNumber > optionList.length) {
          step.values.gracefulFailure = true;
          var response = await utilManager.getRandomResponse(ResponseList["RESTAURANT_GRACEFUL_FAILURE_RESPONSE"]);
          let encodedAmicus = amicusEncode(response[PREFIX] + step.values.place + response[SUFFIX], "negative");
          await step.context.sendActivity(encodedAmicus);
        } else {
          var response = `All set! Navigating to option "${optionList[choiceNumber-1]}!"`
          let encodedAmicus = amicusEncode(response, "positive");
          await step.context.sendActivity(encodedAmicus);
        }
        return await step.endDialog(step.values);
    }

}

module.exports.GoToDestinationDialog = goToDestinationDialog;
