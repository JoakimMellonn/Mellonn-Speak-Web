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
exports.handler = async (event) => {
    const aws = require('aws-sdk');

    const { Parameters } = await (new aws.SSM())
      .getParameters({
        Names: ["stripeKey"].map(secretName => process.env[secretName]),
        WithDecryption: true,
      })
      .promise();

    const stripe = require("stripe")(Parameters[0].Value);
    const body = JSON.parse(event.body);
    const customerId = body.customerId;
    const amount = body.amount;
    const currency = body.currency;


    try {
        const intent = await stripe.paymentIntents.create({
            amount: amount,
            currency: currency,
            customer: customerId,
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                paymentIntent: paymentIntent.client_secret,
            })
        }
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({
                message: err.message
            })
        }
    }
};
