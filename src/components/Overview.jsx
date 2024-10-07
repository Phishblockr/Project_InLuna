import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { useSelector, useDispatch } from 'react-redux';
import { setOverviewData } from '../features/Overview/OverviewSlice.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../static/CustomDatePicker.css';
import LoadingOverlay from "../utils/LoadingOverlay";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const Overview = () => {
  const dispatch = useDispatch();
  const overviewPoints = useSelector(state => state.overview.linkData);
  const theme = useSelector((state) => state.theme);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [dataLoading, setDataLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [barGraphData, setBarGraphData] = useState({ labels: [], totalVisits: [], blacklistedVisits: [], phishingVisits: [] });
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [currentWeek, setCurrentWeek] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

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

  const generateAllDatesInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const dates = [];
    while (date.getMonth() === month) {
      dates.push(format(new Date(date), 'dd/MM/yyyy'));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const firstWeekStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const firstWeekEnd = endOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    setCurrentWeek({ start: firstWeekStart, end: firstWeekEnd });
    fetchMetrics(date, timeFrame);
  };

  const handleSeriesChange = (e) => {
    setSelectedSeries(e.target.value);
  };

  const fetchMetrics = async (date, timeFrame) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    setDataLoading(true);
    let loadingTimer = setTimeout(() => {
      setShowLoading(true);
    }, 500);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user.token;
      const response = await fetch(`${apiUrl}/overview/org-metrics?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}&timeFrame=${timeFrame}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log(data);

      const allDatesInMonth = generateAllDatesInMonth(year, month - 1);
      const mergedBarGraphData = allDatesInMonth.map(date => {
        const index = data.barGraphData.labels.indexOf(date);
        return {
          label: date,
          totalVisits: index !== -1 ? data.barGraphData.totalVisits[index] : 0,
          blacklistedVisits: index !== -1 ? data.barGraphData.blacklistedVisits[index] : 0,
          phishingVisits: index !== -1 ? data.barGraphData.phishingVisits[index] : 0,
        };
      });

      setBarGraphData({
        labels: mergedBarGraphData.map(item => item.label),
        totalVisits: mergedBarGraphData.map(item => item.totalVisits),
        blacklistedVisits: mergedBarGraphData.map(item => item.blacklistedVisits),
        phishingVisits: mergedBarGraphData.map(item => item.phishingVisits),
      });

      const mappedData = [
        { id: 1, title: "Phishing links visited", count: data.totalOrgPhishingVisits, lastMonth: data.percentageChangeOrgPhishingVisits, logo: "bi bi-shield-x" },
        { id: 2, title: "Links whitelisted", count: data.totalApprovedWhitelistRequests, lastMonth: data.percentageChangeApprovedWhitelistRequests, logo: "bi bi-shield-check" },
        { id: 3, title: "Blacklisted links clicked", count: data.totalOrgBlacklistedVisits, lastMonth: data.percentageChangeOrgBlacklistedVisits, logo: "bi bi-shield-exclamation" },
        { id: 4, title: "Phishing links blocked", count: data.totalBlacklistedUrls, lastMonth: data.percentageChangeBlacklistedUrls, logo: "bi bi-shield-shaded" },
      ];
      dispatch(setOverviewData(mappedData));
      clearTimeout(loadingTimer);
      setShowLoading(false);
      setDataLoading(false);
    } catch (error) {
      clearTimeout(loadingTimer);
      setShowLoading(false);
      setDataLoading(false);
      console.log(error);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    fetchMetrics(selectedDate, timeFrame);
  }, [dispatch, selectedDate, timeFrame, currentWeek]);

  const chartStyles = theme === 'dark' ? {
    textColor: '#f4f4f4',
    gridColor: '#444444',
  } : {
    textColor: '#000000',
    gridColor: '#E0E0E0',
  };

  const chartData = barGraphData.labels.map((label, index) => ({
    name: label,
    detection: barGraphData.totalVisits[index],
    phishing: barGraphData.phishingVisits[index],
    blacklisted: barGraphData.blacklistedVisits[index]
  }));

  return (
    <div className='z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4'>
      {showLoading && <LoadingOverlay loading={dataLoading} />}
      <div className='z-1 w-full h-full bg-white rounded-xl shadow-xl flex flex-col p-3 gap-2 dark:bg-[#002451]'>
        <div className="flex justify-between">
          <h1 className='text-2xl font-medium tracking-tight dark:text-[#F4F4F4]'>Overview</h1>

          <div className="flex items-center gap-4 dark:text-[#f4f4f4]">
            <span>Showing overview for: </span>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              showMonthYearPicker
              dateFormat="MM/yyyy"
              className="w-20 text-center rounded-lg dark:text-[#F4F4F4] dark:bg-[#002451] focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
            />
          </div>
        </div>

        <OverviewCards points={overviewPoints} />

        <div className='w-full mt-10 dark:text-[#f4f4f4]'>
          <div className="mt-4">
            <label htmlFor="seriesSelect" className="mr-2">Show Data:</label>
            <select
              id="seriesSelect"
              value={selectedSeries}
              onChange={handleSeriesChange}
              className="p-2 border rounded-lg dark:bg-[#001C40] dark:text-[#F4F4F4] dark:border-[#001C40] focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
            >
              <option value="all">All</option>
              <option value="totalVisits">Detection</option>
              <option value="phishingVisits">Phishing Visits</option>
              <option value="blacklistedVisits">Blacklisted Visits</option>
            </select>
          </div>

          <div className='mt-3 p-[20px] rounded-lg shadow border-2 border-gray-100 dark:bg-[#001C40] dark:shadow-none dark:border-[#001C40]'>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20, right: 30, left: 20, bottom: 5,
                }}
              >
                <CartesianGrid stroke={chartStyles.gridColor} />

                <XAxis
                  dataKey="name"
                  stroke={chartStyles.textColor}
                  tickFormatter={(tick) => tick.split('/')[0]} // Extracts and displays the day part of the date
                />

                <YAxis stroke={chartStyles.textColor} />
                <Tooltip cursor={{ fill: chartStyles.gridColor }} />
                <Legend verticalAlign="top" wrapperStyle={{ color: chartStyles.textColor }} />

                {/* Conditionally render bars based on the selected series */}
                {selectedSeries === 'all' || selectedSeries === 'totalVisits' ? (
                  <Bar dataKey="detection" fill="#82ca9d" radius={[10, 10, 0, 0]}/>
                ) : null}

                {selectedSeries === 'all' || selectedSeries === 'phishingVisits' ? (
                  <Bar dataKey="phishing" fill="#8884d8" radius={[10, 10, 0, 0]}/>
                ) : null}

                {selectedSeries === 'all' || selectedSeries === 'blacklistedVisits' ? (
                  <Bar dataKey="blacklisted" fill="#ff4d4f" radius={[10, 10, 0, 0]}/>
                ) : null}

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
