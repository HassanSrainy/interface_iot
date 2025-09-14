<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens; // <- Ajouter ceci
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory,HasApiTokens, Notifiable;

    /**
     * Attributs assignables en masse.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role', // <-- ajout du rôle
    ];

    /**
     * Attributs cachés pour la sérialisation.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts automatiques.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * Relation Many-to-Many avec Cliniques
     */
    public function cliniques()
    {
        return $this->belongsToMany(
            Clinique::class,
            'clinique_user',
            'user_id',
            'clinique_id'
        )->withTimestamps();
    }
}
