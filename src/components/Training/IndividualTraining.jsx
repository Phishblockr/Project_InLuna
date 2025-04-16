import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../utils/AuthProvider";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "../../features/Users/usersSlice";
import LoadingOverlay from "../../utils/LoadingOverlay";
import Select from "react-select";
import {
  assignCourse,
  fetchCourseOptions,
} from "../../features/UserCourse/userCourseSlice";
import {
  assignEmail,
  fetchEmailOptions,
} from "../../features/UserEmail/userEmailSlice";

const IndividualTraining = () => {
  const { getToken } = useAuth();
  const token = getToken();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    userDetails: user,
    loading,
    error,
  } = useSelector((state) => state.users);
  const { courseOptions, optionsLoading, optionsError } = useSelector(
    (state) => state.userCourses
  );
  const { emailOptions, emailLoading, emailError } = useSelector(
    (state) => state.userEmails
  );
  const theme = useSelector((state) => state.theme);

  const [dataLoading, setDataLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);

  const [assignStatus, setAssignStatus] = useState(false);
  const isDarkMode = true;
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#001C40" : provided.backgroundColor,
      border: isDarkMode ? "none" : provided.border,
    }),
    input: (provided) => ({
      ...provided,
      color: isDarkMode ? "#ffffff" : provided.color,
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#001C40" : provided.backgroundColor,
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? "#001C40" : provided.backgroundColor,
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: isDarkMode ? "#ffffff" : provided.color,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: "#001C40",
      color: "#ffffff",
      ...(state.isFocused && {
        backgroundColor: "#001C40",
      }),
      ...(state.isSelected && {
        backgroundColor: "#001C40",
      }),
      cursor: "pointer",
    }),
  };

  const assignCourseHandler = async () => {
    const courseIds = selectedCourses.map(course => course.value);
    const emailIds = selectedEmails.map(email => email.value);
    const userId = user._id;

    for (const courseId of courseIds) {
        const result = await dispatch(assignCourse({ token, userId, courseId }));
        if (assignCourse.fulfilled.match(result)) {
            toast.success(`Course ${courseId} assigned successfully`);
        } else {
            toast.error(`Error assigning course ${courseId}`);
        }
    }

    for (const emailId of emailIds) {
        const result = await dispatch(assignEmail({ token, userId, emailTemplateId: emailId }));
        if (assignEmail.fulfilled.match(result)) {
            toast.success(`Email ${emailId} assigned successfully`);
        } else {
            toast.error(`Error assigning email ${emailId}`);
        }
    }

    navigate(`/users/userDetails/${userId}`);
}


  const handleMultiSelectChange = (selected) => {
    setSelectedCourses(selected);
  };

  const handleEmailSelectChange = (selected) => {
    setSelectedEmails(selected);
  };

  useEffect(() => {
    dispatch(getUser({ id, token }));
    dispatch(fetchCourseOptions({ token }));
    dispatch(fetchEmailOptions({ token }));
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
      {showLoading && <LoadingOverlay loading={dataLoading} />}

      <div className="z-1 w-full h-full bg-white rounded-xl shadow-xl p-3 dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
        <h1 className="text-2xl font-medium tracking-tight mb-5">
          Assign Training to {user.name}
        </h1>
        <div className="flex flex-col gap-5">
          <div>
            <span>Course</span>
            <Select
              isMulti
              styles={customStyles}
              options={courseOptions}
              value={selectedCourses}
              onChange={handleMultiSelectChange}
            />
          </div>
          <div>
            <span>Email</span>
            <Select
              isMulti
              styles={customStyles}
              options={emailOptions}
              value={selectedEmails}
              onChange={handleEmailSelectChange}
            />
          </div>

          <div>
            <label htmlFor="userName">Assigned User: </label>
            <input
              type="text"
              name="userName"
              id="userName"
              value={user.name}
              className="w-full p-[10px] mb-[10px] border-2 rounded-lg dark:bg-[#001C40] dark:border-0"
              disabled
            />
          </div>
          <button
            className="px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
            onClick={() => assignCourseHandler()}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default IndividualTraining;
