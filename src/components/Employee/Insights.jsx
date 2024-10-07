import React, { useEffect, useState } from "react";
import {
    MdOutlineArrowBackIos,
    MdOutlineArrowForwardIos,
} from "react-icons/md";
import { PiUserCircleLight } from "react-icons/pi";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchEmployees, removeEmployee, addUser } from "../../features/Insights/insightsSlice";
import { toast } from "sonner";

const Pagination = ({ currentPage, totalPages, onPageChange, onNextPage, onPrevPage }) => (
    <nav className="flex gap-x-1 justify-between">
        <a
            className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
            href="#"
            onClick={onPrevPage}
        >
            <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
        </a>
        <div className="flex gap-x-2 items-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                <a
                    key={number}
                    className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-[#f4f4f4] transition dark:hover:bg-[#0364BD] ${currentPage === number
                            ? "bg-[#0364BD] text-[#f4f4f4] dark:bg-[#0364BD]"
                            : "bg-gray-200 dark:bg-[#001C40]"
                        }`}
                    href="#"
                    onClick={() => onPageChange(number)}
                >
                    {number}
                </a>
            ))}
        </div>
        <a
            className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-[#f4f4f4] flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD] ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                }`}
            href="#"
            onClick={onNextPage}
        >
            Next <MdOutlineArrowForwardIos className="w-6 h-6" />
        </a>
    </nav>
);

const EmployeeRow = ({ _id, name, email, department, img, handleRemove }) => (
    <tr className="font-medium odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40] dark:text-[#F4F4F4]">
        <td className="p-2 pr-0 text-gray-500 dark:text-[#F4F4F4]">{_id}</td>
        <td className="py-2">
            <Link
                title="Click to view details"
                to={`/insights/empinsight/${_id}`}
                className="flex justify-start items-center gap-3 dark:text-[#F4F4F4]"
            >
                {img ? (
                    <img
                        src={img}
                        alt={name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <PiUserCircleLight className="w-10 h-10 p-0 rounded-full object-cover" />
                )}
            </Link>
        </td>
        <td>{name}</td>
        <td>{email}</td>
        <td>{department}</td>
        <td>
            <button
                onClick={() => handleRemove(_id)}
                className="text-red-500 hover:text-red-700"
            >
                Remove
            </button>
        </td>
    </tr>
);

const Insights = () => {
    const dispatch = useDispatch();
    const employees = useSelector((state) => state.insights.users);
    const currentPage = useSelector((state) => state.insights.currentPage);
    const totalPages = useSelector((state) => state.insights.totalPages);
    const [query, setQuery] = useState("");
    const [dataFilter, setDataFilter] = useState("all");

    useEffect(() => {
        dispatch(fetchEmployees(69));
    }, [dispatch, currentPage]);

    const handleRemoveEmployee = (id) => {
        dispatch(removeEmployee(id)).then(() => {
            toast.success("Employee removed successfully");
            dispatch(fetchEmployees(currentPage));
        });
    };

    const handleAddEmployee = (employee) => {
        dispatch(addUser(employee)).then(() => {
            toast.success("Employee added successfully");
            dispatch(fetchEmployees(currentPage));
        });
    };

    const handlePageChange = (page) => {
        dispatch(fetchEmployees(page));
    };

    const handleSearch = () => {
        const filteredData = employees.filter((emp) =>
            Object.keys(emp).some((key) =>
                String(emp[key]).toLowerCase().includes(query.toLowerCase())
            )
        );
        return filteredData;
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    return (
        <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
            <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight">Insights</h1>
                </div>
                <div className="flex items-center gap-x-3">
                    <input
                        type="text"
                        placeholder="Search Employee..."
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
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        onClick={handleSearch}
                        className="border border-gray-300 rounded-md p-[10px]"
                    >
                        Search
                    </button>
                    <Link
                        to={"/insights/addemployee"}
                        className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition"
                    >
                        <MdOutlineArrowForwardIos />
                        <span>Add Employee</span>
                    </Link>
                </div>
            </div>
            {employees.length === 0 ? (
                <div className="flex justify-center font-medium dark:text-[#F4F4F4]">
                    <span>No Insights Found!</span>
                </div>
            ) : (
                <div>
                    <table className="w-full dark:text-[#F4F4F4]">
                        <thead>
                            <tr className="text-left mb-3 dark:text-[#F4F4F4]">
                                <th className="border-b p-2">Employee-id</th>
                                <th className="border-b p-2">Name</th>
                                <th className="border-b p-2">Email</th>
                                <th className="border-b p-2">Department</th>
                                <th className="border-b p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="mt-3">
                            {handleSearch().map((employee) => (
                                <EmployeeRow
                                    key={employee._id}
                                    {...employee}
                                    handleRemove={handleRemoveEmployee}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onNextPage={handleNextPage}
                onPrevPage={handlePrevPage}
            />
        </div>
    );
};

export default Insights;
