import { Route, Routes } from "react-router-dom";
import Home from "./Home";
import Chat from "./component/Chat";
import ChatRegister from "./component/ChatRegister";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chatregister" element={<ChatRegister />} />
      </Routes>
    </div>
  );
}
