import React, { useEffect, useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { deleteUserSuccess, updateStatus } from "../features/Users/usersSlice";
import { toast } from "sonner";
import LineChart from "./LineChart";
import PieChart from "./PieChart";
import LoadingOverlay from "./LoadingOverlay";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../static/CustomDatePicker.css';

const statusActive =
  "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400 dark:border-green-400";
const statusInactive =
  "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400 dark:border-red-400";

const UserDetails = () => {
  const { id } = useParams();
  const [activityCounts, setActivityCounts] = useState({
    "phishingClicks": 0,
    "blacklistedClicks": 0,
    "whitelistRequests": 0,
    "visitsToWhitelistUrls": 0,
    "percentageBlacklistedClicks": 0,
    "percentagePhishingClicks" : 0,
    "percentageVisitToWhitelistUrls": 0,
    "percentageWhitelistReq": 0
  });
  const [dataLoading, setDataLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date());


  const renderMonthContent = (month, shortMonth, longMonth, day) => {
    const fullYear = new Date(day).getFullYear();
    const tooltipText = `Tooltip for month: ${longMonth} ${fullYear}`;

    return <span title={tooltipText}>{shortMonth}</span>;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchActivityCounts(id, date);
  };

  useEffect(() => {
    fetchActivityCounts(id, selectedDate);
  }, [id, selectedDate])


  const navigate = useNavigate();
  const user = useSelector((state) =>
    state.users.users.find((user) => user._id === id)
  );
  const theme = useSelector((state) => state.theme);

  const dispatch = useDispatch();

  const handleRemUser = (id, name) => {
    try {
      dispatch(remUser(id));
      navigate("/users");
      toast.success(`User ${name} removed`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleUpdateStatus = (id, name) => {
    try {
      dispatch(updateStatus(id));
      toast.success(`User ${name} status updated`);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const fetchActivityCounts = async (id, date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    try {
      setDataLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL
      const token = JSON.parse(localStorage.getItem("user")).token;
      const response = await fetch(`${apiUrl}/overview/user-metrics/${id}/${month}/${year}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity counts");
      }

      const data = await response.json();
      setActivityCounts(data);
      setDataLoading(false)
    } catch (error) {
      console.error(error.message);
    }
  };

  if (!user) {
    return <div>User not found</div>;
  }

  const seriesData = [56, 89, 74];
  const categories = [
    "Blacklisted urls visited",
    "whitelist urls requests",
    "visits to requested urls",
  ];

  const overviewPoints = [
    {
      id: 1,
      title: "Phishing Links Visited",
      count: activityCounts.phishingClicks,
      lastMonth: activityCounts.percentagePhishingClicks,
      logo: "bi bi-shield-x",
    },
    {
      id: 2,
      title: "Whitelist Requests",
      count: activityCounts.whitelistRequests,
      lastMonth: activityCounts.percentageWhitelistReq,
      logo: "bi bi-shield-exclamation",
    },
    {
      id: 3,
      title: "Visits to Requested Urls.",
      count: activityCounts.visitsToWhitelistUrls,
      lastMonth: activityCounts.percentageVisitToWhitelistUrls,
      logo: "bi bi-shield-shaded",
    },
    {
      id: 4,
      title: "Blacklisted Links Visited.",
      count: activityCounts.blacklistedClicks,
      lastMonth: activityCounts.percentageBlacklistedClicks,
      logo: "bi bi-shield-shaded",
    },
  ];

  const OverviewCard = ({ count, title, logo, lastMonth }) => (
    <div
      className={`shadow border-2 border-gray-100 flex px-4 py-6 items-center text-black rounded-lg dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-0`}
    >
      <div className="w-full flex flex-col font-medium">
        <div className="flex flex-row justify-between">
          <h4 className="">{title}</h4>
          <i className={`${logo}`}></i>
        </div>
        <h4 className="mt-2 text-2xl font-bold">{count}</h4>
        <div>
          <span className="text-[12px] text-gray-500">
            {lastMonth}% compared to last month
          </span>
        </div>
      </div>
    </div>
  );

  const OverviewCards = ({ points }) => (
    <div className="grid grid-cols-4 gap-3">
      {points.map(({ id, title, count, logo, lastMonth }) => (
        <OverviewCard
          key={id}
          count={count}
          title={title}
          logo={logo}
          lastMonth={lastMonth}
        />
      ))}
    </div>
  );


  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <LoadingOverlay loading={dataLoading} />
      <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
        <div>
          <h1 className="text-2xl font-medium tracking-tight mb-5">
            User Details
          </h1>
        </div>
        <div className="flex flex-row gap-x-5 items-center">
          {user.img ? (
            <img
              className="w-[10rem] h-[10rem] rounded-full object-cover"
              src={user.img}
              alt="user Profile"
            />
          ) : (
            <svg
              className="w-[10rem] h-[10rem] rounded-full object-cover"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="16 16 224 224"
            >
              <path
                d="M63.8,199.37a72,72,0,0,1,128.4,0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="12"
              />
              <circle
                cx="128"
                cy="128"
                r="96"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="12"
              />
              <circle
                cx="128"
                cy="120"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="12"
              />
            </svg>
          )}
          <ul className="flex flex-col">
            <li className="font-medium text-3xl my-2">{user.name}</li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                Username:
              </span>
              <span>{user.username}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                E-mail:
              </span>
              <span>{user.email}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                Phone:
              </span>
              <span>{user.phone}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                Department:
              </span>
              <span>{user.department}</span>
            </li>
            <li className="font-medium mb-2">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                Role:
              </span>
              <span>{user.role}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                Status:
              </span>
              <span
                className={
                  user.status === "active" ? statusActive : statusInactive
                }
              >
                {user.status}
              </span>
            </li>
          </ul>
        </div>
        <div className="my-8">
            <div className="mb-2 py-2 px-5 shadow border-2 border-gray-100 flex items-center justify-center text-black rounded-lg dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-[#001C40]">
              <span>Showing overview for: </span>
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                renderMonthContent={renderMonthContent}
                showMonthYearPicker
                dateFormat="MM/yyyy"
                className="w-20 text-center dark:text-[#F4F4F4] dark:bg-[#001C40]"
              />
          </div>
          <OverviewCards points={overviewPoints} />
        </div>
        <h1 className="text-2xl font-medium tracking-tight mb-5">Graph</h1>
        <div className="flex flex-row justify-around">
          <div>
            <LineChart
              data={seriesData}
              categories={categories}
              theme={theme}
            />
          </div>
          <div>
            <PieChart data={seriesData} labels={categories} theme={theme} />
          </div>
        </div>
        <div className="text-right mt-5">
          <button
            onClick={() => handleUpdateStatus(id, user.name)}
            className="bg-[#0364BD] hover:bg-[#003A70] p-2 text-white font-medium rounded-lg mr-2"
          >
            <span className="flex flex-row items-center gap-x-1">
              <RiLoopLeftLine className="w-6 h-6" /> Update Status
            </span>
          </button>
          <button
            onClick={() => handleRemUser(id, user.name)}
            className="bg-red-500 hover:bg-red-700 p-2 text-white font-medium rounded-lg"
          >
            <span className="flex flex-row items-center gap-x-1">
              <RiDeleteBinLine className="w-6 h-6" /> Remove User
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
