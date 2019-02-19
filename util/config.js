var config = {}

config.endpoint = "https://jangj8523.documents.azure.com:443/";
config.primaryKey = "co5ZQEkpYAnWfgfGSxJ1fS6L73yEr10jLIHDSB0zNiqP7YPQSyt9C90yv1oVPfqMA85LoYidcgFevG6aLn1XfQ";

config.database = {
   "id": "CarUser"
};

config.container = {
  "id": "Conversation"
};

config.items = {
   "Andersen": {
       "id": "Anderson.1",
       "lastName": "Truman",
       "conversation": ["Stanford University", "Menlo Park", "Boston"],
     "carInfo": [{
         "model": "BMW i8",
         "history": "4.5 years",
         "recentDestination": [{
             "restaurants": ["Pompous", "Izakaya", "Nola"],
             "others" : ["Stanford University", "Menlo Park", "Boston"]
         }]
     }],
     "assistantSetting": {
         "name": "amicus",
         "gender": "woman.2",
     }
 },
	"Frank": {
	       "id": "Frank.1",
	       "lastName": "Zheng",
	       "conversation": [{
	         "firstName": "Thomas"
	     }, {
	             "firstName": "Mary Kay"
	         }],
	     "carInfo": [{
	         "model": "BMW i8",
	         "history": "4.5 years",
	         "recentDestination": [{
	             "restaurants": ["Pompous", "Izakaya", "Nola"],
	             "others" : ["Stanford University", "Menlo Park", "Boston"]
	         }]
	     }],
	     "assistantSetting": {
	         "name": "amicus",
	         "gender": "woman.2",
	     }
	 }
};

module.exports = config;