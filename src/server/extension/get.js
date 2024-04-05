const configuration = require('../../configuration.json');

const info = process.argv.length >= 3
    ? JSON.parse(process.argv[2])
    : {};

let input = '';

process.stdin.on('data', d => {
    try {
        input += d.toString();
    } catch (e) {
        console.error(`Could not read input into string: ${e.message}`, e.stack);
        process.exit(1);
    }
});

process.stdin.on('end', () => {
    const result = {};
    const accessToken = info.api_user_access_token;

    result.test = 'Test!';
    result.accessToken = accessToken;
    result.input = JSON.parse(input);
    result.info = info;
    result.configuration = configuration;

    console.log(JSON.stringify(result, null, 2));
});

function throwError(error, description) {
    console.log(JSON.stringify({
        "error": {
            "code": "error.validation",
            "statuscode": 400,
            "realm": "api",
            "error": error,
            "parameters": {},
            "description": description
        }
    }));
    process.exit(0);
}
