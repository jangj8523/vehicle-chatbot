

const { ActivityTypes, IMessageActivity } = require('botbuilder');
const { DialogSet, ComponentDialog, WaterfallDialog, TextPrompt, NumberPrompt, ChoicePrompt, DialogTurnStatus } = require('botbuilder-dialogs');


class ControlCarFeature  extends ComponentDialog {

    

    constructor(dialogId) {
        super(dialogId);



<<<<<<< HEAD:dialogs/controlCarFeature.js

=======
>>>>>>> 6e5e7744f62a57ee919576ba0f39f88c0ce25d0b:Software Development/amicus-bot-framework/controlCarFeature.js
        // ID of the child dialog that should be started anytime the component is started.
        this.initialDialogId = dialogId;

        // Define the prompts used in this conversation flow.
        this.addDialog(new TextPrompt('textPrompt'));

        // Define the conversation flow using a waterfall model.
        this.addDialog(new WaterfallDialog(dialogId, [
<<<<<<< HEAD:dialogs/controlCarFeature.js
            async function (step) {
                
                /**

                This is the start of the waterfall dialog and everytime the user 
                responds to the prompt in each function, the response gets read 
                as an input to the next function. 


                step.values.conversation holds the conversation
                step.options holds the input parameters
                */


                //*DEBUGGING PURPOSES*
                //-------------------------------------
                // step.values.conversation = [];
                // if (step.options.sentiment > 0.5) {
                //     console.log("user is happy");
                // } else if (step.options.sentiment < 0.5) {
                //     console.log(`user is sad: ${step.options.sentiment}`);
                // } else {
                //     console.log(`user is neutral: ${step.options.sentiment}`);
                // }
                // if (step.context.activity.type === 'message') {
                //     console.log('hi');
                // }
                

                return await step.prompt('textPrompt', `${step.options.userName}. What is your name?`);
=======
            async function (step, sentimentIntent) {
                console.log(sentimentIntent)
                step.prompt('textPrompt', `Hi ${sentimentIntent}`);
                // Clear the user information and prompt for the user's name.
                step.values.userInfo = {};
                return await step.prompt('textPrompt', "What is your name?");
>>>>>>> 6e5e7744f62a57ee919576ba0f39f88c0ce25d0b:Software Development/amicus-bot-framework/controlCarFeature.js
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
