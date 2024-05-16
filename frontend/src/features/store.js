import { configureStore } from '@reduxjs/toolkit'
import OverviewSlice from './Overview/OverviewSlice';
import insightsSlice from './Insights/insightsSlice';
import usersSlice from './Users/usersSlice';
import urlSlice from './Urls/urlSlice';
import requestsSlice from './Requests/requestsSlice';

const store = configureStore({
  reducer: {
    overview: OverviewSlice,
    insights: insightsSlice,
    users: usersSlice,
    urls: urlSlice,
    requests:requestsSlice,
  },
});

export default store;