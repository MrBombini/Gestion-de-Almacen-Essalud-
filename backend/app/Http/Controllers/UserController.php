<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return response()->json(User::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'operator_code' => 'required|string|max:20|unique:users,operator_code',
            'name'          => 'required|string|max:100',
            'role'          => 'required|string|in:Operator,Administrator,Engineer',
            'password'      => 'required|string|min:6',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['status']   = 'active';

        $user = User::create($validated);
        return response()->json($user, 201);
    }

    public function show($id)
    {
        return response()->json(User::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'operator_code' => 'required|string|max:20|unique:users,operator_code,' . $id,
            'name'          => 'required|string|max:100',
            'role'          => 'required|string|in:Operator,Administrator,Engineer',
            'password'      => 'nullable|string|min:6',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        return response()->json($user->fresh());
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Protección: no puede eliminar su propia cuenta
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta.'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }

    public function deactivate($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'inactive';
        $user->save();
        return response()->json(['message' => 'Usuario desactivado correctamente.']);
    }
}
