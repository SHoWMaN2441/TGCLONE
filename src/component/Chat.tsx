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
  const [editedMessage, setEditedMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

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

      const updateReadStatus = async () => {
        const snapshot = await ref(database, `messages/${chatId}`).once(
          "value"
        );
        snapshot.forEach((child) => {
          if (!child.val().isRead && child.val().userId !== user.uid) {
            update(ref(database, `messages/${chatId}/${child.key}`), {
              isRead: true,
            });
          }
        });
      };
      updateReadStatus();
    }
  }, [user, selectedUser]);

  useEffect(() => {
    if (selectedUser) {
      const removeLastMessage = async () => {
        await remove(
          ref(database, `lastMessages/${user?.uid}/${selectedUser.uid}`)
        );
        await remove(
          ref(database, `lastMessages/${selectedUser.uid}/${user?.uid}`)
        );
      };
      removeLastMessage();
    }
  }, [selectedUser, user]);

  const saveUser = (user: User) => {
    set(ref(database, `users/${user.uid}`), {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  };

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
    set(
      ref(database, `lastMessages/${user.uid}/${selectedUser.uid}`),
      newMessage
    );
    set(
      ref(database, `lastMessages/${selectedUser.uid}/${user.uid}`),
      newMessage
    );

    setMessage("");
  };

  const handleEditMessage = async () => {
    if (editedMessage.trim() && editingMessageId && user && selectedUser) {
      const chatId = createChatId(user.uid, selectedUser.uid);
      await update(ref(database, `messages/${chatId}/${editingMessageId}`), {
        message: editedMessage,
      });
      setEditingMessageId(null);
      setEditedMessage("");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (user && selectedUser) {
      const chatId = createChatId(user.uid, selectedUser.uid);
      await remove(ref(database, `messages/${chatId}/${messageId}`));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleEditMessage();
  };

  const createChatId = (a: string, b: string) =>
    a < b ? `${a}_${b}` : `${b}_${a}`;

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-white border-r overflow-y-auto">
        <header className="bg-indigo-600 h-20 flex items-center justify-center text-white px-4">
          <div className="flex items-center gap-3">
            <img
              src={user?.photoURL}
              alt={user?.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <span className="text-lg font-medium">{user?.displayName}</span>
          </div>
        </header>
        {users.map((u) =>
          u.uid !== user?.uid ? (
            <div
              key={u.uid}
              onClick={() => {
                setSelectedUser(u);
                setNewMessages((prev) => {
                  const copy = { ...prev };
                  delete copy[u.uid];
                  return copy;
                });
              }}
              className={`flex items-center gap-3 p-3 cursor-pointer ${
                selectedUser?.uid === u.uid
                  ? "bg-gray-200"
                  : "hover:bg-gray-100"
              }`}
            >
              <img
                src={u.photoURL}
                alt={u.displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <span className="font-medium">{u.displayName}</span>
                <span className="text-xs text-gray-500">{u.email}</span>
              </div>
              {newMessages[u.uid] && (
                <span className="ml-auto w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
          ) : null
        )}
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        {/* Top bar showing selected user */}
        {selectedUser && (
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-center">
            <img
              src={selectedUser.photoURL}
              alt={selectedUser.displayName}
              className="w-10 h-10 rounded-full object-cover mr-3"
            />
            <span className="font-semibold text-lg">
              {selectedUser.displayName}
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 flex ${
                msg.userId === user?.uid ? "justify-end" : "justify-start"
              }`}
            >
              <div className="relative flex items-center gap-2">
                {msg.userId !== user?.uid && (
                  <img
                    src={selectedUser?.photoURL}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div
                  className={`max-w-md p-3 rounded-xl text-white ${
                    msg.userId === user?.uid
                      ? "bg-indigo-500 rounded-br-none"
                      : "bg-green-500 rounded-bl-none"
                  }`}
                >
                  {editingMessageId === msg.id ? (
                    <>
                      <input
                        type="text"
                        value={editedMessage}
                        onChange={(e) => setEditedMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="w-full bg-white text-black rounded-md p-2"
                      />
                      <button
                        onClick={handleEditMessage}
                        className="mt-2 bg-indigo-500 text-white px-2 py-1 rounded"
                      >
                        Saqlash
                      </button>
                    </>
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
                    <div className="absolute top-1 right-1 flex gap-1">
                      <MdEdit
                        size={16}
                        className="cursor-pointer text-yellow-300"
                        onClick={() => {
                          setEditingMessageId(msg.id);
                          setEditedMessage(msg.message);
                        }}
                      />
                      <MdDelete
                        size={16}
                        className="cursor-pointer text-red-400"
                        onClick={() => handleDeleteMessage(msg.id)}
                      />
                    </div>
                  )}
                </div>
                {msg.userId === user?.uid && (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        {selectedUser && (
          <div className="border-t p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Xabar yozing..."
                className="flex-1 border rounded-md px-3 py-2"
              />
              <button
                onClick={handleSend}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md"
              >
                Yuborish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
