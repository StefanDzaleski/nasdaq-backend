const express = require('express');
const {MongoClient} = require('mongodb');
const bodyParser = require('body-parser');
const RequestWrapper = require('./requestWrapper');
const {CompanyLineNumberEnum, TimeSeriesEnum, TimeSeriesLabel, CurrencyEnum, CurrencyLabel} = require('./enums');
const {getSingleLine, getMultipleLines} = require('./parseData');
const cors = require('cors');

const app = express();
const URL = 'mongodb+srv://StefanTest:TestPassword@clusterdiplomska-h6bmf.mongodb.net/test?retryWrites=true&w=majority'

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

let database, collection;
const BASE_URL = "https://www.alphavantage.co";
const DATABASE_NAME = "TestDatabase";
const COLLECTION_NAME = "TestCollection";
const API_KEY = 'BQZK8LNIDB3J068Y';

const port = process.env.PORT || 3001;
app.listen(port);

MongoClient.connect(URL, {useNewUrlParser: true}, (err, client) => {
    if (err) {
        console.log('Could not connect to database.', err);
    } else {
        database = client.db(DATABASE_NAME);
        collection = database.collection(COLLECTION_NAME);
        console.log("Connected to `" + DATABASE_NAME + "`!");
    }
});

app.get('/get-companies', (req, res) => {
    collection.find({}).toArray((error, result) => {
        if(error) {
            console.log('Error while fetching companies.');
            Promise.resolve(error);
        }
        Promise.resolve(result);
        res.json(result);
    });
});

app.get('/single-company', (req, res) => {
    const company = req.query.company;
    const interval = req.query.interval;
    const timeSeries = req.query.timeSeries;
    const values = req.query.values;
    const arearange = req.query.arearange;

    parseSingleCompany(company, interval, timeSeries, values, arearange).then(response => {
        res.send(response);
    });
});

app.get('/multi-company', (req, res) => {
    const companies = req.query.companies.split(",");
    const interval = req.query.interval;
    const timeSeries = req.query.timeSeries;
    const values = req.query.values;

    parseMultipleCompanies(companies, interval, timeSeries, values).then(response => {
        res.send(response);
    });
});

app.get('/stock-chart', (req, res) => {
    const company = req.query.company;
    const interval = req.query.interval;
    const timeSeries = req.query.timeSeries;
    const values = req.query.values;

    parseStockChartData(company, interval, timeSeries, values).then(response => {
        res.send(response);
    });
})

app.get('/currency', (req, res) => {
    const fromSymbol = req.query.fromSymbol;
    const toSymbol = req.query.toSymbol;
    const timeSeries = req.query.timeSeries;
    const interval = req.query.interval;
    parseCurrencyData(fromSymbol, toSymbol, timeSeries, interval).then(response => {
        res.send(response);
    });
})

parseSingleCompany = (company, interval, timeSeries, values, arearange) => {
    if (values.split(",").length > 1) {
        values = values.split(",");
    }
    if (timeSeries === TimeSeriesEnum.Intraday) {
        return new Promise((resolve, reject) => {
            RequestWrapper.get(BASE_URL + '/query?function=TIME_SERIES_INTRADAY&symbol=' + company + '&interval=' + interval + '&apikey=' + API_KEY).then(response => {
                const filteredResponse = {data: response['Time Series (' + interval + ')']};
                if (Array.isArray(values)) {
                    return getMultipleLines(filteredResponse.data, values, arearange).then(response => {
                        return resolve(response);
                    });
                } else {
                    return getSingleLine(filteredResponse.data, values, CompanyLineNumberEnum.SingleCompany).then(response => {
                        return resolve(response);
                    })
                }
            })
        }
        );
    } else {
        return new Promise((resolve, reject) => {
            RequestWrapper.get(BASE_URL + '/query?function=' + timeSeries + '&symbol=' + company + '&apikey=' + API_KEY).then(response => {
                const filteredResponse = {
                    
                    data: response[timeSeries === TimeSeriesEnum.Daily ? 'Time Series (' + TimeSeriesLabel[timeSeries] + ')' : TimeSeriesLabel[timeSeries] + ' Time Series']
                };
                if (Array.isArray(values)) {
                    return getMultipleLines(filteredResponse.data, values, arearange).then(response => {
                        return resolve(response);
                    });
                } else {
                    return getSingleLine(filteredResponse.data, values, CompanyLineNumberEnum.SingleCompany).then(response => {
                        return resolve(response);
                    })
                }
            })
        })
    }
}

parseMultipleCompanies = (companies, interval, timeSeries, values) => {
    let promises = [];
    if (timeSeries === TimeSeriesEnum.Intraday) {
        companies.forEach(company => {
            promises.push(new Promise((resolve, reject) => {
                RequestWrapper.get(BASE_URL + '/query?function=TIME_SERIES_INTRADAY&symbol=' + company + '&interval=' + interval + '&apikey=' + API_KEY).then(response => {
                    const filteredResponse = {data: response['Time Series (' + interval + ')']};
                        getSingleLine(filteredResponse.data, values, CompanyLineNumberEnum.MultipleCompanies).then(response => {
                            resolve(response);
                        })               
                })
            }))
        });
        return Promise.all(promises);
    } else {
        companies.forEach(company => {
            promises.push(new Promise((resolve, reject) => {
                RequestWrapper.get(BASE_URL + '/query?function=' + timeSeries + '&symbol=' + company + '&apikey=' + API_KEY).then(response => {
                const filteredResponse = {
                        data: response[timeSeries === TimeSeriesEnum.Daily ? 'Time Series (' + TimeSeriesLabel[timeSeries] + ')' : TimeSeriesLabel[timeSeries] + ' Time Series']
                    };
                        getSingleLine(filteredResponse.data, values, CompanyLineNumberEnum.MultipleCompanies).then(response => {
                            resolve(response);
                        })               
                })
            }))
        });
        return Promise.all(promises);
    }
}

parseStockChartData = (company, interval, timeSeries, values) => {
    if (timeSeries === TimeSeriesEnum.Intraday) {
        return new Promise((resolve, reject) => {
            RequestWrapper.get(BASE_URL + '/query?function=TIME_SERIES_INTRADAY&symbol=' + company + '&interval=' + interval + '&apikey=' + API_KEY).then(response => {
                const filteredResponse = response['Time Series (' + interval + ')'];
                parseStockChartResponse(filteredResponse).then(response => {
                    return resolve(response);
                })
            })
        }
        );
    } else {
        return new Promise((resolve, reject) => {
            RequestWrapper.get(BASE_URL + '/query?function=' + timeSeries + '&symbol=' + company + '&apikey=' + API_KEY).then(response => {
                const filteredResponse = response[timeSeries === TimeSeriesEnum.Daily ? 'Time Series (' + TimeSeriesLabel[timeSeries] + ')' : TimeSeriesLabel[timeSeries] + ' Time Series']
                parseStockChartResponse(filteredResponse).then(response => {
                    return resolve(response);
                })
            })
        })
    }
}

parseCurrencyData = (fromSymbol, toSymbol, timeSeries, interval) => {
    if (timeSeries === CurrencyEnum.Intraday) {
        return new Promise((resolve, reject) => {
            RequestWrapper.get(BASE_URL + '/query?function=FX_INTRADAY&from_symbol=' + fromSymbol + '&to_symbol=' + toSymbol + '&interval=' + interval + '&apikey=' + API_KEY).then(response => {
                const filteredResponse = response['Time Series FX (' + interval + ')'];
                return getSingleLine(filteredResponse, '1. open', CompanyLineNumberEnum.SingleCompany).then(response => {
                    return resolve(response);
                })
            })
        }
        );
    } else {
        return new Promise((resolve, reject) => {
            RequestWrapper.get(BASE_URL + '/query?function=' + timeSeries + '&from_symbol=' + fromSymbol + '&to_symbol=' + toSymbol + '&apikey=' + API_KEY).then(response => {
                const filteredResponse = response['Time Series FX (' + CurrencyLabel[timeSeries] + ')'];
                return getSingleLine(filteredResponse, '1. open', CompanyLineNumberEnum.SingleCompany).then(response => {
                    return resolve(response);
                })
            })
        })
    }
}

parseStockChartResponse = (data) => {
    let newValuesData = [];
    let newVolumeData = [];

    Object.entries(data).forEach(object => {
        let valuesData = [];
        let volumeData = [];
        let itemDate = new Date(object[0]).getTime();
        valuesData.push(itemDate);
        volumeData.push(itemDate);
        Object.entries(object[1]).forEach(([key, value]) => {
            if (key !== '5. volume') {
                valuesData.push(parseFloat(value));
            }
        })
        volumeData.push(parseFloat(object[1]['5. volume']));
        newValuesData.push(valuesData);
        newVolumeData.push(volumeData);
    });

    newValuesData = newValuesData.sort((a, b) => {
        return a[0] - b[0];
    });

    newVolumeData = newVolumeData.sort((a, b) => {
        return a[0] - b[0];
    });

    const finalData = {values: newValuesData, volume: newVolumeData};
    return Promise.resolve(finalData);
}



