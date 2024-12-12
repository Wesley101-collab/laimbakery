import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    addDoc, 
    onSnapshot, 
    getDoc,
    doc,
    setDoc,
    limit
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db, auth } from './firebase';
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPaperPlane, 
    faArrowLeft, 
    faPaperclip,
    faSmile,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
    // State Management
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isOnline, setIsOnline] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [productInquiry, setProductInquiry] = useState(null);
    
    // Refs
    const fileInputRef = useRef(null);
    const chatMessagesRef = useRef(null);
    const messageInputRef = useRef(null);
    const messagesCache = useRef(new Map());

    // Navigation
    const navigate = useNavigate();

    // Constants
    const messagesPerPage = 50;

    // Session Management
    const sessionId = useRef(
        localStorage.getItem('chatSessionId') || 
        Date.now().toString(36) + Math.random().toString(36).substr(2)
    ).current;

    // Sanitize message data for Firestore
    const sanitizeMessageData = useCallback((messageData) => {
        const sanitizedData = {};
        Object.keys(messageData).forEach(key => {
            if (messageData[key] !== undefined && messageData[key] !== null) {
                if (Array.isArray(messageData[key])) {
                    const filteredArray = messageData[key].filter(
                        item => item !== undefined && item !== null
                    );
                    sanitizedData[key] = filteredArray;
                } else if (typeof messageData[key] === 'object') {
                    sanitizedData[key] = sanitizeMessageData(messageData[key]);
                } else {
                    sanitizedData[key] = messageData[key];
                }
            }
        });
        return sanitizedData;
    }, []);

    // Improved File Upload Function with Supabase
    const uploadFiles = useCallback(async (files) => {
        const fileUrls = [];
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum file size is 5MB.`);
                continue;
            }
    
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${sessionId}/${Date.now()}_${Math.random().toString(36).substr(2)}.${fileExt}`;
    
                const { data, error } = await supabase.storage
                    .from('chat_files')
                    .upload(fileName, file);
    
                if (error) {
                    console.error('Supabase file upload error:', error);
                    alert(`Failed to upload ${file.name}. Please try again.`);
                    continue;
                }
    
                const { data: { publicUrl } } = supabase.storage
                    .from('chat_files')
                    .getPublicUrl(fileName);
    
                fileUrls.push({
                    name: file.name || 'Unnamed File',
                    type: file.type || 'unknown',
                    url: publicUrl,
                    size: file.size
                });
            } catch (error) {
                console.error('File upload error:', error);
                alert(`Failed to upload ${file.name}. Please try again.`);
            }
        }
        return fileUrls;
    }, [sessionId]);

    // Memoized Add Welcome Message Function
    const addWelcomeMessage = useCallback(async () => {
        const welcomeMessage = {
            message: "Welcome to LAIM Bakery & Pastry! How can we help you today?",
            timestamp: new Date().toISOString(),
            sessionId,
            isUser: false,
            files: []
        };

        const welcomeDocRef = doc(db, 'session_metadata', sessionId);
        await Promise.all([
            addDoc(collection(db, 'messages'), sanitizeMessageData(welcomeMessage)),
            setDoc(welcomeDocRef, { hasWelcomeMessage: true })
        ]);
    }, [sessionId, sanitizeMessageData]);

    // Load and Listen for Messages
    useEffect(() => {
        let unsubscribe;
        let isFirstLoad = true;
        
        const loadMessages = async () => {
            try {
                const messagesRef = collection(db, 'messages');
                const q = query(
                    messagesRef, 
                    where('sessionId', '==', sessionId), 
                    orderBy('timestamp', 'asc'),
                    limit(messagesPerPage)
                );
    
                // Set up real-time listener
                unsubscribe = onSnapshot(q, async (querySnapshot) => {
                    const updatedMessages = querySnapshot.docs.map(doc => {
                        const messageData = doc.data();
                        const cachedMessage = messagesCache.current.get(doc.id);
                        
                        if (cachedMessage && 
                            cachedMessage.timestamp === messageData.timestamp) {
                            return cachedMessage;
                        }
                        
                        const newMessage = {
                            id: doc.id,
                            ...messageData
                        };
                        messagesCache.current.set(doc.id, newMessage);
                        return newMessage;
                    });
                    
                    setMessages(updatedMessages);
    
                    // Only check for welcome message on first load
                    if (isFirstLoad) {
                        isFirstLoad = false;
                        
                        // Check if there are any messages at all
                        if (updatedMessages.length === 0) {
                            const welcomeDocRef = doc(db, 'session_metadata', sessionId);
                            const welcomeDocSnap = await getDoc(welcomeDocRef);
    
                            if (!welcomeDocSnap.exists()) {
                                await addWelcomeMessage();
                            }
                        }
                    }
                });
    
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };
    
        loadMessages();
    
        // Check for product inquiry
        const storedInquiry = localStorage.getItem('productInquiry');
        if (storedInquiry) {
            setProductInquiry(JSON.parse(storedInquiry));
            localStorage.removeItem('productInquiry');
        }
    
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [sessionId, addWelcomeMessage]);

    // Add Product Inquiry Message
    const addProductInquiryMessage = useCallback(async () => {
        if (productInquiry) {
            const inquiryMessage = {
                message: `Hello! I'm interested in the ${productInquiry.productName || 'product'}. Is it currently available?`,
                timestamp: new Date().toISOString(),
                sessionId,
                isUser: true,
                files: productInquiry.productImage ? [{
                    name: productInquiry.productName || 'Product Image',
                    type: 'image',
                    url: productInquiry.productImage
                }] : []
            };

            await addDoc(collection(db, 'messages'), sanitizeMessageData(inquiryMessage));
            setProductInquiry(null);
        }
    }, [productInquiry, sessionId, sanitizeMessageData]);

    useEffect(() => {
        if (productInquiry) {
            addProductInquiryMessage();
        }
    }, [productInquiry, addProductInquiryMessage]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
        }
    }, [messages]);

    // Message Submission Handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() && selectedFiles.length === 0) return;

        try {
            const uploadedFiles = selectedFiles.length > 0 
                ? await uploadFiles(selectedFiles) 
                : [];

            const messageData = sanitizeMessageData({
                message: newMessage.trim(),
                timestamp: new Date().toISOString(),
                sessionId,
                isUser: true,
                files: uploadedFiles
            });

            if (messageData.message || messageData.files.length > 0) {
                await addDoc(collection(db, 'messages'), messageData);
            }

            setNewMessage('');
            setSelectedFiles([]);
            setShowEmojiPicker(false);
            
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
            }, 2000);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // File Selection Handler
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        
        const allowedTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        const validFiles = files.filter(file => {
            if (!allowedTypes.includes(file.type)) {
                alert(`Invalid file type for ${file.name}. Allowed types: JPEG, PNG, GIF, PDF, DOC, DOCX`);
                return false;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} is too large. Maximum file size is 5MB.`);
                return false;
            }

            return true;
        });

        if (validFiles.length > 5) {
            alert('You can only upload up to 5 files at a time.');
            return;
        }

        setSelectedFiles(prevFiles => {
            const combinedFiles = [...prevFiles, ...validFiles];
            return combinedFiles.slice(0, 5);
        });
    };

    // Emoji Selection Handler
    const handleEmojiClick = (event, emojiObject) => {
        const cursor = messageInputRef.current.selectionStart;
        const text = newMessage.slice(0, cursor) + 
                     emojiObject.emoji + 
                     newMessage.slice(cursor);
        
        setNewMessage(text);
        setShowEmojiPicker(false);
    };

    // File Removal Handler
    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Back to Home Handler
    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col">
            {/* Navigation Bar */}
            <nav className="bg-amber-500 text-white p-4 flex items-center w-full">
                <button 
                    onClick={handleBackToHome} 
                    className="mr-4 hover:bg-amber-600 p-2 rounded-full transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                </button>
                <h1 className="text-xl font-bold flex-grow">Customer Support</h1>
            </nav>
    
            <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-6 flex-grow flex flex-col lg:px-6 xl:px-8">
                <div className="bg-white rounded-lg shadow-xl flex flex-col h-full w-full max-w-full overflow-hidden">
                    {/* Chat Header */}
                    <div className="p-4 bg-amber-500 text-white rounded-t-lg flex justify-between items-center">
                        <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <h2 className="text-lg sm:text-xl font-bold">Live Chat Support</h2>
                        </div>
                        <div className="flex items-center space-x-2 text-sm sm:text-base">
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                    </div>
    
                    {/* Messages Container */}
                    <div 
                        ref={chatMessagesRef}
                        className="flex-grow overflow-y-auto p-4 space-y-3"
                        style={{ 
                            maxHeight: 'calc(100vh - 250px)', 
                            minHeight: '300px',
                            height: '100%'
                        }}
                    >
                        {messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                            >
                                <div 
                                    className={`
                                        max-w-[90%] sm:max-w-[80%] p-3 rounded-lg break-words
                                        ${msg.isUser ? 'bg-amber-500 text-white' : 'bg-gray-200 text-black'}
                                    `}
                                >
                                    <p>{msg.message}</p>
                                    {msg.files && msg.files.map((file, index) => (
                                        <div key={index} className="mt-2">
                                            {file.type.startsWith('image/') ? (
                                                <img 
                                                    src={file.url} 
                                                    alt="Attachment" 
                                                    className="max-w-full max-h-64 object-cover rounded"
                                                />
                                            ) : (
                                                <a 
                                                    href={file.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 underline block truncate"
                                                >
                                                    {file.name}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        {/* Typing Indicator */}
                        {isTyping && (
                            <div className="self-start text-sm text-gray-500 mb-4">
                                Agent is typing...
                            </div>
                        )}
                    </div>
    
                    {/* File Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="px-2 py-2 bg-gray-100 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 overflow-x-auto">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="relative">
                                    {file.type.startsWith('image/') ? (
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            alt="Preview" 
                                            className="w-full aspect-square object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-full aspect-square bg-gray-200 flex items-center justify-center rounded truncate p-1 text-xs">
                                            {file.name}
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => removeFile(index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                                    >
                                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div className="p-2 w-full">
                            <div className="w-full max-w-md mx-auto">
                                <EmojiPicker 
                                    onEmojiClick={handleEmojiClick}
                                    disableAutoFocus={true}
                                    width="100%"
                                />
                            </div>
                        </div>
                    )}
    
                    {/* Hidden File Input */}
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                    />
    
                    {/* Message Input */}
                    <form onSubmit={handleSubmit} className="border-t mt-auto">
                        <div className="px-2 py-2">
                            <div className="flex items-center space-x-1 bg-white rounded-full border">
                                <button 
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                                >
                                    <FontAwesomeIcon icon={faSmile} className="text-gray-600 w-5 h-5" />
                                </button>
    
                                <input 
                                    ref={messageInputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 p-2 focus:outline-none min-w-0 bg-transparent"
                                />
    
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors relative flex-shrink-0"
                                >
                                    <FontAwesomeIcon icon={faPaperclip} className="text-gray-600 w-5 h-5" />
                                    {selectedFiles.length > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                            {selectedFiles.length}
                                        </span>
                                    )}
                                </button>
    
                                <button 
                                    type="submit"
                                    className="p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors flex-shrink-0 mx-1"
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Chat;
