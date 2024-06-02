import React, { useState } from "react";
import { Link } from "react-router-dom";
import Log from "./Log";
import {
  MdOutlineArrowBackIosNew,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { BsFileEarmarkArrowDown } from "react-icons/bs";
import { setPerPageRec } from "../features/PerPageRec/perPageRecSlice";
import { useDispatch, useSelector } from "react-redux";

const logsData = [
  {
    id: 1,
    type: "whitelisted",
    name: "John Doe",
    date: "2024-05-08",
    time: "10:15:32",
    day: "Monday",
    phishingUrl: "http://example.com/phishing1",
  },
  {
    id: 2,
    type: "blacklisted",
    name: "Jane Smith",
    date: "2024-05-08",
    time: "11:30:45",
    day: "Monday",
    phishingUrl: "http://example.com/phishing2",
  },
  {
    id: 3,
    type: "whitelisted",
    name: "Alice Johnson",
    date: "2024-05-08",
    time: "13:45:22",
    day: "Monday",
    phishingUrl: "http://example.com/phishing3",
  },
  {
    id: 4,
    type: "blacklisted",
    name: "Bob Brown",
    date: "2024-05-08",
    time: "15:20:17",
    day: "Monday",
    phishingUrl: "http://example.com/phishing4",
  },
  {
    id: 5,
    type: "whitelisted",
    name: "Michael Clark",
    date: "2024-05-09",
    time: "09:10:05",
    day: "Tuesday",
    phishingUrl: "http://example.com/phishing5",
  },
  {
    id: 6,
    type: "blacklisted",
    name: "Emily Davis",
    date: "2024-05-09",
    time: "10:55:30",
    day: "Tuesday",
    phishingUrl: "http://example.com/phishing6",
  },
  {
    id: 7,
    type: "whitelisted",
    name: "David Lee",
    date: "2024-05-09",
    time: "12:20:12",
    day: "Tuesday",
    phishingUrl: "http://example.com/phishing7",
  },
  {
    id: 8,
    type: "blacklisted",
    name: "Sarah White",
    date: "2024-05-09",
    time: "14:40:48",
    day: "Tuesday",
    phishingUrl: "http://example.com/phishing8",
  },
  {
    id: 9,
    type: "whitelisted",
    name: "James Wilson",
    date: "2024-05-10",
    time: "08:05:55",
    day: "Wednesday",
    phishingUrl: "http://example.com/phishing9",
  },
  {
    id: 10,
    type: "blacklisted",
    name: "Olivia Martinez",
    date: "2024-05-10",
    time: "10:30:20",
    day: "Wednesday",
    phishingUrl: "http://example.com/phishing10",
  },
  {
    id: 11,
    type: "whitelisted",
    name: "William Anderson",
    date: "2024-05-10",
    time: "13:15:10",
    day: "Wednesday",
    phishingUrl: "http://example.com/phishing11",
  },
  {
    id: 12,
    type: "blacklisted",
    name: "Sophia Taylor",
    date: "2024-05-10",
    time: "15:45:37",
    day: "Wednesday",
    phishingUrl: "http://example.com/phishing12",
  },
  {
    id: 13,
    type: "whitelisted",
    name: "Christopher Thomas",
    date: "2024-05-11",
    time: "08:50:42",
    day: "Thursday",
    phishingUrl: "http://example.com/phishing13",
  },
  {
    id: 14,
    type: "blacklisted",
    name: "Emma Hernandez",
    date: "2024-05-11",
    time: "11:25:18",
    day: "Thursday",
    phishingUrl: "http://example.com/phishing14",
  },
  {
    id: 15,
    type: "whitelisted",
    name: "Ava Young",
    date: "2024-05-11",
    time: "14:00:03",
    day: "Thursday",
    phishingUrl: "http://example.com/phishing15",
  },
  {
    id: 16,
    type: "blacklisted",
    name: "Matthew King",
    date: "2024-05-11",
    time: "16:20:59",
    day: "Thursday",
    phishingUrl: "http://example.com/phishing16",
  },
  {
    id: 17,
    type: "whitelisted",
    name: "Liam Garcia",
    date: "2024-05-12",
    time: "09:35:15",
    day: "Friday",
    phishingUrl: "http://example.com/phishing17",
  },
  {
    id: 18,
    type: "blacklisted",
    name: "Isabella Martinez",
    date: "2024-05-12",
    time: "12:10:28",
    day: "Friday",
    phishingUrl: "http://example.com/phishing18",
  },
  {
    id: 19,
    type: "whitelisted",
    name: "Ethan Rodriguez",
    date: "2024-05-12",
    time: "14:55:09",
    day: "Friday",
    phishingUrl: "http://example.com/phishing19",
  },
  {
    id: 20,
    type: "blacklisted",
    name: "Amelia Lopez",
    date: "2024-05-12",
    time: "16:45:44",
    day: "Friday",
    phishingUrl: "http://example.com/phishing20",
  },
];

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  onNextPage,
  onPrevPage,
}) => (
  <nav className="flex gap-x-1 justify-between">
    <a
      className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${
        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
      }`}
      href="#"
      onClick={onPrevPage}
    >
      <MdOutlineArrowBackIosNew className="w-6 h-6" /> Previous
    </a>
    <div className="flex gap-x-2 items-center">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
        <a
          key={number}
          className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition ${
            currentPage === number ? "bg-[#0364BD] text-white" : "bg-gray-200"
          }`}
          href="#"
          onClick={() => onPageChange(number)}
        >
          {number}
        </a>
      ))}
    </div>
    <a
      className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${
        currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
      }`}
      href="#"
      onClick={onNextPage}
    >
      Next <MdOutlineArrowForwardIos className="w-6 h-6" />
    </a>
  </nav>
);

const LogDetailsModal = ({ show, onClose, logData }) => {
  if (!show) return null;

  return (
    <div className="z-50 fixed bg-black/50 top-0 left-0 right-0 bottom-0 flex justify-center items-center">
      <div className="bg-white rounded-xl p-3 flex flex-col gap-2 justify-center items-center relative">
        <div className="flex justify-between items-center w-full">
          <h1 className="font-medium text-2xl">Detailed Info</h1>
          <button onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* Details Content Here */}
        <div className="bg-gray-300 rounded-xl w-full p-4 flex gap-4">
          <div className="flex flex-col flex-1 gap-4">
            <div className=" bg-white rounded-md p-4 flex flex-col gap-3">
              <h1 className="font-medium text-xl">User Details</h1>
              <div className="flex gap-5">
                <div className="flex justify-center items-center flex-1">
                  <img
                    alt="user-image"
                    className="rounded-full min-h-24 min-w-24"
                    src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
                  />
                </div>
                <div className="flex-[3] w-full flex flex-col gap-2">
                  <p className="font-medium text-xl">{logData.name}</p>
                  <div className="flex gap-1">
                    <p className="font-medium text-gray-500">email:</p>
                    <p className="font-medium">{logData.email}</p>
                  </div>
                  <div className="flex gap-1">
                    <p className="font-medium text-gray-500">department:</p>
                    <p className="font-medium">{logData.department}</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Add other details */}
          </div>
        </div>
      </div>
    </div>
  );
};

const Logs = () => {
  const perPageRec = useSelector((state) => state.perPageRec);
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [currPage, setCurrPage] = useState(1);
  const userPerPage = perPageRec;
  const lastPageIndex = currPage * userPerPage;
  const firstPageIndex = lastPageIndex - userPerPage;
  const records = logsData.slice(firstPageIndex, lastPageIndex);
  const npage = Math.ceil(logsData.length / userPerPage);

  const changePage = (n) => setCurrPage(n);
  const nextPage = () => currPage < npage && setCurrPage(currPage + 1);
  const prevPage = () => currPage > 1 && setCurrPage(currPage - 1);

  const openLogDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };
  
  const handleSetPerPageRec = (value) =>{
    dispatch(setPerPageRec(value))
  }

  return (
    <div className="z-1 overflow-x-hidden max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] p-4 gap-5">
      <LogDetailsModal
        show={showModal}
        onClose={() => setShowModal(false)}
        logData={selectedLog}
      />
      <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl w-full">
        <div>
          <h1 className="font-medium text-2xl">Logs</h1>
        </div>
        <div className="flex gap-3 justify-evenly items-center">
          <input
            placeholder="Search Logs"
            className="border-2 border-gray-300 rounded-lg p-2 focus:outline-none"
          />
          <select
            defaultValue="default"
            className=" bg-white text-lg text-gray-400 focus:outline-none p-2 border-2 border-gray-300 rounded-lg"
          >
            <option value="default">Sort by</option>
          </select>
          <select
            defaultValue="default"
            className="bg-white text-lg text-gray-400 focus:outline-none p-2 border-2 border-gray-300 rounded-lg"
          >
            <option value="default">Date Range Filter</option>
          </select>
          <select
            name="perPageRec"
            id="perPageRec"
            className="rounded-lg border-gray-300 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
            onChange={(e) => handleSetPerPageRec(e.target.value)}
            value={perPageRec}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <div className="flex">
            <Link to={"/insights/addemp"}>
              <button className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-white cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition">
                <p className="text-md font-medium">to CSV</p>
                <BsFileEarmarkArrowDown className="w-6 h-6" />
              </button>
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {records.map((el) => (
          <Log
            blog={el}
            key={el.id}
            setBlog={() => openLogDetails(el)}
            showBlog={showModal}
          />
        ))}
      </div>
      {records.length > 0 && (
        <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max">
          <Pagination
            currentPage={currPage}
            totalPages={npage}
            onPageChange={changePage}
            onNextPage={nextPage}
            onPrevPage={prevPage}
          />
        </div>
      )}
    </div>
  );
};

export default Logs;
