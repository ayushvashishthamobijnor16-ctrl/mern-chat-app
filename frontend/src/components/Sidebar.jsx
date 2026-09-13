import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

function Sidebar() {
  const { users, getUsers, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (isUsersLoading) {
    return <div className="w-64 border-r p-4">Loading users...</div>;
  }

  return (
    <div className="w-64 border-r h-full overflow-y-auto">
      <h2 className="font-bold p-4 border-b">Chats</h2>
      {users.map((user) => (
        <button
          key={user._id}
          onClick={() => setSelectedUser(user)}
          className={`flex items-center gap-3 w-full p-3 hover:bg-gray-100 ${
            selectedUser?._id === user._id ? "bg-gray-200" : ""
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span>{user.name}</span>
        </button>
      ))}
    </div>
  );
}

export default Sidebar;