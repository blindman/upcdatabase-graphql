import {mockServer} from 'graphql-tools';
import test from 'ava';
import {GraphQLSchema} from 'graphql';
import casual from 'casual-browserify';
import rewire from 'rewire';
import upcDatabase from '.';

const rewiredUpcDatabase = rewire('.');
const fetchResponseByItem = rewiredUpcDatabase.__get__('fetchResponseByItem');
const itemValidityResolver = rewiredUpcDatabase.__get__('itemValidityResolver');
const snakeCaseResolver = rewiredUpcDatabase.__get__('snakeCaseResolver');

test('fetchResponseByItem', t => {
	fetchResponseByItem('098f6bcd4621d373cade4e832627b4f6', '0111222333446').then(response => {
		t.truthy(response.json().data, '\'data\' object not present on successful response');
	});
});

test('itemValidityResolver', t => {
	t.is(itemValidityResolver({valid: true}), true);

	const boolError = t.throws(() => {
		itemValidityResolver({valid: false, reason: 'Error reason - boolean'});
	}, Error);
	t.is(boolError.message, 'Error reason - boolean');

	const stringError = t.throws(() => {
		itemValidityResolver({valid: 'false', reason: 'Error reason - string'});
	}, Error);
	t.is(stringError.message, 'Error reason - string');
});

test('snakeCaseResolver', t => {
	t.is(snakeCaseResolver({avg_price: '1234'}, null, null, {fieldName: 'avgPrice'}), '1234'); // eslint-disable-line camelcase
	t.is(snakeCaseResolver({avg_price: '1234'}, null, null, {fieldName: 'avg_price'}), '1234'); // eslint-disable-line camelcase
	t.is(snakeCaseResolver({rate_up: '1234'}, null, null, {fieldName: 'rateUp'}), '1234'); // eslint-disable-line camelcase
	t.is(snakeCaseResolver({rate_up: '1234'}, null, null, {fieldName: 'rate_up'}), '1234'); // eslint-disable-line camelcase
	t.is(snakeCaseResolver({rate_down: '1234'}, null, null, {fieldName: 'rateDown'}), '1234'); // eslint-disable-line camelcase
	t.is(snakeCaseResolver({rate_down: '1234'}, null, null, {fieldName: 'rate_down'}), '1234'); // eslint-disable-line camelcase
});

const testingSchema = new GraphQLSchema({query: upcDatabase.ItemQuery});
const dbMock = mockServer(testingSchema, {
	Item: (root, {apiKey, upc}) => ({
		valid: () => {
			if (!apiKey || !upc) {
				return 'false';
			}
			return 'true';
		},
		reason: () => {
			if (!apiKey) {
				throw new Error('API Key length is incorrect');
			} else if (!upc) {
				throw new Error('No product code entered.');
			}
			return null;
		},
		number: casual.integer(0, 1000).toString(),
		itemName: casual.title,
		alias: casual.word,
		description: casual.description,
		avgPrice: casual.double(0, 500).toString(),
		rateUp: casual.integer(15, 30).toString(),
		rateDown: casual.integer(0, 15).toString()
	})
});

const successQuery = dbMock.query(`{
		item(apiKey: "a20087d54899d9f57cec532d3dce87f3", upc: "0111222333446") {
			valid,
			reason,
			number,
			itemName,
			alias,
			description,
			avgPrice,
			rateUp,
			rateDown
		}
	}`);

successQuery.then(({data}) => {
	test('data success', t => {
		t.truthy(data, '\'data\' object not present on successful query');
		t.not(0, Object.keys(data).length, '\'data\' object has no children for a successful query');
		t.truthy(data.item, '\'item\' object not a child of \'data\' object on successful query');
	});

	const item = data.item;
	test('data.item', t => {
		t.not(0, Object.keys(item), '\'item\' object has no children for a successful query');
		t.truthy(item.valid, 'Item does not have \'valid\' child when it was requested');
		t.truthy(item.number, 'Item does not have \'number\' child when it was requested');
		t.truthy(item.itemName, 'Item does not have \'itemName\' child when it was requested');
		t.truthy(item.alias, 'Item does not have \'alias\' child when it was requested');
		t.truthy(item.description, 'Item does not have \'description\' child when it was requested');
		t.truthy(item.avgPrice, 'Item does not have \'avgPrice\' child when it was requested');
		t.truthy(item.rateUp, 'Item does not have \'rateUp\' child when it was requested');
		t.truthy(item.rateDown, 'Item does not have \'rateDown\' child when it was requested');
	});

	test('data.item.valid', t => {
		t.is(typeof item.valid, 'string', 'Expected a string on a successful query');
	});
	test('data.item.reason', t => {
		t.is(item.reason, null, 'Expected null on a successful query');
	});
	test('data.item.number', t => {
		t.is(typeof item.number, 'string', 'Expected a string on a successful query');
	});
	test('data.item.itemName', t => {
		t.is(typeof item.itemName, 'string', 'Expected a string on a successful query');
	});
	test('data.item.alias', t => {
		t.is(typeof item.alias, 'string', 'Expected a string on a successful query');
	});
	test('data.item.description', t => {
		t.is(typeof item.description, 'string', 'Expected a string on a successful query');
	});
	test('data.item.avgPrice', t => {
		t.is(typeof item.avgPrice, 'string', 'Expected a string on a successful query');
	});
	test('data.item.rateUp', t => {
		t.is(typeof item.rateUp, 'string', 'Expected a string on a successful query');
	});
	test('data.item.rateDown', t => {
		t.is(typeof item.rateDown, 'string', 'Expected a string on a successful query');
	});
});

const noAPIKeyQuery = dbMock.query(`{
		item(upc: "0111222333446") {
			valid,
			reason,
			number,
			itemName,
			alias,
			description,
			avgPrice,
			rateUp,
			rateDown
		}
	}`);

noAPIKeyQuery.then(({data, errors}) => {
	const missingAPIKeyMessage = 'Field "item" argument "apiKey" of type "String!" is required but not provided.';

	test('data failure on missing API key', t => {
		t.falsy(data, '\'data\' object is present when missing the API key');
	});
	test('error - API key', t => {
		t.truthy(errors, '\'errors\' object is not present when missing the API key');
		t.not(0, errors.length, '\'errors\' object is empty when missing the API key');
		t.truthy(errors[0].message, '\'message\' object not a child of the first array item in the \'errors\' object when missing the API key');
		t.is(errors[0].message, missingAPIKeyMessage, 'Incorrect error message shown for a missing API key');
	});
});

const noUPCQuery = dbMock.query(`{
		item(apiKey: "a20087d54899d9f57cec532d3dce87f3") {
			valid,
			reason,
			number,
			itemName,
			alias,
			description,
			avgPrice,
			rateUp,
			rateDown
		}
	}`);

noUPCQuery.then(({data, errors}) => {
	const missingUPCMessage = 'Field "item" argument "upc" of type "String!" is required but not provided.';

	test('data failure on missing UPC', t => {
		t.falsy(data, '\'data\' object is present when missing UPC');
	});
	test('error - UPC', t => {
		t.truthy(errors, '\'errors\' object is not present when missing UPC');
		t.not(0, errors.length, '\'errors\' object is empty when missing UPC');
		t.truthy(errors[0].message, '\'message\' object not a child of the first array item in the \'errors\' object when missing UPC');
		t.is(errors[0].message, missingUPCMessage, 'Incorrect error message shown for a missing UPC');
	});
});
