const rp = require('request-promise');

    const get = async (uri) => {
        const options = {
            method: 'GET',
            uri: `${uri}`,
            json : true
        };
        return new Promise((resolve, reject) => {
            console.log('Request Wrapper -> Sending GET request',options.uri);
            return rp(options)
                .then((result) => {
                    console.log('Request Wrapper -> Sending GET request -> SUCCESS: ');
                    console.log('Result: ', result);
                    return resolve(result);
                })
                .catch((err) => {
                    console.log('Request Wrapper -> Sending GET request -> ERROR: ', err);
                });
        });
    }

module.exports.get = get;    

