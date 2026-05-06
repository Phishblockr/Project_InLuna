import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setEffective } from "../features/Theme/themeSlice";

export default function useThemeSync() {
    const dispatch = useDispatch();
    const preference = useSelector((s) => s.theme?.preference ?? "system");
    const effective = useSelector((s) => s.theme?.effective ?? "light");

    // 1) keep DOM in sync with effective theme
    useEffect(() => {
        if (typeof document === "undefined") return;
        document.documentElement.setAttribute("data-theme", effective);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(effective);
    }, [effective]);

    // 2) listen to OS theme changes and update Redux effective theme when needed
    useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return;
        }

        const mq = window.matchMedia("(prefers-color-scheme: dark)");

        // handler reads mq.matches directly (works across browsers)
        const handleChange = () => {
            const isDark = mq.matches;
            const newEffective = isDark ? "dark" : "light";
            // only update effective if user chose 'system'
            if (preference === "system") {
                dispatch(setEffective(newEffective));
            }
        };

        // Register listener: prefer addEventListener, fallback to addListener for older browsers
        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", handleChange);
        } else if (typeof mq.addListener === "function") {
            mq.addListener(handleChange);
        }

        // ensure initial effective is correct when preference === "system"
        if (preference === "system") {
            handleChange();
        }

        // cleanup
        return () => {
            if (typeof mq.removeEventListener === "function") {
                mq.removeEventListener("change", handleChange);
            } else if (typeof mq.removeListener === "function") {
                mq.removeListener(handleChange);
            }
        };
    }, [dispatch, preference]); // re-register if preference changes
}
