var config = {}

config.endpoint = "https://jangj8523.documents.azure.com:443/";
config.primaryKey = "co5ZQEkpYAnWfgfGSxJ1fS6L73yEr10jLIHDSB0zNiqP7YPQSyt9C90yv1oVPfqMA85LoYidcgFevG6aLn1XfQ";

config.database = {
   "id": "FamilyDatabase"
};

config.container = {
  "id": "FamilyContainer"
};

config.items = {
   "Andersen": {
       "id": "Anderson.1",
       "lastName": "Andersen",
       "parents": [{
         "firstName": "Thomas"
     }, {
             "firstName": "Mary Kay"
         }],
     "children": [{
         "firstName": "Henriette Thaulow",
         "gender": "female",
         "grade": 5,
         "pets": [{
             "givenName": "Fluffy"
         }]
     }],
     "address": {
         "state": "WA",
         "county": "King",
         "city": "Seattle"
     }
 },
 "Wakefield": {
     "id": "Wakefield.7",
     "parents": [{
         "familyName": "Wakefield",
         "firstName": "Robin"
     }, {
             "familyName": "Miller",
             "firstName": "Ben"
         }],
     "children": [{
         "familyName": "Merriam",
         "firstName": "Jesse",
         "gender": "female",
         "grade": 8,
         "pets": [{
             "givenName": "Goofy"
         }, {
                 "givenName": "Shadow"
             }]
     }, {
             "familyName": "Miller",
             "firstName": "Lisa",
             "gender": "female",
             "grade": 1
         }],
     "address": {
         "state": "NY",
         "county": "Manhattan",
         "city": "NY"
     },
     "isRegistered": false
   }
};

module.exports = config;