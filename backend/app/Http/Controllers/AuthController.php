<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'operator_code' => 'required|string',
            'password'      => 'required|string',
            'shift'         => 'required|string|in:Morning,Afternoon,Night'
        ]);

        if (!Auth::attempt(['operator_code' => $credentials['operator_code'], 'password' => $credentials['password']])) {
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();


        if (!$user->isActive()) {
            Auth::logout();
            return response()->json([
                'message' => 'This account is inactive.'
            ], 403);
        }

        // Create Sanctum token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user,
            'current_shift' => $credentials['shift']
        ], 200);
    }

    public function logout(Request $request)
    {
        // Revoca el token con el que se realizó la petición
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}
