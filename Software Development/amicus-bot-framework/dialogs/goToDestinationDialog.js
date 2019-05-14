

const { ActivityTypes } = require('botbuilder');

const zlib = require('zlib');
var request = require('request');
var path = require("path");
var xlsx = require('node-xlsx');
const utilManager = require("../utilManager.js")
const { ResponseList } = require('../constant.js')


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
        await step.context.sendActivity(`Unfortunately, I can't find any ${place} nearby.`);
        step.values.gracefulFailure = true;
        return step.endDialog(step.values);
      }

      var response = null;
      if (type == entityType.NAME) {
        response = await utilManager.getRandomResponse(ResponseList["FOUND_RESTAURANT_RESPONSE"]);
      } else {
        response = await utilManager.getRandomResponse(ResponseList["RESTAURANT_RECOMMENDATION_RESPONSE"]);
      }
      var choicePrompt = await utilManager.constructChoicePrompt(place, restaurantList, response);
      return await step.prompt('choicePrompt', choicePrompt);
    }

    async startRestaurantConvo(step) {
      step.values.gracefulFailure = false;
      if (step.values.conversation == null){
          step.values.conversation = []
      }
      if (step.result == null && step.options.entities.length <= 0) {
        step.values.gracefulFailure = true;
        return await step.endDialog(step.values);
      }

      //The first ranking entity of user's query...
      var type = step.options.entities[0].type;
      var place = step.options.entities[0].entity;
      //WE change the user's choice of destination with their most recent input
      if (step.result !== null && step.result !== undefined) { place = step.result; }
      step.values.place = place;

      var restaurantList = null;
      restaurantList = await utilManager.findRestaurantList(place, type, (type === entityType.NAME));
      return this.responseRetrieval(step, restaurantList, place, type);
    }


    async confirmRestaurantChoice(step) {
        var userChoice = step.result.value;
        step.values.conversation.push(userChoice);
        if (userChoice === "Others") {
          var response = await utilManager.getRandomResponse(ResponseList["RESTAURANT_QUERY_CLARIFICATION_RESPONSE"]);
          return await step.prompt('textPrompt', response[PREFIX]);
        } else {
          await step.context.sendActivity(`Sounds great; let's head over to ${userChoice}!"`);
          return await step.endDialog(step.values);
        }
    }

    async finalConfirmChoice(step) {
        var userChoice = step.result.value;
        step.values.conversation.push(userChoice);
        if (userChoice == "Others") {
          step.values.gracefulFailure = true;
          var response = await utilManager.getRandomResponse(ResponseList["RESTAURANT_GRACEFUL_FAILURE_RESPONSE"]);
          await step.context.sendActivity(response[PREFIX] + step.values.place + response[SUFFIX]);
        } else {
          await step.context.sendActivity(`All set! Navigating to "${userChoice}!"`);
        }
        return await step.endDialog(step.values);
    }

}

module.exports.GoToDestinationDialog = GoToDestinationDialog;
