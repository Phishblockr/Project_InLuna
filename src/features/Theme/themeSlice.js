import { createSlice } from "@reduxjs/toolkit";

const getSavedPreference = () => {
    try {
        const saved = localStorage.getItem("theme");
        return saved || "system";
    } catch (e) {
        return "system";
    }
};

const getSystemPref = () => {
    if (typeof window === "undefined" || !window.matchMedia) return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
};

const initialState = (() => {
    const pref = getSavedPreference();
    const effective = pref === "system" ? getSystemPref() : pref;
    return { preference: pref, effective };
})();

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setPreference: (state, action) => {
            const preference = action.payload;
            state.preference = preference;
            try {
                localStorage.setItem("theme", preference);
            } catch (e) {
                console.warn(e);
            }
            if (preference === "system") {
                state.effective =
                    typeof window !== "undefined" &&
                    window.matchMedia &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light";
            } else {
                state.effective = preference;
            }
        },

        setEffective: (state, action) => {
            const effective = action.payload;
            state.effective = effective;
        },
    },
});

export const { setPreference, setEffective } = themeSlice.actions;
export default themeSlice.reducer;
