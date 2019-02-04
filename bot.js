// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityTypes, MessageFactory } = require('botbuilder');
const { DialogSet, WaterfallDialog, TextPrompt, Dialog, DialogTurnStatus } = require('botbuilder-dialogs');
const { ConversationDialog } = require('./conversationDialog');

const DIALOG_STATE_PROPERTY = 'dialogStatePropertyAccessor';
const USER_INFO_PROPERTY = 'userInfoPropertyAccessor';

const { CheckInDialog } = require("./checkInDialog");
const { ControlCarFeature } = require("./controlCarFeature.js");
const { ChooseMusic } = require("./chooseMusic.js");
const { ReserveRestaurant } = require("./reserveRestaurant.js");



class MyBot {

    
    constructor(conversationState, userState) {
        // Record the conversation and user state management objects.
        this.conversationState = conversationState;
        this.userState = userState;

        // Create our state property accessors.
        this.dialogStateAccessor = conversationState.createProperty(DIALOG_STATE_PROPERTY);
        this.userInfoAccessor = userState.createProperty(USER_INFO_PROPERTY);

        this.dialogs = new DialogSet(this.dialogStateAccessor)
        .add(new CheckInDialog('checkInDialog'))
        .add(new TextPrompt('textPrompt'))
        .add(new ControlCarFeature('controlCarFeature'))
        .add(new ChooseMusic('chooseMusic'))
        .add(new ReserveRestaurant('reserveRestaurant'))
        .add(new WaterfallDialog('mainDialog', [
            this.promptForChoice.bind(this),
            this.startChildDialog.bind(this),
            this.saveResult.bind(this)
    ]));
    }

  

    async promptForChoice(step) {
        const user = await this.userInfoAccessor.get(step.context);
        if (!user.first_time) {
            user.first_time = true;
            user.userName = "Jaewoo";
            await step.prompt('textPrompt', `Welcome back, ${user.userName}`);
        } 
        return Dialog.EndOfTurn;
    }

    async startChildDialog(step) {
        // Get the user's info.
        const user = await this.userInfoAccessor.get(step.context);
        // Check the user's input and decide which dialog to start.
        // Pass in the user info when starting either of the child dialogs.
        if (!user.userInfo) {
            user.userInfo = {}
        } 

        if (step.result.includes("turn on")) {

            return await step.beginDialog('controlCarFeature', user.userInfo);
        } else if (step.result.includes("list of restaurant")) {
            return await step.beginDialog('checkInDialog', user.userInfo);
        } else if (step.result.includes("hey")) {

        } else if (step.result.includes("recommendations for dinner")) {
            await step.beginDialog('reserveRestaurant', user.userInfo);
        } else if (step.result.include("")) {
            await step.beginDialog('chooseMusic', user.userInfo);
        } else {
            await step.context.sendActivity("What the heck are you talking about. Say it again.");
              
        }
        // await step.context.sendActivity("Sorry, I don't understand that command. Please choose an option from the list.");
        // return await step.replaceDialog('mainDialog');
        // break;
    }

    async saveResult(step) {
        // Process the return value from the child dialog.
        if (step.result) {
            const user = await this.userInfoAccessor.get(step.context);
            if (step.result.table) {
                // Store the results of the reserve-table dialog.
                user.table = step.result.table;
            } else if (step.result.alarm) {
                // Store the results of the set-wake-up-call dialog.
                user.alarm = step.result.alarm;
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

        if (turnContext.activity.type === ActivityTypes.Message) {
            const user = await this.userInfoAccessor.get(turnContext, {});
            const dc = await this.dialogs.createContext(turnContext);
            

            const dialogTurnResult = await dc.continueDialog();
            // if (dialogTurnResult.status === DialogTurnStatus.complete) {
            //     user.userInfo = dialogTurnResult.result;
            //     await this.userInfoAccessor.set(turnContext, user);
            //     await dc.beginDialog('mainDialog');
            // } 
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
