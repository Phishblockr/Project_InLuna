import React, { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthProvider";
import { toast } from "sonner";

const Overview = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();
  const token = getToken();
  const [metricsData, setMetricsData] = useState([]);

  const OverviewCard = ({ title, metrics, href }) => {
    const Wrapper = href ? "a" : "div"; // Dynamically choose the wrapper tag

    return (
      <Wrapper
        href={href || undefined} // Add href only if it exists
        className={`border border-dashed border-gray-200 rounded-lg bg-white flex justify-center items-center py-6 px-2 shadow flex-col text-center dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-0 ${href ? "hover:shadow-md": ""}`}
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
          metrics: data.organizationSignups ,
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

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="bg-white py-4 px-2 m-2 rounded-md">
        <OverviewCards data={metricsData} />
      </div>
    </div>
  );
};

export default Overview;
