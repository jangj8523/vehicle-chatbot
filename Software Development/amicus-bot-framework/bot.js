// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory, IMessageActivity } = require('botbuilder');
const { DialogSet, WaterfallDialog, TextPrompt, Dialog, DialogTurnStatus } = require('botbuilder-dialogs');

const DIALOG_STATE_PROPERTY = 'dialogStatePropertyAccessor';
const USER_INFO_PROPERTY = 'userInfoPropertyAccessor';



const { GoToDestinationDialog } = require("./dialogs/goToDestinationDialog.js");
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
        this.emotion = 0;
        // Create our state property accessors.
        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);

        this.dialogs = new DialogSet(this.dialogStateAccessor)
        .add(new GoToDestinationDialog('goToDestinationDialog'))
        .add(new TextPrompt('textPrompt'))
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

        if (!user.nameExists) {
            user.nameExists = false;
            user.userName = "Vik"
            user.mustClarify = false;
            await step.prompt('textPrompt', "Welcome! I am Amicus, your friend. To get started input your name! ");
        } else if (user.mustClarify == true) {
            var response = clarifyResponse[Math.floor(Math.random() * clarifyResponse.length)];
            await step.prompt('textPrompt', response);
        } else {
            await step.prompt('textPrompt', `Yes ${user.userName}, how can I help?`);
        }

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

        if (user.nameExists == false) {
          return await step.beginDialog('requestNameDialog', user);
        }



        var sentimentIntentList = await this.findIntent(step);
        let topScoreIntent = sentimentIntentList[0];
        let sentiment = sentimentIntentList[1];
        let response = sentimentIntentList[2];
        let entities = sentimentIntentList[3];
        let query = sentimentIntentList[4];
        this.emotion = sentimentIntentList[5];
        //console.log("EMOTION", this.emotion);
        //DEMO PURPOSES: must erase
        var emotionList = ['neutral', 'negative', 'positive']
        this.emotion = emotionList[Math.floor(Math.random() * emotionList.length)];

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
        }

    }


    async saveResult(step) {
        // Process the return value from the child dialog.
        var response = await utilManager.getRandomResponse(ResponseList["CLOSING_REMARK_RESPONSE"]);

        if (step.result) {
            const user = await this.userInfoAccessor.get(step.context);
            if (step.result.userName) {
                // Store the results of the reserve-table dialog.
                user.userName = step.result.userName;
                user.nameExists = true;
            }

            if (step.result.gracefulFailure === true) {
              response = await utilManager.getRandomResponse(ResponseList["ERROR_RESPONSE"]);
            }
            return await step.prompt('textPrompt', response +  user.userName)
        }
        // Restart the main menu dialog.
        // return await step.replaceDialog('mainDialog'); // Show the menu again
    }


    async retrieveEmotions(response){
      var negativeEmotion = ["No"];
      var positiveEmotion = ["Jump", "ThumbsUp", "Punch"];
      var neutralEmotion = ["Wave", "Yes"];

      let emote = null;

      if (this.emotion === 'neutral') {
        emote = neutralEmotion[Math.floor(Math.random() * neutralEmotion.length)];
      } else if (this.emotion === 'negative') {
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

        if (this.emotion === 'neutral') {
          state = neutralStates[Math.floor(Math.random() * neutralStates.length)];
        } else if (this.emotion === 'negative') {
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

        if (this.emotion === 'neutral') {
          angryScale = (Math.random() * (0.850 - 0.3200) + 0.3200);
          surprisedScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
          sadScale = (Math.random() * (0.120 - 0.0200) + 0.0200);
        } else if (this.emotion === 'negative') {
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

    async modifyPitch(emotion){
        var pitch = 0.0;
        var rate = 0.0;
        var volume = 0.0;

        if (this.emotion === 'neutral') {
            volume = 1.0;
            rate = 1.0;
            pitch = 0.8;
        } else if (this.emotion === 'negative') {
            volume = 0.7;
            rate = 0.65;
            pitch = 0.45;
        } else if (this.emotion === 'positive') {
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

            //console.log("problem");

            let inputMap = {};
            inputMap['title'] = "Amicus Message";
            inputMap['description'] = response;
            inputMap['volume'] = setting[0];
            inputMap['rate'] = setting[1];
            inputMap['pitch'] = setting[2];
            inputMap['emotion'] = emotion;
            inputMap['state'] = state;
            inputMap['expression'] = expression;
            // console.log(inputMap);

            var payload = {
                channel : "amicus_global",
                message : inputMap
            }
            pubnub.publish(payload, function(status, response) {
                //console.log(status, response);
            })
          }

          return responses;
        });

        if (turnContext.activity.type === ActivityTypes.Message) {
            const user = await this.userInfoAccessor.get(turnContext, {});
            const dc = await this.dialogs.createContext(turnContext);

            const dialogTurnResult = await dc.continueDialog();

            // Talking Bot
            // await dc.context.sendActivity("Welcome to Amicus. I am your B", "<speak>Sorry, I don\'t understand</speak>");


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

    async sendWelcomeMessage(turnContext) {
        // If any new membmers added to the conversation
        if (turnContext.activity && turnContext.activity.membersAdded) {
            // Define a promise that will welcome the user
            async function welcomeUserFunc(conversationMember) {
                // Greet anyone that was not the target (recipient) of this message.
                // The bot is the recipient of all events from the channel, including all ConversationUpdate-type activities
                // turnContext.activity.membersAdded !== turnContext.activity.aecipient.id indicates
                // a user was added to the conversation
                if (conversationMember.id !== this.activity.recipient.id) {
                    // Because the TurnContext was bound to this function, the bot can call
                    // `TurnContext.sendActivity` via `this.sendActivity`;
                    await this.sendActivity('Welcome to Amicus. I am your BMW Chatbot. Let\'s introduce each other shall we? What\'s is your name?');
                }
            }

            // Prepare Promises to greet the  user.
            // The current TurnContext is bound so `replyForReceivedAttachments` can also send replies.
            const replyPromises = turnContext.activity.membersAdded.map(welcomeUserFunc.bind(turnContext));
            await Promise.all(replyPromises);
        }
    }
}

module.exports.MyBot = MyBot;
