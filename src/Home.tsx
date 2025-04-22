import { ref, set, onValue, push, remove } from "firebase/database";
import { useEffect, useState } from "react";
import { database } from "./firebase.config";

type User = {
  id: string;
  name: string;
  age: number;
  email: string;
};
export default function Home() {
  useEffect(() => {
    fetchUsers();
  }, []);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [soqchi, setSoqchi] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const handleSave = () => {
    const userEndPoint = ref(database, "users");
    if (soqchi === "") {
      const reference = push(userEndPoint);
      set(reference, {
        name,
        email,
        age,
      });
    } else {
      const userEndPoint = ref(database, `users/${soqchi}`);
      set(userEndPoint, {
        name,
        email,
        age,
      });
      setSoqchi("");
    }
  };

  const fetchUsers = () => {
    const UserRef = ref(database, "users");
    onValue(UserRef, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((item) => {
        users.push({ id: item.key, ...item.val() });
      });
      setUsers(users);
    });
  };
  const handleDelete = (userId: string) => {
    const deleteRef = ref(database, `users/${userId}`);
    remove(deleteRef);
  };
  const handleUpdate = (user: User) => {
    setSoqchi(user.id);
    setAge(user.age + "");
    setEmail(user.email);
    setName(user.name);
  };

  return (
    <div>
      <div className="card max-w-[400px] mx-auto mt-5">
        <div className="card-header bg-dark text-white text-center  ">
          Register
        </div>
        <div className="card-body space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="email"
            placeholder="Name..."
            className="form-control"
          />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            type="email"
            placeholder="Age..."
            className="form-control"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email..."
            className="form-control"
          />
        </div>
        <div className="card-footer">
          {" "}
          <button onClick={handleSave} className="btn btn-dark w-full">
            Save
          </button>
          <div className="mt-2 mx-auto  flex items-center justify-center"></div>
        </div>
      </div>
      <div className="mt-4">
        <table className="table">
          <thead className="table-dark">
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Age</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.age}</td>
                <td>{user.email}</td>
                <td>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="btn btn-close"
                  ></button>
                  <button
                    onClick={() => handleUpdate(user)}
                    className="btn btn-warning ml-2"
                  >
                    edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
