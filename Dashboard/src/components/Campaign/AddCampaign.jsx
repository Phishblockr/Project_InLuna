import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { addCampaign } from "../../features/Campaign/Campaign";
import { useAuth } from "../../utils/AuthProvider";

export default function AddCampaign() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const token = getToken();

  const [formData, setFormData] = useState({
    name: "",
    text: "",
    bodyText: "",
    template: "",
    datetime: "",
    users: "",
    templateBody: "",
  });

  const [templates, setTemplates] = useState([]);

  // Fetch available templates when the component mounts
  useEffect(() => {
    // This is a placeholder for fetching templates from an API
    // Example: fetching templates from the server
    const fetchTemplates = async () => {
      try {
        const response = await fetch("/api/templates"); // Replace with your API endpoint
        const data = await response.json();
        setTemplates(data.templates || []); // Assuming the response contains a 'templates' array
      } catch (error) {
        toast.error("Failed to load templates");
      }
    };
    fetchTemplates();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, text, bodyText, template, datetime, users } = formData;

    if (name && text && bodyText && template && datetime && users) {
      const newCampaign = {
        name,
        text,
        bodyText,
        template,
        datetime,
        users,
      };

      dispatch(addCampaign({ data: newCampaign, token }));
      toast.success("Campaign added successfully!");
      navigate("/campaign");
    } else {
      toast.error("Please fill all fields correctly.");
    }
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <h1 className="text-3xl font-medium">Admin</h1>

      {/* Table Section */}
      <div className="overflow-x-auto p-6 bg-gray-100 flex flex-col gap-2">
        <table
          className="min-w-full table-auto bg-white border-separate border-spacing-0 rounded-lg shadow-md"
          id="campaignTable"
        >
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-200">
                ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-200">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-200">
                Users
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-200">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-200">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-200">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 bg-gray-200">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-700">
            {/* Initial rows can be here or empty */}
          </tbody>
        </table>
      </div>

      {/* Form Section */}
      <div className="w-full mx-auto p-6 bg-gray-100 rounded-lg shadow-lg flex flex-col gap-2">
        <form
          id="campaignForm"
          className="space-y-6 bg-white p-6 rounded-lg shadow-md"
          onSubmit={handleSubmit}
        >
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter the campaign name"
              required
            />
          </div>

          {/* Text Field */}
          <div>
            <label
              htmlFor="text"
              className="block text-sm font-semibold text-gray-700"
            >
              Text
            </label>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleChange}
              rows="4"
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter some text for the campaign"
              required
            ></textarea>
          </div>

          {/* Email Body */}
          <div>
            <label
              htmlFor="bodyText"
              className="block text-sm font-semibold text-gray-700"
            >
              Mail Body
            </label>
            <textarea
              type="text"
              id="bodyText"
              name="bodyText"
              value={formData.bodyText}
              onChange={handleChange}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter the email body"
              required
            ></textarea>
          </div>

          {/* Template Select Field */}
          <div>
            <label
              htmlFor="template"
              className="block text-sm font-semibold text-gray-700"
            >
              Select Template
            </label>
            <select
              id="template"
              name="template"
              value={formData.template}
              onChange={handleChange}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="" disabled>
                Select a template
              </option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Field */}
          <div>
            <label
              htmlFor="datetime"
              className="block text-sm font-semibold text-gray-700"
            >
              Date & Time
            </label>
            <input
              type="datetime-local"
              id="datetime"
              name="datetime"
              value={formData.datetime}
              onChange={handleChange}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {/* Users Field */}
          <div>
            <label
              htmlFor="users"
              className="block text-sm font-semibold text-gray-700"
            >
              Users
            </label>
            <select
              id="users"
              name="users"
              value={formData.users}
              onChange={handleChange}
              className="mt-2 block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="" disabled>
                Select users
              </option>
              <option value="all">All Users</option>
              <option value="selected">Selected Users</option>
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
