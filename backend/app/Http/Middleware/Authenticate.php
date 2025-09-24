<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // Check if the request is an API request
        if ($request->expectsJson()) {
            // For API requests, don't redirect. Laravel will return a 401 Unauthorized response.
            return null;
        }

        // For web requests, redirect to the login route
        return route('login');
    }
}