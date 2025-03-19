import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthProvider';
import { setPerPageRec } from '../../features/PerPageRec/perPageRecSlice';
import debounce from 'debounce';
import Pagination from '../Pagination';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ListOrganisations = () => {

    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const token = getToken();

    const perPageRec = useSelector((state) => state.perPageRec);
    const dispatch = useDispatch();

    // For Pagination and Data Filter
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");

    // temporary
    const [totalPages, setTotalPages] = useState(1);

    const [organisations, setOrganisations] = useState([]);

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);

    const fetchOrganisations = async ({ page, limit, search, status, token }) => {

        try {
            const res = await fetch(`${apiUrl}/org/all?page=${page}&limit=${limit}&search=${search}&status=${status}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setOrganisations(data.orgs);
                setTotalPages(data.totalPages);
            } else {
                toast.error(data.message || "Error fetching organisations");
            }
        } catch (error) {
            toast.error("Error fetching organisations:", error.message)
        }
    }

    const handleSetPerPageRec = (value) => {
        dispatch(setPerPageRec(value));
        fetchOrganisations({ page: currentPage, limit: value, search: query, status, token, });
    };

    const handleSearch = debounce((value) => {
        setQuery(value)
        fetchOrganisations({ page: 1, limit: perPageRec, search: value, status, token, });
    }, 300);

    const handleStatus = (value) => {
        setStatus(value)
        fetchOrganisations({ page: 1, limit: perPageRec, search: query, status: value, token, });
    }

    useEffect(() => {
        /*setDataLoading(true)
        let loadingTimer = setTimeout(() => {
            setShowLoading(true);
        }, 500);
                dispatch(getUsers({ page: currentPage, limit: perPageRec, search: query, status, token }))
            .unwrap()
            .finally(() => {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            })
        */
        fetchOrganisations({ page: currentPage, limit: perPageRec, search: query, status, token });
        // dispatch(startListeningToSocket(token));
    }, []);

    return (
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            <div>

                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">Organisations</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search organisation..."
                            className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleSearch(e.target.value)}
                        />

                        <select
                            title='Filter records according to Status'
                            name="filters"
                            id="filters"
                            className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleStatus(e.target.value)}
                        >
                            <option value="all">Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
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
                        <Link to={"/organisations/addOrganisation"} className="bg-[#0364BD] text-white p-2 rounded-lg hover:bg-[#164a7a] transition-colors">Add Organisation</Link>
                    </div>
                </div>
                {organisations.length === 0 ? (
                    <p>No organisations found.</p>
                ) : (
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">Name</th>
                                    <th className="py-3 text-left">Total Admin(s)</th>
                                    <th className="py-3 text-left">Total Users (including Admin)</th>
                                    <th className="py-3 text-left">Status</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {organisations.map((organisation) => {

                                    return (
                                        <tr
                                            key={organisation._id}
                                            className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                        >
                                            <td className="py-2 pl-2">
                                                <span className="font-medium">{organisation.name}</span>
                                            </td>
                                            <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                                {organisation.adminCount}
                                            </td>
                                            <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {organisation.usersCount} / {organisation.totalUsers}
                                            </td>
                                            <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                                {organisation.status ? "Active" : "Inactive"}
                                            </td>
                                            <td>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => {
                        setCurrentPage(page);
                        fetchOrganisations({ page, limit: perPageRec, search: query, status, token });
                    }}
                />
            </div>
        </div>
    )
}

export default ListOrganisations