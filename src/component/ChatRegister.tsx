import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "../firebase.config";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export default function ChatRegister() {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/chat");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((res) => {
        navigate("/chat");
      })
      .catch((err) => {
        console.error("Login error: ", err.message);
        alert("Kirishda xatolik yuz berdi.");
      });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6">Chatga Xush kelibsiz </h1>
        <p className="mb-4 text-gray-600">Google orqali hisobga kiring</p>
        <button
          onClick={handleLogin}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md"
        >
          Google bilan kirish
        </button>
      </div>
    </div>
  );
}
