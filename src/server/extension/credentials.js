const serverConfiguration = require('../../serverConfiguration.json');

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

process.stdin.on('end', async () => {
    const result = await handleRequest();
    console.log(JSON.stringify(result, null, 2));
});

async function handleRequest() {
    const userConfiguration = await getUserConfiguration();
    const permissionGroup = userConfiguration?.user?.custom_data?.doris_permission_group;

    return permissionGroup
        ? serverConfiguration.dorisCredentials[permissionGroup] ?? {}
        : {};
}

async function getUserConfiguration() {
    const url = info.api_url + '/api/v1/user/' + info.api_user.user._id + '?access_token=' + info.api_user_access_token;
    const headers = { 'Accept': 'application/json' };

    let response;
    try {
        response = await fetch(url, { headers });
    } catch {
        throwError('Failed to fetch user configuration');
    }

    if (response.ok) {
        return (await response.json())?.[0];
    } else {
        throwError('Failed to fetch user configuration', response.statusText);
    }
}


function throwError(error, description) {
    console.log(JSON.stringify({
        'error': {
            'code': 'error.doris',
            'statuscode': 400,
            'realm': 'api',
            'error': error,
            'parameters': {},
            'description': description
        }
    }));
    process.exit(0);
}
