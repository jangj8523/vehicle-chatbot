

const { ActivityTypes, IMessageActivity } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');


class ControlCarFeature  extends ComponentDialog {



    constructor(dialogId) {
        super(dialogId);
            async function (step, sentimentIntent) {
                console.log(sentimentIntent)
                step.prompt('textPrompt', `Hi ${sentimentIntent}`);
                // Clear the user information and prompt for the user's name.
                step.values.userInfo = {};
                return await step.prompt('textPrompt', "What is your name?");
            },

            async function (step) {
                step.values.userName = step.result;
                step.values.conversation.push(step.result);
                return await step.prompt('textPrompt', `Hi ${step.result}. What would you like to do?`);
            },
            async function (step) {
                step.values.activity = step.result;
                step.values.conversation.push(step.result);
                await step.context.sendActivity(`Great! I will do that for you ${step.result}!`);

                return await step.endDialog(step.values);
            }
        ]));
    }




}

module.exports.ControlCarFeature = ControlCarFeature;
