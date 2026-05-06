import io from "socket.io-client";

const socket = io(import.meta.env.VITE_BASE_URL);

socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

export default socket;
