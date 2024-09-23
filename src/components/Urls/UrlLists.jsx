import React, { useEffect, useState } from "react";
import { RiAddFill, RiDeleteBinLine } from "react-icons/ri";
import {
    MdOutlineArrowBackIos,
    MdOutlineArrowForwardIos,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { remUrl } from "../../features/Urls/urlSlice";
import { toast } from "sonner";
import { setPerPageRec } from "../../features/PerPageRec/perPageRecSlice";

export default function UrlLists() {
    // Redux
    const perPageRec = useSelector((state) => state.perPageRec);
    const urlData = useSelector((state) => state.urls.urls);
    const dispatch = useDispatch();
    // End of Redux

    // NOTE: This Logic is for demonstration purposes only and should be replaced to optimise database queries
    // Start of Search Logic
    const [query, setQuery] = useState("");
    const keys = ["url", "category", "status"];
    const search = (data) => {
        return data.filter((item) =>
            keys.some((key) => item[key].toLowerCase().includes(query.toLowerCase()))
        );
    };
    // End of Search Logic

    // Start of Filter Logic
    const [dataFilter, setDataFilter] = useState(null);
    const filter = (data) => {
        if (dataFilter === "whitelisted") {
            return data.filter((item) => item.status === "Whitelisted");
        } else if (dataFilter === "blacklisted") {
            return data.filter((item) => item.status === "Blacklisted");
        } else {
            return data;
        }
    };
    // End of Filter Logic

    // Start of Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = perPageRec;
    const filteredData = filter(search(urlData));
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

    const handleSetPerPageRec = (value) => {
        dispatch(setPerPageRec(value));
    };

    useEffect(() => {
        if (npage < currentPage) {
            setCurrentPage(npage || 1);
        }
    }, [npage, currentPage])
    // End of Pagination Logic

    const formatUrl = (url, maxLen = 70) => {
        return url.length > maxLen ? url.substring(0, maxLen) + "..." : url;
    };

    const handleRemUrl = (id, url) => {
        try {
            dispatch(remUrl(id));
            toast.success(`URL ${url} removed`);
        } catch (e) {
            toast.error(e);
        }
    };

    const statusActive =
        "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400 dark:border-green-400";
    const statusInactive =
        "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400 dark:border-red-400";

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight">URL List</h1>
                </div>
                <div className="flex items-center gap-x-3">
                    <input
                        type="text"
                        placeholder="Search Urls..."
                        className="rounded-lg border-gray-300 border-2 text-gray-400 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <select
                        name="filters"
                        id="filters"
                        className="rounded-lg border-gray-300 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
                        onChange={(e) => setDataFilter(e.target.value)}
                    >
                        <option value="all">Status</option>
                        <option value="whitelisted">Whitelisted</option>
                        <option value="blacklisted">Blacklisted</option>
                    </select>
                    <select
                        name="perPageRec"
                        id="perPageRec"
                        className="rounded-lg border-gray-300 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
                        onChange={(e) => handleSetPerPageRec(e.target.value)}
                        value={perPageRec}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                    <Link
                        to={"/urllists/addurl"}
                        className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-white cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition"
                    >
                        <span>
                            Add URL <RiAddFill className="inline-block w-6 h-6 -mt-1" />
                        </span>
                    </Link>
                </div>
            </div>
            {records.length === 0 ? (
                <div className="flex justify-center font-medium dark:text-[#F4F4F4]">
                    <span>No Records Found!</span>
                </div>
            ) : (
                <>
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">URL</th>
                                    <th className="py-3 text-left">Category</th>
                                    <th className="py-3 text-left">Status</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((url, index) => (
                                    <tr
                                        key={index}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="font-medium text-left text-gray-500 pl-2 py-4 dark:text-[#F4F4F4]">
                                            <Link
                                                to={`/urllists/urldetails/${url.id}`}
                                                title="Click to view details"
                                            >
                                                {formatUrl(url.url)}
                                            </Link>
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {url.category}
                                        </td>
                                        <td className="text-left font-medium">
                                            <span
                                                className={
                                                    url.status === "Whitelisted"
                                                        ? statusActive
                                                        : statusInactive
                                                }
                                            >
                                                {url.status}
                                            </span>
                                        </td>
                                        <td className="text-left ">
                                            <button
                                                onClick={() => handleRemUrl(url.id, formatUrl(url.url))}
                                            >
                                                <RiDeleteBinLine className="w-6 h-6 text-red-500 cursor-pointer" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                        <nav className="flex gap-x-1 justify-between">
                            <div>
                                <a
                                    className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
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
                                            className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition dark:hover:bg-[#0364BD] ${currentPage === number
                                                    ? "bg-[#0364BD] text-white"
                                                    : "bg-gray-200 dark:bg-[#001C40]"
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
                                    className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] ${currentPage === npage ? "opacity-50 cursor-not-allowed" : ""
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
