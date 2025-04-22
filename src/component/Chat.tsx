import { onAuthStateChanged } from "firebase/auth";
import { auth, database } from "../firebase.config";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onValue, push, ref, remove, set } from "firebase/database";
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
  const navigate = useNavigate();
  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    fetchCurrentUser();
  }, []);
  useEffect(() => {
    fetchMessages();
  }, []);
  const fetchCurrentUser = () => {
    console.log("salom", user);
    try {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setUser(user as User);
          saveUser(user as User);
        } else {
          navigate("/chatregister");
        }
      });
    } catch (error) {
      console.log(error);
    }
  };
  const saveUser = (user: User) => {
    const userRef = ref(database, `users/${user.uid}`);
    set(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
  };

  const handleMessage = () => {
    if (!message) {
      alert("Message kiriting");
      return;
    }
    const messagesEndpoint = ref(database, "messages");
    const reference = push(messagesEndpoint);
    set(reference, {
      id: reference.key,
      message,
      userId: user?.uid,
      date: new Date().toISOString(),
    });
    setMessage("");
  };
  const fetchMessages = () => {
    const messagesRef = ref(database, "messages");
    onValue(messagesRef, (snapshot) => {
      const messages: Message[] = [];

      snapshot.forEach((item) => {
        const data = item.val();
        console.log(item.val());
        messages.push({
          id: data.id,
          message: data.message,
          userId: data.userId,
          date: new Date(data.date),
        });
      });
      setMessages(messages);
      console.log(messages);
    });
  };
  console.log(messages);
  const fetchUsers = () => {
    const userRef = ref(database, "users");
    onValue(userRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((item) => {
        users.push({ uid: item.key, ...item.val() });
      });
      setUsers(users);
    });
  };
  const deleteMessage = (id: any) => {
    const deleteRef = ref(database, `messages/${id}`);
    remove(deleteRef);
  };

  return (
    <div>
      <div className="flex h-screen overflow-hidden">
        <div className="w-1/4 bg-white border-r border-gray-300">
          <header className="p-4 border-b border-gray-300 flex justify-between items-center bg-indigo-600 text-white">
            <h1 className="text-2xl font-semibold">Chat Web</h1>
          </header>

          <div className="overflow-y-auto h-screen p-3 mb-9 pb-20">
            {users.map((item) => (
              <div className="flex items-center mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded-md">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-3">
                  <img
                    src={item.photoURL}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.displayName}</h2>
                  <p className="text-gray-600">{item.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1  ">
          <header className="bg-white p-4 text-gray-700">
            <h1 className="text-2xl font-semibold"></h1>
          </header>

          <div className=" h-[590px] overflow-y-auto  p-4 pb-36">
            {messages.map((item) => {
              const messageUser: any = users.find((u) => u.uid === item.userId);
              return (
                <div
                  className={`flex  ${
                    item.userId === user?.uid ? "justify-end" : "justify-start"
                  } mb-4 cursor-pointer  `}
                >
                  {" "}
                  <>
                    {item.userId !== user?.uid ? (
                      <img
                        src={messageUser.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full flex self-end mr-2  justify-end"
                      />
                    ) : (
                      ""
                    )}
                  </>
                  <div
                    className={` max-w-96 group relative  ${
                      item.userId === user?.uid
                        ? "bg-indigo-500 rounded-br-none"
                        : "bg-green-500 rounded-bl-none"
                    } text-white  px-4 py-3  rounded-xl`}
                  >
                    <div className="flex justify-between h-[20px] ">
                      <p className="mb-0 text-sm opacity-80 flex justify-self-start">
                        {messageUser.displayName}
                      </p>
                      <p
                        onClick={() => deleteMessage(item.id)}
                        className={`text-lg hidden absolute top-2 right-3 ${
                          item.userId === user?.uid ? "group-hover:block" : ""
                        }  text-white justify-end`}
                      >
                        <MdDelete />
                      </p>
                    </div>
                    <p className="font-bold mb-1">{item.message}</p>
                    <p className="  absolute -bottom-4 right-2 mt-2  opacity-75">
                      {new Date(item.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-full  flex self-end justify-center bottom-0 ml-2">
                    {item.userId === user?.uid ? (
                      <img
                        src={messageUser?.photoURL}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <footer className="bg-white border-t border-gray-300 p-4 absolute bottom-0 w-3/4">
            <div className="flex items-center">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                type="text"
                placeholder="Type a message..."
                className="w-full p-2 rounded-md border border-gray-400 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleMessage}
                className="bg-indigo-500 text-white px-4 py-2 rounded-md ml-2"
              >
                Send
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
