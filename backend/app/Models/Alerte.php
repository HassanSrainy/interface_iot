<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    protected $fillable = ['capteur_id', 'mesure_id', 'type', 'valeur', 'date', 'statut'];

    public function capteur() {
        return $this->belongsTo(Capteur::class);
    }

    public function mesure() {
        return $this->belongsTo(Mesure::class);
    }
}
