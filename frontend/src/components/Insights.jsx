import React, { useState } from 'react';
import {
  MdOutlineArrowBackIos,
  MdOutlineArrowForwardIos,
} from "react-icons/md";
import { Link } from 'react-router-dom';

export default function Insights() {
  const users = [
    {
      id: 1,
      name: "John Doe",
      department: "Marketing",
      email: "john.doe@example.com",
      img: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      id: 2,
      name: "Jane Smith",
      department: "Finance",
      email: "jane.smith@example.com",
      img: "https://randomuser.me/api/portraits/women/2.jpg"
    },
    {
      id: 3,
      name: "David Johnson",
      department: "IT",
      email: "david.johnson@example.com",
      img: "https://randomuser.me/api/portraits/men/3.jpg"
    },
    {
      id: 4,
      name: "Emily Brown",
      department: "Human Resources",
      email: "emily.brown@example.com",
      img: "https://randomuser.me/api/portraits/women/4.jpg"
    },
    {
      id: 5,
      name: "Michael Wilson",
      department: "Operations",
      email: "michael.wilson@example.com",
      img: "https://randomuser.me/api/portraits/men/5.jpg"
    },
    {
      id: 6,
      name: "Sarah Jones",
      department: "Sales",
      email: "sarah.jones@example.com",
      img: "https://randomuser.me/api/portraits/women/6.jpg"
    },
    {
      id: 7,
      name: "Christopher Martinez",
      department: "Customer Support",
      email: "christopher.martinez@example.com",
      img: "https://randomuser.me/api/portraits/men/7.jpg"
    },
    {
      id: 8,
      name: "Jessica Lee",
      department: "Marketing",
      email: "jessica.lee@example.com",
      img: "https://randomuser.me/api/portraits/women/8.jpg"
    },
    {
      id: 9,
      name: "William Taylor",
      department: "IT",
      email: "william.taylor@example.com",
      img: "https://randomuser.me/api/portraits/men/9.jpg"
    },
    {
      id: 10,
      name: "Amanda Miller",
      department: "Finance",
      email: "amanda.miller@example.com",
      img: "https://randomuser.me/api/portraits/women/10.jpg"
    },
    {
      id: 11,
      name: "Daniel Anderson",
      department: "Operations",
      email: "daniel.anderson@example.com",
      img: "https://randomuser.me/api/portraits/men/11.jpg"
    },
    {
      id: 12,
      name: "Olivia Garcia",
      department: "Sales",
      email: "olivia.garcia@example.com",
      img: "https://randomuser.me/api/portraits/women/12.jpg"
    },
    {
      id: 13,
      name: "Ethan Wilson",
      department: "Customer Support",
      email: "ethan.wilson@example.com",
      img: "https://randomuser.me/api/portraits/men/13.jpg"
    },
    {
      id: 14,
      name: "Sophia Brown",
      department: "Human Resources",
      email: "sophia.brown@example.com",
      img: "https://randomuser.me/api/portraits/women/14.jpg"
    },
    {
      id: 15,
      name: "Mason Taylor",
      department: "Marketing",
      email: "mason.taylor@example.com",
      img: "https://randomuser.me/api/portraits/men/15.jpg"
    },
    {
      id: 16,
      name: "Chloe White",
      department: "Finance",
      email: "chloe.white@example.com",
      img: "https://randomuser.me/api/portraits/women/16.jpg"
    },
    {
      id: 17,
      name: "Ryan Martinez",
      department: "IT",
      email: "ryan.martinez@example.com",
      img: "https://randomuser.me/api/portraits/men/17.jpg"
    },
    {
      id: 18,
      name: "Grace Davis",
      department: "Operations",
      email: "grace.davis@example.com",
      img: "https://randomuser.me/api/portraits/women/18.jpg"
    },
    {
      id: 19,
      name: "Jacob Clark",
      department: "Sales",
      email: "jacob.clark@example.com",
      img: "https://randomuser.me/api/portraits/men/19.jpg"
    },
    {
      id: 20,
      name: "Ava Rodriguez",
      department: "Customer Support",
      email: "ava.rodriguez@example.com",
      img: "https://randomuser.me/api/portraits/women/20.jpg"
    }
    // Add more users as needed
  ];

  const [currPage, setCurrPage] = useState(1);
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState(users);
  const [userPerPage] = useState(5);
  const lastPageIndex = currPage * userPerPage;
  const firstPageIndex = lastPageIndex - userPerPage;
  const records = allUsers.slice(firstPageIndex, lastPageIndex);
  const npage = Math.ceil(allUsers.length / userPerPage);
  const numbers = [...Array(npage + 1).keys()].slice(1);

  const changeCPage = (n) => {
    setCurrPage(n);
  };

  const nextP = () => {
    if (currPage < npage) {
      setCurrPage(currPage + 1);
    }
  };

  const prevP = () => {
    if (currPage > 1) {
      setCurrPage(currPage - 1);
    }
  };

  const remUsers = (id) => {
    const updatedUsers = allUsers.filter(el => el.id !== id);
    setAllUsers(updatedUsers);
  }

  const search = (txt) => {
    setQuery(txt);

    if (txt === "") { // Check if the query is empty
      setAllUsers(users); // Reset to the original users array
    } else {
      const updated = users.filter(el => el.name.toLowerCase().includes(txt)); // Filter based on the query
      setAllUsers(updated);
    }
  }

  return (
    <div className='z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-5'>
      <div className='bg-white p-4 flex justify-between items-center rounded-xl shadow-xl'>
        <div>
          <h1 className='font-bold text-2xl'>Employees</h1>
        </div>
        <div className='flex gap-5 justify-evenly items-center'>
          <div>
            <input value={query} onChange={e => search(e.target.value)} placeholder='Search User' className='border-2 border-gray-300 rounded-lg p-2 focus:outline-none' />
          </div>
          <div>
            <select defaultValue={'Department'} className='text-lg text-gray-400 focus:outline-none p-2 border-2 border-gray-300 rounded-lg'>
              <option value="Department">Department</option>
              <option value="Developer">Developer</option>
              <option value="QA">QA</option>
              <option value="Tester">Tester</option>
            </select>
          </div>
          <div className='flex'>
            <Link to={'/insights/addemp'}>
              <button className='flex justify-center items-center gap-3 px-4 p-2 rounded-lg text-white cusror-pointer bg-[#0364BD]'>
                <p className='text-lg'>Add Emp</p>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </div>
      <table className=''>
        <thead className=''>
          <tr className='text-left mb-3'>
            <th>Employee-id</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className='mt-3'>
          {
            records.map(el => <tr key={el.id} className='font-bold odd:bg-white even:bg-gray-100'>
              <td className='p-2 pr-0 text-gray-500'>#0175{el.id}</td>
              <td className='py-2'>
                <div className='flex justify-start items-center gap-3'>
                  <img src={el.img} className='w-10 h-10 rounded-full' />
                  <p>{el.name}</p>
                </div>
              </td>
              <td className='text-gray-500'>{el.email}</td>
              <td>{el.department}</td>
              <td>
                <button className='cursor-pointer' onClick={() => remUsers(el.id)}>
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" className="w-6 h-6 text-red-500 cursor-pointer" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path></svg>
                </button>
              </td>
            </tr>)
          }
        </tbody>
      </table>
      {allUsers.length !== 0 ? <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max">
        <nav className="flex gap-x-1 justify-between">
          <div>
            <a
              className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${currPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
              href="#"
              onClick={prevP}
            >
              <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
            </a>
          </div>
          <div className="flex gap-x-2 items-center">
            {numbers.map((number) => (
              <div key={number}>
                <a
                  className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition ${currPage === number ? "bg-[#0364BD] text-white" : "bg-gray-200"}`}
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
              className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${currPage === npage ? "opacity-50 cursor-not-allowed" : ""} ${numbers.length === 0 ? "disabled" : ''}`}
              href="#"
              onClick={nextP}
            >
              Next <MdOutlineArrowForwardIos className="w-6 h-6" />
            </a>
          </div>
        </nav>
      </div> : ""}
    </div>
  );
}
