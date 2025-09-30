<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Floor extends Model
{
    protected $fillable = ['nom', 'clinique_id','niveau'];

    public function clinique() {
        return $this->belongsTo(Clinique::class);
    }

    public function services() {
        return $this->hasMany(Service::class);
    }
}
