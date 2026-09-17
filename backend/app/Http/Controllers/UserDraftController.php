<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\UserDraft;

class UserDraftController extends Controller
{
    public function show(Request $request, $module)
    {
        $draft = UserDraft::where('user_id', $request->user()->id)
            ->where('module_name', $module)
            ->first();

        if (!$draft) {
            return response()->json(null);
        }

        return response()->json($draft->draft_data);
    }

    public function store(Request $request, $module)
    {
        $validated = $request->validate([
            'draft_data' => 'required|array',
        ]);

        $draft = UserDraft::updateOrCreate(
            ['user_id' => $request->user()->id, 'module_name' => $module],
            ['draft_data' => $validated['draft_data']]
        );

        return response()->json($draft);
    }

    public function destroy(Request $request, $module)
    {
        UserDraft::where('user_id', $request->user()->id)
            ->where('module_name', $module)
            ->delete();

        return response()->json(['message' => 'Draft deleted']);
    }
}
