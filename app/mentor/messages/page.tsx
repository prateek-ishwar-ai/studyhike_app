"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Send, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Contact {
  id: string
  fullName: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}

interface Message {
  id: string
  content: string
  sender_id: string
  receiver_id: string
  created_at: string
  is_read: boolean
}

export default function MessagesPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeContact, setActiveContact] = useState<Contact | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!user) return
    
    fetchContacts()
    
    // Set up real-time subscription for new messages
    if (supabase) {
      const subscription = supabase
        .channel('messages-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        }, (payload) => {
          // Handle new message
          const newMessage = payload.new as Message
          
          // Update messages if the active contact sent the message
          if (activeContact && newMessage.sender_id === activeContact.id) {
            setMessages(prev => [...prev, newMessage])
            markMessageAsRead(newMessage.id)
            scrollToBottom()
          }
          
          // Update contacts list with new message info
          updateContactWithNewMessage(newMessage)
          
          // Show notification
          const contactName = contacts.find(c => c.id === newMessage.sender_id)?.fullName || 'Someone'
          toast({
            title: `New message from ${contactName}`,
            description: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
          })
        })
        .subscribe()
      
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user, activeContact])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if we're in demo mode
      const isDemoMode = window.localStorage.getItem('demo_mentor_mode') === 'true' || !supabase;
      
      if (isDemoMode) {
        console.log("Using demo data for messages page");
        
        // Create mock contacts
        const mockContacts = [
          {
            id: "student-1",
            fullName: "Alex Johnson",
            lastMessage: "I've completed the algebra homework",
            lastMessageTime: "2 hours ago",
            unreadCount: 2,
            isOnline: true
          },
          {
            id: "student-2",
            fullName: "Emma Davis",
            lastMessage: "When is our next physics session?",
            lastMessageTime: "Yesterday",
            unreadCount: 0,
            isOnline: false
          },
          {
            id: "student-3",
            fullName: "Ryan Smith",
            lastMessage: "Thank you for your help with chemistry",
            lastMessageTime: "3 days ago",
            unreadCount: 0,
            isOnline: true
          }
        ];
        
        setContacts(mockContacts);
        
        // Set active contact
        setActiveContact(mockContacts[0]);
        
        // Create mock messages for first contact
        setTimeout(() => {
          const mockMessages = [
            {
              id: "msg-1",
              content: "Hello, how is your homework going?",
              sender_id: user?.id || "",
              receiver_id: "student-1",
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
              is_read: true
            },
            {
              id: "msg-2",
              content: "I'm working on it, but having trouble with quadratic equations",
              sender_id: "student-1",
              receiver_id: user?.id || "",
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
              is_read: true
            },
            {
              id: "msg-3",
              content: "Can you show me how to factor x² + 5x + 6?",
              sender_id: "student-1",
              receiver_id: user?.id || "",
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
              is_read: true
            },
            {
              id: "msg-4",
              content: "Sure! Look for two numbers that multiply to give 6 and add up to 5. Those would be 2 and 3. So x² + 5x + 6 = (x + 2)(x + 3)",
              sender_id: user?.id || "",
              receiver_id: "student-1",
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
              is_read: true
            },
            {
              id: "msg-5",
              content: "Thanks! That makes sense. I've completed the algebra homework now.",
              sender_id: "student-1",
              receiver_id: user?.id || "",
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
              is_read: false
            },
            {
              id: "msg-6",
              content: "Could you review it during our next session?",
              sender_id: "student-1",
              receiver_id: user?.id || "",
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000).toISOString(),
              is_read: false
            }
          ];
          
          setMessages(mockMessages);
          setLoading(false);
        }, 500);
        
        return;
      }
      
      if (!supabase || !user) {
        throw new Error("Supabase client not initialized or user not logged in")
      }
      
      // Get all students associated with this mentor
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          profiles:id(id, full_name)
        `)
        .eq('mentor_id', user.id)
      
      if (studentsError) {
        throw studentsError
      }
      
      // Get the last message for each contact
      const contactsWithMessages: Contact[] = []
      
      for (const student of studentsData || []) {
        // Skip if student doesn't have a profile
        if (!student.profiles) continue
        
        // Get the last message between this user and the contact
        const { data: lastMessageData, error: messageError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .or(`sender_id.eq.${student.profiles.id},receiver_id.eq.${student.profiles.id}`)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (messageError) {
          console.error("Error fetching last message:", messageError)
          continue
        }
        
        // Count unread messages
        const { count: unreadCount, error: unreadError } = await supabase
          .from('messages')
          .select('*', { count: 'exact' })
          .eq('receiver_id', user.id)
          .eq('sender_id', student.profiles.id)
          .eq('is_read', false)
        
        if (unreadError) {
          console.error("Error counting unread messages:", unreadError)
        }
        
        // Get online status (this is just a placeholder - implement real presence)
        const isOnline = Math.random() > 0.7 // Random for demo
        
        contactsWithMessages.push({
          id: student.profiles.id,
          fullName: student.profiles.full_name,
          lastMessage: lastMessageData && lastMessageData.length > 0 
            ? lastMessageData[0].content 
            : "No messages yet",
          lastMessageTime: lastMessageData && lastMessageData.length > 0 
            ? formatMessageTime(lastMessageData[0].created_at)
            : "",
          unreadCount: unreadCount || 0,
          isOnline,
        })
      }
      
      // Sort contacts by last message time (most recent first)
      contactsWithMessages.sort((a, b) => {
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })
      
      setContacts(contactsWithMessages)
      
      // If no active contact is set and we have contacts, set the first one
      if (contactsWithMessages.length > 0 && !activeContact) {
        setActiveContact(contactsWithMessages[0])
        fetchMessages(contactsWithMessages[0].id)
      }
    } catch (error) {
      console.error("Error fetching contacts:", error)
      setError("Failed to load contacts")
    } finally {
      setLoading(false)
    }
  }
  
  const fetchMessages = async (contactId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      if (!supabase || !user) {
        throw new Error("Supabase client not initialized or user not logged in")
      }
      
      // Get all messages between the current user and the contact
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${contactId},receiver_id.eq.${contactId}`)
        .order('created_at', { ascending: true })
      
      if (error) {
        throw error
      }
      
      setMessages(data || [])
      
      // Mark all unread messages as read
      markAllMessagesAsRead(contactId)
      
      // Update the unread count for this contact
      setContacts(prevContacts => 
        prevContacts.map(contact => 
          contact.id === contactId ? { ...contact, unreadCount: 0 } : contact
        )
      )
    } catch (error) {
      console.error("Error fetching messages:", error)
      setError("Failed to load messages")
    } finally {
      setLoading(false)
    }
  }
  
  const markAllMessagesAsRead = async (senderId: string) => {
    if (!supabase || !user) return
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', senderId)
        .eq('is_read', false)
      
      if (error) {
        console.error("Error marking messages as read:", error)
      }
    } catch (error) {
      console.error("Error in markAllMessagesAsRead:", error)
    }
  }
  
  const markMessageAsRead = async (messageId: string) => {
    if (!supabase || !user) return
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
      
      if (error) {
        console.error("Error marking message as read:", error)
      }
    } catch (error) {
      console.error("Error in markMessageAsRead:", error)
    }
  }
  
  const updateContactWithNewMessage = (message: Message) => {
    setContacts(prevContacts => 
      prevContacts.map(contact => {
        if (contact.id === message.sender_id) {
          // Update last message info
          return {
            ...contact,
            lastMessage: message.content,
            lastMessageTime: formatMessageTime(message.created_at),
            unreadCount: activeContact?.id === contact.id ? 0 : contact.unreadCount + 1,
          }
        }
        return contact
      })
    )
  }
  
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeContact || !user) return
    
    try {
      setSendingMessage(true)
      
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }
      
      const newMessageObj = {
        content: newMessage.trim(),
        sender_id: user.id,
        receiver_id: activeContact.id,
        is_read: false,
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert(newMessageObj)
        .select()
      
      if (error) {
        throw error
      }
      
      // Add the new message to the list
      if (data && data.length > 0) {
        setMessages(prev => [...prev, data[0]])
        
        // Update the contact's last message
        setContacts(prevContacts => 
          prevContacts.map(contact => {
            if (contact.id === activeContact.id) {
              return {
                ...contact,
                lastMessage: newMessageObj.content,
                lastMessageTime: formatMessageTime(new Date().toISOString()),
              }
            }
            return contact
          })
        )
      }
      
      // Clear the input
      setNewMessage("")
      scrollToBottom()
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Failed to send message",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      // Today: show time
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday'
    } else if (diffDays < 7) {
      // Within last week: show day name
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      // Older: show date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }
  
  const handleContactClick = (contact: Contact) => {
    setActiveContact(contact)
    fetchMessages(contact.id)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading messages...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Communicate with your students</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
        {/* Contacts List */}
        <Card className="md:col-span-1 h-full flex flex-col">
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Your students</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {loading && contacts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-gray-500">No contacts found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-100 ${
                      activeContact?.id === contact.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleContactClick(contact)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarFallback>
                          {contact.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {contact.isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate">{contact.fullName}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {contact.lastMessageTime}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
                    </div>
                    {contact.unreadCount > 0 && (
                      <div className="min-w-[20px] h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center px-1">
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Messages */}
        <Card className="md:col-span-2 h-full flex flex-col">
          {activeContact ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {activeContact.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{activeContact.fullName}</CardTitle>
                    <CardDescription>
                      {activeContact.isOnline ? 'Online' : 'Offline'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => {
                      const isSentByMe = message.sender_id === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              isSentByMe
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isSentByMe ? 'text-blue-200' : 'text-gray-500'
                              }`}
                            >
                              {formatMessageTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!newMessage.trim() || sendingMessage}>
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Select a contact</h3>
                <p className="text-gray-500">Choose a student from the list to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}