import { IoDocumentTextOutline } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../../features/Theme/themeSlice";
// import { useAuth } from "../../utils/AuthProvider";
import { Link } from "react-router-dom";

const Settings = () => {
  // Redux
  const theme = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  // End of Redux

  // const { getToken } = useAuth();
  // const token = getToken();

  const handleSetTheme = (value) => {
    dispatch(setTheme(value));
  };

  return (
    <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
      <div className="z-1 relative w-full bg-white rounded-xl shadow-xl p-6 h-full dark:bg-[#002451]">
        <div className="mb-10">
          <h1 className="text-2xl font-medium dark:text-[#F4F4F4]">Settings</h1>
          <span className="font-normal text-gray-500 ">
            Manage your dashboard settings
          </span>
        </div>
        <div className=" flex flex-col gap-y-5">
          <div className="grid grid-cols-[minmax(10%,_1fr)_300px]  gap-5">
            <div className="p-2 dark:text-[#F4F4F4]">
              <span className="text-xl">Appearance</span>
            </div>
            <div>
              <select
                className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0364BD] bg-gray-100 dark:bg-[#001c40] dark:text-[#F4F4F4]"
                name="theme"
                id="theme"
                onChange={(e) => handleSetTheme(e.target.value)}
                value={theme}
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
              </select>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          <div className="grid grid-cols-[minmax(10%,_1fr)_300px]  gap-5">
            <div className="p-2 dark:text-[#F4F4F4]">
              <span className="text-xl">Transaction Settings</span>
            </div>
            <div>
              <Link
                to={"/transactionSettings"}
                className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-black cursor-pointer bg-gray-100 hover:bg-gray-300 dark:bg-[#001c40] dark:text-[#F4F4F4] transition-colors"
              >
                <span>View Settings</span>
              </Link>
            </div>
          </div>
          <div className="flex justify-end gap-2 dark:text-[#F4F4F4] bottom-2 absolute right-2">
            <a
              href="https://theinluna.com/policies"
              target="_blank"
              title="Privacy policy"
            >
              <IoDocumentTextOutline className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
