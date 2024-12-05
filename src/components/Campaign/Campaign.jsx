import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { RiDeleteBinLine, RiEyeLine } from "react-icons/ri";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { deleteCampaign, updateCampaign } from '../../features/Campaign/Campaign';
import { setPerPageRec } from "../../features/PerPageRec/perPageRecSlice";

export default function Campaign() {
    const dispatch = useDispatch();
    const { campaigns } = useSelector((state) => state.campaign);
    const perPageRec = useSelector((state) => state.perPageRec);

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
            {/* {showLoading && <LoadingOverlay loading={dataLoading} />}
      <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            /> */}
            <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                {/* Header Section */}
                <div className="flex w-full justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Training Campaign</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <select
                            name="filters"
                            id="filters"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleStatus(e.target.value)}
                        >
                            <option value="all">Status</option>
                            <option value="completed">Completed</option>
                            <option value="inProgress">In Progress</option>
                            <option value="scheduled">Scheduled</option>
                        </select>
                        <select
                            name="perPageRec"
                            id="perPageRec"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleSetPerPageRec(e.target.value)}
                            value={perPageRec}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <Link to={'/campaign/add'}>
                            <button className="rounded-lg text-xl p-3 px-4 bg-[#0364BD] text-white font-medium">
                                Add Campaign
                            </button>
                        </Link>
                    </div>
                </div>
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
                                className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
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
                                        className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${campaign.status === "completed"
                                            ? "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                            : campaign.status === "in progress"
                                                ? "bg-yellow-100 text-yellow-800 dark:bg-[rgba(238,247,187,0.1)] dark:text-yellow-400"
                                                : "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                            }`}
                                    >
                                        {campaign.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2">
                                    <button
                                    title="Click to view details"
                                    >
                                        <RiEyeLine size={24} className="hover:text-[#0364BD] transition-colors" />
                                    </button>
                                    <button
                                        className="mx-1"
                                        title='Delete'
                                        onClick={() => handleDelete(index)}
                                    >
                                        <RiDeleteBinLine className="w-6 h-6 text-red-500 hover:text-red-700 transition-colors" />
                                    </button>
                                    {campaign.status !== "completed" && (
                                        <button
                                            title='Mark as Completed'
                                            onClick={() =>
                                                handleUpdateStatus(index, "completed", "bg-green-500")
                                            }
                                        >
                                            <HiOutlineClipboardCheck className="w-6 h-6 text-blue-500 hover:text-blue-700 transition-colors" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
