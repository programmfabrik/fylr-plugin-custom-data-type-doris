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
    return getCredentials(permissionGroup);
}

function getCredentials(permissionGroup) {
    const configuration = getPluginConfiguration();
    if (permissionGroup === 'basic') {
        return {
            username: configuration.doris_account_basic_username,
            password: configuration.doris_account_basic_password
        };
    } else if (permissionGroup === 'full') {
        return {
            username: configuration.doris_account_full_username,
            password: configuration.doris_account_full_password
        };
    } else {
        return {};
    }
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

function getPluginConfiguration() {
    return info.config.plugin['custom-data-type-doris'].config.doris;
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
