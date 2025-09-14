<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Famille extends Model
{
    protected $fillable = ['type_id', 'famille'];

    public function type() {
        return $this->belongsTo(Type::class);
    }

    public function capteurs() {
        return $this->hasMany(Capteur::class);
    }
}
