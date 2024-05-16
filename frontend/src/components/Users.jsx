import React, { useState } from "react";
import { RiAddFill, RiDeleteBinLine } from "react-icons/ri";
import {
  MdOutlineArrowBackIos,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { remUser } from "../features/Users/usersSlice";
import { toast } from "sonner";



export default function Users() {
  // Redux
  const usersData = useSelector((state) => state.users.users)
  const dispatch = useDispatch()
  // End of Redux

  // NOTE: This Logic is for demonstration purposes only and should be replaced to optimise database queries
  // Start of User Search Logic
  const [query, setQuery] = useState("");
  const keys = ["name", "email", "department", "role"];
  const search = (data) => {
    return data.filter((item) =>
      keys.some((key) => item[key].toLowerCase().includes(query.toLowerCase()))
    );
  };
  // End of User Search Logic

  // Start of User Filter Logic
  const [dataFilter, setDataFilter] = useState(null);
  const filter = (data) => {
    if (dataFilter === "active") {
      return data.filter((item) => item.status === "Active");
    } else if (dataFilter === "inactive") {
      return data.filter((item) => item.status === "Inactive");
    } else {
      return data;
    }
  };
  // End of User Filter Logic

  // Start of Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 6;
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const records = filter(search(usersData)).slice(firstIndex, lastIndex);
  const npage = Math.ceil(usersData.length / recordsPerPage);
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
  // End of Pagination Logic

  const handleRemUser = (id, name) => {
    try{
      dispatch(remUser(id))
      toast.success(`User ${name} removed`)
    } catch(e){
      toast.error(e)
    }
  }

  const statusActive =
    "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg";
  const statusInactive =
    "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg";

  return (
    <div className="z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="z-1 w-full bg-white rounded-xl shadow-xl flex flex-row p-3 items-center justify-between h-max">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Users</h1>
        </div>
        <div className="flex items-center gap-x-3">
          <input
            type="text"
            placeholder="Search User..."
            className="rounded-lg border-grey border-2 p-2"
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            name="filters"
            id="filters"
            className="rounded-lg border-gray-200 border-2 text-gray-400 bg-white p-2"
            onChange={(e) => setDataFilter(e.target.value)}
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Link
            to={"/users/adduser"}
            className="p-2 bg-[#0364BD] text-white rounded-lg hover:bg-[#003A70] transition"
          >
            <span>
              <RiAddFill className="inline-block w-6 h-6 mr-1 -mt-1" /> Add User
            </span>
          </Link>
        </div>
      </div>
      {records.length === 0 ? (
        <div className="flex justify-center font-medium">
          <span>No Records Found!</span>
        </div>
      ) : (
        <>
          <div>
            <table className="w-full">
              <thead className="border-separate">
                <tr>
                  <th className="py-3 text-left">Name</th>
                  <th className="py-3 text-left">Email</th>
                  <th className="py-3 text-left">Department</th>
                  <th className="py-3 text-left">Role</th>
                  <th className="py-3 text-left">Status</th>
                  <th className="py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((user, index) => (
                  <tr key={index} className="odd:bg-white even:bg-gray-100">
                    <td className="py-2 pl-2">
                      <Link to={"/users/userDetails"}>
                        <div className="flex items-center gap-x-3">
                          <img
                            src={user.img}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="font-medium text-left text-gray-500">
                      {user.email}
                    </td>
                    <td className="font-medium text-left text-gray-500">
                      {user.department}
                    </td>
                    <td className="font-medium text-left text-gray-500">
                      {user.role}
                    </td>
                    <td className="text-left font-medium">
                      <span
                        className={
                          user.status === "Active"
                            ? statusActive
                            : statusInactive
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="text-left ">
                      <button onClick={() => handleRemUser(user.id, user.name)}><RiDeleteBinLine className="w-6 h-6 text-red-500 cursor-pointer" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max">
            <nav className="flex gap-x-1 justify-between">
              <div>
                <a
                  className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition"
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
                      className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition ${
                        currentPage === number
                          ? "bg-[#0364BD] text-white"
                          : "bg-gray-200"
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
                  className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition"
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
