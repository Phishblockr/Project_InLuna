import React from "react";
import { toast } from "sonner";
import { useAuth } from "../../utils/AuthProvider";

const UserDetails = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { orgId, userId} = location.state;
  const {getToken}  = useAuth();
  const token = getToken();

  const fetchUserDetails = async ({orgId, userId}) => {
    try {
      const response = await fetch(
        `${apiUrl}/overview/user-metrics/${id}/${month}/${year}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

    } catch (error) {
      toast.error("Error fetching user details. Please try again.", error.message);
    }
  } 

  return (
    <div className="z-1 min-h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
      <div className="z-1 w-full bg-white rounded-xl shadow-xl p-3 h-max dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
        <div>
          <h1 className="text-2xl font-medium tracking-tight mb-5">
            User Details
          </h1>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
