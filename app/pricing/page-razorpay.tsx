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
          .select('plan')
          .eq('id', user.id)
          .single()
          
        if (student) {
          setCurrentPlan(student.plan)
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
      console.log("Creating order for plan:", plan)
      
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
        body: JSON.stringify({ plan }),
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
                plan: plan
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
      description: "Basic access to study resources",
      features: [
        "Access to basic study materials",
        "Limited test analysis",
        "Community forum access",
        "Email support"
      ],
      notIncluded: [
        "Mentor meetings",
        "On-request meetings",
        "Advanced resources",
        "Custom study plans"
      ],
      cta: "Start Free",
      popular: false,
      disabled: currentPlan === "free",
      level: 0
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "₹199",
      period: "/month",
      description: "Enhanced learning with mentor support",
      features: [
        "All Free plan features",
        "8 mentor meetings per month",
        "Full test analysis",
        "Premium study resources",
        "Priority email support"
      ],
      notIncluded: [
        "On-request meetings",
        "Custom study plans"
      ],
      cta: currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      popular: true,
      disabled: currentPlan === "pro",
      level: 1
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "₹499",
      period: "/month",
      description: "Comprehensive learning experience",
      features: [
        "All Pro plan features",
        "8 on-request meetings per month",
        "Custom study plans",
        "Advanced analytics",
        "24/7 priority support",
        "Exclusive workshops"
      ],
      notIncluded: [],
      cta: currentPlan === "premium" ? "Current Plan" : "Get Premium",
      popular: false,
      disabled: currentPlan === "premium",
      level: 2
    },
  ]

  // Define all features with required level
  const allFeatures = [
    { id: 'basic_materials', label: 'Basic study materials', requiredLevel: 0 },
    { id: 'limited_test', label: 'Limited test analysis', requiredLevel: 0 },
    { id: 'forum', label: 'Community forum access', requiredLevel: 0 },
    { id: 'email_support', label: 'Email support', requiredLevel: 0 },
    { id: 'mentor_meetings', label: '8 mentor meetings per month', requiredLevel: 1 },
    { id: 'full_test', label: 'Full test analysis', requiredLevel: 1 },
    { id: 'premium_resources', label: 'Premium study resources', requiredLevel: 1 },
    { id: 'priority_email', label: 'Priority email support', requiredLevel: 1 },
    { id: 'on_request', label: '8 on-request meetings per month', requiredLevel: 2 },
    { id: 'custom_plans', label: 'Custom study plans', requiredLevel: 2 },
    { id: 'advanced_analytics', label: 'Advanced analytics', requiredLevel: 2 },
    { id: 'priority_support', label: '24/7 priority support', requiredLevel: 2 },
    { id: 'workshops', label: 'Exclusive workshops', requiredLevel: 2 },
  ]

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Choose Your <span className="text-blue-600">Learning Path</span>
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Select the plan that best fits your learning needs and goals.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`flex flex-col h-full border-2 transition-all ${
                  plan.popular 
                    ? "border-blue-500 shadow-lg shadow-blue-100" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CardHeader>
                  {plan.popular && (
                    <Badge className="w-fit mb-2" variant="default">Most Popular</Badge>
                  )}
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-500">{plan.period}</span>}
                  </div>
                  
                  <div className="space-y-4 mb-8 flex-grow">
                    <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">Features</h4>
                    <ul className="space-y-3">
                      {allFeatures.map((feature) => (
                        <li key={feature.id} className={`flex items-start ${
                          plan.level >= feature.requiredLevel 
                            ? 'text-gray-700' 
                            : 'text-gray-400'
                        }`}>
                          {plan.level >= feature.requiredLevel ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                          )}
                          <span>{feature.label}</span>
                          {plan.level < feature.requiredLevel && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </li>
                      ))}
                    </ul>
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
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Can I switch plans later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes will take effect immediately.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">How do mentor meetings work?</h3>
              <p className="text-gray-600">Mentor meetings are scheduled sessions with your assigned mentor. You can book these through your dashboard based on your mentor's availability.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">What are on-request meetings?</h3>
              <p className="text-gray-600">On-request meetings allow you to schedule sessions with any available mentor, not just your assigned one. This is useful for getting specialized help in specific subjects.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Is there a refund policy?</h3>
              <p className="text-gray-600">We offer a 7-day money-back guarantee if you're not satisfied with your subscription. Contact our support team for assistance.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}