import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Define plan prices
const PLAN_PRICES = {
  free: 0,
  pro: 19900, // ₹199 in paise
  premium: 49900 // ₹499 in paise
};

export async function POST(request: Request) {
  try {
    console.log("Create order API called");
    
    // Get request body
    const { plan, userId } = await request.json();
    console.log("Requested plan:", plan, "for user:", userId);
    
    // Validate user ID
    if (!userId) {
      console.error("No user ID provided");
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createServerClient();
    
    // Validate plan
    if (!plan || !['pro', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }
    
    // Get plan price
    const amount = PLAN_PRICES[plan as keyof typeof PLAN_PRICES];
    if (!amount) {
      return NextResponse.json(
        { error: 'Invalid plan amount' },
        { status: 400 }
      );
    }
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();
      
    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }
    
    console.log("Found profile:", profile.email);
    
    // Generate a unique order ID
    // In a real implementation, you would call Razorpay's API to create an order
    // For this simulation, we'll create a unique ID that looks like a Razorpay order ID
    const orderId = `order_${crypto.randomBytes(10).toString('hex')}`;
    const receipt = `receipt_${userId}_${Date.now()}`;
    
    console.log("Generated order ID:", orderId);
    
    // Get Razorpay key ID from environment variables
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    
    if (!keyId) {
      console.error("Razorpay key ID not found in environment variables");
      return NextResponse.json(
        { error: 'Razorpay configuration missing' },
        { status: 500 }
      );
    }
    
    // Return order details
    return NextResponse.json({
      orderId: orderId,
      amount: amount,
      currency: 'INR',
      plan: plan,
      keyId: keyId,
      receipt: receipt,
      notes: {
        plan: plan,
        user_id: userId,
        email: profile.email
      }
    });
    
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}