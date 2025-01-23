import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../utils/AuthProvider";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from '../../features/Users/usersSlice';
import LoadingOverlay from '../../utils/LoadingOverlay';
import Select from 'react-select'

const IndividualTraining = () => {
    const { getToken } = useAuth();
    const token = getToken();
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { userDetails: user, loading, error } = useSelector(state => state.users);
    const theme = useSelector((state) => state.theme);
    const apiUrl = import.meta.env.VITE_API_URL

    const [dataLoading, setDataLoading] = useState(false);
    const [showLoading, setShowLoading] = useState(false);

    const [courseOptions, setCourseOptions] = useState([]);
    const [selectedCourses, setSelectedCourses] = useState([]);


    const fetchCourseOptions = async () => {
        try {
            const res = await fetch(`${apiUrl}/course/options`, {
                method: "GET",
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();
            if (res.ok) {
                setCourseOptions(data.options); // Options are already formatted for react-select
            } else {
                console.error("Error fetching course options:", data.message);
            }
        } catch (error) {
            console.error("Error fetching course options:", error.message);
        }
    };

    const assignCourse = async (userId, courseId) => {
        console.log(userId, courseId)
        try {
            const res = await fetch (`${apiUrl}/userCourse/assign`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, courseId }),
            });
            const data = await res.json();

            if (res.ok){
                toast.success("Course assigned successfully")
            } else {
                console.log(data)
                toast.error("Error assigning course: ",data.error)
            }
        } catch (error){
            toast.error("Failed to assign course. Please try again, Error: ", error)
        }
    }

    const assignCourseHandler = () => {
        const courseIds = selectedCourses.map(course => course.value);
        courseIds.forEach(courseId => {
            assignCourse(user._id, courseId)
        })
    }

    const handleMultiSelectChange = (selected) => {
        setSelectedCourses(selected);
    }
    console.log(selectedCourses)

    useEffect(() => {
        dispatch(getUser({ id, token }));
        fetchCourseOptions();
    }, [])

    if (!user) {
        return null
    }

    return (
        <div className="z-1 h-[calc(100vh-65px)] flex flex-col justify-between relative right-0 bottom-0 p-4 gap-4">
            {showLoading && <LoadingOverlay loading={dataLoading} />}

            <div className="z-1 w-full h-full bg-white rounded-xl shadow-xl p-3 dark:bg-[#002451] dark:text-[#F4F4F4] dark:shadow-none">
                <h1 className="text-2xl font-medium tracking-tight mb-5">
                    Assign Course to {user.name}
                </h1>
                <div className='flex flex-col gap-5'>
                    <div>
                        <span>Course</span>
                        <Select
                            isMulti
                            options={courseOptions}
                            value={selectedCourses}
                            onChange={handleMultiSelectChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="userName">Assigned User: </label>
                        <input
                            type="text"
                            name="userName"
                            id="userName"
                            value={user.name}
                            className="w-full p-[10px] mb-[10px] border-2 rounded-lg"
                            disabled />
                    </div>
                    <button className="px-4 p-[10px] rounded-lg text-[#f4f4f4] cursor-pointer bg-[#0364BD] hover:bg-[#003A70] transition-colors"
                    onClick={() => assignCourseHandler()}
                    >Assign</button>
                </div>
            </div>
        </div>
    )
}

export default IndividualTraining