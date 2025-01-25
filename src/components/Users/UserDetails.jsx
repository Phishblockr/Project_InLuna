import React, { useEffect, useRef, useState } from "react";
import { RiLoopLeftLine, RiDeleteBinLine, RiPresentationFill } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { delUser, getUser, startListeningToSocket, updateUserStatus } from "../../features/Users/usersSlice";
import { toast } from "sonner";
import LoadingOverlay from "../../utils/LoadingOverlay";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../static/CustomDatePicker.css';
import AuthenticateModal from "../../utils/AuthenticateModal"
import { handleVerifyPwd } from "../../utils/handleVerifyPwd";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { useAuth } from "../../utils/AuthProvider";
import { fetchAssignedCourses, removeCourse } from "../../features/UserCourse/userCourseSlice";


const UserDetails = () => {
    const apiUrl = import.meta.env.VITE_API_URL
    const { getToken } = useAuth();
    const token = getToken();
    const { id } = useParams();

    const heartbeatSectionRef = useRef(null);
    const courseSectionRef = useRef(null);

    const [activityCounts, setActivityCounts] = useState({
        "phishingClicks": 0,
        "blacklistedClicks": 0,
        "whitelistRequests": 0,
        "visitsToWhitelistUrls": 0,
        "percentageBlacklistedClicks": 0,
        "percentagePhishingClicks": 0,
        "percentageVisitToWhitelistUrls": 0,
        "percentageWhitelistReq": 0
    });
    const [dataLoading, setDataLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [operationType, setOperationType] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedSeries, setSelectedSeries] = useState('all');
    const [barGraphData, setBarGraphData] = useState({ labels: [], totalVisits: [], blacklistedVisits: [], phishingVisits: [] });
    // const [currentWeek, setCurrentWeek] = useState({
    //     start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    //     end: endOfWeek(new Date(), { weekStartsOn: 1 }),
    // });
    const [heartbeatStatus, setHeartbeatStatus] = useState({ "status": "not initialized" });
    const [isHeartbeatSectionVisible, setIsHeartbeatSectionVisible] = useState(false);
    const [isCourseSectionVisible, setIsCourseSectionVisible] = useState(false)

    const { courses, courseLoading, courseError } = useSelector((state) => state.userCourses);
    console.log(courses)

    const theme = useSelector((state) => state.theme);

    const dispatch = useDispatch();

    const renderMonthContent = (month, shortMonth, longMonth, day) => {
        const fullYear = new Date(day).getFullYear();
        const tooltipText = `Tooltip for month: ${longMonth} ${fullYear}`;

        return <span title={tooltipText}>{shortMonth}</span>;
    };


    const generateAllDatesInMonth = (year, month) => {
        const date = new Date(year, month, 1);
        const dates = [];
        while (date.getMonth() === month) {
            dates.push(format(new Date(date), 'dd/MM/yyyy'));
            date.setDate(date.getDate() + 1);
        }
        return dates;
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        fetchActivityCounts(id, date);
    };

    const handleSeriesChange = (e) => {
        setSelectedSeries(e.target.value);
    };


    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            let loadingTimer = setTimeout(() => {
                setShowLoading(true); // Show loading overlay after delay
            }, 500);
    
            try {
                dispatch(startListeningToSocket());
                await dispatch(getUser({ id, token })).unwrap();
                await fetchActivityCounts(id, selectedDate);
                await fetchHeartBeatStatus(id);
                await dispatch(fetchAssignedCourses({ token, id })).unwrap();
            } catch (error) {
                console.error("Error during data fetching:", error);
            } finally {
                clearTimeout(loadingTimer);
                setShowLoading(false);
                setDataLoading(false);
            }
        };
    
        fetchData();
    }, [dispatch, id, selectedDate, token]);

    useEffect(() => {
        setTimeout(() => {
            if (isHeartbeatSectionVisible && heartbeatSectionRef.current) {
                heartbeatSectionRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 200);
        setTimeout(() => {
            if (isCourseSectionVisible && courseSectionRef.current){
                courseSectionRef.current.scrollIntoView({behavior: "smooth"})
            }
        }, 200);
    }, [isHeartbeatSectionVisible, isCourseSectionVisible]);


    const navigate = useNavigate();
    const { userDetails: user, loading, error } = useSelector(state => state.users);

    const handleRemUser = async (id, name) => {
        try {
            await dispatch(delUser({ id, token })).unwrap();
            navigate("/users");
            toast.success(`User deleted!`);
        } catch (e) {
            toast.error(e.message);
        }
    };

    const handleUpdateStatus = (id, name) => {
        dispatch(updateUserStatus({ id, name, token }));
    };

    const fetchActivityCounts = async (id, date) => {
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        try {
            setDataLoading(true)
            let loadingTimer = setTimeout(() => {
                setShowLoading(true); // Only show loading overlay after delay
            }, 500);
            const apiUrl = import.meta.env.VITE_API_URL
            // const token = JSON.parse(localStorage.getItem("user")).token;
            const response = await fetch(`${apiUrl}/overview/user-metrics/${id}/${month}/${year}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch activity counts");
            }

            const data = await response.json();

            const allDatesInMonth = generateAllDatesInMonth(year, month - 1);
            const mergedBarGraphData = allDatesInMonth.map(date => {
                const index = data.barGraphData.labels.indexOf(date);
                return {
                    label: date,
                    totalVisits: index !== -1 ? data.barGraphData.totalVisits[index] : 0,
                    blacklistedVisits: index !== -1 ? data.barGraphData.blacklistedVisits[index] : 0,
                    phishingVisits: index !== -1 ? data.barGraphData.phishingVisits[index] : 0,
                };
            });

            setBarGraphData({
                labels: mergedBarGraphData.map(item => item.label),
                totalVisits: mergedBarGraphData.map(item => item.totalVisits),
                blacklistedVisits: mergedBarGraphData.map(item => item.blacklistedVisits),
                phishingVisits: mergedBarGraphData.map(item => item.phishingVisits),
            });

            setActivityCounts(data);
            clearTimeout(loadingTimer);
            setShowLoading(false);
            setDataLoading(false);
        } catch (error) {
            console.error(error.message);
        }
    };

    const fetchHeartBeatStatus = async (userId) => {
        const apiUrl = import.meta.env.VITE_API_URL;
        const token = getToken();
        try {
            setDataLoading(true);
            const loadingTimer = setTimeout(() => {
                setShowLoading(true);
            }, 500);

            const response = await fetch(`${apiUrl}/heartBeat/fetchHeartBeat/${userId}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch heartbeat status");
            }

            const data = await response.json();
            setHeartbeatStatus(data);

            clearTimeout(loadingTimer);
            setShowLoading(false);
            setDataLoading(false);
        } catch (error) {
            console.error("Error fetching heartbeat status:", error);
            setShowLoading(false);
            setDataLoading(false);
        }
    };
    const handleRemoveCourseBtn = async (token, userId, courseId) => {
       dispatch(removeCourse({token, userId, courseId}))
    }

    const scrollToHeartbeatSection = () => {
        setIsHeartbeatSectionVisible(!isHeartbeatSectionVisible);
    };

    const scrollToCourseSection = () => {
        setIsCourseSectionVisible(!isCourseSectionVisible);
    }

    if (!user) {
        return <div>User not found</div>;
    }

    const overviewPoints = [
        {
            id: 1,
            title: "Phishing Links Visited",
            count: activityCounts.phishingClicks,
            lastMonth: activityCounts.percentagePhishingClicks,
            logo: "bi bi-shield-x",
        },
        {
            id: 2,
            title: "Whitelist Requests",
            count: activityCounts.whitelistRequests,
            lastMonth: activityCounts.percentageWhitelistReq,
            logo: "bi bi-shield-exclamation",
        },
        {
            id: 3,
            title: "Visits to Requested Urls.",
            count: activityCounts.visitsToWhitelistUrls,
            lastMonth: activityCounts.percentageVisitToWhitelistUrls,
            logo: "bi bi-shield-shaded",
        },
        {
            id: 4,
            title: "Blacklisted Links Visited.",
            count: activityCounts.blacklistedClicks,
            lastMonth: activityCounts.percentageBlacklistedClicks,
            logo: "bi bi-shield-shaded",
        },
    ];

    const OverviewCard = ({ count, title, logo, lastMonth }) => (
        <div
            className={`shadow border-2 border-gray-100 flex px-4 py-6 items-center text-black rounded-lg dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-0`}
        >
            <div className="w-full flex flex-col font-medium">
                <div className="flex flex-row justify-between">
                    <h4 className="">{title}</h4>
                    <i className={`${logo}`}></i>
                </div>
                <h4 className="mt-2 text-2xl font-bold">{count}</h4>
                <div>
                    <span className="text-[12px] text-gray-500">
                        {lastMonth}% compared to last month
                    </span>
                </div>
            </div>
        </div>
    );

    const OverviewCards = ({ points }) => (
        <div className="grid grid-cols-4 gap-3">
            {points.map(({ id, title, count, logo, lastMonth }) => (
                <OverviewCard
                    key={id}
                    count={count}
                    title={title}
                    logo={logo}
                    lastMonth={lastMonth}
                />
            ))}
        </div>
    );

    const handlePasswordModalOpen = (user, type) => {
        setSelectedUser(user);
        setOperationType(type);
        setIsPasswordModalOpen(true);
    };

    const handlePasswordConfirm = async (password) => {
        // const token = JSON.parse(localStorage.getItem("user")).token;
        const token = getToken();
        const result = await handleVerifyPwd(password, apiUrl, token);

        if (result) {
            if (operationType === "delete") {
                handleRemUser(selectedUser._id);
            } else if (operationType === "updateStatus") {
                handleUpdateStatus(selectedUser._id, selectedUser.name)
            } else if (operationType === "unassignCourse"){
                handleRemoveCourseBtn(token, selectedUser[0], selectedUser[1])
            }
            setIsPasswordModalOpen(false);
        }
    };


    const chartStyles = theme === 'dark' ? {
        textColor: '#f4f4f4',
        gridColor: '#444444',
    } : {
        textColor: '#000000',
        gridColor: '#E0E0E0',
    };

    const chartData = barGraphData.labels.map((label, index) => ({
        name: label,
        detection: barGraphData.totalVisits[index],
        phishing: barGraphData.phishingVisits[index],
        blacklisted: barGraphData.blacklistedVisits[index]
    }));

    return (
        <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            {showLoading && <LoadingOverlay loading={dataLoading} />}

            <AuthenticateModal isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                onConfirm={handlePasswordConfirm}
            />

            <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight mb-5">
                        User Details
                    </h1>
                </div>
                <div className="flex flex-row items-center justify-between">
                    <div className="flex flex-row items-center gap-x-5">
                        {user.img ? (
                            <img
                                className="w-[10rem] h-[10rem] rounded-full object-cover"
                                src={user.img}
                                alt="user Profile"
                            />
                        ) : (
                            <svg
                                className="w-[10rem] h-[10rem] rounded-full object-cover"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="16 16 224 224"
                            >
                                <path
                                    d="M63.8,199.37a72,72,0,0,1,128.4,0"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="128"
                                    cy="128"
                                    r="96"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="128"
                                    cy="120"
                                    r="40"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="12"
                                />
                            </svg>
                        )}
                        <ul className="flex flex-col">
                            <li className="font-medium text-3xl my-2">{user.name}</li>
                            {/* <li className="font-medium mb-1">
                                <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                                    Username:
                                </span>
                                <span>{user.username}</span>
                            </li> */}
                            <li className="font-medium mb-1">
                                <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                                    E-mail:
                                </span>
                                <span>{user.email}</span>
                            </li>
                            {/* <li className="font-medium mb-1">
                                <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                                    Phone:
                                </span>
                                <span>{user.phone}</span>
                            </li> */}
                            <li className="font-medium mb-1">
                                <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                                    Department:
                                </span>
                                <span>{user.department}</span>
                            </li>
                            <li className="font-medium mb-2">
                                <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                                    Role:
                                </span>
                                <span>{user.role}</span>
                            </li>
                            <li className="font-medium mb-1">
                                <span className="text-gray-500 dark:text-[#F4F4F4] mr-2">
                                    Status:
                                </span>
                                <span
                                    className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${user.status === "active"
                                        ? "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                        : user.status === "not initialized"
                                            ? "bg-yellow-100 text-yellow-800 dark:bg-[rgba(238,247,187,0.1)] dark:text-yellow-400"
                                            : "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                        }`}
                                >
                                    {user.status}
                                </span>
                            </li>
                        </ul>
                    </div>
                    <div className="flex flex-col gap-5">
                        <button className={`${heartbeatStatus.status === "active" ? "text-red-600" : "text-gray-600"} p-2 w-[200px] h-[50px] font-medium rounded-lg transition-colors flex items-center justify-center gap-2`}
                            title={`Extension status: ${heartbeatStatus.status}\nClick to view History`}
                            onClick={scrollToHeartbeatSection}
                        >
                            <div className={`h-5 w-5 rounded-full ${heartbeatStatus.status === "active" ? "bg-red-600 animation-pulse" : "bg-gray-600"}`}></div>
                        </button>
                        <button
                            onClick={() => handlePasswordModalOpen(user, "updateStatus")}
                            className="bg-[#0364BD] hover:bg-[#003A70] w-[200px] h-[50px] p-2 text-[#f4f4f4] font-medium rounded-lg mr-2 transition-colors"
                        >
                            <span className="flex flex-row items-center gap-x-2 justify-center">
                                <RiLoopLeftLine className="w-6 h-6" /> Update Status
                            </span>
                        </button>
                        <button
                            onClick={() => handlePasswordModalOpen(user, "delete")}
                            className="bg-gray-200 hover:bg-gray-300 text-red-500 p-2 w-[200px] h-[50px] font-medium rounded-lg transition-colors dark:dark:bg-[#001733] dark:hover:bg-[#001733]"
                        >
                            <span className="flex flex-row items-center gap-x-2  justify-center">
                                <RiDeleteBinLine className="w-6 h-6" /> Remove User
                            </span>
                        </button>
                        <button
                            className="flex flex-row items-center gap-x-2  justify-center bg-gray-200 hover:bg-gray-300 text-black p-2 w-[200px] h-[50px] font-medium rounded-lg transition-colors dark:dark:bg-[#001733] dark:hover:bg-[#001733]"
                            onClick={scrollToCourseSection}
                        >
                            <RiPresentationFill className="w-6 h-6" /> View Training
                        </button>
                    </div>
                </div>
                <div className="my-8">
                    <div className="mb-2 py-2 px-5 shadow border-2 border-gray-100 flex items-center justify-center text-black rounded-lg dark:text-[#F4F4F4] dark:bg-[#001C40] dark:border-[#001C40]">
                        <span>Showing overview for: </span>
                        <DatePicker
                            selected={selectedDate}
                            onChange={handleDateChange}
                            renderMonthContent={renderMonthContent}
                            showMonthYearPicker
                            dateFormat="MM/yyyy"
                            className="w-20 text-center dark:text-[#F4F4F4] dark:bg-[#001C40]"
                        />
                    </div>
                    <OverviewCards points={overviewPoints} />
                </div>
                <h1 className="text-2xl font-medium tracking-tight mb-5">Graph</h1>
                <div className='mt-3 p-[20px] rounded-lg shadow border-2 border-gray-100 dark:bg-[#001C40] dark:shadow-none dark:border-[#001C40]'>
                    <div className="mt-4">
                        <label htmlFor="seriesSelect" className="mr-2">Show Data:</label>
                        <select
                            id="seriesSelect"
                            value={selectedSeries}
                            onChange={handleSeriesChange}
                            className="p-2 border rounded-lg dark:bg-[#001C40] dark:text-[#F4F4F4] dark:border-[#001C40] focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
                        >
                            <option value="all">All</option>
                            <option value="totalVisits">Detection</option>
                            <option value="phishingVisits">Phishing Visits</option>
                            <option value="blacklistedVisits">Blacklisted Visits</option>
                        </select>
                    </div>
                    <h2 className="text-center dark:text-[#F4F4F4]">Monthly URL Access</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            {/* <CartesianGrid stroke={chartStyles.gridColor} /> */}

                            <XAxis
                                dataKey="name"
                                stroke={chartStyles.textColor}
                                tickFormatter={(tick) => tick.split('/')[0]} // Extracts and displays the day part of the date
                            />

                            <YAxis stroke={chartStyles.textColor} />
                            <Tooltip cursor={{ fill: chartStyles.gridColor }} />
                            <Legend verticalAlign="top" wrapperStyle={{ color: chartStyles.textColor }} />

                            {/* Conditionally render bars based on the selected series */}
                            {selectedSeries === 'all' || selectedSeries === 'totalVisits' ? (
                                <Bar dataKey="detection" fill="#82ca9d" radius={[10, 10, 0, 0]} />
                            ) : null}

                            {selectedSeries === 'all' || selectedSeries === 'phishingVisits' ? (
                                <Bar dataKey="phishing" fill="#8884d8" radius={[10, 10, 0, 0]} />
                            ) : null}

                            {selectedSeries === 'all' || selectedSeries === 'blacklistedVisits' ? (
                                <Bar dataKey="blacklisted" fill="#ff4d4f" radius={[10, 10, 0, 0]} />
                            ) : null}

                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className={`rounded-lg shadow border-2 border-gray-100 dark:bg-[#001C40] dark:shadow-none dark:border-[#001C40] w-full p-5 overflow-hidden transition-all duration-500 ease-in-out ${isHeartbeatSectionVisible ? " mt-5 max-h-screen opacity-100" : "max-h-0 opacity-0"
                    }`}
                    ref={heartbeatSectionRef}
                >
                    <div className="flex flex-row gap-2 items-center  mb-5">
                        <h2 className="text-lg font-semibold">Downtime History</h2>
                        <span>Extension Status:</span>
                        <span
                            className={`px-2 py-1 rounded-full text-sm font-medium capitalize ${heartbeatStatus.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                : heartbeatStatus.status === "not initialized"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-[rgba(238,247,187,0.1)] dark:text-yellow-400"
                                    : "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                }`}
                        >
                            {heartbeatStatus.status}
                        </span>
                    </div>
                    {dataLoading ? ( // Display loading message while data is being fetched
                        <p className="text-center text-gray-500 dark:text-gray-300">Fetching data...</p>
                    ) : heartbeatStatus.downtime && heartbeatStatus.downtime.length > 0 ? ( // Render table if downtime data exists
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Start Time</th>
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">End Time</th>
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Reason</th>
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {heartbeatStatus.downtime.map((entry, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-100 dark:hover:bg-[#182A46]">
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            {new Date(entry.oldTimestamp).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            {new Date(entry.newTimestamp).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">{entry.reason}</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">{entry.duration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-300">No downtime history available.</p>
                    )}
                </div>

                <div className={`rounded-lg shadow border-2 border-gray-100 dark:bg-[#001C40] dark:shadow-none dark:border-[#001C40] w-full p-5 overflow-hidden transition-all duration-500 ease-in-out ${isCourseSectionVisible ? " mt-5 max-h-screen opacity-100" : "max-h-0 opacity-0"
                    }`}
                    ref={courseSectionRef}
                >
                    <div className="flex flex-row gap-2 items-center  mb-5">
                        <h2 className="text-lg font-semibold">Courses assigned to the user</h2>
                        <button 
                        className="p-2 bg-gray-200 rounded-lg"
                        onClick={() => navigate(`/training/individualTraining/${user._id}`)}
                        >Assign New Course</button>
                    </div>
                    {dataLoading ? ( // Display loading message while data is being fetched
                        <p className="text-center text-gray-500 dark:text-gray-300">Fetching data...</p>
                    ) : courses ? ( // Render table if downtime data exists
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Course name</th>
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Assigned By</th>
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Completion</th>
                                    <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course, index) => (
                                    <tr key={index} className="border-b hover:bg-gray-100 dark:hover:bg-[#182A46]">
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            {course.courseId.name || "Unknown Course"}
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">
                                            {course.assignedBy.name || "Unknown"}
                                        </td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400">{course.progress || 0} %</td>
                                        <td className="p-3 text-gray-600 dark:text-gray-400"><button
                                        className="p-2 bg-gray-200 rounded-lg"
                                        // onClick={() => removeCourseAssignment(course.userId, course.courseId)}
                                        onClick={() => handlePasswordModalOpen([course.userId, course.courseId._id], "unassignCourse")}
                                        >Unassign</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-300">No courses assigned to the user.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetails;
