// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory, IMessageActivity } = require('botbuilder');
const { DialogSet, WaterfallDialog, TextPrompt, Dialog, DialogTurnStatus } = require('botbuilder-dialogs');

const DIALOG_STATE_PROPERTY = 'dialogStatePropertyAccessor';
const USER_INFO_PROPERTY = 'userInfoPropertyAccessor';

const { CheckInDialog } = require("./dialogs/checkInDialog.js");
const { ControlCarFeature } = require("./dialogs/controlCarFeature.js");
const { ChooseMusic } = require("./dialogs/chooseMusic.js");
const { ReserveRestaurant } = require("./dialogs/reserveRestaurant.js");
const { ConversationDialog } = require("./dialogs/conversationDialog.js");
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
        // Create our state property accessors.
        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);

        this.dialogs = new DialogSet(this.dialogStateAccessor)
        .add(new CheckInDialog('checkInDialog'))
        .add(new TextPrompt('textPrompt'))
        .add(new ControlCarFeature('controlCarFeature'))
        .add(new ChooseMusic('chooseMusic'))
        .add(new ConversationDialog('conversationDialog'))
        .add(new ReserveRestaurant('reserveRestaurant'))
        .add(new WaterfallDialog('mainDialog', [
            this.promptForChoice.bind(this),
            this.startChildDialog.bind(this),
            this.saveResult.bind(this)
    ]));
    }

    async promptForChoice(step) {
        const user = await this.userInfoAccessor.get(step.context);

        if (!user.firstTime) {
            user.firstTime = true;
            user.userName = "Santi";
            await step.prompt('textPrompt', `Welcome back, ${user.userName}`);
        }
        return Dialog.EndOfTurn;
    }

    async findIntent (step) {
        let intentApi = intentUri;
        intentApi += step.result;
        const response = await fetch(intentApi);
        const intentResponse = await response.json()
        console.log (intentResponse)
        let topScoreIntent = intentResponse.topScoringIntent.intent
        let sentiment = intentResponse.sentimentAnalysis.score
        // let topScoreIntent = intentResponse['topScoringIntent']['intent']
        // let sentiment = intentResponse['sentimentAnalysis']['score']
        return [topScoreIntent, sentiment, intentResponse]
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
        var sentimentIntentList = await this.findIntent(step);

        let topScoreIntent = sentimentIntentList[0];
        let sentiment = sentimentIntentList[1];
        let response = sentimentIntentList[2]
<<<<<<< HEAD
<<<<<<< HEAD
        let entities = sentimentIntentList[3]
=======
>>>>>>> parent of 13fa6b5... added speech delivery without azure cognitive api
        // console.log(sentimentIntentList)
=======
        //console.log(sentimentIntentList)
>>>>>>> cc548b62127e8d781f9d8acd43b77f0c2cdb09a6
        /***
        Navigate to its corresponding intent.
        */
        user.topScoreIntent = topScoreIntent;
        user.sentiment = sentiment;
        user.response = response;
        user.conversation.push(step.result);
        //console.log(user.conversation);

        if (user.topScoreIntent.includes("GetDestinationItem")) {
            return await step.beginDialog('controlCarFeature', user);
        } else if (user.topScoreIntent.includes("CarActionItems")) {
            await step.beginDialog('reserveRestaurant', user);
        } else {
<<<<<<< HEAD
<<<<<<< HEAD
            await step.context.sendActivity("Sorry I do not understand what you mean. Please understand."); 
            return Dialog.EndOfTurn();
=======
            await step.context.sendActivity("Sorry I do not understand what you mean. Please understand.");
>>>>>>> cc548b62127e8d781f9d8acd43b77f0c2cdb09a6
=======
            await step.context.sendActivity("Sorry I do not understand what you mean. Please understand.");   
>>>>>>> parent of 13fa6b5... added speech delivery without azure cognitive api
        }


        // if (step.result.includes("turn on")) {
        //     return await step.beginDialog('controlCarFeature', user);
        // } else if (step.result.includes("list of restaurant")) {
        //     return await step.beginDialog('checkInDialog', user);
        // } else if (step.result.includes("tough day")) {
        //     await step.beginDialog('chooseMusic', user);
        // } else if (step.result.includes("dinner tonight")) {
        //     await step.beginDialog('reserveRestaurant', user);
        // } else if (step.result.includes("choose music")) {
        //     await step.beginDialog('chooseMusic', user);
        // } else if (step.result.includes("take me")){
        //     await step.beginDialog('conversationDialog', user);
        // } else {
        //     await step.context.sendActivity("Sorry I do not understand what you mean. Please understand.");

        // }

    }

    async saveResult(step) {
        // Process the return value from the child dialog.
        if (step.result) {
            const user = await this.userInfoAccessor.get(step.context);
            if (step.result.userName) {
                // Store the results of the reserve-table dialog.
                user.userName = step.result.userName;
<<<<<<< HEAD
            } 
<<<<<<< HEAD
            if (step.result.conversation != null && step.result.conversation.length != null) {
=======
            }
            if (step.result.conversation != null && step.result.conversation.length) {
>>>>>>> cc548b62127e8d781f9d8acd43b77f0c2cdb09a6
=======
            if (step.result.conversation != null && step.result.conversation.length) {
>>>>>>> parent of 13fa6b5... added speech delivery without azure cognitive api

            } else if (step.result.conversation.length) {
                for (var i = 0; i < step.result.conversation.length; i++) {
                    user.conversation.push(step.result.conversation[i]);
                }
            }

            await this.userInfoAccessor.set(step.context, user);
        }
        // Restart the main menu dialog.
        return await step.replaceDialog('mainDialog'); // Show the menu again
    }

    /**
     *
     * @param {TurnContext} on turn context object.
     */
    async onTurn(turnContext) {

        turnContext.onSendActivities(async (context, activities, next) => {
          const responses = await next();

          if (activities[0] !== null && activities[0].text !== null) {
            const response = activities[0].text; //Welcome back, Jaewoo

            var payload = {
                channel : "amicus_global",
                message : { title: "Amicus Message", description: response }
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
<<<<<<< HEAD

<<<<<<< HEAD
            // Talking Bot
            // await dc.context.sendActivity("Welcome to Amicus. I am your B", "<speak>Sorry, I don\'t understand</speak>");

=======
>>>>>>> cc548b62127e8d781f9d8acd43b77f0c2cdb09a6
=======
            
>>>>>>> parent of 13fa6b5... added speech delivery without azure cognitive api
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
