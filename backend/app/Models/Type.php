<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Type extends Model
{
    protected $fillable = ['type'];

    public function familles() {
        return $this->hasMany(Famille::class);
    }
}
