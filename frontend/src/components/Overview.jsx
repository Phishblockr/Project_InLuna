import React, { useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useSelector } from 'react-redux';
import 'bootstrap-icons/font/bootstrap-icons.css';

const seriesData = [128, 56, 89, 74];
const categories = ['Visited', 'Blocked', 'Clicked', 'Whitelisted'];

const OverviewCard = ({count, title, logo, lastMonth }) => (
  <div className={`shadow border-2 border-gray-100 flex px-4 py-6 items-center text-black rounded-lg`}>
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
  <div className='grid grid-cols-4 gap-3'>
    {points.map(({ id, title, count, logo, lastMonth }) => (
      <OverviewCard key={id} count={count} title={title} logo={logo} lastMonth={lastMonth} />
    ))}
  </div>
);

const LineChart = ({ data, categories }) => (
  <Chart
    height={300}
    width={450}
    type='line'
    series={[{ name: 'Link Statistics', data }]}
    options={{ xaxis: { categories } }}
  />
);

const PieChart = ({ data, labels }) => (
  <Chart
    height={450}
    width={450}
    type='pie'
    series={data}
    options={{ labels, noData: { text: 'Statistics not available' } }}
  />
);

const Overview = () => {
  const overviewPoints = useSelector(state => state.overview.linkData);
  console.log(overviewPoints);

  return (
    <div className='z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] p-4 gap-4'>
      <div className='z-1 w-full bg-white rounded-xl shadow-xl flex flex-col p-3 gap-2'>
        <h1 className='text-2xl font-medium tracking-tight'>Overview</h1>
        <OverviewCards points={overviewPoints} />
      
      <div className='mt-10 grid grid-cols-2'>
        <div className='flex justify-center items-center'>
          <LineChart data={seriesData} categories={categories} />
        </div>
        <div className='flex justify-center items-center'>
          <PieChart data={seriesData} labels={categories} />
        </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
