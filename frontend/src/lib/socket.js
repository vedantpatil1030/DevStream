// src/lib/socket.js

import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,   // connect manually when user is logged in
  withCredentials: true,
});

export default socket;