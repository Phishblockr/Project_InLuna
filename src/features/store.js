import { configureStore } from "@reduxjs/toolkit";
import OverviewSlice from "./Overview/OverviewSlice";
import insightsSlice from "./Insights/insightsSlice";
import usersSlice from "./Users/usersSlice";
import urlSlice from "./Urls/urlSlice";
import requestsSlice from "./Requests/requestsSlice";
import perPageRecSlice from "./PerPageRec/perPageRecSlice";
import themeSlice from "./Theme/themeSlice";
import userProfileSlice from "./userProfile/userProfileSlice";
import logsSlice from "./Logs/logsSlice";
import campaignSlice from "./Campaign/Campaign";
import userCourseReducer from "./UserCourse/userCourseSlice";
import userEmailReducer from "./UserEmail/userEmailSlice";
import transactionsettingsSlice from "./TransactionSettigns/transactionSettingsSlice";

const store = configureStore({
  reducer: {
    overview: OverviewSlice,
    insights: insightsSlice,
    users: usersSlice,
    urls: urlSlice,
    requests: requestsSlice,
    perPageRec: perPageRecSlice,
    theme: themeSlice,
    userProfile: userProfileSlice,
    logs: logsSlice,
    userCourses: userCourseReducer,
    userEmails: userEmailReducer,
    campaign: campaignSlice,
    transactionSettings: transactionsettingsSlice,
  },
});

export default store;
