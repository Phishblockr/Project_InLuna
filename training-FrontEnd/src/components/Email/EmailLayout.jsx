import React, { useEffect, useState } from "react";
import { useLocation, Link, useParams } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import DropDownDetails from "./DropDownDetails";

const EmailLayout = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { getToken } = useAuth();
  const token = getToken();
  const location = useLocation();
  const userId = location.state?.userId;
  const { emailId } = useParams();
  const { details } = useSelector((state) => state.userProfile);
  const userEmail = details?.email;
  const userName = details?.name;

  const [emailDetails, setEmailDetails] = useState(null);
  const canEdit = false;

  const fetchEmail = async () => {
    try {
      if(!emailId) return;
      const res = await fetch(
        `${apiUrl}/userEmail/details/${emailId}/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      setEmailDetails(data.userEmail?.emailTemplateId);
    } catch (error) {
      console.error("Error fetching email:", error);
      toast.error("Error fetching email:", error);
    }
  };

  useEffect(() => {
    fetchEmail();
  }, [emailId]);

  useEffect(() => {}, [emailDetails]);

  if (!emailId || !userId) {
    return <div>Error: Missing email or user ID.</div>;
  }
  

  if (!emailDetails) {
    return (
      <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-4 overflow-hidden">
        Loading Email...
      </div>
    );
  }

  const dropDownDetails = {
    from: emailDetails.mailedBy,
    to: userEmail,
    subject: emailDetails.subject,
    mailedBy: emailDetails.mailedBy,
    signedBy: emailDetails.signedBy,
    security: emailDetails.securityProtocol,
  };

  return (
    <div className="z-1 max-w-screen-xl w-[calc(100svw-17.1rem)] min-h-[calc(100svh-65px)] flex flex-col relative left-[16rem] right-0 bottom-0 p-4 gap-3">
      <div className="bg-white w-full px-4 py-2 rounded-lg">
        <p className="text-xl tracking-wide">
          Kindly check if this email is phishing
        </p>
        <p className="text-[#7E7E7E] text-sm">From: {emailDetails.mailedBy}</p>
        <div className="flex text-sm items-center">
          <p className="text-[#7E7E7E] text-sm mr-1">To: {userEmail}</p>
          <DropDownDetails emailDetails={dropDownDetails} />
        </div>
      </div>
      <div>
        {/* Conditionally inject style rules for editors */}
        {canEdit && (
          <style>
            {`
            #previewContainer span[data-phishing="true"] {
            color: red !important;
            }
            #previewContainer span[data-placeholder="name"],
            #previewContainer span[data-placeholder="email"] {
            color: blue !important;
            }
            `}
          </style>
        )}
        <div
          id="previewContainer"
          data-placeholder={userName}
          dangerouslySetInnerHTML={{ __html: emailDetails.htmlContent }}
          className="p-4 bg-white rounded-lg"
        />
      </div>
    </div>
  );
};

export default EmailLayout;
