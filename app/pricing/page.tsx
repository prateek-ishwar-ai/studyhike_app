"use client"

import { Navbar } from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"

// Define Razorpay window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<string>("free")
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const router = useRouter()
  
  // Check if user is logged in
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Get current plan
        const { data: student } = await supabase
          .from('students')
          .select('plan, plan_end_date')
          .eq('id', user.id)
          .single()
          
        if (student) {
          setCurrentPlan(student.plan)
          
          // Check if plan is expired
          if (student.plan_end_date) {
            const endDate = new Date(student.plan_end_date)
            if (endDate < new Date() && student.plan !== 'free') {
              // Plan expired, show notification
              toast({
                title: "Subscription Expired",
                description: "Your subscription has expired. Please renew to continue enjoying premium features.",
                variant: "destructive"
              })
            }
          }
        }
      }
    }
    
    checkUser()
  }, [])

  // Load Razorpay script
  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => {
        console.log("Razorpay script loaded successfully")
        setRazorpayLoaded(true)
        resolve(true)
      }
      script.onerror = () => {
        console.error("Failed to load Razorpay script")
        resolve(false)
      }
      document.body.appendChild(script)
    })
  }

  // Load Razorpay on component mount
  useEffect(() => {
    loadRazorpay()
  }, [])
  
  // Function to handle payment
  const handlePayment = async (plan: string) => {
    if (!user) {
      // Redirect to login if not logged in
      router.push('/auth/login?redirect=/pricing')
      return
    }
    
    if (plan === 'free') {
      // Handle free plan selection
      try {
        await supabase
          .from('students')
          .update({ plan: 'free' })
          .eq('id', user.id)
          
        toast({
          title: "Free Plan Activated",
          description: "You are now on the free plan.",
          variant: "default"
        })
        
        router.push('/student/dashboard')
      } catch (error) {
        console.error("Error updating to free plan:", error)
        toast({
          title: "Error",
          description: "Failed to update your plan. Please try again.",
          variant: "destructive"
        })
      }
      return
    }
    
    // For paid plans, use Razorpay
    setLoading(true)
    
    try {
      console.log("Creating order for plan:", plan, "User:", user)
      
      // Ensure Razorpay is loaded
      if (!window.Razorpay) {
        const loaded = await loadRazorpay()
        if (!loaded) {
          throw new Error("Failed to load Razorpay. Please try again.")
        }
      }
      
      // Create order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          plan,
          userId: user.id // Pass user ID directly
        }),
        credentials: 'include', // Include cookies for authentication
      })
      
      const orderData = await orderResponse.json()
      console.log("Order response:", orderData)
      
      if (!orderResponse.ok) {
        console.error("Order creation failed:", orderData)
        throw new Error(orderData.error || 'Failed to create order')
      }
      
      // Get user profile for prefill
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single()
      
      // Configure Razorpay options
      const options = {
        key: orderData.keyId, // From your API response
        amount: orderData.amount,
        currency: "INR",
        name: "Mark250 Learning",
        description: `${plan.toUpperCase()} Plan Subscription`,
        order_id: orderData.orderId,
        prefill: {
          name: profile?.full_name || user.email,
          email: profile?.email || user.email,
        },
        handler: async function(response: any) {
          console.log("Payment successful:", response)
          
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                plan: plan,
                userId: user.id // Pass user ID directly
              }),
              credentials: 'include', // Include cookies for authentication
            })
            
            const verifyData = await verifyResponse.json()
            console.log("Verification response:", verifyData)
            
            if (!verifyResponse.ok) {
              console.error("Payment verification failed:", verifyData)
              throw new Error(verifyData.error || 'Payment verification failed')
            }
            
            // Payment successful
            toast({
              title: "Payment Successful",
              description: `Your ${plan} plan has been activated successfully!`,
              variant: "default"
            })
            
            // Update current plan state
            setCurrentPlan(plan)
            
            // Redirect to dashboard
            router.push('/student/dashboard')
          } catch (error: any) {
            console.error("Payment verification error:", error)
            toast({
              title: "Payment Verification Failed",
              description: error.message || "There was an error verifying your payment. Please contact support.",
              variant: "destructive"
            })
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: function() {
            console.log("Checkout form closed")
            setLoading(false)
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "default"
            })
          }
        },
        theme: {
          color: "#3B82F6", // Blue color matching the UI
        }
      }
      
      // Initialize Razorpay
      const razorpay = new window.Razorpay(options)
      
      // Open Razorpay checkout
      razorpay.open()
      
    } catch (error: any) {
      console.error("Payment initiation error:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error initiating your payment. Please try again.",
        variant: "destructive"
      })
      setLoading(false)
    }
  }
  const plans = [
    {
      id: "free",
      name: "Free Plan",
      price: "₹0",
      period: "/month",
      description: "Perfect for getting started with JEE preparation",
      features: [
        "6-8 auto-scheduled meetings (max 15 min)",
        "Email reminders",
        "Homework check",
        "Progress tracking",
        "Basic study resources",
      ],
      notIncluded: [
        "Mentor meetings",
        "Test analysis",
        "Personalized study resources",
        "On-request meetings",
        "Custom study plans",
      ],
      cta: currentPlan === "free" ? "Current Plan" : "Get Started Free",
      popular: false,
      color: "border-gray-200",
      disabled: currentPlan === "free",
      level: 0
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "₹199",
      period: "/month",
      description: "Most popular choice for serious JEE aspirants",
      features: [
        "All Free features",
        "8 mentor meetings (25 min)",
        "Test analysis",
        "Personalized study resources",
        "Priority support",
        "Weekly progress reviews",
        "Doubt clearing sessions",
      ],
      notIncluded: [
        "On-request meetings",
        "Custom study plans",
        "Priority access",
      ],
      cta: currentPlan === "pro" ? "Current Plan" : "Join Pro Plan",
      popular: true,
      color: "border-blue-500",
      disabled: currentPlan === "pro",
      level: 1
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "₹499",
      period: "/month",
      description: "Complete package for maximum success",
      features: [
        "All Pro features",
        "8 extra on-request meetings (30 min)",
        "Custom study plans",
        "Priority access",
        "24/7 mentor support",
        "Exam strategy sessions",
        "Mock interview preparation",
        "Career guidance",
      ],
      notIncluded: [],
      cta: currentPlan === "premium" ? "Current Plan" : "Go Premium",
      popular: false,
      color: "border-purple-500",
      disabled: currentPlan === "premium",
      level: 2
    },
  ]
  
  // Define all features with required level
  const allFeatures = [
    { id: 'auto_meetings', label: '6-8 auto-scheduled meetings', requiredLevel: 0 },
    { id: 'email_reminders', label: 'Email reminders', requiredLevel: 0 },
    { id: 'homework_check', label: 'Homework check', requiredLevel: 0 },
    { id: 'progress_tracking', label: 'Progress tracking', requiredLevel: 0 },
    { id: 'basic_resources', label: 'Basic study resources', requiredLevel: 0 },
    { id: 'mentor_meetings', label: '8 mentor meetings (25 min)', requiredLevel: 1 },
    { id: 'test_analysis', label: 'Test analysis', requiredLevel: 1 },
    { id: 'personalized_resources', label: 'Personalized study resources', requiredLevel: 1 },
    { id: 'priority_support', label: 'Priority support', requiredLevel: 1 },
    { id: 'weekly_reviews', label: 'Weekly progress reviews', requiredLevel: 1 },
    { id: 'doubt_clearing', label: 'Doubt clearing sessions', requiredLevel: 1 },
    { id: 'on_request', label: '8 extra on-request meetings', requiredLevel: 2 },
    { id: 'custom_plans', label: 'Custom study plans', requiredLevel: 2 },
    { id: 'priority_access', label: 'Priority access', requiredLevel: 2 },
    { id: 'mentor_support', label: '24/7 mentor support', requiredLevel: 2 },
    { id: 'exam_strategy', label: 'Exam strategy sessions', requiredLevel: 2 },
    { id: 'mock_interview', label: 'Mock interview preparation', requiredLevel: 2 },
    { id: 'career_guidance', label: 'Career guidance', requiredLevel: 2 },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose the Perfect Plan for <span className="text-blue-600">Your JEE Journey</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Start free and upgrade as you progress. All plans include access to our expert mentors and comprehensive
              study materials.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.color} ${plan.popular ? "shadow-xl scale-105" : ""}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="mt-2">{plan.description}</CardDescription>
                  <div className="mt-6">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    <span className="text-gray-600 text-lg">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-8">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Features:</h4>
                      <ul className="space-y-2">
                        {allFeatures.map((feature) => (
                          <li key={feature.id} className={`flex items-start ${
                            plan.level >= feature.requiredLevel 
                              ? 'text-gray-700' 
                              : 'text-gray-400'
                          }`}>
                            {plan.level >= feature.requiredLevel ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                            )}
                            <span className="text-sm">{feature.label}</span>
                            {plan.level < feature.requiredLevel && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"} 
                    size="lg"
                    onClick={() => handlePayment(plan.id)}
                    disabled={loading || plan.disabled}
                    type="button" // Ensure it doesn't submit a form
                  >
                    {loading ? <LoadingSpinner size="sm" /> : plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "Can I change my plan anytime?",
                answer:
                  "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
              },
              {
                question: "What happens if I cancel my subscription?",
                answer:
                  "You can cancel anytime. You'll continue to have access to your current plan until the end of your billing period.",
              },
              {
                question: "Do you offer refunds?",
                answer:
                  "We offer a 7-day money-back guarantee for all paid plans. If you're not satisfied, contact us for a full refund.",
              },
              {
                question: "How are mentor sessions conducted?",
                answer:
                  "All mentor sessions are conducted via video calls using Google Meet or Zoom. You can schedule sessions through your dashboard.",
              },
              {
                question: "Is there a family discount available?",
                answer:
                  "Yes, we offer a 20% discount for families with multiple students. Contact our support team for more details.",
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Start Your JEE Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who have improved their ranks with our platform
          </p>
          <Link href="/auth/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
