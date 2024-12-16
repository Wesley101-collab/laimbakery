import React, { useState, useEffect, useRef } from 'react';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    addDoc, 
    onSnapshot,
    updateDoc,
    doc,
    deleteDoc,
    getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faPaperPlane,
    faCommentAlt,
    faTrash 
} from '@fortawesome/free-solid-svg-icons';

const AdminChatModal = ({ isOpen, onClose, onPendingChatsUpdate }) => {
    const [chatSessions, setChatSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const chatMessagesRef = useRef(null);

    // Load customer chat sessions
    useEffect(() => {
        if (!isOpen) return;

        const loadCustomerChats = async () => {
            try {
                const messagesRef = collection(db, 'messages');
                const q = query(messagesRef, orderBy('timestamp', 'desc'));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const chatSessionsMap = new Map();

                    querySnapshot.forEach((doc) => {
                        const chat = { id: doc.id, ...doc.data() };
                        const sessionId = chat.sessionId;

                        if (!chatSessionsMap.has(sessionId)) {
                            chatSessionsMap.set(sessionId, {
                                sessionId,
                                lastMessage: chat,
                                unreadCount: chat.isUser && !chat.readByAdmin ? 1 : 0,
                                timestamp: new Date(chat.timestamp)
                            });
                        } else {
                            const existingSession = chatSessionsMap.get(sessionId);
                            
                            // Update last message
                            if (new Date(chat.timestamp) > existingSession.timestamp) {
                                existingSession.lastMessage = chat;
                                existingSession.timestamp = new Date(chat.timestamp);
                            }

                            // Update unread count
                            if (chat.isUser && !chat.readByAdmin) {
                                existingSession.unreadCount++;
                            }
                        }
                    });

                    // Convert map to sorted array
                    const sortedSessions = Array.from(chatSessionsMap.values())
                        .sort((a, b) => b.timestamp - a.timestamp);

                    setChatSessions(sortedSessions);

                    onPendingChatsUpdate(sortedSessions);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error loading chats:', error);
            }
        };

        loadCustomerChats();
    }, [isOpen, onPendingChatsUpdate]);

    // Load messages for selected chat session
    useEffect(() => {
        if (!selectedSession) return;

        const loadSessionMessages = async () => {
            try {
                const messagesRef = collection(db, 'messages');
                const q = query(
                    messagesRef, 
                    where('sessionId', '==', selectedSession.sessionId),
                    orderBy('timestamp')
                );

                const unsubscribe = onSnapshot(q, async (querySnapshot) => {
                    const loadedMessages = [];
                    
                    querySnapshot.forEach((doc) => {
                        const message = { id: doc.id, ...doc.data() };
                        loadedMessages.push(message);

                        // Mark user messages as read by admin
                        if (message.isUser && !message.readByAdmin) {
                            updateDoc(doc.ref, { readByAdmin: true });
                        }
                    });

                    setMessages(loadedMessages);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        loadSessionMessages();
    }, [selectedSession]);

    // Scroll to bottom of messages
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    // Send admin message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !selectedSession) return;

        try {
            await addDoc(collection(db, 'messages'), {
                sessionId: selectedSession.sessionId,
                message: newMessage,
                timestamp: new Date().toISOString(),
                isUser: false,
                readByAdmin: true
            });

            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Clear chat functionality
    const handleClearChat = async () => {
        if (!selectedSession) return;

        try {
            // Get all messages for the selected session
            const messagesRef = collection(db, 'messages');
            const q = query(
                messagesRef, 
                where('sessionId', '==', selectedSession.sessionId)
            );

            const querySnapshot = await getDocs(q);

            // Delete each message
            const deletePromises = querySnapshot.docs.map((document) => 
                deleteDoc(document.ref)
            );

            await Promise.all(deletePromises);

            // Clear local state
            setMessages([]);

            
            // setSelectedSession(null);
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    };

    // Mobile sidebar toggle
    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    // Select session and close mobile sidebar
    const selectSessionAndCloseSidebar = (session) => {
        setSelectedSession(session);
        setIsMobileSidebarOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col md:w-11/12">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Customer Chats</h2>
                    <div className="flex items-center space-x-2">
                        {selectedSession && (
                            <button 
                                onClick={handleClearChat} 
                                className="text-red-500 hover:text-red-700 mr-2"
                                title="Clear Chat"
                            >
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                        )}
                        <button 
                            onClick={onClose} 
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </div>

                {/* Chat Container */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Mobile Chat List Toggle */}
                    <div className="md:hidden absolute top-4 left-4 z-10">
                        <button 
                            onClick={toggleMobileSidebar}
                            className="bg-amber-500 text-white p-2 rounded-full"
                        >
                            <FontAwesomeIcon icon={faCommentAlt} />
                            {chatSessions.reduce((acc, session) => acc + session.unreadCount, 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                                    {chatSessions.reduce((acc, session) => acc + session.unreadCount, 0)}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Chat List Sidebar */}
                    <div className={`
                        fixed md:static md:block 
                        w-full md:w-1/3 border-r border-gray-200 
                        overflow-y-auto bg-gray-50 
                        z-50 top-0 left-0 h-full
                        transform transition-transform duration-300 ease-in-out
                        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                        <button 
                            onClick={toggleMobileSidebar} 
                            className="md:hidden absolute top-4 right-4 text-gray-600"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>

                        {chatSessions.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No active chats
                            </div>
                        ) : (
                            chatSessions.map((session) => (
                                <div 
                                    key={session.sessionId}
                                    onClick={() => selectSessionAndCloseSidebar(session)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
                                        selectedSession?.sessionId === session.sessionId 
                                        ? 'bg-gray-200' 
                                        : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-sm md:text-base">Chat Session</h3>
                                        </div>
                                        {session.unreadCount > 0 && (
                                            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                                                {session.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {session.timestamp.toLocaleString()}
                                    </p>
                                    <p className="text-xs md:text-sm truncate">
                                        {session.lastMessage?.message || 'No messages'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Chat Messages Container */}
                    <div className="w-full md:w-2/3 flex flex-col relative">
                        {!selectedSession ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm md:text-base">
                                Select a chat to view messages
                            </div>
                        ) : (
                            <>
                                <div 
                                    ref={chatMessagesRef}
                                    className="flex-1 overflow-y-auto p-4 space-y-4"
                                >
                                    {messages.map((msg) => (
                                        <div 
                                            key={msg.id}
                                            className={`flex ${
                                                msg.isUser 
                                                ? 'justify-start' 
                                                : 'justify-end'
                                            }`}
                                        >
                                            <div 
                                                className={`
                                                    p-3 rounded-lg max-w-[70%] text-xs md:text-sm
                                                    ${
                                                        msg.isUser
                                                        ? 'bg-gray-200 text-black'
                                                        : 'bg-amber-500 text-white'
                                                    }
                                                `}
                                            >
                                                {msg.message}
                                                {msg.files && msg.files.map((file, index) => (
                                                    <img 
                                                        key={index} 
                                                        src={file.url} 
                                                        alt="Attachment" 
                                                        className="mt-2 max-w-24 md:max-w-32 max-h-24 md:max-h-32 rounded"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Admin Reply Form */}
                                <form 
                                    onSubmit={handleSendMessage}
                                    className="p-4 border-t flex items-center space-x-2"
                                >
                                    <input 
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        className="flex-1 p-2 border rounded-lg text-xs md:text-sm"
                                    />
                                    <button 
                                        type="submit"
                                        className="bg-amber-500 text-white p-2 rounded-full"
                                    >
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminChatModal;