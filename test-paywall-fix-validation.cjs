#!/usr/bin/env node

/**
 * Test script to validate the paywall fix for merge_guest_into_user function
 * 
 * This script tests the scenario:
 * 1. Anonymous user creates 1 free song (freesongsused = 1)
 * 2. User authenticates and data is migrated
 * 3. User should NOT be able to create another free song (should be blocked by paywall)
 * 
 * Expected behavior: freesongsused should be 1 after migration (not 0)
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPaywallFix() {
  console.log('🧪 Testing Paywall Fix - merge_guest_into_user function');
  console.log('=' .repeat(60));

  // Generate test data
  const guestDeviceId = `guest-device-${Date.now()}`;
  const testUserId = crypto.randomUUID();
  const testEmail = `test-${Date.now()}@example.com`;
  let actualUserId = null;
  let userDeviceId = null;

  try {
    console.log('📝 Step 1: Create anonymous user with 1 free song used');
    
    // Create guest user with 1 free song used
    const { data: guestData, error: guestError } = await supabase
      .from('user_creations')
      .insert({
        device_id: guestDeviceId,
        freesongsused: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (guestError) {
      throw new Error(`Failed to create guest user: ${guestError.message}`);
    }

    console.log(`✅ Guest user created with ID: ${guestData.id}`);
    console.log(`   Device ID: ${guestDeviceId}`);
    console.log(`   Free songs used: ${guestData.freesongsused}`);

    console.log('\n📝 Step 2: Create authenticated user');
    
    // Create authenticated user (simulating registration)
    // First create a user in auth.users table
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: `test-${Date.now()}@example.com`,
      password: 'test123456',
      email_confirm: true
    });
    
    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }
    
    actualUserId = authUser.user.id;
    userDeviceId = `user-device-${actualUserId}`;
    console.log(`   Created auth user with ID: ${actualUserId}`);
    
    // Now create user_creations record
    const { data: userData, error: userError } = await supabase
      .from('user_creations')
      .insert({
        device_id: userDeviceId, // Use unique device_id for user
        user_id: actualUserId,
        freesongsused: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      throw new Error(`Failed to create authenticated user: ${userError.message}`);
    }

    console.log(`✅ Authenticated user created with ID: ${testUserId}`);
    console.log(`   Free songs used: ${userData.freesongsused}`);

    console.log('\n📝 Step 3: Execute merge_guest_into_user function');
    
    // Execute merge function
    const { data: mergeResult, error: mergeError } = await supabase
      .rpc('merge_guest_into_user', {
        p_device_id: guestDeviceId,
        p_user_id: actualUserId,
        p_last_ip: '127.0.0.1'
      });

    if (mergeError) {
      throw new Error(`Merge function failed: ${mergeError.message}`);
    }

    console.log('✅ Merge function executed successfully');
    console.log('   Result:', JSON.stringify(mergeResult, null, 2));

    console.log('\n📝 Step 4: Verify final state');
    
    // Check final state of authenticated user
    const { data: finalUser, error: finalError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('user_id', actualUserId)
      .single();

    if (finalError) {
      throw new Error(`Failed to fetch final user state: ${finalError.message}`);
    }

    console.log('📊 Final User State:');
    console.log(`   Device ID: ${finalUser.device_id}`);
    console.log(`   Free songs used: ${finalUser.freesongsused}`);
    console.log(`   User ID: ${finalUser.user_id || 'null'}`);
    console.log(`   Created at: ${finalUser.created_at}`);

    // Verify guest user was deleted
    const { data: guestCheck, error: guestCheckError } = await supabase
      .from('user_creations')
      .select('*')
      .eq('device_id', guestDeviceId)
      .neq('user_id', actualUserId);

    if (guestCheckError) {
      console.warn(`⚠️  Warning: Could not verify guest deletion: ${guestCheckError.message}`);
    } else {
      console.log(`✅ Guest records remaining: ${guestCheck.length} (should be 0)`);
    }

    console.log('\n🎯 Test Results:');
    console.log('=' .repeat(40));
    
    // Validate the fix
    const expectedFreeSongs = 1; // guest(1) + user(0) = 1
    const actualFreeSongs = finalUser.freesongsused;
    
    if (actualFreeSongs === expectedFreeSongs) {
      console.log('✅ PASS: freesongsused correctly summed');
      console.log(`   Expected: ${expectedFreeSongs}, Actual: ${actualFreeSongs}`);
      console.log('✅ PASS: User should be blocked from creating more free songs');
    } else {
      console.log('❌ FAIL: freesongsused not correctly summed');
      console.log(`   Expected: ${expectedFreeSongs}, Actual: ${actualFreeSongs}`);
      console.log('❌ FAIL: User might be able to create more free songs');
    }

    if (finalUser.device_id === guestDeviceId) {
      console.log('✅ PASS: Device ID correctly transferred');
    } else {
      console.log('❌ FAIL: Device ID not transferred correctly');
    }

    if (finalUser.user_id === actualUserId) {
      console.log('✅ PASS: User ID correctly set after merge');
    } else {
      console.log('❌ FAIL: User ID not set correctly after merge');
    }

    console.log('\n📝 Step 5: Cleanup test data');
    
    // Cleanup
    await supabase.from('user_creations').delete().eq('user_id', actualUserId);
    await supabase.from('user_creations').delete().eq('device_id', guestDeviceId);
    if (userDeviceId) {
      await supabase.from('user_creations').delete().eq('device_id', userDeviceId);
    }
    // Also cleanup auth user
    await supabase.auth.admin.deleteUser(actualUserId);
    
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 Test completed successfully!');
    console.log('\n💡 Summary: The paywall fix ensures that anonymous + authenticated');
    console.log('   users are limited to 1 total free song, not 1 each.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Attempt cleanup on error
    try {
      await supabase.from('user_creations').delete().eq('user_id', actualUserId);
      await supabase.from('user_creations').delete().eq('device_id', guestDeviceId);
      if (userDeviceId) {
        await supabase.from('user_creations').delete().eq('device_id', userDeviceId);
      }
      // Also cleanup auth user if it was created
      if (actualUserId) {
        await supabase.auth.admin.deleteUser(actualUserId);
      }
      console.log('🧹 Cleanup completed after error');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup failed:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run the test
testPaywallFix().catch(console.error);