import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, push, ref, set, update, remove } from "firebase/database";
import { auth, database } from "../firebase.config";
import { useNavigate } from "react-router-dom";
import { MdDelete, MdEdit } from "react-icons/md";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [newMessages, setNewMessages] = useState<{ [key: string]: boolean }>(
    {}
  );
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [editedMessage, setEditedMessage] = useState(""); // Tahrir qilinayotgan xabar
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null); // Tahrir qilinayotgan xabarning IDsi

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
    const usersRef = ref(database, "users");
    onValue(usersRef, (snapshot) => {
      const fetched: User[] = [];
      snapshot.forEach((child) => {
        fetched.push({ uid: child.key!, ...child.val() });
      });
      setUsers(fetched);
    });

    const presenceRef = ref(database, "presence");
    onValue(presenceRef, (snapshot) => {
      setOnlineUsers(snapshot.val() || {});
    });
  }, []);

  // Yangi xabarlarni olish va notificationlarni yangilash
  useEffect(() => {
    if (user) {
      const lastMessagesRef = ref(database, `lastMessages/${user.uid}`);
      onValue(lastMessagesRef, (snapshot) => {
        const notifications: { [key: string]: boolean } = {};
        snapshot.forEach((child) => {
          const data = child.val();
          if (data.userId !== user.uid && !data.isRead) {
            notifications[child.key!] = true;
          }
        });
        setNewMessages(notifications);
      });
    }
  }, [user]);

  // Foydalanuvchi va tanlangan foydalanuvchi chatini olish
  useEffect(() => {
    if (user && selectedUser) {
      const chatId = createChatId(user.uid, selectedUser.uid);
      const messagesRef = ref(database, `messages/${chatId}`);
      onValue(messagesRef, (snapshot) => {
        const fetched: Message[] = [];
        snapshot.forEach((child) => {
          fetched.push(child.val());
        });
        setMessages(fetched);
      });

      // Tanlangan foydalanuvchi chatiga o'tganida eski xabarlarni o'qilgan deb belgilash
      const updateReadStatus = async () => {
        const chatRef = ref(database, `messages/${chatId}`);
        const snapshot = await snapshot.ref.once("value");
        snapshot.forEach((child) => {
          if (!child.val().isRead && child.val().userId !== user?.uid) {
            const messageRef = ref(database, `messages/${chatId}/${child.key}`);
            update(messageRef, { isRead: true });
          }
        });
      };
      updateReadStatus();
    }
  }, [user, selectedUser]);

  // Tanlangan foydalanuvchiga o'tish va notificationni o'chirish
  useEffect(() => {
    if (selectedUser) {
      // Tanlangan foydalanuvchi bo'lsa, oldingi xabarni lastMessages'dan o'chirish
      const removeLastMessage = async () => {
        const lastMsgRefForMe = ref(
          database,
          `lastMessages/${user?.uid}/${selectedUser.uid}`
        );
        const lastMsgRefForOther = ref(
          database,
          `lastMessages/${selectedUser.uid}/${user?.uid}`
        );

        // Xabarni o'chirish
        await remove(lastMsgRefForMe);
        await remove(lastMsgRefForOther);
      };

      removeLastMessage();
    }
  }, [selectedUser, user]);

  const saveUser = (user: User) => {
    const userRef = ref(database, `users/${user.uid}`);
    set(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  };

  // Xabar yuborish
  const handleSend = () => {
    if (!message.trim() || !user || !selectedUser) return;

    const chatId = createChatId(user.uid, selectedUser.uid);
    const newMessageRef = push(ref(database, `messages/${chatId}`));
    const newMessage: Message = {
      id: newMessageRef.key!,
      userId: user.uid,
      message,
      date: new Date().toISOString(),
      isRead: false,
    };

    set(newMessageRef, newMessage);

    // Last messageni yangilash
    const lastMsgForMe = ref(
      database,
      `lastMessages/${user.uid}/${selectedUser.uid}`
    );
    const lastMsgForOther = ref(
      database,
      `lastMessages/${selectedUser.uid}/${user.uid}`
    );
    set(lastMsgForMe, newMessage);
    set(lastMsgForOther, newMessage);

    setMessage("");
  };

  // Xabarni tahrirlash
  const handleEditMessage = async () => {
    if (editedMessage.trim() && editingMessageId && user && selectedUser) {
      const chatId = createChatId(user.uid, selectedUser.uid);
      const messageRef = ref(
        database,
        `messages/${chatId}/${editingMessageId}`
      );
      await update(messageRef, { message: editedMessage });

      setEditingMessageId(null);
      setEditedMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (user && selectedUser) {
      const chatId = createChatId(user.uid, selectedUser.uid);
      const messageRef = ref(database, `messages/${chatId}/${messageId}`);
      await remove(messageRef);
    }
  };

  const createChatId = (uid1: string, uid2: string) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r overflow-y-auto">
        <header className="bg-indigo-600 text-white p-4 font-bold text-lg">
          Chat App
        </header>
        {users.map(
          (u) =>
            u.uid !== user?.uid && (
              <div
                key={u.uid}
                onClick={() => {
                  setSelectedUser(u);
                  // Notification nuqtachasini o'chirish
                  setNewMessages((prev) => {
                    const updated = { ...prev };
                    delete updated[u.uid]; // Bu foydalanuvchi uchun notificationni o'chirish
                    return updated;
                  });
                }}
                className={`flex items-center gap-2 p-3 cursor-pointer relative ${
                  selectedUser?.uid === u.uid
                    ? "bg-gray-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />

                  {/* Online status */}
                  {onlineUsers[u.uid] && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>

                <div className="flex flex-col">
                  <p className="font-medium">{u.displayName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  {newMessages[u.uid] && (
                    <span className="absolute top-10 right-4 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
              </div>
            )
        )}
      </div>

      {/* Chat Window */}
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
                {editingMessageId === msg.id ? (
                  <div>
                    <input
                      type="text"
                      value={editedMessage}
                      onChange={(e) => setEditedMessage(e.target.value)}
                      onKeyDown={handleKeyPress} // "Enter" bosilganda tahrirni saqlash
                      className="w-full bg-white text-black rounded-md p-2"
                    />
                    <button
                      onClick={handleEditMessage} // Tahrirni saqlash uchun tugma
                      className="mt-2 bg-indigo-500 text-white p-2 rounded-md"
                    >
                      Saqlash
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold">{msg.message}</p>
                )}

                <span className="absolute text-xs right-2 bottom-[-16px] text-gray-900">
                  {new Date(msg.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {msg.userId === user?.uid && (
                  <div>
                    <button
                      onClick={() => {
                        setEditingMessageId(msg.id);
                        setEditedMessage(msg.message);
                      }}
                      className="absolute bottom-1 right-2 text-yellow-500"
                    >
                      <MdEdit size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)} // O'chirish
                      className="absolute  bottom-1 right-8 text-red-500"
                    >
                      <MdDelete size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Send Message */}
        {selectedUser && (
          <div className="p-4 border-t flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2"
              placeholder="Xabar yozing..."
            />
            <button
              onClick={handleSend}
              className="ml-2 bg-indigo-600 text-white px-4 py-2 rounded-md"
            >
              Yuborish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
