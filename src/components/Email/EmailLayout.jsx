import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { toast } from "sonner";

const EmailLayout = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();
  const token = getToken();
  const location = useLocation();
  const { emailId, userId } = location.state;

  const fetchEmail = async (req, res)=>{
    try {
        const res = await fetch(``)
    } catch (error) {
        toast.error("Error fetching email:", error)
    }
  }

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      EmailLayout
    </div>
  );
};

export default EmailLayout;
