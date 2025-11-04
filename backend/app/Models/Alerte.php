<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    protected $fillable = [
        'capteur_id', 
        'mesure_id', 
        'type', 
        'valeur', 
        'date', 
        'statut',
        'critique',
        'date_resolution'
    ];

    protected $casts = [
        'critique' => 'boolean',
        'date_resolution' => 'datetime',
    ];

    public function capteur() {
        return $this->belongsTo(Capteur::class);
    }

    public function mesure() {
        return $this->belongsTo(Mesure::class);
    }
}
