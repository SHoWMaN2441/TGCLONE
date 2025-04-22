import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, database } from "../firebase.config";
import { onValue, push, ref, remove, set } from "firebase/database";
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
  date: Date;
};

export default function Chat() {
  const [user, setUser] = useState<User>();
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user && activeUser) {
      fetchPrivateMessages(activeUser.uid);
    }
  }, [user, activeUser]);

  const getRoomId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join("_");
  };

  const fetchCurrentUser = () => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u as User);
        saveUser(u as User);
      } else {
        navigate("/chatregister");
      }
    });
  };

  const saveUser = (user: User) => {
    const userRef = ref(database, `users/${user.uid}`);
    set(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  };

  const fetchUsers = () => {
    const userRef = ref(database, "users");
    onValue(userRef, (snapshot) => {
      const allUsers: User[] = [];
      snapshot.forEach((snap) => {
        allUsers.push({ uid: snap.key!, ...snap.val() });
      });
      setUsers(allUsers);
    });
  };

  const fetchPrivateMessages = (receiverId: string) => {
    const roomId = getRoomId(user!.uid, receiverId);
    const messagesRef = ref(database, `privateMessages/${roomId}`);
    onValue(messagesRef, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((snap) => {
        const data = snap.val();
        msgs.push({
          id: snap.key!,
          message: data.message,
          userId: data.senderId,
          date: new Date(data.date),
        });
      });
      setMessages(msgs);
    });
  };

  const sendPrivateMessage = () => {
    if (!message || !activeUser) return;
    const roomId = getRoomId(user!.uid, activeUser.uid);
    const reference = push(ref(database, `privateMessages/${roomId}`));
    set(reference, {
      message,
      senderId: user!.uid,
      receiverId: activeUser.uid,
      date: new Date().toISOString(),
    });
    setMessage("");
  };

  const deletePrivateMessage = (messageId: string) => {
    if (!user || !activeUser) return;
    const roomId = getRoomId(user.uid, activeUser.uid);
    const msgRef = ref(database, `privateMessages/${roomId}/${messageId}`);
    remove(msgRef);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Users sidebar */}
      <div className="w-1/4 bg-white border-r border-gray-300">
        <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-indigo-600 text-white">
          <h1 className="text-2xl font-semibold">Chat Web</h1>
        </header>
        <div className="overflow-y-auto h-screen p-3 mb-9 pb-20">
          {users
            .filter((u) => u.uid !== user?.uid)
            .map((item) => (
              <div
                key={item.uid}
                className={`flex items-center mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md ${
                  activeUser?.uid === item.uid ? "bg-gray-200" : ""
                }`}
                onClick={() => setActiveUser(item)}
              >
                <img
                  src={item.photoURL}
                  alt=""
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                  <h2 className="text-lg font-semibold">{item.displayName}</h2>
                  <p className="text-gray-600">{item.email}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 relative">
        <header className="bg-white p-4 border-b text-gray-700">
          <h1 className="text-xl font-semibold">
            {activeUser ? activeUser.displayName : "User tanlang"}
          </h1>
        </header>

        <div className="h-[590px] overflow-y-auto p-4 pb-36">
          {messages.map((msg) => {
            const messageUser = msg.userId === user?.uid ? user : activeUser;
            return (
              <div
                key={msg.id}
                className={`flex mb-4 ${
                  msg.userId === user?.uid ? "justify-end" : "justify-start"
                }`}
              >
                {msg.userId !== user?.uid && (
                  <img
                    src={messageUser?.photoURL}
                    className="w-8 h-8 rounded-full mr-2 self-end"
                  />
                )}
                <div
                  className={`max-w-96 group relative px-4 py-3 rounded-xl text-white ${
                    msg.userId === user?.uid
                      ? "bg-indigo-500 rounded-br-none"
                      : "bg-green-500 rounded-bl-none"
                  }`}
                >
                  <div className="flex justify-between">
                    <p className="text-sm opacity-80">
                      {messageUser?.displayName}
                    </p>
                    {msg.userId === user?.uid && (
                      <p
                        onClick={() => deletePrivateMessage(msg.id)}
                        className="text-lg hidden group-hover:block absolute top-1 right-2 cursor-pointer"
                      >
                        <MdDelete />
                      </p>
                    )}
                  </div>
                  <p className="font-bold">{msg.message}</p>
                  <p className="absolute -bottom-4 right-2 text-xs opacity-70">
                    {msg.date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {msg.userId === user?.uid && (
                  <img
                    src={messageUser?.photoURL}
                    className="w-8 h-8 rounded-full ml-2 self-end"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Message input */}
        <footer className="bg-white border-t p-4 absolute bottom-0 w-3/4">
          <div className="flex items-center">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              type="text"
              placeholder="Xabar yozing..."
              className="w-full p-2 border rounded-md focus:outline-none"
            />
            <button
              onClick={sendPrivateMessage}
              className="bg-indigo-500 text-white px-4 py-2 rounded-md ml-2"
            >
              Yuborish
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
