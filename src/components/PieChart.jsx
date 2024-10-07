import React from 'react';
import Chart from 'react-apexcharts';

const PieChart = ({ data, labels, theme }) => {
  const options = {
    chart: {
      type: 'pie',
    },
    colors: theme === 'dark' ? ['#FF5733', '#33FF57', '#3357FF', '#FFC300'] : ['#FF5733', '#33FF57', '#3357FF', '#FFC300'],
    labels,
    noData: { text: 'Statistics not available' },
    legend: {
      labels: {
        colors: theme === 'dark' ? ['#f4f4f4', '#f4f4f4', '#f4f4f4', '#f4f4f4'] : ['#000', '#000', '#000', '#000']
      }
    },
    dataLabels: {
      style: {
        colors: theme === 'dark' ? ['#f4f4f4', '#f4f4f4', '#f4f4f4', '#f4f4f4'] : ['#f4f4f4', '#f4f4f4', '#f4f4f4', '#f4f4f4']
      }
    },
  };

  return (
    <Chart
      height={450}
      width={450}
      type='pie'
      series={data}
      options={options}
    />
  );
};

export default PieChart;
