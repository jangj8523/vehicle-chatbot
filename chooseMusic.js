

const { ActivityTypes } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');


class ChooseMusic  extends ComponentDialog {
	constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            async function (step) {
                // Clear the user information and prompt for the user's name.
                step.values.userInfo = {};
                return await step.prompt('textPrompt', "What is your name?");
            },
            async function (step) {
                // Save the name and prompt for the room number.
                step.values.userInfo.userName = step.result;
                return await step.prompt('textPrompt', `Hi ${step.result}. What would you like to do?`);
            },
            async function (step) {
                // Save the room number and "sign off".
                step.values.userInfo.roomNumber = step.result;
                await step.context.sendActivity(`Great! I will do that for you ${step.result}!`);

                // End the dialog, returning the user info.
                return await step.endDialog(step.values.userInfo);
            }
        ]));
    }

    


}

module.exports.ChooseMusic = ChooseMusic;
