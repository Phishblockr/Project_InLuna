import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setEffective } from "../features/Theme/themeSlice";

export default function useThemeSync() {
    const dispatch = useDispatch();
    const preference = useSelector((s) => s.theme?.preference ?? "system");
    const effective = useSelector((s) => s.theme?.effective ?? "light");

    useEffect(() => {
        if (typeof document === "undefined") return;
        document.documentElement.setAttribute("data-theme", effective);
    }, [effective]);

    useEffect(() => {
        if (
            typeof window === "undefined" ||
            typeof window.matchMedia !== "function"
        ) {
            return;
        }
        const mq = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            const isDark = mq.matches;
            const newEffective = isDark ? "dark" : "light";
            // only update effective if user chose 'system'
            if (preference === "system") {
                dispatch(setEffective(newEffective));
            }
        };

        if (typeof mq.addEventListener === "function") {
            mq.addEventListener("change", handleChange);
        } else if (typeof mq.addListener === "function") {
            mq.addListener(handleChange);
        }

        if (preference === "system") {
            handleChange();
        }

        return () => {
            if (typeof mq.removeEventListener === "function") {
                mq.removeEventListener("change", handleChange);
            } else if (typeof mq.removeListener === "function") {
                mq.removeListener(handleChange);
            }
        };
    }, [dispatch, preference]);
}
