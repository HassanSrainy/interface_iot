<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Clinique extends Model
{
    protected $fillable = ['nom', 'adresse', 'ville'];

    public function users()
    {
        return $this->belongsToMany(User::class, 'clinique_user', 'clinique_id', 'user_id')
                    ->withTimestamps();
    }

    public function floors() {
        return $this->hasMany(Floor::class);
    }
}
