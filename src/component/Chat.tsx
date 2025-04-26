// Chat.tsx
import { onAuthStateChanged } from "firebase/auth";
import { auth, database } from "../firebase.config";
import { onValue, push, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdDelete } from "react-icons/md";

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
  const [onlineUsers, setOnlineUsers] = useState<{ [key: string]: boolean }>(
    {}
  );
  const navigate = useNavigate();

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        const currentUser = u as User;
        setUser(currentUser);
        saveUser(currentUser);
        const userStatusRef = ref(database, `presence/${u.uid}`);
        set(userStatusRef, true);
        window.addEventListener("beforeunload", () =>
          set(userStatusRef, false)
        );
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

    const presenceRef = ref(database, "presence");
    onValue(presenceRef, (snapshot) => {
      setOnlineUsers(snapshot.val() || {});
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
      <div className="w-1/4 bg-white border-r border-gray-200 overflow-y-auto">
        <header className="bg-indigo-600 text-white p-4 font-bold text-lg">
          Chat Web
        </header>
        {users.map(
          (u) =>
            u.uid !== user?.uid && (
              <div
                key={u.uid}
                onClick={() => setSelectedUser(u)}
                className={`flex items-center gap-2 p-3 cursor-pointer ${
                  selectedUser?.uid === u.uid
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="relative">
                  <img
                    src={u.photoURL}
                    alt=""
                    className="w-10 h-10 rounded-full"
                  />
                  {onlineUsers[u.uid] && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-white border"></span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
              </div>
            )
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 overflow-y-auto">
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
                <p className="text-sm font-semibold mb-0">{msg.message}</p>
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
            className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-md"
          >
            Yuborish
          </button>
        </div>
      </div>
    </div>
  );
}
