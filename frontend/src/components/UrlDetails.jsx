import React from "react";

const UrlDetails = () => {
  return (
    <div className="z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className='<div className="z-1 w-full font-bold bg-white rounded-xl shadow-xl p-3 h-max">'>
        <div>
          <h1 className="pt-3 pl-5 text-2xl font-bold">Edit URL</h1>
        </div>
        <div className="mt-3 flex flex-col w-full items-center">
          <div className="flex flex-col">
            <label htmlFor="url">URL: </label>
            <input
              type="text"
              id="url"
              name="url"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="category">Category: </label>
            <input
              type="text"
              id="category"
              name="category"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300"
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="status">Status: </label>
            <select
              className="w-[40rem] py-2 rounded-lg border border-gray-300 bg-white"
              name="status"
              id="status"
            >
              <option value="blacklisted">Blacklist</option>
              <option value="whitelisted">Whitelist</option>
            </select>
          </div>
          <div className="flex flex-row gap-x-2">
          <button className=" mt-9 mb-2 rounded-lg text-white font-bold w-[19rem] bg-[#0364BD] hover:bg-[#003A70] transition p-2 ">
            Update URL
          </button>
          <button className=" mt-9 mb-2 rounded-lg text-white font-bold w-[19rem] bg-red-500 hover:bg-red-700 transition p-2 ">
            Delete URL
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlDetails;
