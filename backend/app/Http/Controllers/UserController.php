<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'operator_code' => 'required|string|unique:users,operator_code',
            'name'          => 'required|string|max:100',
            'role'          => 'required|string',
            'password'      => 'required|string|min:6',
        ]);

        $user = User::create($validated);
        return response()->json($user, 201);
    }

    public function deactivate($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'inactive';
        $user->save();

        return response()->json(['message' => 'User deactivated successfully.']);
    }
}
