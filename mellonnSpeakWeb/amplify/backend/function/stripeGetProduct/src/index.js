/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	stripeKey
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    const stripe = require("stripe")(process.env.stripeKey);
    
    //const group = JSON.parse(event.body).group;
    //const currency = JSON.parse(event.body).currency;
    const group = event.group;
    const currency = event.currency;

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
