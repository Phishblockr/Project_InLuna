export const generateZoomMeetUrl = () => {
    // Generate a random 11-digit meeting ID
    const meetingId = Math.floor(10000000000 + Math.random() * 90000000000);
    return `https://zoom.us/j/${meetingId}`;
};