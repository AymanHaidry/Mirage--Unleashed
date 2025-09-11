import loginBg from "../assets/login-bg.jpeg";
import React, { useState } from "react";
import axios from "axios";

function Login({ setUser, setContacts }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return;

    try {
      if (isRegister) {
        await axios.post(
          "https://mirage-server-concordia.onrender.com/register",
          { username, password }
        );
        alert("✅ Registered! Now log in.");
        setIsRegister(false);
      } else {
        const res = await axios.post(
          "https://mirage-server-concordia.onrender.com/login",
          { username, password }
        );
        setUser({ username });
        setContacts(res.data.contacts || []);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "2rem",
          borderRadius: "10px",
          color: "white",
        }}
      >
        <h2>{isRegister ? "Register" : "Login"}</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleSubmit}>
          {isRegister ? "Register" : "Login"}
        </button>
        <p
          style={{ cursor: "pointer", color: "lightblue" }}
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







