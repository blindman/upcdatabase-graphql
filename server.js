'use strict';
const express = require('express');
const graphQLHTTP = require('express-graphql');
const GraphQLSchema = require('graphql').GraphQLSchema;
const upcDatabase = require('./index.js');

const app = express();

app.use('/', graphQLHTTP({
	schema: new GraphQLSchema({query: upcDatabase.ItemQuery}),
	graphiql: true
}));

app.listen(3000, () => {
	console.log('GraphiQL Testing Server listening on port 3000');
});
