import React from "react";
import Chart from "react-apexcharts";
import { RiLoopLeftLine, RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { remUser } from '../features/Insights/insightsSlice';

const seriesData = [56, 89, 74];
const categories = ["Blacklisted urls visited", "whitelist urls requests", "visits to requested urls"];

const overviewPoints = [
  {
    id: 1,
    title: "Clicks On Blacklisted Links",
    count: 118,
    lastMonth:"+20", logo:"bi bi-shield-x"
  },
  { id: 2, title: "whitelist requests", count: 56, lastMonth:"+10", logo:"bi bi-shield-exclamation" },
  {
    id: 3,
    title: "Visits to requested Urls.",
    count: 23,
    lastMonth:"+90", logo:"bi bi-shield-shaded"
  },
];

const OverviewCard = ({count, title, logo, lastMonth }) => (
  <div className={`shadow border-2 border-gray-100 flex px-4 py-6 items-center text-black rounded-lg dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-0`}>
    <div className='w-full flex flex-col font-medium'>
      <div className='flex flex-row justify-between'>
        <h4 className=''>{title}</h4>
        <i className={`${logo}`}></i>
      </div>
      <h4 className='mt-2 text-2xl font-bold'>{count}</h4>
      <div>
        <span className='text-[12px] text-gray-500'>{lastMonth}% from last month</span>
      </div>
    </div>
  </div>
);

const OverviewCards = ({ points }) => (
  <div className='grid grid-cols-3 gap-3'>
    {points.map(({ id, title, count, logo, lastMonth }) => (
      <OverviewCard key={id} count={count} title={title} logo={logo} lastMonth={lastMonth} />
    ))}
  </div>
);
const LineChart = ({ data, categories }) => (
  <Chart
    height={300}
    width={450}
    type="line"
    series={[{ name: "Link Statistics", data }]}
    options={{ xaxis: { categories } }}
  />
);

const PieChart = ({ data, labels }) => (
  <Chart
    height={450}
    width={450}
    type="pie"
    series={data}
    options={{ labels, noData: { text: "Statistics not available" } }}
  />
);


const EmpInsights = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const empData = useSelector((state) =>
    state.insights.users.find((user) => user.id === parseInt(id))
  );

  const handleRemUser = (id, name) => {
    const res = confirm(`Do you want to remove user ${name}?`);
  
    if (res) {
      try {
        dispatch(remUser(id));
        toast.success(`User ${name} removed`)
        navigate("/insights/")
      } catch (error) {
        console.error(error.message);
        toast.error(`Unable to remove user ${id}`);
      }
    } else {
      return;
    }
  }

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
        <div>
          <h1 className="text-2xl font-medium tracking-tight mb-5">
            Employee Insights
          </h1>
        </div>
        <div className="flex flex-row gap-x-5 items-center">
          <img
            className="w-[10rem] h-[10rem] rounded-full object-cover"
            src={empData.img}
            alt="user Profile"
          />
          <ul className="flex flex-col">
            <li className="font-medium text-3xl my-2">{empData.name}</li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">Id:</span>
              <span>{empData.id}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">E-mail:</span>
              <span>{empData.email}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">Department:</span>
              <span>{empData.department}</span>
            </li>
          </ul>
        </div>
        <div className="my-8">
        <OverviewCards points={overviewPoints} />
        </div>
        <h1 className="text-2xl font-medium tracking-tight mb-5">Graph</h1>
        <div className="flex flex-row justify-around">
          <div>
            <LineChart data={seriesData} categories={categories} />
          </div>
          <div>
            <PieChart data={seriesData} labels={categories} />
          </div>
        </div>
        <div className="text-right mt-5">
          <button onClick={() => handleRemUser(empData.id, empData.name)} className="bg-red-500 hover:bg-red-700 p-2 text-white font-medium rounded-lg">
            <span className="flex flex-row items-center gap-x-1">
              <RiDeleteBinLine className="w-6 h-6" /> Remove User
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmpInsights;
