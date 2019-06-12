

const { ActivityTypes } = require('botbuilder');

const zlib = require('zlib');
var request = require('request');
var path = require("path");
var xlsx = require('node-xlsx');



const entityType = {
  CUISINE: 'RestaurantReservation.Cuisine',
  NAME: 'RestaurantReservation.PlaceName',
}


var FOUND_RESTAURANT_RESPONSE = [
  ["There are several nearby options for \"", "\". Which one are you referring to? Please tell me the number of choice 1, 2, 3, 4 or 5. "],
  ["There are a number of \"", "\" nearby. Can you specify which one you want? Your choice number 1, 2, 3, 4 or 5. "]
]

var RESTAURANT_QUERY_CLARIFICATION_RESPONSE = [
  ["Ok, would you mind repeating your desired destination again?"],
  ["Please refine your request; what restaurant would you like to head to?"],
  ["Sure, where would you like to go? Just the name of the place please."]
]

var RESTAURANT_GRACEFUL_FAILURE_RESPONSE= [
  ["Sorry I wasn't able to find any restaurant named \"", "\". Double check there is one nearby and use the GPS to navigate; sorry."],
  ["Sorry, I couldn't find the place called \"", "\". Hopefully I learn fast enough to find it soon!"]
]

var CLOSING_REMARK_RESPONSE = [
  "Let me know if you need anything else, ",
  "Just let me know if there’s anything else I can help with, ",
  "If you need something, let me know "
]

var RESTAURANT_RECOMMENDATION_RESPONSE = [
  ["I have found a couple \"", "\" restaurant. Which one would you like to go? Please tell me the number of choice  1, 2, 3, 4 or 5. "],
  ["There are a number of \"", "\" restaurants closeby. Which one would you choose to go? Please tell us the number only  1, 2, 3, 4 or 5. "]
]

var ERROR_RESPONSE = [
  ["Please refine your query please, "],
  ["I have nothing to work with here. Give me more context, "]
]


module.exports.ResponseList = {
  "FOUND_RESTAURANT_RESPONSE": FOUND_RESTAURANT_RESPONSE,
  "RESTAURANT_QUERY_CLARIFICATION_RESPONSE": RESTAURANT_QUERY_CLARIFICATION_RESPONSE,
  "RESTAURANT_GRACEFUL_FAILURE_RESPONSE" : RESTAURANT_GRACEFUL_FAILURE_RESPONSE,
  "CLOSING_REMARK_RESPONSE": CLOSING_REMARK_RESPONSE,
  "ERROR_RESPONSE": ERROR_RESPONSE,
  "RESTAURANT_RECOMMENDATION_RESPONSE": RESTAURANT_RECOMMENDATION_RESPONSE
}
