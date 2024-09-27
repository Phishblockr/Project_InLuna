import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiUploadCloud2Line, RiLoopLeftLine } from "react-icons/ri";
import { PiUserCircleLight } from "react-icons/pi";
import { toast } from "sonner";
import { fetchUserStart, fetchUserSuccess, fetchUserFailure } from "../features/userProfile/userProfileSlice";
import UpdatePasswordModal from "../utils/UpdatePasswordModal";

const AdminSettings = () => {
  const [image, setImage] = useState(null);
  const hiddenFileInput = useRef(null);
  const dispatch = useDispatch()
  const { details, loading, error } = useSelector((state) => state.userProfile);
  
  const [user, setUser] = useState({
    img: "",
    name: "",
    email: "",
    recoveryEmail: "",
    phone: "",
    role: "",
    department: ""
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    if (details) {
      setUser({
        img: details.img || "",
        name: details.name || "",
        email: details.email || "",
        recoveryEmail: details.recoveryEmail || "",
        phone: details.phone || "",
        role: details.role || "",
        department: details.department || ""
      });
    }
  }, [details]);


  const handleImageChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setUser(prevState => ({
        ...prevState,
        img: reader.result // This will store the base64 string
      }));
      setImage(file); // Optionally, still keep the file for preview purposes
    };
    reader.readAsDataURL(file); // Convert to base64 string
  };

  const handleClick = (event) => {
    hiddenFileInput.current.click();
  };

  const handleUpdate = async () => {
    dispatch(fetchUserStart());
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = JSON.parse(localStorage.getItem("user")).token;

      const response = await fetch (`${apiUrl}/user/updateAdminDetails`, {
        method:"PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
        
      });
      const updatedUser = await response.json();

      if (!response.ok){
        throw new Error(updatedUser.message || "Failed to update user details");
      }
      dispatch(fetchUserSuccess(updatedUser))
      toast.success("Details updated successfully")
    } catch (error) {
      dispatch(fetchUserFailure(error.message));
      toast.error("Failed to update user details")
    }
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className='z-1 w-full font-medium bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none'>
        <div>
          <h1 className="pt-3 pl-5 text-2xl font-medium">Admin Account Settings</h1>
        </div>
        <div className="flex flex-col items-center justify-between">
          <div>
            <label htmlFor="image-upload-input">
              {image ? "Click on upload" : "Choose an image"}
            </label>
            <div onClick={handleClick} style={{ cursor: "pointer" }}>
              {image ? (
                <img
                  src={URL.createObjectURL(image)}
                  alt="upload image"
                  className="mt-2 w-[150px] h-[150px] rounded-full"
                />
              ) : user?.img ? (
                <img
                  src={user.img}
                  alt="upload image"
                  className="mt-2 w-[150px] h-[150px] rounded-full"
                />
              ) : (
                <PiUserCircleLight className="mt-2 w-[150px] h-[150px] rounded-full" />
              )}

              <input
                id="image-upload-input"
                type="file"
                onChange={handleImageChange}
                ref={hiddenFileInput}
                style={{ display: "none" }}
              />
            </div>
          </div>
          {/* <button className="mt-2 bg-[#0364BD] hover:bg-[#003A70] transition p-2 rounded-lg text-white">
            <span className="flex flex-row gap-x-1">
              <RiUploadCloud2Line className="w-6 h-6" /> Upload Image
            </span>
          </button> */}
        </div>
        <div className="mt-3 flex flex-col w-full items-center">
          <div className="flex flex-col">
            <label htmlFor="name">Name: </label>
            <input
              type="text"
              id="name"
              name="name"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
              value={user.name}
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="email">Email: </label>
            <input
              type="text"
              id="email"
              name="email"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
              value={user.email}
            />
          </div>

          <div className="mt-3 flex flex-col">
            <label htmlFor="role">Recovery Email: </label>
            <input
              type="text"
              id="recoveryEmail"
              name="recoveryEmail"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
              value={user.recoveryEmail}
            />
          </div>
          <div className="mt-3 flex flex-col">
            <label htmlFor="role">Phone: </label>
            <input
              type="text"
              id="phone"
              name="phone"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
              value={user.phone}
            />
          </div>
          <div className="mt-3 flex flex-col">
            <label htmlFor="role">Role: </label>
            <input
              type="text"
              id="role"
              name="role"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
              value={user.role}
            />
          </div>
          <div className="mt-3 flex flex-col">
            <label htmlFor="role">Department: </label>
            <input
              type="text"
              id="department"
              name="department"
              className=" w-[40rem] p-2 rounded-lg border border-gray-300 dark:bg-[#001C40] dark:border-0"
              onChange={e => setUser({ ...user, [e.target.name]: e.target.value })}
              value={user.department}
            />
          </div>
          <div className="flex flex-row gap-x-2">
            <button className=" mt-9 mb-2 rounded-lg text-white font-medium w-[19rem] bg-[#0364BD] hover:bg-[#003A70] transition p-2 "
            onClick={handleUpdate}
            >
              <span className="flex flex-row gap-x-2 items-center justify-center">
                <RiLoopLeftLine className="w-6 h-6" /> Update Details
              </span>
            </button>
            <button className=" mt-9 mb-2 rounded-lg text-black font-medium w-[19rem] bg-gray-300 hover:bg-gray-400 transition p-2 dark:bg-[#001C40] dark:text-white"
            onClick={openModal}
            >
              <span className="flex flex-row gap-x-2 items-center justify-center">
                <RiLoopLeftLine className="w-6 h-6" /> Update password
              </span>
            </button>
          </div>
          <UpdatePasswordModal isOpen={isModalOpen} onClose={closeModal} />
        </div>
      </div>
    </div>
  );
};

export default AdminSettings