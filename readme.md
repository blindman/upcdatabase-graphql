# upcdatabase-graphql [![Build Status](https://travis-ci.org/blindman/upcdatabase-graphql.svg?branch=master)](https://travis-ci.org/blindman/upcdatabase-graphql)

> GraphQL translation for the UPC Database at http://upcdatabase.org/

*NOTE*: Currently supports v2 of the UPC Database API


## Install

```
$ yarn add upcdatabase-graphql
```

```
$ npm install --save upcdatabase-graphql
```


## Usage

First, sign up and retrieve your API key from http://upcdatabase.org/

```js
const ItemQuery = require('upcdatabase-graphql');
const graphQL = require('graphql');

const schema = new graphQL.GraphQLSchema({
	query: ItemQuery,
});

const query = '{ item(api_key: "YOUR_API_KEY", upc: "0111222333446") { valid, reason, number, itemName, alias, description, avg_price, rateUp, rateDown } }';

graphQL(schema, query).then((result) => { console.log(result); });
```

## Testing

#### GraphiQL

```
yarn run graphiql
```

#### Automated

```
yarn test
```

## License

MIT © [Jon Heller](https://github.com/blindman)
