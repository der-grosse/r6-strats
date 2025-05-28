#!/usr/bin/env node
/**
 * Socket.IO Server Tester
 *
 * This script tests if your Socket.IO server is properly configured and accessible.
 * Run this script while your Next.js server is running to check connectivity.
 */

import { io } from "socket.io-client";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000/team-1";
const SOCKET_PATH = process.env.SOCKET_PATH || "/api/socketio";

console.log(`
🔌 Socket.IO Connection Test
============================
Server URL: ${SERVER_URL}
Socket Path: ${SOCKET_PATH}
`);

// Create the Socket.IO client
const socket = io(SERVER_URL, {
  path: SOCKET_PATH,
  transports: ["polling"],
  reconnectionAttempts: 3,
  timeout: 5000,
});

// Add event listeners
socket.on("connect", () => {
  console.log(`✅ Connected successfully! Socket ID: ${socket.id}`);
  console.log(`🚀 Transport: ${socket.io.engine.transport.name}`);

  socket.io.engine.on("upgrade", (transport) => {
    console.log(`🔄 Transport upgraded to: ${transport.name}`);
  });

  console.log('\nType a message to send or "exit" to quit:');

  socket.emit("active-strat:subscribe");

  // Allow sending messages from the console
  rl.on("line", (input) => {
    if (input.toLowerCase() === "exit") {
      socket.disconnect();
      rl.close();
      process.exit(0);
    } else {
      socket.emit("active-strat:change", parseInt(input));
      console.log(`📤 Sent message: ${input}`);
    }
  });
});

socket.on("connect_error", (err) => {
  console.error(`❌ Connection error: ${err.message}`);
});

socket.on("disconnect", (reason) => {
  console.log(`🔌 Disconnected: ${reason}`);
});

socket.on("active-strat:changed", (strat) => {
  console.log(`📩 New active Strat: ${strat.name}`);
});

// Set a timeout to check if connection was not successful
setTimeout(() => {
  if (!socket.connected) {
    console.log("⚠️ Connection timed out after 5 seconds");
    console.log("Check your server configuration and try again");
  }
}, 5000);

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Closing connection...");
  socket.disconnect();
  rl.close();
  process.exit(0);
});
