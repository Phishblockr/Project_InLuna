import React, { useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useSelector } from 'react-redux';

const seriesData = [128, 56, 89, 74];
const categories = ['Visited', 'Blocked', 'Clicked', 'Whitelisted'];

const OverviewCard = ({ bg, count, title }) => (
  <div className={`${bg} shadow-md flex px-4 py-6 items-center text-white rounded-lg`}>
    <div className='flex flex-col font-normal'>
      <h4 className='text-xl'>{count}</h4>
      <h4 className='w-3/4'>{title}</h4>
    </div>
  </div>
);

const OverviewCards = ({ points }) => (
  <div className='grid grid-cols-4 gap-3'>
    {points.map(({ id, title, count, bg }) => (
      <OverviewCard key={id} bg={bg} count={count} title={title} />
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
    <div className='z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] p-4 gap-4'>
      <div className='z-1 w-full bg-white rounded-xl shadow-xl flex flex-col p-3 gap-2'>
        <h1 className='text-2xl font-normal tracking-tight'>Overview</h1>
        <OverviewCards points={overviewPoints} />
      </div>
      <div className='w-full bg-white rounded-xl shadow-xl grid grid-cols-2'>
        <div className='flex justify-center items-center'>
          <LineChart data={seriesData} categories={categories} />
        </div>
        <div className='flex justify-center items-center'>
          <PieChart data={seriesData} labels={categories} />
        </div>
      </div>
    </div>
  );
};

export default Overview;
