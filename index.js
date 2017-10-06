'use strict';
const gql = require('graphql');
const fetch = require('node-fetch');

/** @type {String} The endpoint URL for all requests to the UPC Database */
const ENDPOINT_URL = 'http://api.upcdatabase.org/json/';

/**
 * Retrieves the information of an item
 * @param  {String} apiKey   The API apiKey of the user querying the database
 * @param  {String} upc The UPC that is associated with an item
 * @return {Item}           	The item that was queried
 */
function fetchResponseByItem(apiKey, upc) {
	return fetch(`${ENDPOINT_URL}${apiKey}/${upc}`);
}

/**
 * Returns the validity of the retrieved item
 * @param  {Object} item
 * @return {String|Boolean}
 */
function itemValidityResolver(item) {
	if (item.valid === false || item.valid === 'false') {
		throw new Error(item.reason);
	}
	return item.valid;
}

/**
 * Resolves the field when snake case is requird
 * @param  {Object} item
 * @param  {Object} args
 * @param  {Object} context
 * @param  {String} info
 * @return {*}
 */
function snakeCaseResolver(item, args, context, info) {
	const fieldNameAsArray = info.fieldName.split(/(?=[A-Z])/);
	const camelCaseFieldName = fieldNameAsArray.reduce((final, curr, idx) => {
		return idx === 0 ? curr : `${final}_${curr.toLowerCase()}`;
	}, '');
	return item[camelCaseFieldName];
}

const ItemType = new gql.GraphQLObjectType({
	name: 'Item',
	description: 'Information about the item requested using its UPC',
	fields: () => ({
		valid: {
			type: gql.GraphQLString,
			description: 'Indicates whether the request was valid',
			resolve: itemValidityResolver
		},
		reason: {
			type: gql.GraphQLString,
			description: 'Explains why the request was not valid'
		},
		number: {
			type: gql.GraphQLString,
			description: 'The UPC value sent with the request'
		},
		itemName: {
			type: gql.GraphQLString,
			description: 'The name of the requested item'
		},
		alias: {
			type: gql.GraphQLString,
			description: 'Another name for the requested item'
		},
		description: {
			type: gql.GraphQLString,
			description: 'A description of the requested item'
		},
		avgPrice: {
			type: gql.GraphQLString,
			description: 'The average price of the item',
			resolve: snakeCaseResolver
		},
		rateUp: {
			type: gql.GraphQLString,
			description: 'The number of users who rated this item entry positively',
			resolve: snakeCaseResolver
		},
		rateDown: {
			type: gql.GraphQLString,
			description: 'The number of users who rated this item entry negatively',
			resolve: snakeCaseResolver
		}
	})
});

module.exports = {
	ItemType,
	ItemQuery: new gql.GraphQLObjectType({
		name: 'Query',
		description: 'The root of the query',
		fields: () => ({
			item: {
				type: ItemType,
				description: 'The item being requested from the server using a UPC and API key',
				args: {
					apiKey: {
						type: new gql.GraphQLNonNull(gql.GraphQLString),
						description: 'The API key that must be obtained at http://upcdatabase.org/'
					},
					upc: {
						type: new gql.GraphQLNonNull(gql.GraphQLString),
						description: 'The UPC of the item your are requesting'
					}
				},
				resolve: (root, args) => fetchResponseByItem(args.apiKey, args.upc).then(response => response.json())
			}
		})
	})
};
