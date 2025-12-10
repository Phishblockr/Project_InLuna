import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
    FaCog,
    FaBell,
    FaEye,
    FaMoon,
    FaSun,
    FaLanguage,
    FaShieldAlt,
} from "react-icons/fa";
import { setPreference } from "../features/Theme/themeSlice";

const Settings = () => {
    // Theme now expected to be an object: { preference: "light"|"dark"|"system", effective: "light"|"dark" }
    const { preference = "system", effective = "light" } =
        useSelector((state) => state.theme) || {};
    const dispatch = useDispatch();

    const [notifications, setNotifications] = useState({
        email: true,
        push: false,
        courseReminders: true,
        achievementAlerts: true,
    });

    const handleNotificationChange = (type) => {
        setNotifications((prev) => ({
            ...prev,
            [type]: !prev[type],
        }));
    };

    // simple handler to set user's theme preference
    const handleSetPreference = (pref) => {
        dispatch(setPreference(pref)); // "light" | "dark" | "system"
    };

    return (
        <div className="z-1 min-h-[calc(100svh-85px)] flex flex-col relative right-0 bottom-0 p-4 gap-4">
            <div className="fixed inset-0 bg-[#f7f4f4] dark:bg-[#001733] -z-10" />
            <div className="bg-white rounded-lg shadow-sm p-6 dark:bg-[#002451]">
                <div className="flex items-center gap-3 mb-6">
                    <FaCog className="text-2xl text-[#0364BD]" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-[#F4F4F4]">
                        Settings
                    </h1>
                </div>

                <div className="space-y-8">
                    {/* Appearance Settings */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-[#F4F4F4] mb-4 flex items-center gap-2">
                            <FaEye className="text-[#0364BD]" />
                            Appearance
                        </h2>

                        <div className="space-y-4">
                            {/* Preference segmented control */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-700 dark:text-gray-300">
                                        Theme Preference
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Choose a theme or follow your system
                                        setting
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="inline-flex rounded-lg bg-gray-100 dark:bg-[#001733] p-1">
                                        <button
                                            onClick={() =>
                                                handleSetPreference("light")
                                            }
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                                preference === "light"
                                                    ? "bg-[#0364bd] text-white"
                                                    : "text-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            Light
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleSetPreference("dark")
                                            }
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                                preference === "dark"
                                                    ? "bg-[#0364bd] text-white"
                                                    : "text-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            Dark
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleSetPreference("system")
                                            }
                                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                                preference === "system"
                                                    ? "bg-[#0364bd] text-white"
                                                    : "text-gray-700 dark:text-gray-300"
                                            }`}
                                        >
                                            System
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Language Settings */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-[#F4F4F4] mb-4 flex items-center gap-2">
                            <FaLanguage className="text-[#0364BD]" />
                            Language & Region
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Language
                                </label>
                                <select className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0364BD] focus:border-transparent dark:bg-[#001733] dark:border-gray-600 dark:text-[#F4F4F4]">
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Time Zone
                                </label>
                                <select className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0364BD] focus:border-transparent dark:bg-[#001733] dark:border-gray-600 dark:text-[#F4F4F4]">
                                    <option value="utc">UTC</option>
                                    <option value="est">Eastern Time</option>
                                    <option value="pst">Pacific Time</option>
                                    <option value="cet">
                                        Central European Time
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Security Settings */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-[#F4F4F4] mb-4 flex items-center gap-2">
                            <FaShieldAlt className="text-[#0364BD]" />
                            Security
                        </h2>
                        <div className="space-y-4 flex flex-col">
                            <button className="w-full max-w-xs px-4 py-2 bg-[#0364BD] text-white rounded-lg hover:bg-[#003A70] transition-colors text-left">
                                Change Password
                            </button>
                            <button className="w-full max-w-xs px-4 py-2 border text-gray-700 dark:text-gray-300 rounded-lg border-gray-200 dark:border-[#003366] dark:bg-[#001733] dark:hover:bg-[#002451] transition-colors text-left">
                                Two-Factor Authentication
                            </button>
                            <button className="w-full max-w-xs px-4 py-2 border text-gray-700 dark:text-gray-300 rounded-lg border-gray-200 dark:border-[#003366] dark:bg-[#001733] dark:hover:bg-[#002451] transition-colors text-left">
                                Login History
                            </button>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button className="px-6 py-2 bg-[#0364BD] text-white rounded-lg hover:bg-[#003A70] transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const getNotificationDescription = (key) => {
    const descriptions = {
        email: "Receive notifications via email",
        push: "Browser push notifications",
        courseReminders: "Reminders about ongoing courses",
        achievementAlerts: "Notifications for new achievements",
    };
    return descriptions[key] || "";
};

export default Settings;
