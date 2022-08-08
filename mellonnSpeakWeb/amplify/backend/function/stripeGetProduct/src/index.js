/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["stripeKey"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    const aws = require('aws-sdk');

    const { Parameters } = await (new aws.SSM())
    .getParameters({
        Names: ["stripeKey"].map(secretName => process.env[secretName]),
        WithDecryption: true,
    })
    .promise();

    const stripe = require("stripe")(process.env.stripeKey);
    
    const group = JSON.parse(event.body).group;
    const currency = JSON.parse(event.body).currency;

    let product = 'prod_LtZIbFmc9pe9VQ';
    if (group == 'benefit') product = 'prod_MCxCO7M4beTl5y';

    try {
        const product = stripe.product.retrieve(
            'prod_LtZIbFmc9pe9VQ'
        );

        console.log(JSON.stringify(product));

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }, 
            body: JSON.stringify(product),
        };
    } catch (err) {
        console.log(`Error: ${err}`);

        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }, 
            body: JSON.stringify(err),
        };
    }

    
};
