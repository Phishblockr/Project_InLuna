import React from 'react'
import { RiSendPlane2Line } from "react-icons/ri";

export default function Feedbacks() {
  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className='z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none'>
        <div>
          <h1 className="mb-10 pt-3 pl-5 text-2xl font-medium">Your feedback matters to us!</h1>
        </div>
        <div className="mt-3 flex flex-col w-full items-center">
          <div className="flex flex-col">
            <label htmlFor="url">Subject: </label>
            <input
              type="text"
              id="url"
              name="url"
              className=" w-[60rem] p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
            />
          </div>

          <div className="mt-7 flex flex-col">
            <label htmlFor="category">What Problems are you facing or any suggestions Please write us here:  </label>
            <textarea
              type="text"
              id="category"
              name="category"
              className=" w-[60rem] h-[20rem] p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001C40] dark:border-0"
            > </textarea>
          </div>
          <button className="w-[60rem] mt-9 mb-2 rounded-lg text-white font-medium bg-[#0364BD] hover:bg-[#003A70] transition p-4 ">
            <span className="flex flex-row justify-center items-center">
              <RiSendPlane2Line className="w-6 h-6 mr-1" /> Submit
            </span>
          </button>
          </div>
      </div>
    </div>
  )
}
