import React, { useEffect, useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { remUrl, editUrl } from "../../features/Urls/urlSlice";
import { toast } from "sonner";

const UrlDetails = () => {
  const [editUrlData, setEditUrlData] = useState({ url: "", category: "", status: "" });

  const { id } = useParams();
  const navigate = useNavigate();
  const url = useSelector((state) => state.urls.urls.find((url) => url.id === parseInt(id)));
  const dispatch = useDispatch();

  useEffect(() => {
    if (url) {
      setEditUrlData({ url: url.url, category: url.category, status: url.status });
    }
  }, [url]);

  const handleRemUrl = () => {
    try {
      dispatch(remUrl(parseInt(id)));
      toast.success(`URL ${url.url} removed`);
      navigate("/urllists");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setEditUrlData({ ...editUrlData, [name]: value });
  };

  const handleEditUrl = (event) => {
    event.preventDefault();
    try {
      dispatch(editUrl({ id: parseInt(id), ...editUrlData }));
      toast.success(`URL updated successfully`);
      navigate("/urllists");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!url) {
    return <div>URL not found</div>;
  }

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
        <div>
          <h1 className="pt-3 pl-5 text-2xl font-medium">URL Details</h1>
        </div>
        <form className="mt-3 flex flex-col w-full items-center" onSubmit={handleEditUrl}>
          <div className="flex flex-col">
            <label htmlFor="url">URL: </label>
            <input
              type="text"
              id="url"
              name="url"
              value={editUrlData.url}
              onChange={handleChange}
              className="w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="category">Category: </label>
            <input
              type="text"
              id="category"
              name="category"
              value={editUrlData.category}
              onChange={handleChange}
              className="w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="status">Status: </label>
            <select
              className="w-[40rem] py-2 rounded-lg border border-gray-300 bg-white dark:bg-[#001C40] dark:border-0"
              name="status"
              id="status"
              value={editUrlData.status}
              onChange={handleChange}
            >
              <option value="Blacklisted">Blacklist</option>
              <option value="Whitelisted">Whitelist</option>
            </select>
          </div>
          <div className="flex flex-row gap-x-2">
            <button
              type="submit"
              className="mt-9 mb-2 rounded-lg text-white font-medium w-[19rem] bg-[#0364BD] hover:bg-[#003A70] transition p-2"
            >
              <span className="flex flex-row gap-x-2 items-center justify-center">
                <RiLoopLeftLine className="w-6 h-6" /> Update URL
              </span>
            </button>
            <button
              type="button"
              onClick={handleRemUrl}
              className="mt-9 mb-2 rounded-lg text-white font-medium w-[19rem] bg-red-500 hover:bg-red-700 transition p-2"
            >
              <span className="flex flex-row gap-x-2 items-center justify-center">
                <RiDeleteBinLine className="w-6 h-6" /> Delete URL
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UrlDetails;
