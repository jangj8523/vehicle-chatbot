// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory, IMessageActivity } = require('botbuilder');
const { DialogSet, WaterfallDialog, TextPrompt, Dialog, DialogTurnStatus } = require('botbuilder-dialogs');

const amicusEncode = require('./util/jwtManager.js');

const DIALOG_STATE_PROPERTY = 'dialogStatePropertyAccessor';
const USER_INFO_PROPERTY = 'userInfoPropertyAccessor';



const { GoToDestinationDialog } = require("./dialogs/goToDestinationDialog.js");
const { ControlCarFeature } = require("./dialogs/controlCarFeature.js");
const { RequestNameDialog } = require("./dialogs/requestNameDialog.js");
const utilManager = require("./utilManager.js");
const { ResponseList } = require("./constant.js");


const { TextToSpeech } = require("./util/textToSpeech.js");
const intentUri = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/3eaa2bb4-22bf-43da-8c30-f00d0ae07cfc?verbose=true&timezoneOffset=-360&subscription-key=060adde9a0b44caabbac37ac8dcb8cbe&q=";


//TODO working on simplifying this
const PubNub = require('pubnub');
const pubnub = new PubNub({
  publishKey : 'pub-c-08bc673e-b941-4909-9e97-3c388077baef',
  subscribeKey : 'sub-c-e9df644a-3b9d-11e9-9010-ca52b265d058'
});

class MyBot {

    constructor(conversationState, userState) {
        // Record the conversation and user state management objects.
        this.conversationState = conversationState;
        this.userState = userState;
        this.textToSpeech = new TextToSpeech();
        this.sentiment = 0;
        // Create our state property accessors.
        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);

        this.dialogs = new DialogSet(this.dialogStateAccessor)
        .add(new GoToDestinationDialog('goToDestinationDialog'))
        .add(new TextPrompt('textPrompt'))
        .add(new ControlCarFeature('controlCarFeature'))
        .add(new RequestNameDialog('requestNameDialog'))
        .add(new WaterfallDialog('mainDialog', [
            this.promptForChoice.bind(this),
            this.startChildDialog.bind(this),
            this.saveResult.bind(this)
    ]));
    }

    async promptForChoice(step) {
        const user = await this.userInfoAccessor.get(step.context);
        var clarifyResponse = ['Please clarify your question. Thanks!', 'Mind if you asked me again?', 'I didnt quite get that, would you mind repeating?', 'Ummm, would you mind rewording your question again please?'];
        var response = '';
        let encodedAmicus = '';
        user.nameExists = true;
        user.userName = "Jaewoo";
        if (!user.nameExists) {
            user.nameExists = false;
            user.userName = "Vik"
            user.mustClarify = false;

            response = "Welcome! I am Amicus, your friend. To get started input your name!";
            console.log(response);
            encodedAmicus = amicusEncode(response, "positive");

            // await step.prompt('textPrompt', /*encodedAmicus*/"Welcome! I am Amicus, your friend. To get started input your name!");
        } else if (user.mustClarify == true) {
            response = clarifyResponse[Math.floor(Math.random() * clarifyResponse.length)];
            encodedAmicus = amicusEncode(response, "negative");

        } else {
            response = `Yes ${user.userName}, how can I help?`;
            encodedAmicus = amicusEncode(response, "neutral");

        }
        return await step.prompt('textPrompt', encodedAmicus);
    }

    async findIntent (step) {
        let intentApi = intentUri;
        intentApi += step.result;
        const response = await fetch(intentApi);
        const intentResponse = await response.json();


        let topScoreIntent = intentResponse.topScoringIntent.intent;
        let sentiment = intentResponse.sentimentAnalysis.score;
        let userEmotion = intentResponse.sentimentAnalysis.label;
        let entities = null;
        if (intentResponse.entities !== null) {
            entities = intentResponse.entities;
        }
        let query = intentResponse.query;
        console.log(intentResponse)
        // let topScoreIntent = intentResponse['topScoringIntent']['intent']
        // let sentiment = intentResponse['sentimentAnalysis']['score']
        return [topScoreIntent, sentiment, intentResponse, entities, query, userEmotion];
    }

    async startChildDialog(step) {
        // Get the user's info.
        const user = await this.userInfoAccessor.get(step.context);
        // Check the user's input and decide which dialog to start.
        // Pass in the user info when starting either of the child dialogs.
        if (!user.userInfo) {
            user.userInfo = {};
        }
        if (!user.conversation) {
            user.conversation = [];
        }

        //Check how many times the user has given an incorrect input
        if (!user.numInvalidQueries) {
            user.numInvalidQueries = 0;
        }
        user.mustClarify = false;
        console.log(user.numInvalidQueries);

        // if (user.nameExists == false) {
        //   return await step.beginDialog('requestNameDialog', user);
        // }





        var sentimentIntentList = await this.findIntent(step);
        let topScoreIntent = sentimentIntentList[0];
        let sentiment = sentimentIntentList[1];
        let response = sentimentIntentList[2];
        let entities = sentimentIntentList[3];
        let query = sentimentIntentList[4];

        //DEMO PURPOSES: must erase
        // this.sentiment = sentimentIntentList[5];
        var emotionList = ['neutral', 'negative', 'positive']
        this.sentiment = emotionList[Math.floor(Math.random() * emotionList.length)];

        /***
        Navigate to its corresponding intent.
        */
        user.topScoreIntent = topScoreIntent;
        user.sentiment = sentiment;
        user.response = response;
        user.entities = entities;
        user.query = query;
        user.conversation.push(step.result);

        console.log("topScoring");
        console.log(user.topScoreIntent);


        //GetDestinationItem
        if (user.topScoreIntent.includes("goToDestinationDialog")) {
          console.log("topScoringIntent (launch)");
          return await step.beginDialog('goToDestinationDialog', user);
        } else if (user.topScoreIntent.includes("WindowDoorItems")) {
          return await step.beginDialog('controlCarFeature', user);
        }

    }


    async saveResult(step) {
        // Process the return value from the child dialog.
        var response = await utilManager.getRandomResponse(ResponseList["CLOSING_REMARK_RESPONSE"]);
        console.log(step._info.result);
        if (step._info.result) {
            const user = await this.userInfoAccessor.get(step.context);
            // console.log(step);
            var encodedAmicus = '';
            if (step._info.result.confirm === 'no') {
              encodedAmicus = amicusEncode("Please tell me your name again!", "negative");
              return await step.prompt('textPrompt', encodedAmicus);
            }
            if (step._info.result.userName) {
                // Store the results of the reserve-table dialog.
                user.userName = step._info.result.userName;
                user.nameExists = true;
                encodedAmicus = amicusEncode(response +  user.userName, "positive");
            }
            if (step._info.result.gracefulFailure === true) {
              response = await utilManager.getRandomResponse(ResponseList["ERROR_RESPONSE"]);
              encodedAmicus = amicusEncode(response +  user.userName, "negative");
            }
            console.log('saved!: ', response);
            return await step.prompt('textPrompt', encodedAmicus);
        }
        // Restart the main menu dialog.
        // return await step.replaceDialog('mainDialog'); // Show the menu again
    }


    async retrieveEmotions(response){
      var negativeEmotion = ["No"];
      var positiveEmotion = ["Jump", "ThumbsUp", "Punch"];
      var neutralEmotion = ["Wave", "Yes"];

      let emote = null;

      if (this.sentiment === 'neutral') {
        emote = neutralEmotion[Math.floor(Math.random() * neutralEmotion.length)];
      } else if (this.sentiment === 'negative') {
        emote = negativeEmotion[Math.floor(Math.random() * negativeEmotion.length)];
      } else {
        emote = positiveEmotion[Math.floor(Math.random() * positiveEmotion.length)];
      }
        //console.log("emote: ", emote);
        return emote;
    }

    async retrieveState(response){
        var negativeStates = ['Idle', 'Death'];
        var positiveStates = ['Dance', 'Running'];
        var neutralStates = ['Standing', 'Sitting', 'Walking', null];

        let state = null;

        if (this.sentiment === 'neutral') {
          state = neutralStates[Math.floor(Math.random() * neutralStates.length)];
        } else if (this.sentiment === 'negative') {
          state = negativeStates[Math.floor(Math.random() * negativeStates.length)];
        } else {
          state = positiveStates[Math.floor(Math.random() * positiveStates.length)];
        }

        return state;
    }

    async retrieveExpression(response){
        var angryScale = null;
        var surprisedScale = null;
        var sadScale = null;

        let expression = null;

        if (this.sentiment === 'neutral') {
          angryScale = (Math.random() * (0.850 - 0.3200) + 0.3200);
          surprisedScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
          sadScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
        } else if (this.sentiment === 'negative') {
          angryScale = (Math.random() * (0.010 - 0.0500) + 0.0500);
          surprisedScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
          sadScale = (Math.random() * (0.950 - 0.5200) + 0.5200);;
        } else {
          angryScale = (Math.random() * (0.650 - 0.4200) + 0.4200);
          surprisedScale = (Math.random() * (0.650 - 0.4200) + 0.4200);
          sadScale = (Math.random() * (0.320 - 0.1200) + 0.1200);
        }
        expression = {'angryScale':angryScale, 'surprisedScale':surprisedScale, 'sadScale':sadScale}
        return expression;
    }

    async modifyText(response) {
        return response;
    }

    async modifyPitch(){
        var pitch = 0.0;
        var rate = 0.0;
        var volume = 0.0;
        if (this.sentiment === 'neutral') {
            volume = 1.0;
            rate = 1.0;
            pitch = 0.8;
        } else if (this.sentiment === 'negative') {
            volume = 0.7;
            rate = 0.65;
            pitch = 0.45;
        } else if (this.sentiment === 'positive') {
            volume = 1.0;
            rate = 1.15;
            pitch = 0.9;
        }
        return [volume, rate, pitch]
    }
    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {
        turnContext.onSendActivities(async (context, activities, next) => {
          const responses = await next();

          if (activities[0] !== null && activities[0].text !== null) {
            var response = activities[0].text; //Welcome back, Jaewoo
            if (activities[0]['suggestedActions'] !== null) {
              if (activities[0].suggestedActions !== null && typeof(activities[0].suggestedActions) !== "undefined") {
                  //console.log('debug\n');
                  var optionList = activities[0].suggestedActions.actions;
                  for (var i = 0; i < optionList.length; i++) {
                      response += "\n"
                      response += optionList[i].value + ".";
                  }
              }
            }

            const emotion = await this.retrieveEmotions(response);
            const state = await this.retrieveState(response);
            const text = await this.modifyText(response);
            const expression = await this.retrieveExpression(response);
            const setting = await this.modifyPitch();
            // console.log("Wow I am here!!!! ", response);
            // let inputMap = {};
            // inputMap['title'] = "Amicus Message";
            // inputMap['description'] = response;
            // inputMap['volume'] = setting[0];
            // inputMap['rate'] = setting[1];
            // inputMap['pitch'] = setting[2];
            // inputMap['emotion'] = emotion;
            // inputMap['state'] = state;
            // inputMap['expression'] = expression;
            // // console.log(inputMap);
            // var payload = {
            //     channel : "amicus_global",
            //     message : inputMap
            // }
            // pubnub.publish(payload, function(status, response) {
            //     //console.log(status, response);
            // })
          }

          return responses;
        });

        if (turnContext.activity.type === ActivityTypes.Message) {
            const user = await this.userInfoAccessor.get(turnContext, {});
            const dc = await this.dialogs.createContext(turnContext);
            const dialogTurnResult = await dc.continueDialog();
            if (!dc.context.responded) {
                // Continue the current dialog if one is pending.
                await dc.continueDialog();
            }
            if (!dc.context.responded) {
                // If no response has been sent, start the onboarding dialog.
                await dc.beginDialog('mainDialog');
            }
            // Save state changes
            await this.conversationState.saveChanges(turnContext);
            await this.userState.saveChanges(turnContext);
        }
    }

}

module.exports.MyBot = MyBot;
