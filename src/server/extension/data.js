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
    const dorisId = info.request.query.id?.[0];
    if (!dorisId) throwError('Missing parameter: id', 'No DoRIS document ID provided');

    const yesId = (await performSearch(['ja_nein_objekttyp.name'], 'Ja'))?.[0]?.ja_nein_objekttyp._id;
    if (!yesId) throwError('Missing value: Ja', 'ja_nein_objekttyp is not set up correctly in Fylr database');

    const objects = await performSearch(getFieldPaths(), dorisId);

    return {
        objects: objects?.map(object => getData(object, yesId)) ?? []
    };
}

async function performSearch(fields, searchString) {
    const url = info.api_url + '/api/v1/search?access_token=' + info.api_user_access_token;
    const searchRequest = {
        search: [{
            type: 'match',
            bool: 'should',
            fields,
            string: searchString
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchRequest)
        });
        const result = await response.json();
        return result.objects;
    } catch (err) {
        throwError('Search request failed', JSON.stringify(err));
    }
}

function getFieldPaths() {
    return getPluginConfiguration().api_fields?.map(field => field.path + '.id') ?? [];
}

function getPluginConfiguration() {
    return info.config.plugin['custom-data-type-doris'].config.doris;
}

function getData(object, yesId) {
    const objectType = object._objecttype;
    const nestedPrefix = '_nested:' + objectType + '__';

    return {
        systemObjectId: object._system_object_id,
        uuid: object._uuid,
        title: object[objectType][nestedPrefix + 'titel']?.map(entry => entry.titel).join(', '),
        itemType: object[objectType].lk_objekttyp?.conceptName,
        itemIdentifier: object[objectType][nestedPrefix + 'identifier']
            ?.find(entry => entry.lk_identifier_typ?.conceptName === 'ADABweb-Kennziffer')?.identifier,
        detailViewUrl: info.external_url + '/#/detail/' + object._uuid,
        designationStatus: object[objectType][nestedPrefix + 'event']
            ?.find(entry => {
                return entry.lk_eventtyp?.conceptName === 'Ausweisung'
                    && entry.lk_veroeffentlichen?.ja_nein_objekttyp._id === yesId;
            })?.lk_status?.conceptName,
        dorisDocuments: object[objectType][nestedPrefix + 'e_akte']
            ?.map(entry => entry.lk_doris?.id)
            .filter(entry => entry !== undefined)
    };
}

function throwError(error, description) {
    console.log(JSON.stringify({
        "error": {
            "code": "error.doris",
            "statuscode": 400,
            "realm": "api",
            "error": error,
            "parameters": {},
            "description": description
        }
    }));
    process.exit(0);
}
