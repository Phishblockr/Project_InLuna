import React, { useState } from "react";
import { RiAddFill } from "react-icons/ri";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUrl } from "../features/Urls/urlSlice";
import { toast } from "sonner";

const AddUrl = () => {

  const [url, setUrl] = useState({url:"", category:"", status:"Blacklisted"})

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleAddUrl = (url) =>{
    dispatch(addUrl(url));
    toast.success(`URL added.`);
    navigate("/urllists");
  }

  return (
    <div className="z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className='<div className="z-1 w-full font-bold bg-white rounded-xl shadow-xl p-3 h-max">'>
        <div>
          <h1 className="pt-3 pl-5 text-2xl font-bold">Add URL</h1>
        </div>
        <div className="mt-3 flex flex-col w-full items-center">
          <div className="flex flex-col">
            <label htmlFor="url">URL: </label>
            <input
              type="text"
              id="url"
              name="url"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
              onChange={e => setUrl({...url, [e.target.name]: e.target.value})}
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="category">Category: </label>
            <input
              type="text"
              id="category"
              name="category"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
              onChange={e => setUrl({...url, [e.target.name]: e.target.value})}
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="status">Status: </label>
            <select
              className="w-[40rem] py-2 rounded-lg border border-gray-300 bg-white"
              name="status"
              id="status"
              onChange={e => setUrl({...url, [e.target.name]: e.target.value})}
            >
              <option value="Blacklisted">Blacklist</option>
              <option value="Whitelisted">Whitelist</option>
            </select>
          </div>
          <button onClick={() => handleAddUrl(url)} className=" mt-9 mb-2 rounded-lg text-white font-bold w-[40rem] bg-[#0364BD] hover:bg-[#003A70] transition p-2 ">
            <span className="flex flex-row justify-center items-center">
              <RiAddFill className="w-6 h-6 mr-1" /> Submit
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUrl;
