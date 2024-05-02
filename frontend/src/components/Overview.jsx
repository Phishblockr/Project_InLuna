import React from 'react'
import Chart from 'react-apexcharts'

export default function Overview() {
  const overview_points = [
    { id: 1, title: "Phishing links visited", count: 108, bg: 'bg-[#FF6392] opacity-40 ' },
    { id: 2, title: "Links whitelisted", count: 18, bg: "bg-[#D3B938]" },
    { id: 3, title: "Blacklisted links clicked", count: 26, bg: "bg-[#5AA9E6] opacity-60 " },
    { id: 4, title: "Phishing links blocked", count: 54, bg: 'bg-[#C62828] opacity-80' },
  ]

  const series = [128, 56, 89, 74]

  const options = ['Visited', 'Blocked', 'Clicked', 'Whitelisted']

  return (
    <div className='z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4'>
      <div className='z-1 w-full bg-white rounded-xl shadow-xl flex flex-col p-3 gap-2 h-max'>
        <h1 className='text-2xl font-bold tracking-tight'>Overview</h1>
        <div className='grid grid-cols-4 gap-3'>
          {overview_points.map(el => <div key={el.id} className={`${el.bg} shadow-md flex px-4 py-6 items-center text-white rounded-lg`}>
            <div className='flex flex-col font-bold '>
              <h4 className='text-xl'>{el.count}</h4>
              <h4 className='w-3/4'>{el.title}</h4>
            </div>
          </div>)}
        </div>
      </div>
      <div className='w-full bg-white rounded-xl h-full shadow-xl grid grid-cols-2'>
        <div className="flex justify-center items-center">
          <Chart height={300} width={450} type='line' series={[{name: "Link Statistics", data: series}]} options={{xaxis: { categories: options }}}>
          </Chart>
        </div>
        <div className="flex justify-center items-center">
          <Chart height={450} width={450} type='pie' series={series} options={{labels: options, noData: "Statistics not available"}}>
          </Chart>
        </div>
      </div>
    </div>
  )
}
