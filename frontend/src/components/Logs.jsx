import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Log from './Log';
import { MdOutlineArrowBackIos, MdOutlineArrowBackIosNew, MdOutlineArrowForwardIos } from 'react-icons/md';

export default function Logs() {
  const [showBlog, setBlog] = useState(false)

  const logs = [
    {
      id: 1,
      type: "whitelisted",
      name: "John Doe",
      date: "2024-05-08",
      time: "10:15:32",
      day: "Monday",
      phishingUrl: "http://example.com/phishing1"
    },
    {
      id: 2,
      type: "blacklisted",
      name: "Jane Smith",
      date: "2024-05-08",
      time: "11:30:45",
      day: "Monday",
      phishingUrl: "http://example.com/phishing2"
    },
    {
      id: 3,
      type: "whitelisted",
      name: "Alice Johnson",
      date: "2024-05-08",
      time: "13:45:22",
      day: "Monday",
      phishingUrl: "http://example.com/phishing3"
    },
    {
      id: 4,
      type: "blacklisted",
      name: "Bob Brown",
      date: "2024-05-08",
      time: "15:20:17",
      day: "Monday",
      phishingUrl: "http://example.com/phishing4"
    },
    {
      id: 5,
      type: "whitelisted",
      name: "Michael Clark",
      date: "2024-05-09",
      time: "09:10:05",
      day: "Tuesday",
      phishingUrl: "http://example.com/phishing5"
    },
    {
      id: 6,
      type: "blacklisted",
      name: "Emily Davis",
      date: "2024-05-09",
      time: "10:55:30",
      day: "Tuesday",
      phishingUrl: "http://example.com/phishing6"
    },
    {
      id: 7,
      type: "whitelisted",
      name: "David Lee",
      date: "2024-05-09",
      time: "12:20:12",
      day: "Tuesday",
      phishingUrl: "http://example.com/phishing7"
    },
    {
      id: 8,
      type: "blacklisted",
      name: "Sarah White",
      date: "2024-05-09",
      time: "14:40:48",
      day: "Tuesday",
      phishingUrl: "http://example.com/phishing8"
    },
    {
      id: 9,
      type: "whitelisted",
      name: "James Wilson",
      date: "2024-05-10",
      time: "08:05:55",
      day: "Wednesday",
      phishingUrl: "http://example.com/phishing9"
    },
    {
      id: 10,
      type: "blacklisted",
      name: "Olivia Martinez",
      date: "2024-05-10",
      time: "10:30:20",
      day: "Wednesday",
      phishingUrl: "http://example.com/phishing10"
    },
    {
      id: 11,
      type: "whitelisted",
      name: "William Anderson",
      date: "2024-05-10",
      time: "13:15:10",
      day: "Wednesday",
      phishingUrl: "http://example.com/phishing11"
    },
    {
      id: 12,
      type: "blacklisted",
      name: "Sophia Taylor",
      date: "2024-05-10",
      time: "15:45:37",
      day: "Wednesday",
      phishingUrl: "http://example.com/phishing12"
    },
    {
      id: 13,
      type: "whitelisted",
      name: "Christopher Thomas",
      date: "2024-05-11",
      time: "08:50:42",
      day: "Thursday",
      phishingUrl: "http://example.com/phishing13"
    },
    {
      id: 14,
      type: "blacklisted",
      name: "Emma Hernandez",
      date: "2024-05-11",
      time: "11:25:18",
      day: "Thursday",
      phishingUrl: "http://example.com/phishing14"
    },
    {
      id: 15,
      type: "whitelisted",
      name: "Ava Young",
      date: "2024-05-11",
      time: "14:00:03",
      day: "Thursday",
      phishingUrl: "http://example.com/phishing15"
    },
    {
      id: 16,
      type: "blacklisted",
      name: "Matthew King",
      date: "2024-05-11",
      time: "16:20:59",
      day: "Thursday",
      phishingUrl: "http://example.com/phishing16"
    },
    {
      id: 17,
      type: "whitelisted",
      name: "Liam Garcia",
      date: "2024-05-12",
      time: "09:35:15",
      day: "Friday",
      phishingUrl: "http://example.com/phishing17"
    },
    {
      id: 18,
      type: "blacklisted",
      name: "Isabella Martinez",
      date: "2024-05-12",
      time: "12:10:28",
      day: "Friday",
      phishingUrl: "http://example.com/phishing18"
    },
    {
      id: 19,
      type: "whitelisted",
      name: "Ethan Rodriguez",
      date: "2024-05-12",
      time: "14:55:09",
      day: "Friday",
      phishingUrl: "http://example.com/phishing19"
    },
    {
      id: 20,
      type: "blacklisted",
      name: "Amelia Lopez",
      date: "2024-05-12",
      time: "16:45:44",
      day: "Friday",
      phishingUrl: "http://example.com/phishing20"
    }
  ];

  const [logData, setLogData] = useState({
    id: "",
    name: "",
    type: "",
    url: "",
    date: "",
    time: "",
    deviceName: "",
    ip: "",
    browser: ""
  })

  const [currPage, setCurrPage] = useState(1);
  const [userPerPage] = useState(6);
  const lastPageIndex = currPage * userPerPage;
  const firstPageIndex = lastPageIndex - userPerPage;
  const records = logs.slice(firstPageIndex, lastPageIndex);
  const npage = Math.ceil(logs.length / userPerPage);
  const numbers = [...Array(npage + 1).keys()].slice(1);

  const changeCPage = (n) => {
    setCurrPage(n);
  };

  const nextP = () => {
    if (currPage < npage) {
      setCurrPage(currPage + 1);
    }
  };

  const prevP = () => {
    if (currPage > 1) {
      setCurrPage(currPage - 1);
    }
  };

  return (
    <div className='z-1 overflow-x-hidden w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-5'>
      {showBlog ? <div className='z-50 fixed bg-black/50 top-0 left-0 right-0 bottom-0 flex justify-center items-center'>
        <div className='bg-white rounded-xl p-3 flex flex-col gap-2 justify-center items-center relative'>
          <div className='flex justify-between items-center w-full'>
            <h1 className='font-bold text-2xl'>Detailed Info</h1>
            <button onClick={() => setBlog(!showBlog)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className='bg-gray-300 rounded-xl w-full p-4 flex gap-4'>
            <div className='flex flex-col flex-1 gap-4'>
              <div className="bg-white rounded-md p-4 flex flex-col gap-3">
                <h1 className='font-bold text-xl'>User Details</h1>
                <div className='flex gap-5'>
                  <div className='flex justiy-center items-center flex-1'>
                    <img alt='user-image' className='rounded-full min-h-24 min-w-24' src='data:image/jpeg;base64,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' />
                  </div>
                  <div className='flex-[3] w-full flex flex-col gap-2'>
                    <p className='font-bold text-xl'>John Doe</p>
                    <div className='flex gap-1'>
                      <p className='font-bold text-gray-500'>email: </p>
                      <p className='font-bold'>johndoe@example.com</p>
                    </div>
                    <div className='flex gap-1'>
                      <p className='font-bold text-gray-500'>department: </p>
                      <p className='font-bold'>IT</p>
                    </div>
                    <div className='flex gap-1'>
                      <p className='font-bold text-gray-500'>role: </p>
                      <p className='font-bold'>software</p>
                    </div>
                    <div className='flex gap-1 justify-start items-center'>
                      <p className='font-bold text-gray-500'>status: </p>
                      <div className='bg-red-300 border-[3px] font-bold border-red-600 text-red-600 rounded-md p-1 px-2'>
                        <p>Inactive</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-md p-5 flex flex-col gap-3">
                <h1 className='font-bold text-xl'>Device Info</h1>
                <div className='flex flex-col gap-1'>
                  <div className='flex gap-1'>
                    <p className='font-bold text-gray-500'>device: </p>
                    <p className='font-bold'>DELL</p>
                  </div>
                  <div className='flex gap-1'>
                    <p className='font-bold text-gray-500'>operating system: </p>
                    <p className='font-bold'>Windows</p>
                  </div>
                  <div className='flex gap-1'>
                    <p className='font-bold text-gray-500'>browser: </p>
                    <p className='font-bold'>FireFox</p>
                  </div>
                  <div className='flex gap-1'>
                    <p className='font-bold text-gray-500'>device ip: </p>
                    <p className='font-bold'>192.168.1.151</p>
                  </div>
                </div>
              </div>
            </div>
            <div className='bg-white rounded-lg p-5 flex-1 flex flex-col justify-center gap-3'>
              <h1 className='text-xl font-bold'>URL Details</h1>
              <div className='flex flex-col gap-2'>
                <div className='flex gap-1'>
                  <p className='font-bold text-gray-500'>url: </p>
                  <p className='font-bold'>https://thisisrandomurl.com</p>
                </div>
                <div className='flex gap-1'>
                  <p className='font-bold text-gray-500'>url type: </p>
                  <p className='font-bold text-red-500'>blacklisted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> : ""}
      <div className='bg-white p-4 flex justify-between items-center rounded-xl shadow-xl w-full'>
        <div>
          <h1 className='font-bold text-2xl'>Logs</h1>
        </div>
        <div className='flex gap-3 justify-evenly items-center'>
          <div>
            <input placeholder='Search Logs' className='border-2 border-gray-300 rounded-lg p-2 focus:outline-none' />
          </div>
          <div>
            <select defaultValue={'default'} className='text-lg text-gray-400 focus:outline-none p-2 border-2 border-gray-300 rounded-lg'>
              <option value="default">Sort by</option>
            </select>
          </div>
          <div>
            <select defaultValue={'default'} className='text-lg text-gray-400 focus:outline-none p-2 border-2 border-gray-300 rounded-lg'>
              <option value="default">Date Range Filter</option>
            </select>
          </div>
          <div className='flex'>
            <Link to={'/insights/addemp'}>
              <button className='flex justify-center items-center gap-3 px-4 p-2 rounded-lg text-white cusror-pointer bg-[#0364BD]'>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 12H16L12 16L8 12H11V8H13V12ZM15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918Z" fill="black" />
                  <path d="M13 12H16L12 16L8 12H11V8H13V12ZM15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918Z" fill="#FCFDFD" />
                  <path d="M13 12H16L12 16L8 12H11V8H13V12ZM15 4H5V20H19V8H15V4ZM3 2.9918C3 2.44405 3.44749 2 3.9985 2H16L20.9997 7L21 20.9925C21 21.5489 20.5551 22 20.0066 22H3.9934C3.44476 22 3 21.5447 3 21.0082V2.9918Z" fill="#FCFDFD" />
                </svg>
                <p className='text-md font-bold'>to CSV</p>
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        {records.map(el => <Log blog={el} key={el.id} setBlog={setBlog} showBlog={showBlog} />)}
      </div>
      {records.length !== 0 ? <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max">
        <nav className="flex gap-x-1 justify-between">
          <div>
            <a
              className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${currPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              href="#"
              onClick={prevP}
            >
              <MdOutlineArrowBackIosNew className="w-6 h-6" /> Previous
            </a>
          </div>
          <div className="flex gap-x-2 items-center">
            {numbers.map((number) => (
              <div key={number}>
                <a
                  className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition ${currPage === number ? "bg-[#0364BD] text-white" : "bg-gray-200"}`}
                  href="#"
                  onClick={() => changeCPage(number)}
                >
                  {number}
                </a>
              </div>
            ))}
          </div>
          <div>
            <a
              className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${currPage === npage ? "opacity-50 cursor-not-allowed" : ""} ${numbers.length === 0 ? "disabled" : ''}`}
              href="#"
              onClick={nextP}
            >
              Next <MdOutlineArrowForwardIos className="w-6 h-6" />
            </a>
          </div>
        </nav>
      </div> : ""}
    </div>
  )
}
