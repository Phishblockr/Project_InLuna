import React from "react";
import { RiLoopLeftLine, RiDeleteBinLine } from "react-icons/ri";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { remUser, updateStatus } from "../features/Users/usersSlice";
import { toast } from "sonner";

const statusActive =
  "py-1 px-3 bg-green-200 text-green-900 border-2 border-green-900 rounded-lg";
const statusInactive =
  "py-1 px-3 bg-red-200 text-red-600 border-2 border-red-600 rounded-lg";

const UserDetails = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.users.users.find((user) => user.id === parseInt(id)));
  const dispatch = useDispatch();
  
  const handleRemUser = (id, name) => {
    try {
      dispatch(remUser(id));
      navigate("/users")
      toast.success(`User ${name} removed`);
    } catch (e) {
      toast.error(e);
    }
  };

  const handleUpdateStatus = (id, name) => {
    try{
      dispatch(updateStatus(id));
      toast.success(`User ${name} status updated`);
    } catch (e){
      toast.error(e);
    }
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max">
        <div>
          <h1 className="text-2xl font-medium tracking-tight mb-5">
            User Details
          </h1>
        </div>
        <div className="flex flex-row gap-x-5 items-center">
          <img
            className="w-[10rem] h-[10rem] rounded-full object-cover"
            src={user.img}
            alt="user Profile"
          />
          <ul className="flex flex-col">
            <li className="font-medium text-3xl my-2">{user.name}</li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 mr-2">E-mail:</span>
              <span>{user.email}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 mr-2">Department:</span>
              <span>{user.department}</span>
            </li>
            <li className="font-medium mb-2">
              <span className="text-gray-500 mr-2">Role:</span>
              <span>{user.role}</span>
            </li>
            <li className="font-medium mb-1">
              <span className="text-gray-500 mr-2">Status:</span>
              <span
                className={
                  user.status === "Active" ? statusActive : statusInactive
                }
              >
                {user.status}
              </span>
            </li>
          </ul>
        </div>
        <div className="text-right mt-5">
          <button onClick={() => handleUpdateStatus(parseInt(id), user.name)} className="bg-[#0364BD] hover:bg-[#003A70] p-2 text-white font-medium rounded-lg mr-2">
            <span className="flex flex-row items-center gap-x-1">
              <RiLoopLeftLine className="w-6 h-6" /> Update Status
            </span>
          </button>
          <button onClick={() => handleRemUser(parseInt(id), user.name)} className="bg-red-500 hover:bg-red-700 p-2 text-white font-medium rounded-lg">
            <span className="flex flex-row items-center gap-x-1">
              <RiDeleteBinLine className="w-6 h-6" /> Remove User
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
