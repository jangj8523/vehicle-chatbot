

const { ActivityTypes, IMessageActivity } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');


class ControlCarFeature  extends ComponentDialog {

    

    constructor(dialogId) {
        super(dialogId);




        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
            async function (step) {
                // step.prompt('textPrompt', `Hi ${args}`);
                // Clear the user information and prompt for the user's name.
                // var list = step.options
                // var sentimentList = args.sentimentIntent;
                step.values.conversation = [];
                // if (step.options.sentiment > 0.5) {
                //     console.log("user is happy");
                // } else if (step.options.sentiment < 0.5) {
                //     console.log(`user is sad: ${step.options.sentiment}`);
                // } else {
                //     console.log(`user is neutral: ${step.options.sentiment}`);
                // }
                if (step.context.activity.type === 'message') {
                    console.log('hi');
                }
                // step.context.activity.text = 'There is a snake';
                // step.context.activity.speak = 'There is a snake';
                // var message = step.context.activity.AsMessageActivity();
                return await step.prompt('textPrompt', `${step.options.userName}. Sure should I open the right or the left rear window?`);
            },
            async function (step) {
                // Save the name and prompt for the room number.
                step.values.userName = step.result;
                step.values.conversation.push(step.result);
                return await step.prompt('textPrompt', `Hi ${step.result}. What would you like to do?`);
            },
            async function (step) {
                // Save the room number and "sign off".
                step.values.activity = step.result;
                step.values.conversation.push(step.result);
                await step.context.sendActivity(`Great! I will do that for you ${step.result}!`);

                // End the dialog, returning the user info.
                return await step.endDialog(step.values);
            }
        ]));
    }

    


}

module.exports.ControlCarFeature = ControlCarFeature;
