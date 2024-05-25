import React, { useEffect, useState } from 'react';
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { remUser } from '../features/Insights/insightsSlice';
import { toast } from 'sonner';

const EmployeeRow = ({ id, name, email, department, img, handleRemUser }) => (
  <tr className='font-medium odd:bg-white even:bg-gray-100'>
    <td className='p-2 pr-0 text-gray-500'>#0175{id}</td>
    <td className='py-2'>
      <Link to={`/insights/empinsight/${id}`} className='flex justify-start items-center gap-3'>
        <img src={img} className='w-10 h-10 rounded-full' alt={`${name}'s profile`} />
        <p>{name}</p>
      </Link>
    </td>
    <td className='text-gray-500'>{email}</td>
    <td>{department}</td>
    <td>
      <button className='cursor-pointer' onClick={() => handleRemUser(id, name)}>
        <svg
          stroke='currentColor'
          fill='currentColor'
          strokeWidth='0'
          viewBox='0 0 24 24'
          className='w-6 h-6 text-red-500 cursor-pointer'
          height='1em'
          width='1em'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path d='M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z'></path>
        </svg>
      </button>
    </td>
  </tr>
);

const Pagination = ({ currentPage, totalPages, onPageChange, onNextPage, onPrevPage }) => (
  <nav className='flex gap-x-1 justify-between'>
    <a
      className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${
        currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      href='#'
      onClick={onPrevPage}
    >
      <MdOutlineArrowBackIos className='w-6 h-6' /> Previous
    </a>
    <div className='flex gap-x-2 items-center'>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
        <a
          key={number}
          className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition ${
            currentPage === number ? 'bg-[#0364BD] text-white' : 'bg-gray-200'
          }`}
          href='#'
          onClick={() => onPageChange(number)}
        >
          {number}
        </a>
      ))}
    </div>
    <a
      className={`bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition ${
        currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      href='#'
      onClick={onNextPage}
    >
      Next <MdOutlineArrowForwardIos className='w-6 h-6' />
    </a>
  </nav>
);

const Insights = () => {
  const disp = useDispatch();
  const userData = useSelector(state => state.insights.users);
  const [currPage, setCurrPage] = useState(1);
  const [query, setQuery] = useState('');
  const [allUsers, setAllUsers] = useState(userData);
  const [userPerPage] = useState(5);
  const lastPageIndex = currPage * userPerPage;
  const firstPageIndex = lastPageIndex - userPerPage;
  const records = allUsers.slice(firstPageIndex, lastPageIndex);
  const npage = Math.ceil(allUsers.length / userPerPage);

  const changePage = (n) => setCurrPage(n);
  const nextPage = () => currPage < npage && setCurrPage(currPage + 1);
  const prevPage = () => currPage > 1 && setCurrPage(currPage - 1);
  const departments = [...new Set(userData.map(user => user.department))];


  const searchUsers = (txt) => {
    setQuery(txt.toLowerCase());
    if (txt === '') setAllUsers(userData);
    else setAllUsers(userData.filter((el) => el.name.toLowerCase().includes(txt)));
  };

  const handleRemUser = (id, name) => {
    const res = confirm(`Do you want to remove user ${name}?`);

    if (res) {
      try {
        disp(remUser(id));
        toast.success(`User ${name} removed`)
      } catch (error) {
        console.error(error.message);
        toast.error(`Unable to remove user ${id}`);
      }
    } else {
      return;
    }
  }

  const handleDepartmentSort = (dept) => {
    if (dept === 'default') {
      setAllUsers(userData);
    } else {
      const filteredUsers = userData.filter(user => user.department === dept);
      setAllUsers(filteredUsers);
    }
  }

  useEffect(() => {
    setAllUsers(userData);
  }, [userData]);

  return (
    <div className='z-1 w-[calc(100svw-16rem)] flex flex-col relative left-[16rem] p-4 gap-5'>
      <div className='bg-white p-4 flex justify-between items-center rounded-xl shadow-xl'>
        <div>
          <h1 className='font-medium text-2xl'>Employees</h1>
        </div>
        <div className='flex gap-5 justify-evenly items-center'>
          <input
            value={query}
            onChange={(e) => searchUsers(e.target.value)}
            placeholder='Search User'
            className='border-2 border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD]'
          />
          <select
            defaultValue='Department'
            className='bg-white text-lg text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0364BD] p-2 border-2 border-gray-300 rounded-lg'
            onChange={e => handleDepartmentSort(e.target.value)}
          >
            <option value="default">Sort by</option>
            {
              departments.map(el => <option key={el} value={el}>{el}</option>)
            }
          </select>
          <Link to='/insights/addemp'>
            <button className='flex justify-center items-center gap-3 px-4 p-2 rounded-lg text-white cursor-pointer bg-[#0364BD]'>
              <p className='text-lg'>Add Emp</p>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
                className='w-6 h-6 text-white'
              >
                <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
              </svg>
            </button>
          </Link>
        </div>
      </div>
      <table>
        <thead>
          <tr className='text-left mb-3'>
            <th>Employee-id</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody className='mt-3'>
          {records.map(({ id, name, email, department, img }) => (
            <EmployeeRow handleRemUser={handleRemUser} key={id} id={id} name={name} email={email} department={department} img={img} />
          ))}
        </tbody>
      </table>
      {allUsers.length > 0 && (
        <div className='z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max'>
          <Pagination
            currentPage={currPage}
            totalPages={npage}
            onPageChange={changePage}
            onNextPage={nextPage}
            onPrevPage={prevPage}
          />
        </div>
      )}
    </div>
  );
};

export default Insights;
