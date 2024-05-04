import React, { useState } from 'react'
import { RiAddFill } from "react-icons/ri";
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md";

export default function Insights() {
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
      name: "John Doe",
      email: "johndoe@gmail.com",
      department: "QA",
      role: "Tester",
      status: "Inactive",
    },
  ];

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const lastIndex = currentPage * recordsPerPage;
  const firstIndex = lastIndex - recordsPerPage;
  const records = users.slice(firstIndex, lastIndex);
  const npage = Math.ceil(users.length / recordsPerPage);
  const numbers = [...Array(npage + 1).keys()].slice(1);

  function nextPage() {
    if (currentPage !== npage) {
      setCurrentPage(currentPage + 1)
    }
  };

  function prePage() {
    if (currentPage !== 1) {
      setCurrentPage(currentPage - 1)
    }
  };

  function changeCPage(n) {
    setCurrentPage(n)
  };
  // End of Pagination Logic

  const statusActive =
    "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg";
  const statusInactive =
    "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg";

  return (
    <div className='flex flex-col absolute top-[63px] left-[16rem] right-0 bottom-0 p-4 gap-2'>
      <div className="bg-white rounded-lg gap-5 shadow-lg p-3 flex justify-evenly items-center">
        <h1 className='text-2xl font-bold tracking-tight'>Employees</h1>
        <div className='flex gap-5'>
          <div className='border-2 border-gray-300 p-1 px-2 justify-start items-center rounded-lg flex gap-1'>
            <button className="cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
            <input placeholder='Search' className='focus:outline-none placeholder:text-lg placeholder:text-gray-400' />
          </div>
          <div className='border-2 border-gray-300 p-1 px-2 justify-start items-center rounded-lg flex gap-[8rem]'>
            <p className='text-gray-400 text-lg'>Department</p>
            <button className="cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>
        <button className='flex text-white p-2 px-3 justify-center items-center gap-4 rounded-lg bg-[#0364BD]'>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <p>Add Emp</p>
        </button>
      </div>
      <div className="w-full">
        <table className="w-full mb-4">
          <thead className="border-separate">
            <tr>
              <th className="py-3 text-left">Employee-id</th>
              <th className="py-3 text-left">Name</th>
              <th className="py-3 text-left">Email</th>
              <th className="py-3 text-left">Department</th>
              <th className="py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((user) => (
              <tr key={user.id} className="odd:bg-white even:bg-gray-100">
                <td>
                  <p className='font-bold text-gray-500 ml-3'>#0175{user.id}</p>
                </td>
                <td className="py-2 px-0">
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
                <td>
                  <button>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="text-red-500 w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
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
            <a className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition" href="#" onClick={prePage}>
              <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
            </a>
          </div>
          <div className="flex gap-x-2 items-center">
            {numbers.map((number, index) => (
              <div
                key={index}>
                <a className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition ${currentPage === number ? 'bg-[#0364BD] text-white' : 'bg-gray-200'}`} href="#" onClick={() => changeCPage(number)}>
                  {number}
                </a>
              </div>
            ))}
          </div>
          <div>
            <a className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition" href="#" onClick={nextPage}>
              Next <MdOutlineArrowForwardIos className="w-6 h-6" />
            </a>
          </div>
        </nav>
      </div>
    </div>
  )
}
