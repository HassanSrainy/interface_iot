<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class HandleSanctumSession
{
    public function handle(Request $request, Closure $next)
    {
        try {
            if (!$request->session()->isStarted()) {
                $request->session()->start();
            }

            $response = $next($request);

            if ($response->getStatusCode() >= 500) {
                Log::error('Erreur serveur dans HandleSanctumSession', [
                    'status' => $response->getStatusCode(),
                    'content' => $response->getContent()
                ]);
            }

            return $response;
        } catch (\Exception $e) {
            Log::error('Exception dans HandleSanctumSession', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}