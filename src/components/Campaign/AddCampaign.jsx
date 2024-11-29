import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addCampaign } from "../../features/Campaign/Campaign";
import { useNavigate } from "react-router-dom";

export default function AddCampaign() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    groups: "select",
    frequency: "One Time",
    startTime: "",
    startDate: "",
    category: "select",
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.name &&
      formData.groups !== "select" &&
      formData.category !== "select" &&
      formData.startDate &&
      formData.startTime
    ) {
      const newCampaign = {
        name: formData.name,
        groups: formData.groups,
        courses: formData.category,
        date: `${formData.startDate} ${formData.startTime}`,
      };
      dispatch(addCampaign(newCampaign)); // Dispatch to Redux store
      alert("Campaign added successfully!");
      navigate("/campaign");
    } else {
      alert("Please fill all fields correctly.");
    }
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="w-full dark:bg-[#002451] bg-white p-5 rounded-lg dark:text-white flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Add New Campaign</h1>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="flex gap-3 justify-start items-center">
            <p>Name</p>
            <input
              className="dark:bg-[#002451] border-2 border-gray-400 p-1 px-2 rounded-lg w-full"
              type="text"
              name="name"
              placeholder="Enter campaign name..."
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-3 justify-start items-center">
            <p>Groups Included</p>
            <select
              name="groups"
              value={formData.groups}
              onChange={handleChange}
              className="dark:text-white dark:bg-[#002451] border-2 border-gray-400 p-1 px-2 rounded-lg w-full"
            >
              <option value="select">Select</option>
              <option value="Accounts">Accounts</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Logistics">Logistics</option>
            </select>
          </div>
          <div className="flex justify-between items-center">
            <h1>Frequency</h1>
            {["One Time", "Weekly", "Monthly", "Quarterly"].map((freq) => (
              <div key={freq} className="flex gap-1 dark:text-white">
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={formData.frequency === freq}
                  onChange={handleChange}
                />
                <label>{freq}</label>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-start items-center w-1/2">
            <p>Start Time & Date</p>
            <input
              className="dark:bg-[#002451] border-2 border-gray-400 p-1 px-2 rounded-lg w-1/2"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
            />
            <input
              className="dark:bg-[#002451] border-2 border-gray-400 p-1 px-2 rounded-lg w-1/2"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-3 justify-start items-center">
            <p>Categories</p>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="dark:text-white dark:bg-[#002451] border-2 border-gray-400 p-1 px-2 rounded-lg w-full"
            >
              <option value="select">Select</option>
              <option value="Phishing test">Phishing test</option>
              <option value="Email test">Email test</option>
              <option value="Malware test">Malware test</option>
            </select>
          </div>
          <div className="flex justify-end items-center">
            <button
              type="submit"
              className="rounded-lg text-md p-3 px-4 bg-[#0364BD] text-white font-medium"
            >
              Add Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
