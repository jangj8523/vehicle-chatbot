const request = require('request');
// Requires fs to write synthesized speech to a file
const fs = require('fs');
// Requires readline-sync to read command line inputs
const readline = require('readline-sync');
// Requires xmlbuilder to build the SSML body
const xmlbuilder = require('xmlbuilder');


class TextToSpeech {
	constructor(){
		this.subscriptionKey = '32c4c30f6bd64530bdebcc5a6ddf1a77';

		// if (!this.subscriptionKey) {
		//   throw new Error('Environment variable for your subscription key is not set.')
		// };

		// Prompts the user to input text.
	}

	async textToSpeech() {
		let text = readline.question('What would you like to convert to speech? ');
	    let options = {
	        method: 'POST',
	        uri: 'https://westus.api.cognitive.microsoft.com/sts/v1.0/issueToken',
	        headers: {
	            'Ocp-Apim-Subscription-Key': this.subscriptionKey
	        }
	    };
	    // This function retrieve the access token and is passed as callback
	    // to request below.
	    function getToken(error, response, body) {
	        console.log("Getting your token...\n")
	        if (!error && response.statusCode == 200) {
	            //This is the callback to our saveAudio function.
	            // It takes a single argument, which is the returned accessToken.
	            // console.log(response)
	        }
	        else {
	          throw new Error(error);
	        }
	    }
	    var response = request(options, getToken);
	    return response;
	}

}

module.exports.TextToSpeech = TextToSpeech;
