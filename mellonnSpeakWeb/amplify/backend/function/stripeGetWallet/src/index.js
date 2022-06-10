exports.handler = async (event) => {
    const stripe = require("stripe")(process.env.stripeKey);
    const body = JSON.parse(event.body);
    const customerId = body.customerId;


    try {
        const cards = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card',
        });

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: {
                cards: cards,
            }
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
