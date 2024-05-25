import React, { useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine } from "react-icons/ri";
import {
  MdOutlineArrowBackIos,
  MdOutlineArrowForwardIos,
} from "react-icons/md";

import { useDispatch, useSelector } from "react-redux";
import { remReq, updateStatus } from "../features/Requests/requestsSlice";
import { toast } from "sonner";

export default function Requests() {
  const requestData = useSelector((state) => state.requests.requests);
  const dispatch = useDispatch();

  const statusActive =
    "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg";
  const statusInactive =
    "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg";

  // NOTE: This Logic is for demonstration purposes only and should be replaced to optimise database queries
  // Start of Search Logic
  const [query, setQuery] = useState("");
  const keys = ["name", "email", "url", "reason", "status"];
  const search = (data) => {
    return data.filter((item) =>
      keys.some((key) => item[key].toLowerCase().includes(query.toLowerCase()))
    );
  };
  // End of Search Logic

  // Start of Filter Logic
  const [dataFilter, setDataFilter] = useState(null);
  const filter = (data) => {
    if (dataFilter === "completed") {
      return data.filter((item) => item.status === "Completed");
    } else if (dataFilter === "pending") {
      return data.filter((item) => item.status === "Pending");
    } else {
      return data;
    }
  };
  // End of Filter Logic

  // Start of Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const filteredData = filter(search(requestData));
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const records = filteredData.slice(firstIndex, lastIndex);
  const npage = Math.ceil(filteredData.length / recordsPerPage);
  const numbers = [...Array(npage + 1).keys()].slice(1);

  function nextPage() {
    if (currentPage !== npage) {
      setCurrentPage(currentPage + 1);
    }
  }

  function prePage() {
    if (currentPage !== 1) {
      setCurrentPage(currentPage - 1);
    }
  }

  function changeCPage(n) {
    setCurrentPage(n);
  }
  // End of Pagination Logic

  function handleRem(id) {
    try {
      dispatch(remReq(id));
      toast.success(`Request id: ${id} removed`);
    } catch (error) {
      toast.error(`Something went wrong: ${error}`);
    }
  }

  function handleUpdateStatus(id) {
    try {
      dispatch(updateStatus(id));
      toast.success(`Request id: ${id} updated`);
    } catch (error) {
      toast.error(`Something went wrong: ${error}`);
    }
  }

  return (
    <div className="z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Requests</h1>
        </div>
        <div className="flex items-center gap-x-3">
          <input
            type="text"
            placeholder="Search Request..."
            className="rounded-lg border-grey border-2 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            name="filters"
            id="filters"
            className="rounded-lg border-gray-200 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
            onChange={(e) => setDataFilter(e.target.value)}
          >
            <option value="all">Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      {records.length === 0 ? (
        <div className="flex justify-center font-medium">
          <span>No Records Found!</span>
        </div>
      ) : (
        <>
          {records.map((request) => (
            <div
              className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max whitespace-pre-wrap"
              key={request.id}
            >
              <div className=" grid grid-cols-[380px_minmax(10%,_1fr)]  gap-2">
                <div className="flex flex-row gap-x-5 items-center">
                  <img
                    className="w-[5rem] h-[5rem] rounded-full object-cover"
                    src={request.profileImage}
                    alt="user Profile"
                  />
                  <ul className="flex flex-col">
                    <li className="font-medium text-3xl my-2">
                      {request.name}
                    </li>
                    <li className="font-medium mb-1">
                      <span className="text-gray-500 mr-2">E-mail:</span>
                      <span>{request.email}</span>
                    </li>
                    <li className="font-medium mb-1">
                      <span className="text-gray-500 mr-2">Status:</span>
                      <span
                        className={
                          request.status === "Completed"
                            ? statusActive
                            : statusInactive
                        }
                      >
                        {request.status}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="">
                  <p className="font-medium ">
                    <span>URL: </span> <span>{request.url}</span>
                  </p>
                  <p>
                    <span className="font-medium">Reason: </span>{" "}
                    {request.reason}
                  </p>
                </div>
              </div>
              <div className="text-right mt-5">
                <button
                  onClick={() => handleUpdateStatus(request.id)}
                  className="bg-[#0364BD] hover:bg-[#003A70] p-2 text-white font-medium rounded-lg mr-2"
                >
                  <span className="flex flex-row items-center gap-x-1">
                    <RiLoopLeftLine className="w-6 h-6" /> Update URL Status
                  </span>
                </button>
                <button
                  onClick={() => handleRem(request.id)}
                  className="bg-red-500 hover:bg-red-700 p-2 text-white font-medium rounded-lg"
                >
                  <span className="flex flex-row items-center gap-x-1">
                    <RiDeleteBinLine className="w-6 h-6" /> Remove Request
                  </span>
                </button>
              </div>
            </div>
          ))}
          <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max">
            <nav className="flex gap-x-1 justify-between">
              <div>
                <a
                  className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  href="#"
                  onClick={prePage}
                >
                  <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
                </a>
              </div>
              <div className="flex gap-x-2 items-center">
                {numbers.map((number, index) => (
                  <div key={index}>
                    <a
                      className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition ${
                        currentPage === number
                          ? "bg-[#0364BD] text-white"
                          : "bg-gray-200"
                      }`}
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
                  className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${
                    currentPage === npage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  href="#"
                  onClick={nextPage}
                >
                  Next <MdOutlineArrowForwardIos className="w-6 h-6" />
                </a>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
