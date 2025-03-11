import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthProvider';
import { setPerPageRec } from '../../features/PerPageRec/perPageRecSlice';
import debounce from 'debounce';
import Pagination from '../Pagination';
import { RiEyeLine } from 'react-icons/ri';

const ListAppointments = () => {

    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const token = getToken();

    const month = 3
    const year = 2025

    const perPageRec = useSelector((state) => state.perPageRec);
    const dispatch = useDispatch();

    const [appointments, setAppointments] = useState([]);

    // For Pagination and Data Filter
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");

    // temporary
    const [totalPages, setTotalPages] = useState(1);

    // For Loading Overlay
    const [dataLoading, setDataLoading] = useState(true);
    const [showLoading, setShowLoading] = useState(false);


    const fetchAppointments = async ({ page, limit, search, status, token, month, year }) => {
        try {
            const res = await fetch(`${apiUrl}/bookADemo/fetchAppointments?page=${page}&limit=${limit}&search=${search}&status=${status}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`, {
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (res.ok) {
                setAppointments(data.appointments);
                setTotalPages(data.totalPages);
            } else {
                toast.error(data.message || "Error fetching appointments");
            }
        } catch (error) {
            toast.error("Error fetching appointments:", error.message)
        }
    }

    const handleSetPerPageRec = (value) => {
        dispatch(setPerPageRec(value));
        fetchAppointments({ page: currentPage, limit: value, search: query, status, token, month, year });
    };

    const handleSearch = debounce((value) => {
        setQuery(value)
        fetchAppointments({ page: 1, limit: perPageRec, search: value, status, token, month, year });
    }, 300);

    const handleStatus = (value) => {
        setStatus(value)
        fetchAppointments({ page: 1, limit: perPageRec, search: query, status: value, token, month, year });
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
        fetchAppointments({ page: currentPage, limit: perPageRec, search: query, status, token, month, year });
        // dispatch(startListeningToSocket(token));
    }, []);


    return (
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            <div>

                <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                    <div>
                        <h1 className="text-2xl font-medium tracking-tight">appointments</h1>
                    </div>
                    <div className="flex items-center gap-x-3">
                        <input
                            type="text"
                            placeholder="Search appointment..."
                            className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                            onChange={(e) => handleSearch(e.target.value)}
                        />

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
                    </div>
                </div>
                {appointments.length === 0 ? (
                    <p>No appointments found.</p>
                ) : (
                    <div>
                        <table className="w-full dark:text-[#F4F4F4]">
                            <thead className="border-separate">
                                <tr>
                                    <th className="py-3 text-left">Name</th>
                                    <th className="py-3 text-left">E-mail</th>
                                    <th className="py-3 text-left">Date</th>
                                    <th className="py-3 text-left">TimeSlot</th>
                                    <th className="py-3 text-left">Status</th>
                                    <th className="py-3 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((appointment) => (
                                    <tr
                                        key={appointment._id}
                                        className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                    >
                                        <td className="py-2 pl-2">
                                            <span className="font-medium">{appointment.name}</span>
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {appointment.email}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {appointment.appointmentDate}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {appointment.timeslot}
                                        </td>
                                        <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                                            {appointment.approved ? "Approved" : "Pending"}
                                        </td>
                                        <td>
                                            {appointment.approved ?
                                                <button
                                                    onClick={() => navigate(`/courses/courseEditor/${appointment._id}`)}
                                                    title="Click to view details"
                                                    className="bg-[#0364BD] hover:bg-[#14528b] text-white px-2 py-1 rounded-lg transition-colors"
                                                >Connect</button>
                                                :
                                                <button
                                                    onClick={() => navigate(`/courses/courseEditor/${appointment._id}`)}
                                                    title="Click to view details"
                                                    className="bg-[#0364BD] hover:bg-[#14528b] text-white px-2 py-1 rounded-lg transition-colors"
                                                >Accept</button>
                                            }
                                            {/* <button onClick={() => handlePasswordModalOpen(appointment._id, "delete")}>
                                                <RiDeleteBinLine className="w-6 h-6 text-red-500 hover:text-red-700 transition-colors" />
                                            </button> */}
                                        </td>
                                    </tr>
                                ))}
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
                        fetchAppointments({ page, limit: perPageRec, search: query, status, token, month, year });
                    }}
                />
            </div>
        </div>
    )
}

export default ListAppointments