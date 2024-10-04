import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { useSelector, useDispatch } from 'react-redux';
import { setOverviewData } from '../features/Overview/OverviewSlice.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../static/CustomDatePicker.css';
import LoadingOverlay from "../utils/LoadingOverlay";
import { BarChart } from '@mui/x-charts/BarChart';
import { format, getISOWeek, endOfMonth, startOfMonth, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval } from 'date-fns';

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
  const [timeFrame, setTimeFrame] = useState('weekly');
  const [dataLoading, setDataLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [barGraphData, setBarGraphData] = useState({ labels: [], totalVisits: [], blacklistedVisits: [], phishingVisits: [] });
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [currentWeek, setCurrentWeek] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const goToNextWeek = () => {
    const endOfCurrentMonth = endOfMonth(selectedDate);
    const nextWeekStart = addWeeks(currentWeek.start, 1);
    const nextWeekEnd = addWeeks(currentWeek.end, 1);

    // Limit the next week within the current month
    const nextStart = nextWeekStart > endOfCurrentMonth ? endOfCurrentMonth : nextWeekStart;
    const nextEnd = nextWeekEnd > endOfCurrentMonth ? endOfCurrentMonth : nextWeekEnd;

    // Update current week
    setCurrentWeek({
      start: nextStart,
      end: nextEnd,
    });
  };

  const goToPreviousWeek = () => {
    const startOfCurrentMonth = startOfMonth(selectedDate);
    const prevWeekStart = subWeeks(currentWeek.start, 1);
    const prevWeekEnd = subWeeks(currentWeek.end, 1);

    // Limit the previous week within the current month
    const prevStart = prevWeekStart < startOfCurrentMonth ? startOfCurrentMonth : prevWeekStart;
    const prevEnd = prevWeekEnd < startOfCurrentMonth ? startOfCurrentMonth : prevWeekEnd;

    // Update current week
    setCurrentWeek({
      start: prevStart,
      end: prevEnd,
    });
  };

  const getFormattedWeekRange = () => {
    return `${format(currentWeek.start, 'dd/MM/yyyy')} - ${format(currentWeek.end, 'dd/MM/yyyy')}`;
  };

  const generateAllDatesInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const dates = [];
    while (date.getMonth() === month) {
      dates.push(format(new Date(date), 'dd/MM/yyyy'));
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const renderMonthContent = (month, shortMonth, longMonth, day) => {
    const fullYear = new Date(day).getFullYear();
    const tooltipText = `Tooltip for month: ${longMonth} ${fullYear}`;

    return <span title={tooltipText}>{shortMonth}</span>;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);

    // Update the current week to the first week of the newly selected month
    const firstWeekStart = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    const firstWeekEnd = endOfWeek(startOfMonth(date), { weekStartsOn: 1 });
    setCurrentWeek({ start: firstWeekStart, end: firstWeekEnd });

    fetchMetrics(date, timeFrame); // Fetch data based on selected date and time frame
  };


  const handleTimeFrameChange = (e) => {
    setTimeFrame(e.target.value);
    fetchMetrics(selectedDate, e.target.value); // Fetch data when the time frame changes
  };

  const handleSeriesChange = (e) => {
    setSelectedSeries(e.target.value); // Update the selected series based on user input
  };

  const fetchMetrics = async (date, timeFrame) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    setDataLoading(true);
    let loadingTimer = setTimeout(() => {
      setShowLoading(true); // Only show loading overlay after delay
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
      console.log(data)
      // Generate all dates in the selected month
      const allDatesInMonth = generateAllDatesInMonth(year, month - 1);

      // Merge fetched data with all dates in the month and filter by current week
      const mergedBarGraphData = allDatesInMonth.map(date => {
        const index = data.barGraphData.labels.indexOf(date);
        return {
          label: date,
          totalVisits: index !== -1 ? data.barGraphData.totalVisits[index] : 0,
          blacklistedVisits: index !== -1 ? data.barGraphData.blacklistedVisits[index] : 0,
          phishingVisits: index !== -1 ? data.barGraphData.phishingVisits[index] : 0,
        };
      }).filter((item) => {
        const itemDate = new Date(item.label.split('/').reverse().join('-')); // Convert label to Date
        // Ensure only dates within the current week and within the selected month are included
        return isWithinInterval(itemDate, { start: currentWeek.start, end: currentWeek.end }) &&
          itemDate.getMonth() === selectedDate.getMonth();
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

  const filteredSeries = {
    totalVisits: { label: "Detection", data: barGraphData.totalVisits },
    blacklistedVisits: { label: "Blacklisted Visits", data: barGraphData.blacklistedVisits },
    phishingVisits: { label: "Phishing Visits", data: barGraphData.phishingVisits },
    all: [
      { label: "Detection", data: barGraphData.totalVisits },
      { label: "Phishing Visits", data: barGraphData.phishingVisits },
      { label: "Blacklisted Visits", data: barGraphData.blacklistedVisits }
    ]
  };

  return (
    <div className='z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4'>
      {showLoading && <LoadingOverlay loading={dataLoading} />}
      <div className='z-1 w-full h-full bg-white rounded-xl shadow-xl flex flex-col p-3 gap-2 dark:bg-[#002451]'>
        <div className="flex justify-between">
          <h1 className='text-2xl font-medium tracking-tight dark:text-[#F4F4F4]'>Overview</h1>

          <div className="flex items-center gap-4">
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

        <OverviewCards points={overviewPoints} />

        <div className='w-full mt-10'>
          <div className="flex justify-between items-center mt-4">
            <button onClick={goToPreviousWeek} className="p-2 border rounded-lg dark:bg-[#001C40] dark:text-[#F4F4F4]">
              &larr; Previous Week
            </button>
            <span className="text-xl font-semibold dark:text-[#F4F4F4]">{getFormattedWeekRange()}</span>
            <button onClick={goToNextWeek} className="p-2 border rounded-lg dark:bg-[#001C40] dark:text-[#F4F4F4]">
              Next Week &rarr;
            </button>
          </div>

          <div className="mt-4">
            <label htmlFor="seriesSelect" className="mr-2">Show Data:</label>
            <select id="seriesSelect" value={selectedSeries} onChange={handleSeriesChange} className="p-2 border rounded-lg dark:bg-[#001C40] dark:text-[#F4F4F4]">
              <option value="all">All</option>
              <option value="totalVisits">Detection</option>
              <option value="phishingVisits">Phishing Visits</option>
              <option value="blacklistedVisits">Blacklisted Visits</option>
            </select>
          </div>

          <BarChart
            xAxis={[{ scaleType: 'band', data: barGraphData.labels }]}
            series={selectedSeries === 'all' ? filteredSeries.all : [filteredSeries[selectedSeries]]}
            height={300}
            sx={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  );
};

export default Overview;
