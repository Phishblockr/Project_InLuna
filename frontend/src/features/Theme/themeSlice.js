import { createSlice } from "@reduxjs/toolkit";

const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme : "light";
};

const themeSlice = createSlice({
    name: "theme",
    initialState: getInitialTheme(),
    reducers: {
        setTheme: (state, action) => {
            const theme = action.payload;
            localStorage.setItem("theme", theme);
            return theme;
        }
    }
});

export default themeSlice.reducer;
export const {setTheme} = themeSlice.actions;