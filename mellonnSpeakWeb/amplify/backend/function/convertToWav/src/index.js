/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STORAGE_MELLONNSPEAKS3EU_BUCKETNAME
Amplify Params - DO NOT EDIT */

NODE_OPTIONS='--experimental-wasm-threads --experimental-wasm-bulk-memory';

const ff = require('@ffmpeg/ffmpeg');
var AWSS3 = require('aws-sdk/clients/s3');
var s3 = new AWSS3();

exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    const e = JSON.parse(event.body);
    const inputString = e.inputString;
    const outputString = e.outputString;
    const inputKey = e.inputKey;
    let outputFile;

    let statusCode = 500;
    let returnBody = JSON.stringify('Nothing happened');

    var getParams = {
        Bucket: process.env.STORAGE_MELLONNSPEAKS3EU_BUCKETNAME,
        Key: 'public/' + inputKey,
    };
    
    const ffmpeg = ff.createFFmpeg({
        log: true,
    });

    await ffmpeg.load();

    //Load failed...
    if (!ffmpeg.isLoaded()) {
        console.log(`Operation failed while loading ffmpeg`);
        returnBody = "Operation failed while loading ffmpeg";
    }

    try {
        const data = (await s3.getObject(getParams).promise()).Body;
        console.log(data);

        ffmpeg.FS('writeFile', inputString, data);
        await ffmpeg.run('-i', inputString, '-c:a', 'pcm_s16le', '-ac', '1', '-ar', '16000', outputString);
        outputFile = ffmpeg.FS('readFile', outputString);

        var putParams = {
            Bucket: process.env.STORAGE_MELLONNSPEAKS3EU_BUCKETNAME,
            Key: 'public/convert/output/' + outputString,
            Body: outputFile,
            ContentType: 'audio/wav'
        };
        await s3.putObject(putParams).promise();

        statusCode = 200;
        returnBody = JSON.stringify("Success");
    } catch (e) {
        console.log('Something went wrong: ' + e);
        returnBody = JSON.stringify("Something went wrong");
    }

    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,PUT,GET"
        },
        body: returnBody
    };

}