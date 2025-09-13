import React, { useState } from "react";
import axios from "axios";

const API = "https://mirage-server-concordia.onrender.com";

function Login({ username, setUsername, setUser, setContacts, onLogin }) {
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;

    try {
      if (isRegister) {
        await axios.post(`${API}/register`, { username, password });
        alert("✅ Registered! Now log in.");
        setIsRegister(false);
      } else {
        const res = await axios.post(`${API}/login`, { username, password });
        setUser({ username });
        setContacts(res.data.contacts || []);
        onLogin(); // switch to chat
      }
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: "url('/chat-bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="login-card"
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          padding: "30px 25px",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          width: "300px",
          textAlign: "center",
        }}
      >
        <h2>{isRegister ? "Register" : "Login"}</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            margin: "10px 0",
            padding: "12px 15px",
            width: "100%",
            borderRadius: "12px",
            border: "1px solid #999",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            margin: "10px 0",
            padding: "12px 15px",
            width: "100%",
            borderRadius: "12px",
            border: "1px solid #999",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            marginTop: "15px",
            padding: "12px",
            width: "100%",
            backgroundColor: "#128c7e",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {isRegister ? "Register" : "Login"}
        </button>
        <p
          style={{ cursor: "pointer", color: "blue", marginTop: "12px" }}
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister
            ? "Already have an account? Login"
            : "No account? Register"}
        </p>
      </div>
    </div>
  );
}

export default Login;
