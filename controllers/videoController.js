  import Video from "../models/videoModel.js";
  import multer from "multer";

  // Set up storage for video uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/videos/");  // Folder to store videos
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  const upload = multer({ storage });

  export const uploadVideo = async (req, res) => {
    upload.single('video')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
  
      const orgId = req.user.orgId;
  
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No video file uploaded" });
      }
  
      try {
        const newVideo = new Video({
          name: req.file.originalname,
          videoUrl: req.file.path,  // Save video URL or path
          orgId,
        });
  
        const savedVideo = await newVideo.save();
  
        res.status(201).json({ success: true, message: "Video uploaded successfully", data: savedVideo });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });
  };
  

  // Get all videos for the organization
  export const getAllVideos = async (req, res) => {
    const orgId = req.user.orgId;

    try {
      const videos = await Video.find({ orgId });
      res.status(200).json({ success: true, videos });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
