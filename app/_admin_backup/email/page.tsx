"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AdminEmailPage() {
  const [target, setTarget] = useState<string>("students");
  const [customEmail, setCustomEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [previewRecipients, setPreviewRecipients] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userOptions, setUserOptions] = useState<{id: string, email: string, name: string}[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  
  const supabase = createClientComponentClient();
  
  // Fetch users when target changes
  useEffect(() => {
    if (target === "single-student" || target === "single-mentor") {
      fetchUsers(target === "single-student" ? "student" : "mentor");
    }
  }, [target]);
  
  // Function to fetch users based on role
  const fetchUsers = async (role: string) => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("role", role);
        
      if (error) {
        throw error;
      }
      
      // Format users for dropdown
      const formattedUsers = data
        .filter(user => user.email) // Only include users with emails
        .map(user => ({
          id: user.id,
          email: user.email,
          name: user.full_name || user.email
        }));
        
      setUserOptions(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateForm = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return false;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return false;
    }

    if (target === "custom") {
      if (!customEmail.trim()) {
        toast.error("Please enter a custom email address");
        return false;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customEmail)) {
        toast.error("Please enter a valid email address");
        return false;
      }
    }
    
    if ((target === "single-student" || target === "single-mentor") && !selectedUser) {
      toast.error(`Please select a ${target === "single-student" ? "student" : "mentor"}`);
      return false;
    }
    
    return true;
  };
  
  const fetchRecipientPreview = async () => {
    setIsLoading(true);
    try {
      // Handle custom email
      if (target === "custom") {
        setPreviewRecipients([customEmail]);
        setShowConfirmDialog(true);
        return;
      }
      
      // Handle single user selection
      if (target === "single-student" || target === "single-mentor") {
        if (!selectedUser) {
          toast.error("Please select a user");
          setIsLoading(false);
          return;
        }
        
        // Find the selected user's email
        const user = userOptions.find(u => u.id === selectedUser);
        if (!user || !user.email) {
          toast.error("Selected user has no email address");
          setIsLoading(false);
          return;
        }
        
        setPreviewRecipients([user.email]);
        setShowConfirmDialog(true);
        return;
      }
      
      // Handle bulk emails to all students or mentors
      const targetRole = target === "students" ? "student" : "mentor";
      
      // Query profiles table to get users with the target role
      const { data: users, error } = await supabase
        .from("profiles")
        .select("email")
        .eq("role", targetRole);
      
      if (error) {
        throw new Error(`Failed to fetch ${targetRole} emails: ${error.message}`);
      }
      
      if (!users || users.length === 0) {
        toast.warning(`No ${targetRole}s found with email addresses`);
        setIsLoading(false);
        return;
      }
      
      // Filter out null emails and extract the email addresses
      const emails = users
        .filter(user => user.email)
        .map(user => user.email);
      
      if (emails.length === 0) {
        toast.warning(`No ${targetRole}s found with valid email addresses`);
        setIsLoading(false);
        return;
      }
      
      setPreviewRecipients(emails);
      setShowConfirmDialog(true);
    } catch (error) {
      console.error("Error fetching recipients:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch recipients");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendClick = () => {
    if (validateForm()) {
      fetchRecipientPreview();
    }
  };
  
  const handleSendEmail = async () => {
    setIsSending(true);
    
    try {
      // Use the preview recipients we already fetched
      if (previewRecipients.length === 0) {
        toast.warning("No recipients found");
        setIsSending(false);
        setShowConfirmDialog(false);
        return;
      }
      
      // Use the standard email sending endpoint
      const response = await fetch("/api/admin/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: previewRecipients,
          subject,
          message,
          directSend: true, // Flag to indicate we're sending directly to email addresses
        }),
      });
      
      try {
        // Check if the response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // Not JSON, likely an error page
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error("Server returned an invalid response. Please check your authentication.");
        }
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || "Failed to send emails");
        }
        
        // Show success message with count of emails sent
        if (result.count) {
          toast.success(`Emails sent successfully to ${result.count} recipient(s)`);
          
          // If we have preview URLs (from nodemailer), show them
          if (result.results && Array.isArray(result.results)) {
            result.results.forEach(emailResult => {
              if (emailResult.previewUrl) {
                // Create a clickable link to view the email
                const previewLink = document.createElement('a');
                previewLink.href = emailResult.previewUrl;
                previewLink.target = '_blank';
                previewLink.textContent = `View email sent to ${emailResult.email}`;
                previewLink.style.color = 'blue';
                previewLink.style.textDecoration = 'underline';
                previewLink.style.cursor = 'pointer';
                
                // Show the link in a toast
                toast(t => (
                  <div onClick={() => window.open(emailResult.previewUrl, '_blank')}>
                    <strong>Email Preview Available</strong>
                    <p>Click to view email sent to {emailResult.email}</p>
                  </div>
                ), {
                  duration: 10000, // Show for 10 seconds
                });
              }
            });
          }
        } else {
          toast.success("Emails sent successfully");
        }
      } catch (responseError) {
        console.error("Error processing response:", responseError);
        toast.error("Failed to process server response. Please try again.");
        throw responseError;
      }
      
      // Reset form
      if (target === "custom") {
        setCustomEmail("");
      }
      setSubject("");
      setMessage("");
      setPreviewRecipients([]);
      
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send emails");
    } finally {
      setIsSending(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Email Center</h1>
      
      <Card className="p-6 rounded-xl shadow-md bg-white">
        <h2 className="text-xl font-bold mb-4">Send Email</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="target">Choose Recipients</Label>
            <Select value={target} onValueChange={(value) => {
              setTarget(value);
              setSelectedUser(""); // Reset selected user when target changes
            }}>
              <SelectTrigger id="target" className="w-full">
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="students">All Students</SelectItem>
                <SelectItem value="mentors">All Mentors</SelectItem>
                <SelectItem value="single-student">Single Student</SelectItem>
                <SelectItem value="single-mentor">Single Mentor</SelectItem>
                <SelectItem value="custom">Custom Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {target === "custom" && (
            <div>
              <Label htmlFor="customEmail">Email Address</Label>
              <Input
                id="customEmail"
                type="email"
                placeholder="example@email.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
            </div>
          )}
          
          {(target === "single-student" || target === "single-mentor") && (
            <div>
              <Label htmlFor="selectedUser">
                Select {target === "single-student" ? "Student" : "Mentor"}
              </Label>
              {loadingUsers ? (
                <div className="text-sm text-gray-500 mt-2">Loading users...</div>
              ) : (
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="selectedUser" className="w-full">
                    <SelectValue placeholder={`Select a ${target === "single-student" ? "student" : "mentor"}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {userOptions.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No users found
                      </SelectItem>
                    ) : (
                      userOptions.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          
          <Button 
            onClick={handleSendClick} 
            disabled={isSending || isLoading}
            className="w-full"
          >
            {isSending ? "Sending..." : isLoading ? "Loading Recipients..." : "Send Email"}
          </Button>
        </div>
      </Card>
      
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Email Send</AlertDialogTitle>
            <AlertDialogDescription>
              {target === "students" && (
                <p>You are about to send an email to {previewRecipients.length} students:</p>
              )}
              {target === "mentors" && (
                <p>You are about to send an email to {previewRecipients.length} mentors:</p>
              )}
              {target === "single-student" && (
                <p>You are about to send an email to a student:</p>
              )}
              {target === "single-mentor" && (
                <p>You are about to send an email to a mentor:</p>
              )}
              {target === "custom" && (
                <p>You are about to send an email to: {customEmail}</p>
              )}
              
              {previewRecipients.length > 0 && (
                <div className="mt-2 mb-4 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md text-sm">
                  {previewRecipients.map((email, index) => (
                    <div key={index} className="mb-1">
                      {email}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p><strong>Subject:</strong> {subject}</p>
                <p className="mt-2"><strong>Message:</strong></p>
                <p className="whitespace-pre-wrap">{message}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendEmail} disabled={isSending}>
              {isSending ? "Sending..." : `Send Email${previewRecipients.length > 0 ? ` (${previewRecipients.length})` : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}