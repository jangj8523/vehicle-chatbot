const { ComponentDialog, TextPrompt, ChoicePrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { MessageFactory } = require('botbuilder')


class CheckInDialog extends ComponentDialog {
    constructor(dialogId) {
        super(dialogId);

        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));
        this.addDialog(new ChoicePrompt('choicePrompt'))

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            async function (step) {
                // Clear the guest information and prompt for the user's name.
                // step.values.userInfo = {};
                // step.values.userInfo.userName = "Jaewoo";
                // const greeting = step.options && step.options.userName ? `Welcome ${step.options.userName}` : `Welcome`;

                const promptOptions = {
                    prompt: `Ok. Here are the list of restaurants you\'ve been over the last ten days.`,
                    choices: ["Nola", "Pompous", "Izakaya", "L&L", "Circles"]
                };
                return await step.prompt('choicePrompt', promptOptions);
                
                // await step.context.sendActivity(MessageFactory.suggestedActions(menu, 'Ok. Here are the list of restaurants you\'ve been over the last ten days?'));
            },
            async function (step) {
                // Save the name and prompt for the room number.
                var destChoice = step.result.value;
                step.values.userInfo = {};
                step.values.userInfo.destChoice = destChoice;
                return await step.prompt('textPrompt', `Is this where you want to go tonight ${destChoice}?`);
            },
            async function (step) {
                // Save the room number and "sign off".
                var destChoice = step.values.userInfo.destChoice;
                if (step.result.includes("yes")) {
                    await step.context.sendActivity(`Great! ${destChoice} is a great place to go tonight!`);
                } else {

                }

                // End the dialog, returning the user info.
                return await step.endDialog(step.values.userInfo);
            }
        ]));
    }
}

exports.CheckInDialog = CheckInDialog;