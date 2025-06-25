"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Define form schema with Zod
const formSchema = z.object({
  requested_day: z.date({
    required_error: "Please select a date for your meeting.",
  }),
  requested_time: z.string({
    required_error: "Please select a time for your meeting.",
  }),
  topic: z.string()
    .min(5, "Topic must be at least 5 characters.")
    .max(200, "Topic must not exceed 200 characters."),
})

type FormValues = z.infer<typeof formSchema>

// Generate time slots from 9 AM to 8 PM
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 9; hour <= 20; hour++) {
    const hourFormatted = hour % 12 === 0 ? 12 : hour % 12
    const ampm = hour < 12 ? 'AM' : 'PM'
    slots.push(`${hourFormatted}:00 ${ampm}`)
    slots.push(`${hourFormatted}:30 ${ampm}`)
  }
  return slots
}

const timeSlots = generateTimeSlots()

export function RequestMeetingForm({ mentorId, isOnRequest = false }: { mentorId?: string, isOnRequest?: boolean }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [assignedMentorId, setAssignedMentorId] = useState<string | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    plan: string;
    meetingsUsed: number;
    onRequestUsed: number;
    meetingsLimit: number;
    onRequestLimit: number;
  }>({
    plan: 'free',
    meetingsUsed: 0,
    onRequestUsed: 0,
    meetingsLimit: 8,
    onRequestLimit: 8
  })

  // Add useEffect to fetch the assigned mentor and subscription info
  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Fetch subscription info
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("plan, meetings_used, on_request_used")
          .eq("id", user.id)
          .single();
          
        if (studentError) {
          console.error("Error fetching subscription info:", studentError);
        } else if (studentData) {
          setSubscriptionInfo({
            plan: studentData.plan,
            meetingsUsed: studentData.meetings_used || 0,
            onRequestUsed: studentData.on_request_used || 0,
            meetingsLimit: 8, // All plans have 8 regular meetings
            onRequestLimit: 8  // Premium plan has 8 on-request meetings
          });
        }
        
        // If mentor ID is provided, use it directly
        if (mentorId) {
          setAssignedMentorId(mentorId);
          setLoading(false);
          return;
        }
        
        console.log("Fetching assigned mentor for student:", user.id);
        
        // Try both tables to find the mentor assignment
        // First try the assigned_students table (new structure)
        let mentorData = null;
        
        const { data: assignedData, error: assignedError } = await supabase
          .from("assigned_students")
          .select(`mentor_id`)
          .eq("student_id", user.id)
          .order("assigned_at", { ascending: false })
          .limit(1)
          .single();
        
        if (!assignedError && assignedData) {
          console.log("Found mentor in assigned_students:", assignedData);
          mentorData = assignedData.mentor_id;
        } else {
          // If no data in assigned_students, try the student_mentor_assignments table (old structure)
          console.log("No mentor found in assigned_students, trying student_mentor_assignments");
          
          const { data: oldData, error: oldError } = await supabase
            .from("student_mentor_assignments")
            .select(`mentor_id`)
            .eq("student_id", user.id)
            .order("assigned_at", { ascending: false })
            .limit(1)
            .single();
            
          if (!oldError && oldData) {
            console.log("Found mentor in student_mentor_assignments:", oldData);
            mentorData = oldData.mentor_id;
          }
        }
        
        setAssignedMentorId(mentorData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user, mentorId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to request a meeting.",
        variant: "destructive",
      })
      return
    }

    if (!supabase) {
      toast({
        title: "Service unavailable",
        description: "The meeting request service is currently unavailable. Please try again later.",
        variant: "destructive",
      })
      return
    }
    
    // Check if we have a mentor to send the request to
    const targetMentorId = mentorId || assignedMentorId;
    if (!targetMentorId) {
      toast({
        title: "No mentor assigned",
        description: "You don't have a mentor assigned yet. Please contact an administrator.",
        variant: "destructive",
      })
      return
    }
    
    // Check subscription limits
    if (isOnRequest) {
      // Check if user has premium plan
      if (subscriptionInfo.plan !== 'premium') {
        toast({
          title: "Premium plan required",
          description: "On-request meetings are only available with the Premium plan.",
          variant: "destructive",
        })
        return
      }
      
      // Check if user has reached on-request meeting limit
      if (subscriptionInfo.onRequestUsed >= subscriptionInfo.onRequestLimit) {
        toast({
          title: "Meeting limit reached",
          description: `You have used all ${subscriptionInfo.onRequestLimit} on-request meetings for this month.`,
          variant: "destructive",
        })
        return
      }
    } else {
      // Check if user has pro or premium plan for regular meetings
      if (subscriptionInfo.plan === 'free') {
        toast({
          title: "Pro or Premium plan required",
          description: "Mentor meetings are only available with Pro or Premium plans.",
          variant: "destructive",
        })
        return
      }
      
      // Check if user has reached regular meeting limit
      if (subscriptionInfo.meetingsUsed >= subscriptionInfo.meetingsLimit) {
        toast({
          title: "Meeting limit reached",
          description: `You have used all ${subscriptionInfo.meetingsLimit} mentor meetings for this month.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Convert time string to proper TIME format for PostgreSQL
      const timeString = data.requested_time
      const [time, period] = timeString.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      
      if (period === 'PM' && hour !== 12) {
        hour += 12
      } else if (period === 'AM' && hour === 12) {
        hour = 0
      }
      
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minutes}:00`

      // First check if we can access the table
      const { data: testData, error: testError } = await supabase
        .from('meeting_requests')
        .select('id')
        .limit(1)

      if (testError) {
        console.error("Error accessing meeting_requests table:", testError)
        // Don't throw here, just log the error and continue
        console.warn(`Table access warning: ${testError.message}`)
      }

      // Prepare the meeting request data
      const targetMentorId = mentorId || assignedMentorId;
      const meetingData = {
        student_id: user.id,
        mentor_id: targetMentorId,
        requested_day: format(data.requested_day, 'yyyy-MM-dd'),
        requested_time: formattedTime,
        topic: data.topic,
        status: 'pending'
      }

      console.log("Submitting meeting request:", meetingData)

      // Try multiple approaches to insert the meeting request
      try {
        console.log("Attempting to insert meeting request using direct method:", meetingData)
        
        // First try the normal insert
        const { data: insertData, error } = await supabase
          .from('meeting_requests')
          .insert(meetingData)
          .select()

        if (error) {
          console.error("Error inserting meeting request via direct method:", error)
          
          // If that fails, try using our API endpoint
          console.log("Trying API endpoint fallback...")
          
          const response = await fetch('/api/meetings/request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mentorId: targetMentorId,
              requestedDay: format(data.requested_day, 'yyyy-MM-dd'),
              requestedTime: formattedTime,
              topic: data.topic
            }),
          })
          
          const result = await response.json()
          
          if (!response.ok) {
            console.error("API endpoint fallback failed:", result)
            throw new Error(`API error: ${result.error || 'Unknown error'}`)
          }
          
          console.log("Meeting request created via API endpoint:", result)
        } else {
          console.log("Meeting request created via direct method:", insertData)
        }
      } catch (insertError: any) {
        console.error("All insert attempts failed:", insertError)
        throw new Error(`Insert error: ${insertError.message}`)
      }

      console.log("Meeting request submitted successfully:", insertData)

      toast({
        title: "Meeting requested",
        description: "Your meeting request has been sent to the mentor.",
      })

      form.reset()
    } catch (error: any) {
      console.error("Error submitting meeting request:", error)
      toast({
        title: "Failed to request meeting",
        description: `Error: ${error.message || "Unknown error"}. Please try the Diagnostic tab for more information.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <LoadingSpinner size="md" animation="pulse-dots" text="Loading mentor information..." />
      </div>
    );
  }
  
  if (!assignedMentorId && !mentorId) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <h3 className="text-lg font-medium text-red-800 mb-2">No Mentor Assigned</h3>
        <p className="text-red-600">
          You don't have a mentor assigned yet. Please contact an administrator to get a mentor assigned to you.
        </p>
      </div>
    );
  }
  
  // Check subscription status
  const hasReachedLimit = isOnRequest 
    ? subscriptionInfo.onRequestUsed >= subscriptionInfo.onRequestLimit
    : subscriptionInfo.meetingsUsed >= subscriptionInfo.meetingsLimit;
    
  const needsUpgrade = isOnRequest 
    ? subscriptionInfo.plan !== 'premium'
    : subscriptionInfo.plan === 'free';
    
  if (hasReachedLimit || needsUpgrade) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {hasReachedLimit ? 'Meeting Limit Reached' : 'Plan Upgrade Required'}
          </AlertTitle>
          <AlertDescription>
            {hasReachedLimit 
              ? `You have used all ${isOnRequest ? subscriptionInfo.onRequestLimit : subscriptionInfo.meetingsLimit} ${isOnRequest ? 'on-request' : 'mentor'} meetings for this month.`
              : `${isOnRequest ? 'Premium' : 'Pro or Premium'} plan is required for ${isOnRequest ? 'on-request' : 'mentor'} meetings.`
            }
          </AlertDescription>
        </Alert>
        
        <Button className="w-full" asChild>
          <Link href="/pricing">
            {hasReachedLimit ? 'Upgrade Your Plan' : 'View Pricing Plans'}
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="requested_day"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Select a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => 
                      date < new Date(new Date().setHours(0, 0, 0, 0)) || // Disable past dates
                      date > new Date(new Date().setDate(new Date().getDate() + 30)) // Disable dates more than 30 days in the future
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Select a date for your meeting (within the next 30 days).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requested_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Time</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Choose your preferred time for the meeting.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What would you like to discuss in this meeting?"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Briefly describe what you'd like to discuss with your mentor.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner 
                animation="pulse-dots" 
                color="blue" 
                size="sm" 
                text="Submitting request..." 
              />
            </div>
          ) : (
            "Request Session"
          )}
        </Button>
      </form>
    </Form>
  )
}