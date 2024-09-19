import React, { useEffect, useState } from "react";
import { RiDeleteBinLine, RiAddFill } from "react-icons/ri";
import { MdOutlineArrowBackIos, MdOutlineArrowForwardIos } from "react-icons/md";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { delUser, getUsers, uploadCsv, startListeningToSocket } from "../features/Users/usersSlice";
import { toast } from "sonner";
import { setPerPageRec } from "../features/PerPageRec/perPageRecSlice";
import { PiUserCircleLight } from "react-icons/pi";
import LoadingOverlay from "./LoadingOverlay";
import FileUploadModal from "./FileUploadModal";
import debounce from "debounce";

export default function Users() {
  const usersData = useSelector((state) => state.users.users);
  const totalPages = useSelector((state) => state.users.totalPages);
  const perPageRec = useSelector((state) => state.perPageRec);
  const dispatch = useDispatch();

  const [query, setQuery] = useState("");
  const [dataFilter, setDataFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setErrors] = useState(null);

  useEffect(() => {
    dispatch(getUsers({ page: currentPage, limit: perPageRec, search: query, status: "all" }))
      .unwrap()
      .finally(() => setDataLoading(false))

    dispatch(startListeningToSocket());
  }, [dispatch, currentPage, perPageRec, query]);

  const handleSearch = debounce((value) => {
    setQuery(value)
    dispatch(getUsers({ page: 1, limit: perPageRec, search: value }));
  }, 300); 

  const handleStatus = (value) =>{
    dispatch(getUsers({ page: 1, limit: perPageRec, search: query, status: value }));
  }

  const handleFileSubmit = async (file) => {
    const formData = new FormData();
    formData.append("file", file)

    try {
      const response = dispatch(uploadCsv(formData)).unwrap()
      if (response.errors) {
        setErrors(response.errors);
        toast.error("CSV contains errors. Please correct them and try again.");
      } else {
        toast.success("CSV uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload CSV! Make sure your CSV don't contain duplicate email & phone values");
    }
  }

  const filterUsers = (data) => {
    if (!Array.isArray(data)) return [];
    if (dataFilter === "active") {
      return data.filter((item) => item.status === "active");
    } else if (dataFilter === "inactive") {
      return data.filter((item) => item.status === "inactive");
    } else {
      return data;
    }
  };

  // const filteredData = filter(search(usersData));
  // const lastIndex = currentPage * perPageRec;
  // const firstIndex = lastIndex - perPageRec;
  // const records = filteredData.slice(firstIndex, lastIndex);
  // const npage = Math.ceil(filteredData.length / perPageRec);
  // const numbers = [...Array(npage + 1).keys()].slice(1);

  // function nextPage() {
  //   if (currentPage !== npage) {
  //     setCurrentPage(currentPage + 1);
  //   }
  // }

  // function prePage() {
  //   if (currentPage !== 1) {
  //     setCurrentPage(currentPage - 1);
  //   }
  // }

  // function changeCPage(n) {
  //   setCurrentPage(n);
  // }

  const handleSetPerPageRec = (value) => {
    dispatch(setPerPageRec(value));
  };

  function nextPage() {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }

  function prePage() {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }

  function changeCPage(n) {
    setCurrentPage(n);
  }

  const handleRemUser = async (id) => {
    try {
      await dispatch(delUser(id)).unwrap();
      toast.success(`User ${id} removed`);

      const updatedRecords = filteredUsers.slice(0, perPageRec - 1);

      if (updatedRecords.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        dispatch(getUsers({ page: currentPage, limit: perPageRec, search: query }));
      }
    } catch (e) {
      toast.error('Failed to remove user');
    }
  };

  const filteredUsers = filterUsers(usersData);

  const statusActive = "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg dark:bg-[rgba(187,247,208,0.1)] dark:text-green-400 dark:border-green-400";
  const statusInactive = "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg dark:bg-[rgba(254,202,202,0.1)] dark:text-red-400 dark:border-red-400";

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <FileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFileSubmit={handleFileSubmit}
        FileMsg="Make sure csv contains following headers 'name, email, phone, gender, role, department'"
        FileType="csv"
      />
      <LoadingOverlay loading={dataLoading} />
      <div className="bg-white p-4 flex justify-between items-center rounded-xl shadow-xl dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Users</h1>
        </div>
        <div className="flex items-center gap-x-3">
          <input
            type="text"
            placeholder="Search User..."
            className="rounded-lg border-gray-300 border-2 text-gray-400 p-2 focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <select
            name="filters"
            id="filters"
            className="rounded-lg border-gray-300 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
            onChange={(e) => handleStatus(e.target.value)}
          >
            <option value="all">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            name="perPageRec"
            id="perPageRec"
            className="rounded-lg border-gray-300 border-2 text-gray-400 bg-white p-[10px] focus:outline-none focus:ring-2 focus:ring-[#0364BD] dark:bg-[#001733] dark:border-0"
            onChange={(e) => handleSetPerPageRec(e.target.value)}
            value={perPageRec}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <button className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg cursor-pointer bg-gray-100 hover:bg-gray-300 dark:dark:bg-[#001733] dark:hover:bg-[#001733] transition"
            onClick={() => setIsModalOpen(true)}>Add users via CSV</button>
          <Link
            to={"/users/adduser"}
            className="flex justify-center items-center gap-3 px-4 p-[10px] rounded-lg text-white cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
          >
            <span>
              Add User
            </span>
          </Link>
        </div>
      </div>
      {filteredUsers.length === 0 ? (
        <div className="flex justify-center font-medium dark:text-[#F4F4F4]">
          <span>No Records Found!</span>
        </div>
      ) : (
        <>
          <div>
            <table className="w-full dark:text-[#F4F4F4]">
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="odd:bg-white even:bg-gray-100 dark:odd:bg-[#002451] dark:even:bg-[#001C40]"
                  >
                    <td className="py-2 pl-2">
                      <Link
                        to={`/users/userDetails/${user._id}`}
                        title="Click to view details"
                      >
                        <div className="flex items-center gap-x-3">
                          {user.img ? <img src={user.img} alt="" className="h-12 w-12 rounded-full" /> : <PiUserCircleLight className="h-12 w-12" />}
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </Link>
                    </td>
                    <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                      {user.email}
                    </td>
                    <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                      {user.department}
                    </td>
                    <td className="font-medium text-left text-gray-500 dark:text-[#F4F4F4]">
                      {user.role}
                    </td>
                    <td className="text-left font-medium">
                      <span
                        className={
                          user.status === "active"
                            ? statusActive
                            : statusInactive
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="text-left ">
                      <button onClick={() => handleRemUser(user._id)}>
                        <RiDeleteBinLine className="w-6 h-6 text-red-500 cursor-pointer" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
            <nav className="flex gap-x-1 justify-between">
              <div>
                <button
                  className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD]"
                  disabled={currentPage === 1}
                  onClick={prePage}
                >
                  <MdOutlineArrowBackIos className="w-6 h-6" /> Previous
                </button>
              </div>
              <div className="flex gap-x-2 items-center">
                {totalPages && totalPages > 0 ? (
                  [...Array(totalPages).keys()].map((n) => (
                    <button
                      className={`rounded px-2 py-1 hover:bg-[#0364BD] hover:text-white transition dark:hover:bg-[#0364BD] ${currentPage === n + 1 ? "bg-[#0364BD] text-white dark:bg-[#0364BD]" : "bg-gray-200 dark:bg-[#001C40]"
                        }`}
                      key={n + 1}
                      onClick={() => changeCPage(n + 1)}
                    >
                      {n + 1}
                    </button>
                  ))
                ) : (
                  <span></span>
                )}
              </div>
              <div>
                <button
                  className="bg-gray-200 p-2 rounded-lg hover:bg-[#0364BD] hover:text-white flex flex-row transition dark:bg-[#001C40] dark:hover:bg-[#0364BD]"
                  disabled={currentPage === totalPages}
                  onClick={nextPage}
                >
                  Next <MdOutlineArrowForwardIos className="w-6 h-6" />
                </button>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
