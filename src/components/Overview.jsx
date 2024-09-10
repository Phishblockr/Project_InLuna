import React, { useEffect, useState } from 'react';
import LineChart from './LineChart';
import PieChart from './PieChart';
import { toast } from "sonner";
import { useSelector, useDispatch } from 'react-redux';
import { setOverviewData } from '../features/Overview/OverviewSlice.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../static/CustomDatePicker.css'; 
import LoadingOverlay from "./LoadingOverlay";

const seriesData = [128, 56, 89, 74];
const categories = ['Visited', 'Blocked', 'Clicked', 'Whitelisted'];

const OverviewCard = ({ count, title, logo, lastMonth }) => (
  <div className="shadow border-2 border-gray-100 flex px-4 py-6 items-center text-black rounded-lg dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-0">
    <div className='w-full flex flex-col font-medium'>
      <div className='flex flex-row justify-between'>
        <h4>{title}</h4>
        <i className={`${logo}`}></i>
      </div>
      <h4 className='mt-2 text-2xl font-bold'>{count}</h4>
      <div>
        <span className='text-[12px] text-gray-500'>{lastMonth}% compared to last month</span>
      </div>
    </div>
  </div>
);

const OverviewCards = ({ points }) => (
  <div className='grid grid-cols-4 gap-3'>
    {points.map(({ id, title, count, logo, lastMonth }) => (
      <OverviewCard key={id} count={count} title={title} logo={logo} lastMonth={lastMonth} />
    ))}
  </div>
);

const Overview = () => {
  const dispatch = useDispatch();
  const overviewPoints = useSelector(state => state.overview.linkData);
  const theme = useSelector((state) => state.theme);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dataLoading, setDataLoading] = useState(false)

  const renderMonthContent = (month, shortMonth, longMonth, day) => {
    const fullYear = new Date(day).getFullYear();
    const tooltipText = `Tooltip for month: ${longMonth} ${fullYear}`;

    return <span title={tooltipText}>{shortMonth}</span>;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchMetrics(date);
  };

  const fetchMetrics = async (date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    setDataLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user.token;
      const response = await fetch(`${apiUrl}/overview/org-metrics?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      const mappedData = [
        { id: 1, title: "Phishing links visited", count: data.totalOrgPhishingVisits, lastMonth: data.percentageChangeOrgPhishingVisits, logo: "bi bi-shield-x" },
        { id: 2, title: "Links whitelisted", count: data.totalApprovedWhitelistRequests, lastMonth: data.percentageChangeApprovedWhitelistRequests, logo: "bi bi-shield-check" },
        { id: 3, title: "Blacklisted links clicked", count: data.totalOrgBlacklistedVisits, lastMonth: data.percentageChangeOrgBlacklistedVisits, logo: "bi bi-shield-exclamation" },
        { id: 4, title: "Phishing links blocked", count: data.totalBlacklistedUrls, lastMonth: data.percentageChangeBlacklistedUrls, logo: "bi bi-shield-shaded" },
      ];
      dispatch(setOverviewData(mappedData));
      setDataLoading(false)
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchMetrics(selectedDate);
  }, [dispatch, selectedDate]);

  return (
    <div className='z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] p-4 gap-4'>
      <LoadingOverlay loading={dataLoading} />
      <div className='z-1 w-full bg-white rounded-xl shadow-xl flex flex-col p-3 gap-2 dark:bg-[#002451]'>
        <div className="flex justify-between">
        <h1 className='text-2xl font-medium tracking-tight dark:text-[#F4F4F4]'>Overview</h1>

        <div >
          <div className="mb-2 py-2 px-5 shadow border-2 border-gray-100 flex items-center text-black rounded-lg dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-[#001C40]">
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
          </div>
        </div>

        <OverviewCards points={overviewPoints} />

        <div className='mt-10 grid grid-cols-2'>
          <div className='flex justify-center items-center'>
            <LineChart data={seriesData} categories={categories} theme={theme} />
          </div>
          <div className='flex justify-center items-center'>
            <PieChart data={seriesData} labels={categories} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
