import React from 'react';
import Chart from 'react-apexcharts';

const LineChart = ({ data, categories, theme }) => {
  const options = {
    chart: {
      type: 'line',
      toolbar: { show: false },
    },
    colors: theme === 'dark' ? ['#4ea9fc'] : ['#0364BD'],
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: {
        style: { colors: theme === 'dark' ? ['#f4f4f4', '#f4f4f4', '#f4f4f4', '#f4f4f4'] : ['#000', '#000', '#000', '#000'] },
      },
    },
    yaxis: {
      labels: {
        style: { colors: theme === 'dark' ? ['#f4f4f4'] : ['#000'] },
      },
    },
    title: {
      text: 'Link Statistics',
      style: { color: theme === 'dark' ? '#f4f4f4' : '#000' },
    },
    legend: {
      labels: {
        colors: theme === 'dark' ? ['#f4f4f4'] : ['#000'],
      },
    },
  };

  return (
    <Chart
      height={300}
      width={450}
      type='line'
      series={[{ name: 'Link Statistics', data }]}
      options={options}
    />
  );
};

export default LineChart;
