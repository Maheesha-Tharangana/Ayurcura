// Test script for Stripe payment integration
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let authCookie = '';

async function login() {
  console.log('Logging in...');
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'kavindu',
      password: 'kavindu123', // Updated password
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  // Get the cookie from the response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    authCookie = setCookie;
    console.log('Login successful, cookie obtained');
  } else {
    throw new Error('No cookie received from login');
  }
}

async function testStripeConnection() {
  console.log('Testing Stripe connection...');
  try {
    const response = await fetch(`${BASE_URL}/api/test-payment-flow`, {
      headers: {
        'Cookie': authCookie,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Stripe connection test result:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const text = await response.text();
      console.log('Response is not JSON. First 100 chars:', text.substring(0, 100));
      return null;
    }
  } catch (error) {
    console.error('Error testing Stripe connection:', error);
    return null;
  }
}

async function createPaymentIntent() {
  console.log('Creating payment intent...');
  try {
    // Get the first appointment from the user's list
    const response = await fetch(`${BASE_URL}/api/appointments`, {
      headers: {
        'Cookie': authCookie,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.status} ${response.statusText}`);
    }

    const appointments = await response.json();
    if (!appointments || appointments.length === 0) {
      console.log('No appointments found. Cannot test payment intent creation.');
      return null;
    }

    const appointment = appointments[0];
    console.log(`Using appointment ID: ${appointment._id || appointment.id}`);

    // Create a payment intent for this appointment
    const paymentResponse = await fetch(`${BASE_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      body: JSON.stringify({
        appointmentId: appointment._id || appointment.id,
        amount: 2990, // $50.00 in cents
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      throw new Error(`Failed to create payment intent: ${paymentResponse.status} ${paymentResponse.statusText}\n${errorText}`);
    }

    const paymentData = await paymentResponse.json();
    console.log('Payment intent created successfully:', JSON.stringify(paymentData, null, 2));
    return paymentData;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

async function main() {
  try {
    await login();
    await testStripeConnection();
    await createPaymentIntent();

    console.log('Tests completed.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

main();