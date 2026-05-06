import { configureStore } from '@reduxjs/toolkit'
import themeSlice from './Theme/themeSlice'
import userProfileSlice from "./userProfile/userProfileSlice"
import userSlice from "./Users/usersSlice"

export default configureStore({
  reducer: {
    theme: themeSlice,
    userProfile: userProfileSlice,
    users: userSlice,
  },
})