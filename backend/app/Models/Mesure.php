<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mesure extends Model
{
    protected $fillable = ['capteur_id', 'valeur', 'date_mesure'];

    public function capteur() {
        return $this->belongsTo(Capteur::class);
    }

    public function alerte() {
        return $this->hasOne(Alerte::class);
    }
}
