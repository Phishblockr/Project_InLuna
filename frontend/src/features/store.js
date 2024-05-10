import { configureStore } from '@reduxjs/toolkit'
import OverviewSlice from './Overview/OverviewSlice';
import insightsSlice from './Insights/insightsSlice';

const store = configureStore({
  reducer: {
    overview: OverviewSlice,
    insights: insightsSlice
  }
})

export default store;