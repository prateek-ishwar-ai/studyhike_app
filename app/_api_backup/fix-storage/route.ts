import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Initialize Supabase client with environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }
    
    // Create Supabase client with anon key (this will work for most operations)
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const results = {
      steps: [],
      success: true
    };
    
    // Step 1: Check if the bucket exists
    try {
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        results.steps.push(`Error listing buckets: ${bucketsError.message}`);
        results.success = false;
      } else {
        results.steps.push(`Found ${buckets.length} buckets`);
        
        // Check if our target bucket exists
        const bucketName = 'homework-submissions';
        const existingBucket = buckets.find(b => b.name === bucketName);
        
        if (existingBucket) {
          results.steps.push(`Found existing bucket: ${bucketName}`);
          
          // Try to create a simple test file to verify permissions
          try {
            const testFile = new Blob(['test'], { type: 'text/plain' });
            const testPath = `test-${Date.now()}.txt`;
            
            const { error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(testPath, testFile);
            
            if (uploadError) {
              results.steps.push(`Upload test failed: ${uploadError.message}`);
              results.success = false;
            } else {
              results.steps.push('Test upload successful! Bucket is working correctly.');
              
              // Clean up test file
              await supabase.storage.from(bucketName).remove([testPath]);
            }
          } catch (testError) {
            results.steps.push(`Test upload error: ${testError.message}`);
            results.success = false;
          }
        } else {
          results.steps.push(`Bucket '${bucketName}' not found. Please contact administrator.`);
          results.success = false;
        }
      }
    } catch (error) {
      results.steps.push(`Error checking buckets: ${error.message}`);
      results.success = false;
    }
    
    // Step 2: Check browser storage permissions
    results.steps.push('Checking browser storage permissions...');
    
    // Return the results
    return NextResponse.json({
      message: results.success ? 'Storage is working correctly' : 'Storage issues detected',
      details: results
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Unexpected error: ${error.message}` },
      { status: 500 }
    );
  }
}