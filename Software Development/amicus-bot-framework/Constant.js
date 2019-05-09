

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
  ["Sure I have found multiple options for \"", "\" nearby. Which one are you referring to?"],
  ["Ok, there are a number of \"", "\" closeby. Can you specify which one?"]
]

var RESTAURANT_QUERY_CLARIFICATION_RESPONSE = [
  ["Ok, would you mind telling me the name of the place again?"],
  ["Umm, then would you refine your request please? Please just tell me the name of the place?"],
  ["Sure, where would you like to go? Would you mind clarifying? Just the name of the place."]
]

var RESTAURANT_GRACEFUL_FAILURE_RESPONSE= [
  ["Sorry I wasn't able to find any relevant place named \"", "\". You may need to manually lookup the exact place."],
  ["Sorry, I couldn't find the place called \"", "\". Hopefully I learn fast enough to learn about it!"]
]

var CLOSING_REMARK_RESPONSE = [
  ["Let me know if you need anything else, "],
  ["Just let me know if there’s anything else I can help with, "],
  ["If you need something, let me know "]
]

var RESTAURANT_RECOMMENDATION_RESPONSE = [
  ["Sure I have found a couple \"", "\" restaurant. Which one would you like to go? "],
  ["Ok, there are a number of \"", "\" restaurants closeby. Which one would you choose to go? "]
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
