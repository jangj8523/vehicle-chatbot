

const { ActivityTypes, IMessageActivity } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');


class GoToBurger  extends ComponentDialog {

    

    constructor(dialogId) {
        super(dialogId);




        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));
        this.addDialog(new ChoicePrompt('choicePrompt'));
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
                
                // step.context.activity.text = 'There is a snake';
                // step.context.activity.speak = 'There is a snake';


                const promptOptions = {
                    prompt: `Okay. Here are the nearby burger locations within 15 minutes away: `,
                    choices: ["Ruff’s Burger", "Pinakothekan", "Hamburgerei", "Burger House"]
                };
                return await step.prompt('choicePrompt', promptOptions);
            },
            async function (step) {
                // Save the name and prompt for the room number.
                await step.context.sendActivity(`Ok. Plotting route, estimated travel time to ${step.result.value} is 19 minutes`);
                return await step.endDialog(step.values);
            }

        ]));
    }

    


}

module.exports.GoToBurger = GoToBurger;
