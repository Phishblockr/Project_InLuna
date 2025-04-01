import React, { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthProvider";
import { toast } from "sonner";

const Overview = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();
  const token = getToken();
  const [cardData, setCardData] = useState([]);
  const [orgData, setOrgData] = useState([]);
  const [indData, setIndData] = useState([]);
  const [totalData, setTotalData] = useState([]);

  const OverviewCard = ({ title, metrics, href }) => {
    const Wrapper = href ? "a" : "div"; // Dynamically choose the wrapper tag
  
    return (
      <Wrapper
        href={href || undefined} // Add href only if it exists
        className="border border-gray-100 rounded-lg flex justify-center items-center py-6 px-2 shadow flex-col text-center dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-0 hover:shadow-md"
      >
        <h1 className="text-5xl font-medium">{metrics}</h1>
        <p>{title}</p>
      </Wrapper>
    );
  };
  

  const OverviewCards = ({ data }) => (
    <div className="grid grid-cols-4 gap-3">
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
      // const mappedData = [
      //   {
      //     id:1,title:"Total Organizations",metrics:data.totalOrganizations
      //   },{
      //     id:2, title:"Total Organizations User Count", metrics:data.orgUserCount
      //   }
      //   ,{
      //     id:3, title:"Freemium Organizations Count", metrics:data.freemiumOrgCount
      //   }
      //   ,{
      //     id:4, title:"Paid Organizations Count", metrics:data.paidOrgCount
      //   }
      //   ,{
      //     id:5, title:"Freemium Individual Count", metrics:data.freemiumIndCount
      //   }
      //   ,{
      //     id:6, title:"Paid Individual Count", metrics:data.paidIndCount
      //   }
      //   ,{
      //     id:7, title:"Total Individual Count", metrics:data.totalIndividuals
      //   }
      //   ,{
      //     id:8, title:"Combined total users", metrics:data.combinedTotalUsers
      //   }
      // ];
      // setCardData(mappedData);
      const OrgData = [
        {
          id: 1,
          title: "Total Organizations",
          metrics: data.totalOrganizations,
          href: "/Organisations",
        },
        {
          id: 2,
          title: "Total Organizations User Count",
          metrics: data.orgUserCount,
        },
        {
          id: 3,
          title: "Freemium Organizations Count",
          metrics: data.freemiumOrgCount,
        },
        {
          id: 4,
          title: "Paid Organizations Count",
          metrics: data.paidOrgCount,
        },
      ];
      const IndData = [
        {
          id: 5,
          title: "Freemium Individual Count",
          metrics: data.freemiumIndCount,
        },
        {
          id: 6,
          title: "Paid Individual Count",
          metrics: data.paidIndCount,
        },
        {
          id: 7,
          title: "Total Individual Count",
          metrics: data.totalIndividuals,
        },
      ];
      const TotalData = [
        {
          id: 8,
          title: "Total users",
          metrics: data.combinedTotalUsers,
        },
      ];
      setOrgData(OrgData);
      setIndData(IndData);
      setTotalData(TotalData);
    } catch (error) {
      toast.error("Error Fetching metrics", error.message);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="overflow-x-hidden">
      <div className="bg-white py-4 px-2 m-2 rounded-md">
        <div className="my-3">
          <h2 className="mb-2 text-xl font-semibold">Organizations</h2>
          <OverviewCards data={orgData} />
        </div>
        <div className="my-3">
          <h2 className="mb-2 text-xl font-semibold">Individual</h2>
          <OverviewCards data={indData} />
        </div>
        <div className="my-3">
          <h2 className="mb-2 text-xl font-semibold">Total</h2>
          <OverviewCards data={totalData} />
        </div>
      </div>
    </div>
  );
};

export default Overview;
