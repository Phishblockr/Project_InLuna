import React, { useState } from "react";
import { RiAddFill } from "react-icons/ri";
import {
  MdOutlineArrowBackIos,
  MdOutlineArrowForwardIos,
} from "react-icons/md";

const users = [
  {
    id: 1,
    profileImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "Johnita Doe",
    email: "johnitadoe@gmail.com",
    department: "Software",
    role: "Developer",
    status: "Active",
  },
  {
    id: 2,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 3,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 4,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 5,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 6,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 7,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 8,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 9,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 10,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 11,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 12,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 13,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 14,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "John Doe",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
  {
    id: 15,
    profileImage:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    name: "test user",
    email: "johndoe@gmail.com",
    department: "QA",
    role: "Tester",
    status: "Inactive",
  },
];

export default function Users() {
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
  const recordsPerPage = 10;
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const records = filter(search(users)).slice(firstIndex, lastIndex);
  const npage = Math.ceil(users.length / recordsPerPage);
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

  const statusActive =
    "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg";
  const statusInactive =
    "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg";

  return (
    <div className="z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="z-1 w-full bg-white rounded-xl shadow-xl flex flex-row p-3 items-center justify-between h-max">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
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
          <button className="p-2 bg-[#0364BD] text-white rounded-lg hover:bg-[#003A70] transition">
            <span>
              <RiAddFill className="inline-block w-6 h-6 mr-1 -mt-1" /> Add User
            </span>
          </button>
        </div>
      </div>
      {records.length === 0 ? (
        <div className="flex justify-center font-bold">
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
            </tr>
          </thead>
          <tbody>
            {records.map((user) => (
              <tr key={user.id} className="odd:bg-white even:bg-gray-100">
                <td className="py-2 pl-2">
                  <div className="flex items-center gap-x-3">
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-bold">{user.name}</span>
                  </div>
                </td>
                <td className="font-bold text-left text-gray-500">
                  {user.email}
                </td>
                <td className="font-bold text-left text-gray-500">
                  {user.department}
                </td>
                <td className="font-bold text-left text-gray-500">
                  {user.role}
                </td>
                <td className="text-left font-bold">
                  <span
                    className={
                      user.status === "Active" ? statusActive : statusInactive
                    }
                  >
                    {user.status}
                  </span>
                </td>
                {/* <td className='font-bold text-left '><RiDeleteBinLine className='w-6 h-6 text-red-500 cursor-pointer' /></td> */}
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
