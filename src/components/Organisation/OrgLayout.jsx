import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { toast } from "sonner";
import {
    MdOutlineArrowBackIos,
    MdOutlineArrowForwardIos,
} from "react-icons/md";
import { RiEyeLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const OrgLayout = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const Admin = import.meta.env.VITE_USERTYPE_ADMIN;
    const location = useLocation();
    const { orgId } = location.state;
    const { getToken } = useAuth();
    const token = getToken();
    const navigate = useNavigate();
    const [orgData, setOrgData] = useState();
    const [userDetails, setUserDetails] = useState();
    const [users, setUsers] = useState();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [selectedUserType, setSelectedUserType] = useState("all");
    const [perPage, setPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    const [newPrice, setNewPrice] = useState(0);

    const handleSetPerSeatPrice = async () => {
        try {
            const res = await fetch(`${apiUrl}/org/update/${orgId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ perMemberPriceInPaise: newPrice }),
            });
            const data = await res.json();
            setOrgData((prev) => ({
                ...prev,
                perMemberPriceInPaise: newPrice,
            }));
            toast.success("Per seat price updated successfully");
        } catch (error) {
            toast.error("Error updating per seat price:", error.message);
        }
    };

    useEffect(() => {
        const fetchOrganisation = async ({ orgId, token }) => {
            if (!orgId) return;
            try {
                const res = await fetch(`${apiUrl}/org/get/${orgId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const data = await res.json();
                setOrgData(data);
                setNewPrice(data.perMemberPriceInPaise);
                console.log("Org Details", data);
            } catch (error) {
                toast.error("Error Fetching Organisation:", error.message);
            }
        };

        const fetchOrgDetails = async ({ orgId, token }) => {
            if (!orgId) return;
            try {
                const res = await fetch(`${apiUrl}/org/orgDetails/${orgId}`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });
                const data = await res.json();
                console.log("UseDetails", data);
                setUserDetails(data);
                setUsers(data.Users);
            } catch (error) {
                toast.error(
                    "Error fetching the Organisation details:",
                    error.message,
                );
            }
        };

        fetchOrganisation({ orgId, token });
        fetchOrgDetails({ orgId, token });
    }, [orgId, token]);

    if (!orgData || !userDetails || !users) {
        return (
            <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4 overflow-hidden">
                Loading ...
            </div>
        );
    }

    const filteredUsers = users
        .filter((user) =>
            searchTerm
                ? user.name.toLowerCase().includes(searchTerm.toLowerCase())
                : true,
        )
        .filter((user) =>
            selectedDepartment !== "all"
                ? user.department === selectedDepartment
                : true,
        )
        .filter((user) =>
            selectedUserType !== "all"
                ? user.userType === selectedUserType
                : true,
        ); // Fix here

    // Pagination Logic
    const startIndex = (currentPage - 1) * perPage;
    const paginatedUsers = filteredUsers.slice(
        startIndex,
        startIndex + perPage,
    );
    const totalPages = Math.ceil(filteredUsers.length / perPage);

    const OverviewCard = ({ title, metrics, href }) => {
        const Wrapper = href ? "a" : "div"; // Dynamically choose the wrapper tag

        return (
            <Wrapper
                href={href || undefined} // Add href only if it exists
                className={`border border-dashed border-gray-200 rounded-lg bg-white flex justify-center items-center py-6 px-2 shadow flex-col text-center dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none dark:border-0 ${
                    href ? "hover:shadow-md" : ""
                }`}
            >
                <h1 className="text-5xl font-medium">{metrics}</h1>
                <p>{title}</p>
            </Wrapper>
        );
    };

    const OverviewCards = ({ data }) => (
        <div className="grid grid-cols-2 gap-4">
            {data.map(({ id, title, metrics, href }) => (
                <OverviewCard
                    key={id}
                    metrics={metrics}
                    title={title}
                    href={href}
                />
            ))}
        </div>
    );

    const orgMetric = [
        {
            id: 1,
            title: "Total Users",
            metrics: userDetails?.Users?.length || 0,
        },
        {
            id: 2,
            title: "Total Departments",
            metrics: userDetails?.Department?.length || 0,
        },
    ];

    return (
        <div>
            <div className="m-2">
                <div className="bg-white py-5 px-3 rounded-md dark:bg-[#001733] dark:text-[#F4F4F4] dark:shadow-none">
                    <div className="mb-4">
                        <h1 className="text-2xl font-semibold">
                            {orgData.name}
                        </h1>
                    </div>
                    <div>
                        <OverviewCards data={orgMetric} />
                    </div>
                    <div className="mt-2 flex gap-2 items-center">
                        <label htmlFor="perSeatPaise">Per Seat Price:</label>
                        <input
                            type="number"
                            id="perSeatPaise"
                            className="border border-gray-300 rounded-lg p-2 dark:bg-[#002451] dark:border-none dark:text-gray-400 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
                            value={newPrice}
                            onChange={(e) =>
                                setNewPrice(Number(e.target.value))
                            }
                        />
                        {orgData.perMemberPriceInPaise === newPrice ? (
                            <button
                                className="border border-gray-300 rounded-lg p-2 cursor-not-allowed opacity-50"
                                disabled
                            >
                                Update
                            </button>
                        ) : (
                            <button
                                onClick={handleSetPerSeatPrice}
                                className="border border-gray-300 rounded-lg p-2"
                            >
                                Update
                            </button>
                        )}
                    </div>
                </div>

                <div className="z-1 flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
                    <div>
                        <div className="flex items-center gap-x-5 mt-5 bg-white py-3 px-2 rounded-xl shadow-sm dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                            <input
                                type="text"
                                placeholder="Search User..."
                                className="rounded-lg border-gray-300 border-2 text-gray-600 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <select
                                title="Filter records according to Department"
                                className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                                value={selectedDepartment}
                                onChange={(e) =>
                                    setSelectedDepartment(e.target.value)
                                }
                            >
                                <option value="all">All Departments</option>
                                {userDetails.Department.map((dep) => (
                                    <option key={dep} value={dep}>
                                        {dep}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="rounded-lg border-gray-300 border-2 p-2 dark:bg-[#001733] dark:border-none dark:text-gray-400 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-[#0364BD]"
                                value={selectedUserType}
                                onChange={(e) =>
                                    setSelectedUserType(e.target.value)
                                }
                            >
                                <option value="all">All Users</option>
                                <option value={Admin}>Admin</option>
                                {users.length > 0 && (
                                    <option
                                        value={
                                            users.find(
                                                (user) =>
                                                    user.userType !== Admin,
                                            )?.userType || "User"
                                        }
                                    >
                                        User
                                    </option>
                                )}
                            </select>

                            <select
                                className="rounded-lg border-gray-300 border-2 text-gray-600 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:text-gray-400 dark:border-0"
                                value={perPage}
                                onChange={(e) =>
                                    setPerPage(Number(e.target.value))
                                }
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                            </select>
                        </div>

                        {paginatedUsers.length === 0 ? (
                            <p>No Users Found.</p>
                        ) : (
                            <div className="mt-5">
                                <table className="w-full dark:text-[#f4f4f4]">
                                    <thead className="border-separate">
                                        <tr>
                                            <th className="py-3 text-left">
                                                Name
                                            </th>
                                            <th className="py-3 text-left">
                                                Email
                                            </th>
                                            <th className="py-3 text-left">
                                                Department
                                            </th>
                                            <th className="py-3 text-left">
                                                Role
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedUsers.map((user) => {
                                            return (
                                                <tr
                                                    key={user._id}
                                                    className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                                                >
                                                    <td className="font-medium py-2 pl-2 text-left dark:text-[#F4F4F4]">
                                                        {user.name}
                                                    </td>
                                                    <td className="font-medium py-2 pl-2 text-left dark:text-[#F4F4F4]">
                                                        {user.email}
                                                    </td>
                                                    <td className="font-medium py-2 pl-2 text-left dark:text-[#F4F4F4]">
                                                        {user.department}
                                                    </td>
                                                    <td className="font-medium py-2 pl-2 text-left dark:text-[#F4F4F4]">
                                                        {user.role}
                                                    </td>
                                                    <td
                                                        className={`font-medium py-2 pl-2 text-left dark:text-[#F4F4F4] `}
                                                    >
                                                        <span
                                                            className={`${
                                                                user.userType ===
                                                                Admin
                                                                    ? "bg-red-100 text-red-800 dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400"
                                                                    : "bg-green-100 text-green-800 dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400"
                                                            } px-2 py-1 rounded-md`}
                                                        >
                                                            {user.userType ===
                                                            Admin
                                                                ? "Admin"
                                                                : "User"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/organisations/${orgData.name}/userDetails/${user._id}`,
                                                                    {
                                                                        state: {
                                                                            orgId: orgData._id,
                                                                            userId: user._id,
                                                                        },
                                                                    },
                                                                )
                                                            }
                                                            title="Click to view details"
                                                        >
                                                            <RiEyeLine
                                                                size={24}
                                                                className="hover:text-[#0364BD] transition-colors"
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="z-1 w-full bg-white rounded-xl shadow-sm p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                        <nav className="flex gap-x-1 justify-between">
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.max(prev - 1, 1),
                                    )
                                }
                                disabled={currentPage === 1}
                                className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 "
                            >
                                <MdOutlineArrowBackIos className="w-6 h-6" />{" "}
                                Prev
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() =>
                                    setCurrentPage((prev) =>
                                        Math.min(prev + 1, totalPages),
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] disabled:opacity-50 "
                            >
                                Next{" "}
                                <MdOutlineArrowForwardIos className="w-6 h-6" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgLayout;
