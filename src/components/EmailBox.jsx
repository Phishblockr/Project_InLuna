import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "../utils/AuthProvider";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const EmailBox = () => {
  const { getToken } = useAuth();
  const token = getToken();
  const apiUrl = import.meta.env.VITE_API_URL;
  const { details } = useSelector((state) => state.userProfile);
  const id = details?._id;
  const [assignEmails, setAssignEmails] = useState([]);

  const FetchAssignedEmails = async (token, id) => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${apiUrl}/userCourse/getAssignedEmails/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      console.log("ResData: ", data);

      setAssignEmails(data.emailTemplates);
    } catch (error) {
      toast.error("Error Fetch Course: ", error.message);
    }
  };

  useEffect(() => {
    FetchAssignedEmails(token, id);
  }, [token, id]);

  useEffect(() => {
    console.log("Updated AssignEmails:", assignEmails);
  }, [assignEmails]);

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4">
      {assignEmails.length > 0 ? (
        <ul className="">
          {assignEmails.map((email) => (
            <Link
              key={email._id}
              to={`/email/inbox/${email._id}`}
              state={{
                emailId: email._id,
                userId: id,
              }}
            >
              <li className="bg-white w-full h-20 flex justify-between items-center mb-1.5 rounded-lg px-2 py-1 hover:shadow-md">
                <div className="flex items-center w-[80%]">
                  <div className="p-4">
                    <div className="bg-gray-500 w-4 h-4 rounded-2xl"></div>
                  </div>
                  <div className="flex-col gap-y-2">
                    <h2>{email.mailedBy}</h2>
                    <p>kindly check if this email is phishing...</p>
                  </div>
                </div>
                <div className="p-2">
                  <input type="checkbox" className="w-4 h-4" />
                </div>
              </li>
            </Link>
          ))}
        </ul>
      ) : (
        <p></p>
      )}
    </div>
  );
};

export default EmailBox;
