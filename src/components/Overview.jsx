import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { useSelector, useDispatch } from 'react-redux';
import { setOverviewData } from '../features/Overview/OverviewSlice.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../static/CustomDatePicker.css';
import LoadingOverlay from "../utils/LoadingOverlay";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import Plot from 'react-plotly.js';
import { PiUserCircleLight } from "react-icons/pi";
import { Link } from 'react-router-dom';
import socket from '../utils/socket.jsx';
import Chart from 'react-apexcharts';

const Overview = () => {

    const BrowsingProfileTable = ({ profiles, title }) => {
      return (
          <div className="rounded-lg shadow border-2 border-gray-100 dark:bg-[#001C40] dark:shadow-none dark:border-[#001C40] w-full p-5">
              <h2 className="text-lg font-semibold mb-5">{title}</h2>
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="border-b">
                          <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Name</th>
                          <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Department</th>
                          <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Extension Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      {profiles.map(user => (
                          <tr key={user.userId} className="border-b hover:bg-gray-100 dark:hover:bg-[#182A46]">
                              <td className="p-3 flex items-center gap-x-2">
                                  <Link to={`/users/userDetails/${user.userId}`} title="Click to view details" className="flex items-center gap-x-2">
                                      {user.profilePic ? (
                                          <img src={user.profilePic} alt={`${user.name}'s profile`} className="h-12 w-12 rounded-full" />
                                      ) : (
                                          <PiUserCircleLight className="h-12 w-12 text-gray-500" />
                                      )}
                                      <span className="font-medium text-gray-800 dark:text-gray-200">{user.name}</span>
                                  </Link>
                              </td>
                              <td className="p-3 text-gray-600 dark:text-gray-400">{user.department}</td>
                              <td className="p-3">
                                  <span
                                      className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${
                                          user.heartBeatStatus === "active"
                                              ? "bg-green-100 text-green-800"
                                              : user.heartBeatStatus === "not initialized"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                      }`}
                                  >
                                      {user.heartBeatStatus}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  const dispatch = useDispatch();
  const overviewPoints = useSelector(state => state.overview.linkData);
  const theme = useSelector((state) => state.theme);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeFrame, setTimeFrame] = useState('monthly');
  const [browsingProfileMetrics, setBrowsingProfileMetrics] = useState("15")
  const [dataLoading, setDataLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [barGraphData, setBarGraphData] = useState({ labels: [], totalVisits: [], blacklistedVisits: [], phishingVisits: [] });
  const [scatterPlotData, setScatterPlotData] = useState([])
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [currentWeek, setCurrentWeek] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  const [heatmapData, setHeatmapData] = useState([]);
  const [badBrowsingProfile, setBadBrowsingProfile] = useState([])
  const [goodBrowsingProfile, setGoodBrowsingProfile] = useState([])

  const departments = [...new Set(scatterPlotData.map(d => d.department))];

  const phishingColor = "#FF5733";
  const blacklistedColor = "#33FFBD";
  const totalCountsColor = "#3375FF";
  const detectionColor = "#82ca9d";


  const isDarkMode = theme === 'dark';
  const backgroundColor = isDarkMode ? '#001C40' : '#ffffff';
  const gridColor = isDarkMode ? '#444444' : '#e5e5e5';
  const textColor = isDarkMode ? '#f4f4f4' : '#000000';

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
      const response = await fetch(`${apiUrl}/overview/org-metrics?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}&timeFrame=${timeFrame}&browsingProfileMetrics=${browsingProfileMetrics}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      console.log(data)

      setHeatmapData(
        Object.entries(data.heatmapData).map(([category, values]) => ({
          name: category,
          data: values.times.map((time, index) => ({
            x: time,
            y: values.visits[index]
          }))
        }))
      )

      setBadBrowsingProfile(data.badBrowsingProfile);
      setGoodBrowsingProfile(data.goodBrowsingProfile);

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

      setScatterPlotData(data.scatterPlotData);

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
      console.error(error);
      toast.error("Failed to fetch data");
    }
  };

  useEffect(() => {
    const events = [
      "newReqAdded",
      "reqUpdated",
      "reqDeleted",
      "urlAdded",
      "urlUpdated",
      "urlDeleted",
      "urlsByCsvAdded",
    ];

    const handleSocketEvent = () => {
      fetchMetrics(selectedDate, timeFrame);
    };

    events.forEach(event => socket.on(event, handleSocketEvent));

    // Clean up socket listeners on unmount
    return () => {
      events.forEach(event => socket.off(event, handleSocketEvent));
    };
  }, [selectedDate, timeFrame]); // Dependencies here ensure re-fetching on date/timeFrame changes

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

  console.log(heatmapData)

  return (
    <div className='z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4'>
      {showLoading && <LoadingOverlay loading={dataLoading} />}
      <div className='z-1 w-full h-full bg-white rounded-xl shadow-xl flex flex-col p-3 gap-5 dark:bg-[#002451]'>
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
            <h2 className="text-center dark:text-[#F4F4F4]">Monthly URL Access</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{
                  top: 20, right: 30, left: 20, bottom: 5,
                }}
              >
                {/* <CartesianGrid stroke={chartStyles.gridColor} /> */}

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
                  <Bar dataKey="detection" fill="#82ca9d" radius={[10, 10, 0, 0]} />
                ) : null}

                {selectedSeries === 'all' || selectedSeries === 'phishingVisits' ? (
                  <Bar dataKey="phishing" fill="#8884d8" radius={[10, 10, 0, 0]} />
                ) : null}

                {selectedSeries === 'all' || selectedSeries === 'blacklistedVisits' ? (
                  <Bar dataKey="blacklisted" fill="#ff4d4f" radius={[10, 10, 0, 0]} />
                ) : null}

              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full mt-3 p-2 rounded-lg shadow border-2 border-gray-100 dark:bg-[#001C40] dark:shadow-none dark:border-[#001C40]">
            <Plot className='w-full h-[400px]'
              data={[
                // Conditionally render data for Phishing Visits
                (selectedSeries === 'all' || selectedSeries === 'phishingVisits') && {
                  x: scatterPlotData.map(d => d.department),
                  y: scatterPlotData.map(d => d.phishingVisits),
                  mode: 'markers',
                  type: 'scatter',
                  name: 'Phishing Visits',
                  marker: { color: phishingColor, size: 8 },
                },
                // Conditionally render data for Blacklisted Visits
                (selectedSeries === 'all' || selectedSeries === 'blacklistedVisits') && {
                  x: scatterPlotData.map(d => d.department),
                  y: scatterPlotData.map(d => d.blacklistedVisits),
                  mode: 'markers',
                  type: 'scatter',
                  name: 'Blacklisted Visits',
                  marker: { color: blacklistedColor, size: 8 },
                },
                // Conditionally render data for Total Counts
                (selectedSeries === 'all' || selectedSeries === 'totalVisits') && {
                  x: scatterPlotData.map(d => d.department),
                  y: scatterPlotData.map(d => d.totalVisits),
                  mode: 'markers',
                  type: 'scatter',
                  name: 'Total Counts (Detection)',
                  marker: { color: totalCountsColor, size: 8 },
                },
              ].filter(Boolean)} // Filter out null traces if not selected
              layout={{
                title: {
                  text: 'Monthly URL Accesses by Department',
                  font: { color: textColor },
                },
                xaxis: {
                  title: { text: 'Departments', font: { color: textColor } },
                  tickvals: scatterPlotData.map(d => d.department),
                  ticktext: scatterPlotData.map(d => d.department),
                  showgrid: false,
                  color: textColor,
                },
                yaxis: {
                  title: { text: 'URL Access Count', font: { color: textColor } },
                  range: [0, Math.max(...scatterPlotData.map(d => d.totalVisits || 0)) + 5],
                  color: textColor,
                  gridcolor: gridColor,
                },
                shapes: scatterPlotData.map((dept, index) => ({
                  type: 'line',
                  x0: index + 0.5,
                  x1: index + 0.5,
                  y0: 0,
                  y1: Math.max(...scatterPlotData.map(d => d.totalVisits || 0)) + 5,
                  line: {
                    color: gridColor,
                    width: 1,
                    dash: 'dot',
                  },
                })),
                paper_bgcolor: backgroundColor,
                plot_bgcolor: backgroundColor,
                height: 400,
                showlegend: true,
                legend: {
                  font: { color: textColor },
                },
                margin: { l: 50, r: 50, t: 50, b: 50 },
              }}
              config={{ responsive: true }}
            />
          </div>
        </div>
        <div className="w-full p-2 rounded-lg shadow border-2 border-gray-100 dark:bg-[#001C40] dark:shadow-none dark:border-[#001C40]">
          <h2 className="text-center dark:text-[#F4F4F4]">URL Category Heatmap</h2>
          <Chart
            options={{
              chart: {
                type: 'heatmap',
                toolbar: { show: false },
                background: isDarkMode ? '#001C40' : '#ffffff', // Set background based on theme
              },
              plotOptions: {
                heatmap: {
                  colorScale: {
                    ranges: [
                      { from: 0, to: 5, color: "#a9d5ff" },
                      { from: 6, to: 10, color: "#57aeff" },
                      { from: 11, to: 20, color: "#0687ff" },
                      { from: 21, to: 30, color: "#005cb3" },
                      { from: 31, to: 40, color: "#003A70" },
                    ],
                  },
                },
              },
              dataLabels: {
                enabled: false,
              },
              xaxis: {
                type: "category",
                labels: { style: { colors: textColor } },
                title: { text: "Date", style: { color: textColor } }
              },
              yaxis: {
                labels: { style: { colors: textColor } },
                title: { text: "Categories", style: { color: textColor } }
              },
              legend: { labels: { colors: textColor } },
              theme: { mode: isDarkMode ? "dark" : "light" },
            }}
            series={heatmapData}
            type="heatmap"
            height={350}
          />
        </div>
        <div className='flex justify-center gap-5 dark:text-[#f4f4f4]'>
          <BrowsingProfileTable profiles={badBrowsingProfile} title={"User with Bad Browsing Profile"}/>
          <BrowsingProfileTable profiles={goodBrowsingProfile} title={"User with Good Browsing Profile"}/>
        </div>
      </div>
    </div>
  );
};

export default Overview;
