import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

import { useNavigate } from "react-router-dom";

import { FcGoogle } from "react-icons/fc";

export default function ChatRegister() {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();
  const handleGoogle = () => {
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        console.log(credential);
        navigate("/chat");
      })
      .catch((error) => {
        console.log(error);
      });
  };
  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div
        onClick={handleGoogle}
        className="bg-green-400 text-white cursor-pointer w-[300px] rounded-md flex items-center justify-evenly p-2 "
      >
        <FcGoogle className="size-8" />
        Google orqali ro'yxatdan o'ting
      </div>
    </div>
  );
}
