import { io } from "socket.io-client";

const socket = io("https://mirage-server-concordia.onrender.com");

export default socket;

