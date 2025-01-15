import { configureStore } from '@reduxjs/toolkit'
import themeSlice from './Theme/themeSlice'
import userProfileSlice from "./userProfile/userProfileSlice"

export default configureStore({
  reducer: {
    theme: themeSlice,
    userProfile: userProfileSlice,
  },
})