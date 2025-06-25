"use client"

import { Navbar } from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, X } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
// import Script from "next/script" - Not needed for simulated checkout
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"

export default function PricingPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<string>("free")
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
    
    // For paid plans, use client-side approach
    setLoading(true)
    
    try {
      console.log("Processing payment for plan:", plan);
      
      // Define plan prices (same as server-side)
      const PLAN_PRICES = {
        free: 0,
        pro: 19900, // ₹199 in paise
        premium: 49900 // ₹499 in paise
      };
      
      // Get amount for the selected plan
      const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
      
      // Generate a simulated order ID
      const orderId = `order_${Math.random().toString(36).substring(2, 15)}`;
      
      // Show a confirmation dialog
      const amountInRupees = amount / 100; // Convert from paise to rupees
      if (confirm(`Confirm your ${plan.toUpperCase()} plan purchase for ₹${amountInRupees}?`)) {
        console.log("Payment confirmed, processing subscription");
        
        // Simulate successful payment
        const simulatedPaymentId = `pay_${Math.random().toString(36).substring(2, 15)}`;
        
        // Calculate plan dates
        const planStartDate = new Date();
        const planEndDate = new Date();
        planEndDate.setDate(planEndDate.getDate() + 30); // 30 days subscription
        
        // Update student plan directly
        const { error: updateError } = await supabase
          .from('students')
          .update({
            plan: plan,
            plan_start_date: planStartDate.toISOString(),
            plan_end_date: planEndDate.toISOString(),
            meetings_used: 0,
            on_request_used: 0,
            payment_verified: true
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating student plan:', updateError);
          throw new Error("Failed to update subscription");
        }
        
        // Insert payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            student_id: user.id,
            payment_id: simulatedPaymentId,
            order_id: orderId,
            amount: amount,
            plan: plan,
            status: 'success'
          });
        
        if (paymentError) {
          console.warn('Error recording payment (non-critical):', paymentError);
          // Continue anyway since the plan was updated
        }
        
        // Payment successful
        toast({
          title: "Payment Successful",
          description: `Your ${plan} plan has been activated successfully!`,
          variant: "default"
        });
        
        // Update current plan state
        setCurrentPlan(plan);
        
        // Redirect to dashboard
        router.push('/student/dashboard');
      } else {
        // User cancelled
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
          variant: "default"
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Payment processing error:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      })
    } finally {
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
      disabled: currentPlan === "free"
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
      disabled: currentPlan === "pro"
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
      disabled: currentPlan === "premium"
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Razorpay script removed - using simulated checkout */}
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
                    <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider">What's included</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {plan.notIncluded.length > 0 && (
                      <>
                        <h4 className="font-medium text-sm text-gray-500 uppercase tracking-wider mt-6">Not included</h4>
                        <ul className="space-y-3">
                          {plan.notIncluded.map((feature, index) => (
                            <li key={index} className="flex items-start text-gray-500">
                              <X className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"} 
                    size="lg"
                    onClick={() => handlePayment(plan.id)}
                    disabled={loading || plan.disabled}
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