const TimeSeriesEnum = {
        Intraday: 'TIME_SERIES_INTRADAY',
        Daily: 'TIME_SERIES_DAILY',
        Weekly: 'TIME_SERIES_WEEKLY',
        Monthly: 'TIME_SERIES_MONTHLY'
    }
    
const TimeSeries = [
        {label: 'Intraday', value: TimeSeriesEnum.Intraday},
        {label: 'Daily', value: TimeSeriesEnum.Daily},
        {label: 'Weekly', value: TimeSeriesEnum.Weekly},
        {label: 'Monthly', value: TimeSeriesEnum.Monthly},
    ]
    
const TimeSeriesLabel = {
        'TIME_SERIES_DAILY': 'Daily',
        'TIME_SERIES_WEEKLY': 'Weekly',
        'TIME_SERIES_MONTHLY': 'Monthly'
    }
    
const CompanyLineNumberEnum = {
        SingleCompany: 'singleCompany',
        MultipleCompanies: 'multipleCompanies',
        SingleLine: 'singleLine',
        MultiLine: 'multiLine'
    }
    

module.exports = {
    CompanyLineNumberEnum,
    TimeSeriesEnum,
    TimeSeriesLabel,
    TimeSeries
}
