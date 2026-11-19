import { useState } from 'react';
import { ChatProvider } from './context/ChatContext';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import ChatWindow from './components/ChatWindow';
import './index.css';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <ChatHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <ChatWindow />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
