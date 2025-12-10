import { createSlice } from "@reduxjs/toolkit";

const getSavedPreference = () => {
    try {
        const saved = localStorage.getItem("theme");
        return saved || "system"; // default to system if nothing saved
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

// initial state is an object: { preference, effective }
const initialState = (() => {
    const pref = getSavedPreference();
    const effective = pref === "system" ? getSystemPref() : pref;
    return { preference: pref, effective };
})();

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        // Set the stored user preference: "light" | "dark" | "system"
        setPreference: (state, action) => {
            const preference = action.payload; // "light" | "dark" | "system"
            state.preference = preference;
            try {
                localStorage.setItem("theme", preference);
            } catch (e) {
                /* ignore storage errors */
            }
            // update effective immediately
            if (preference === "system") {
                // compute system again; using window here is fine (slice is run in browser)
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

        // Update only the effective theme (used when the OS/browser preference changes)
        setEffective: (state, action) => {
            const effective = action.payload; // "light" | "dark"
            state.effective = effective;
        },
    },
});

export const { setPreference, setEffective } = themeSlice.actions;
export default themeSlice.reducer;
