
const dotenv = require('dotenv');
const path = require('path');
const restify = require('restify');

const { ActivityTypes } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');

const USER_PROFILE_PROPERTY = 'userProfileData';
const DIALOG_STATE_PROPERTY = 'conversationManager';

class ConversationDialog  extends ComponentDialog {
	constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            async function (step) {
                // Clear the guest information and prompt for the guest's name.
                step.values.userInfo = {};
                step.values.userInfo.destChoice = "home";
                await step.context.sendActivity("Ok, navigating to “Home”");
                return await step.endDialog(step.values.userInfo);
            },

            // async function (step) {
            //     // Save the name and prompt for the room number.
            //     step.values.userInfo = {};
            //     step.values.userInfo.userName = step.result;
            //     await step.context.sendActivity("Great, let’s go. Home sweet home!");
            //     return await step.endDialog(step.values.userInfo);
            //     // return await step.prompt('textPrompt', `Hi ${step.result}. What room will you be staying in?`);
            // },
            // async function (step) {
            //     // Save the room number and "sign off".
            //     step.values.guestInfo.roomNumber = step.result;
            //     await step.context.sendActivity(`Great! Enjoy your stay in room ${step.result}!`);

            //     // End the dialog, returning the guest info.
            //     return await step.endDialog(step.values.guestInfo);
            // }
        ]));
    }




}

module.exports.ConversationDialog = ConversationDialog;
