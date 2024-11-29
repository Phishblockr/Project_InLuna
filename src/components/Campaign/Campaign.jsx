import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteCampaign, updateCampaign } from '../../features/Campaign/Campaign';

export default function Campaign() {
  const dispatch = useDispatch();
  const { campaigns } = useSelector((state) => state.campaign);

  const handleDelete = (index) => {
    dispatch(deleteCampaign(index));
  };

  const handleUpdateStatus = (index, newStatus, newStatusColor) => {
    dispatch(
      updateCampaign({
        index,
        updatedData: { status: newStatus, statusColor: newStatusColor },
      })
    );
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="w-full dark:bg-[#002451] bg-white p-5 rounded-lg dark:text-white flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex w-full justify-between items-center">
          <h1 className="text-3xl font-bold">Training Campaign</h1>
          <Link to={'/campaign/add'}>
            <button className="rounded-lg text-xl p-3 px-4 bg-[#0364BD] text-white font-medium">
              Add Campaign
            </button>
          </Link>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-700">
                <th className="text-left px-4 py-2 font-medium">Campaign Name</th>
                <th className="text-left px-4 py-2 font-medium">Groups</th>
                <th className="text-left px-4 py-2 font-medium">Courses</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-300 dark:border-gray-700 last:border-b-0"
                >
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <p>{campaign.name}</p>
                      <p>{campaign.date}</p>
                    </div>
                  </td>
                  <td className="px-4 py-2">{campaign.groups}</td>
                  <td className="px-4 py-2">{campaign.courses}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-3 py-1 text-white text-sm font-semibold rounded ${campaign.statusColor}`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="text-sm text-red-500 mr-2"
                      onClick={() => handleDelete(index)}
                    >
                      Delete
                    </button>
                    {campaign.status !== "Completed" && (
                      <button
                        className="text-md rounded-md p-1 px-2 bg-blue-500 text-white"
                        onClick={() =>
                          handleUpdateStatus(index, "Completed", "bg-green-500")
                        }
                      >
                        Mark as Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
