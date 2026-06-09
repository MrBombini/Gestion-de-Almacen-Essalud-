<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // 1. Verificar si el usuario está Activo
        if (!$user->isActive()) {
            Auth::logout();
            return response()->json(['message' => 'Inactive account.'], 403);
        }

        // 2. Control de roles
        if ($user->role === 'SuperAdmin') {
            return $next($request);
        }

        if (!in_array($user->role, $roles)) {
            // Si requiere Admin/Ingeniero y el usuario es Operador, retorna 403.
            return response()->json(['message' => 'You do not have permission to access this route.'], 403);
        }

        return $next($request);
    }
}
