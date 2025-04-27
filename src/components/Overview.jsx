import React, { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthProvider";
import { toast } from "sonner";
import MultiLineChart from "./Charts/LineCharts//MultiLineChart.jsx";
import SingleLineChart from "./Charts/LineCharts/SingleLineChart.jsx";

const Overview = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();
  const token = getToken();
  const [metricsData, setMetricsData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [weeklyUserData, setWeeklyUserData] = useState([]);
  const [monthlyUserData, setMonthlyUserData] = useState([]);
  const [weeklyOrgData, setWeeklyOrgData] = useState([]);

  const OverviewCard = ({ title, metrics, href }) => {
    const Wrapper = href ? "a" : "div"; // Dynamically choose the wrapper tag

    return (
      <Wrapper
        href={href || undefined} // Add href only if it exists
        className={`border border-dashed border-gray-200 rounded-lg bg-white flex justify-center items-center py-6 px-2 shadow flex-col text-center dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-0 ${
          href ? "hover:shadow-md" : ""
        }`}
      >
        <h1 className="text-5xl font-medium">{metrics}</h1>
        <p>{title}</p>
      </Wrapper>
    );
  };

  const OverviewCards = ({ data }) => (
    <div className="grid grid-cols-3 gap-4">
      {data.map(({ id, title, metrics, href }) => (
        <OverviewCard key={id} metrics={metrics} title={title} href={href} />
      ))}
    </div>
  );

  const fetchMetrics = async (token) => {
    try {
      const res = await fetch(`${apiUrl}/supermetrics/getOverallStats`, {
        method: "GET",
      });
      const data = await res.json();
      const mappedData = [
        {
          id: 1,
          title: "Total users",
          metrics: data.combinedTotalUsers,
        },
        {
          id: 2,
          title: "Total Organisations",
          metrics: data.totalOrganizations,
          href: "/Organisations",
        },
        {
          id: 3,
          title: "Total Individual ",
          metrics: data.totalIndividuals,
        },
        {
          id: 4,
          title: "Paid Organisations",
          metrics: data.paidOrgCount,
        },
        {
          id: 5,
          title: "Paid Individuals",
          metrics: data.paidIndCount,
        },
      ];
      setMetricsData(mappedData);
      fetchWeeklySignUp(mappedData);
    } catch (error) {
      toast.error("Error Fetching metrics", error.message);
    }
  };
  const fetchWeeklySignUp = async (currentMetrics) => {
    try {
      const res = await fetch(`${apiUrl}/supermetrics/getLastWeekSignups`, {
        method: "GET",
      });
      const data = await res.json();
      const weeklyMetrics = [
        {
          id: 6,
          title: "Weekly Organisations SignUp",
          metrics: data.organizationSignups,
        },
        {
          id: 7,
          title: "Weekly Individual SignUps",
          metrics: data.individualSignups,
        },
      ];
      const updatedMetrics = [...currentMetrics, ...weeklyMetrics];
      setMetricsData(updatedMetrics);

      fetchMonthSignUp(updatedMetrics);
    } catch (error) {
      toast.error("Error Fetching Weekly Signup", error.message);
    }
  };
  const fetchMonthSignUp = async (currentMetrics) => {
    try {
      const res = await fetch(`${apiUrl}/supermetrics/getLastMonthSignups`, {
        method: "GET",
      });
      const data = await res.json();
      const monthlyMetrics = [
        {
          id: 8,
          title: "Monthly Organisations SignUps",
          metrics: data.organizationSignups,
        },
        {
          id: 9,
          title: "Monthly Individual SignUps",
          metrics: data.individualSignups,
        },
      ];
      setMetricsData([...currentMetrics, ...monthlyMetrics]);
    } catch (error) {
      toast.error("Error Fetching Weekly Signup", error.message);
    }
  };

  const fetchLastFiveWeekSignup = async () => {
    try {
      const res = await fetch(`${apiUrl}/supermetrics/lastFiveWeekSignups`, {
        method: "GET",
      });
      const rawData = await res.json();
      console.log("raw data", rawData);

      const weekUserData = rawData
        .map((entry, i) => {
          const week = entry[`week${i + 1}`];
          return {
            date: new Date(week.endDate).toISOString().split("T")[0], // formatted date string
            value: week.userSignups,
          };
        })
        .reverse(); // Show oldest first
      console.log("week User data", weekUserData);

      const weekOrgData = rawData
        .map((entry, i) => {
          const week = entry[`week${i + 1}`];
          return {
            date: new Date(week.endDate).toISOString().split("T")[0], // formatted date string
            value: week.organizationSignups,
          };
        })
        .reverse(); // Show oldest first
      console.log("week Org data", weekOrgData);

      setWeeklyUserData(weekUserData);
      setWeeklyOrgData(weekOrgData);
      setChartData(weekUserData);
    } catch (error) {
      toast.error("Error Fetching Last Five Week Signups", error.message);
    }
  };

  const sales = [
    { date: "2023-04-30", value: 4 },
    { date: "2023-05-01", value: 6 },
    { date: "2023-05-02", value: 8 },
    { date: "2023-05-03", value: 10 },
    { date: "2023-05-04", value: 12 },
    { date: "2023-05-05", value: 14 },
    { date: "2023-05-06", value: 16 },
    { date: "2023-05-07", value: 18 },
    { date: "2023-05-08", value: 20 },
    // ...
  ];

  const sales2 = [
    { date: "2023-04-30", value: 3 },
    { date: "2023-05-01", value: 3.5 },
    { date: "2023-05-02", value: 4 },
    { date: "2023-05-03", value: 4.5 },
    { date: "2023-05-04", value: 5 },
    { date: "2023-05-05", value: 5.5 },
    { date: "2023-05-06", value: 6 },
    { date: "2023-05-07", value: 6.5 },
    { date: "2023-05-08", value: 7 },

    // ...
  ];

  useEffect(() => {
    fetchMetrics();
    fetchLastFiveWeekSignup();
    console.log("chart Data", chartData);
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="bg-white py-4 px-2 m-2 rounded-md">
        <OverviewCards data={metricsData} />
      </div>
      <div className="flex ">
        <div className="bg-white py-4 px-5 m-2 mt-6 rounded-md mb-20 w-full">
          <h2 className="text-xl font-semibold mb-8">
            Weekly User Signup
          </h2>
          <SingleLineChart data={weeklyUserData} color="stroke-blue-500" dotColor="text-blue-400" />
        </div>
        <div className="bg-white py-4 px-3 m-2 mt-6 rounded-md mb-20 w-full">
          <h2 className="text-xl font-semibold mb-8">
            Weekly Organisation Signup
          </h2>
          <SingleLineChart data={weeklyOrgData} />
        </div>
      </div>
    </div>
  );
};

export default Overview;
