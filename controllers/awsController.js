import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import asyncHandler from "../middlewares/asyncHandler";




const demoData = [
    {
        name: "Learn JavaScript for Beginners",
        videos: [
            {
                title: "Introduction to JavaScript",
                url: "https://example.com/videos/js-intro.mp4",
                duration: 600, // 10 minutes in seconds
                description: "This video provides an introduction to JavaScript and its basics.",
                resources: [
                    { url: "https://example.com/docs/js-basics.pdf", text: "JavaScript Basics PDF" },
                    { url: "https://example.com/slides/js-intro-slides.ppt", text: "Presentation Slides" }
                ],
                assignEmail: true,
            },
            {
                title: "JavaScript Functions Explained",
                url: "https://example.com/videos/js-functions.mp4",
                duration: 1200, // 20 minutes in seconds
                description: "A detailed explanation of functions in JavaScript.",
                resources: [
                    { url: "https://example.com/docs/js-functions.pdf", text: "Functions in JavaScript" }
                ],
                assignEmail: false,
            }
        ],
        category: "Development",
        description: "A beginner-friendly course to learn JavaScript.",
        reviews: [
            {
                user: "63f50c4e0f1cfc6a9b2f4b44", // Replace with a valid ObjectId
                comment: "Great course for beginners!",
                rating: 5,
            },
            {
                user: "63f50c8e0f1cfc6a9b2f4b45", // Replace with a valid ObjectId
                comment: "Loved the videos and resources.",
                rating: 4,
            }
        ]
    },
    {
        name: "Mastering Python: Advanced Techniques",
        videos: [
            {
                title: "Python Data Structures",
                url: "https://example.com/videos/python-data-structures.mp4",
                duration: 900, // 15 minutes in seconds
                description: "Learn about lists, dictionaries, and other data structures in Python.",
                resources: [
                    { url: "https://example.com/docs/python-data-structures.pdf", text: "Python Data Structures Guide" }
                ],
                assignEmail: true,
            },
            {
                title: "Object-Oriented Programming in Python",
                url: "https://example.com/videos/python-oop.mp4",
                duration: 1500, // 25 minutes in seconds
                description: "Understand the concepts of OOP and how to apply them in Python.",
                resources: [],
                assignEmail: false,
            }
        ],
        category: "Programming",
        description: "Take your Python skills to the next level with this advanced course.",
        reviews: [
            {
                user: "63f50d1e0f1cfc6a9b2f4b46", // Replace with a valid ObjectId
                comment: "Excellent course for experienced Python developers.",
                rating: 5,
            }
        ]
    }
];


export const demoValue = asyncHandler(async (req, res) => {
    try {
        await Course.insertMany(demoData);
        res.status(201).json({ success: true, data: demoData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})