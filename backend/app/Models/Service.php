<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['nom', 'floor_id'];

    public function floor() {
        return $this->belongsTo(Floor::class);
    }

    public function capteurs() {
        return $this->hasMany(Capteur::class);
    }
}
