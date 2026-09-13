import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useChatStore } from "../store/useChatStore";

function HomePage() {
  const { selectedUser } = useChatStore();

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        {selectedUser ? <ChatWindow /> : <p className="text-gray-500">Select a user to start chatting</p>}
      </div>
    </div>
  );
}

export default HomePage;