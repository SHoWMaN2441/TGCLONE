// Chat.tsx
import { onAuthStateChanged } from "firebase/auth";
import { auth, database } from "../firebase.config";
import { onValue, push, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};

type Message = {
  id: string;
  userId: string;
  message: string;
  date: string;
  isRead: boolean;
};

export default function Chat() {
  const [user, setUser] = useState<User>();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        const currentUser = u as User;
        setUser(currentUser);
        saveUser(currentUser);
      } else {
        navigate("/chatregister");
      }
    });
  }, []);

  useEffect(() => {
    const userRef = ref(database, "users");
    onValue(userRef, (snapshot) => {
      const fetched: User[] = [];
      snapshot.forEach((item) => {
        fetched.push({ uid: item.key!, ...item.val() });
      });
      setUsers(fetched);
    });
  }, []);

  useEffect(() => {
    if (user && selectedUser) {
      const chatId = createChatId(user.uid, selectedUser.uid);
      const msgRef = ref(database, `messages/${chatId}`);
      onValue(msgRef, (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((snap) => {
          const data = snap.val();
          msgs.push({ ...data });
        });
        setMessages(msgs);
      });
    }
  }, [user, selectedUser]);

  const saveUser = (user: User) => {
    const userRef = ref(database, `users/${user.uid}`);
    set(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  };

  const handleSend = () => {
    if (!message.trim() || !user || !selectedUser) return;
    const chatId = createChatId(user.uid, selectedUser.uid);
    const newRef = push(ref(database, `messages/${chatId}`));
    const newMessage = {
      id: newRef.key!,
      userId: user.uid,
      message,
      date: new Date().toISOString(),
      isRead: false,
    };
    set(newRef, newMessage);

    const lastMsg1 = ref(
      database,
      `lastMessages/${user.uid}/${selectedUser.uid}`
    );
    const lastMsg2 = ref(
      database,
      `lastMessages/${selectedUser.uid}/${user.uid}`
    );
    set(lastMsg1, newMessage);
    set(lastMsg2, newMessage);

    setMessage("");
  };

  const createChatId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto scrollbar-hide">
        {/* Profile Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 flex items-center gap-4 shadow-md">
          <img
            src={user?.photoURL || "https://via.placeholder.com/150"}
            alt="User"
            className="w-12 h-12 rounded-full border-2 border-white shadow-sm"
          />
          <div className="flex flex-col">
            <span className="text-white font-semibold text-lg">
              {user?.displayName || "Foydalanuvchi"}
            </span>
            <span className="text-gray-300 text-sm">
              {user?.email || "email@example.com"}
            </span>
          </div>
        </header>

        {/* Other Users */}
        <div className="mt-4">
          {users.map(
            (u) =>
              u.uid !== user?.uid && (
                <div
                  key={u.uid}
                  onClick={() => setSelectedUser(u)}
                  className={`flex items-center gap-2 p-3 cursor-pointer mx-2 rounded-lg ${
                    selectedUser?.uid === u.uid
                      ? "bg-indigo-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <img
                    src={u.photoURL}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex flex-col">
                    <p className="font-medium">{u.displayName}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
              )
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto scrollbar-hide">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${
                msg.userId === user?.uid ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-md p-3 rounded-xl text-white relative ${
                  msg.userId === user?.uid
                    ? "bg-indigo-500 rounded-br-none"
                    : "bg-green-500 rounded-bl-none"
                }`}
              >
                <p className="text-sm font-semibold">{msg.message}</p>
                <span className="absolute text-xs right-2 bottom-[-16px] text-gray-900">
                  {new Date(msg.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Send Message */}
        <div className="p-4 border-t flex items-center">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2"
            type="text"
            placeholder="Xabar yozing..."
          />
          <button
            onClick={handleSend}
            className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Yuborish
          </button>
        </div>
      </div>
    </div>
  );
}
