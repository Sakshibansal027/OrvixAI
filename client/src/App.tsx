import { useState } from 'react';
import { ChatPage } from './pages/ChatPage';
import { SupportInboxPage } from './pages/SupportInboxPage';

export default function App() {
  const [view, setView] = useState<'chat' | 'support'>('chat');
  return view === 'chat'
    ? <ChatPage onOpenSupport={() => setView('support')} />
    : <SupportInboxPage onBack={() => setView('chat')} />;
}
