import React, { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const VideoPlayer = ({ options, userId, courseId, videoId, apiUrl }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [lastWatchedTime, setLastWatchedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered", "vjs-fluid", "vjs-custom");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, options, async () => {
        console.log("Player is ready");

        // Fetch progress from backend
        const res = await fetch(`${apiUrl}/progress/${userId}/${courseId}`);
        const data = await res.json();

        if (data.success) {
          const videoProgress = data.watchStatus.find((v) => v.videoId === videoId);
          if (videoProgress) {
            setLastWatchedTime(videoProgress.watchedDuration);
            player.currentTime(videoProgress.watchedDuration);
          }
          setIsCompleted(data.progress === 100);
        }
      }));

      // Prevent skipping ahead
      player.on("seeking", () => {
        if (player.currentTime() > lastWatchedTime + 10) {
          player.currentTime(lastWatchedTime);
        }
      });

      // Track progress
      player.on("timeupdate", async () => {
        const currentTime = player.currentTime();
        if (currentTime > lastWatchedTime) {
          setLastWatchedTime(currentTime);

          // Save progress
          await fetch(`${apiUrl}/progress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              courseId,
              videoId,
              watchedDuration: currentTime,
            }),
          });
        }
      });

      // Mark as completed
      player.on("ended", async () => {
        setIsCompleted(true);
        await fetch(`${apiUrl}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            courseId,
            videoId,
            watchedDuration: 0, // Reset to 0 to prevent skipping
          }),
        });
        console.log("Video watched completely!");
      });
    }
  }, [options]);

  return (
      <div data-vjs-player >
        <div ref={videoRef}></div>
      </div>
  );
};

export default VideoPlayer;
