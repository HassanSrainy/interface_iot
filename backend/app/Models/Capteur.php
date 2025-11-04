<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Capteur extends Model
{
    protected $fillable = [
        'famille_id',
        'service_id',
        'matricule',
        'date_installation',
        'date_derniere_connexion',
        'date_derniere_deconnexion',
        'seuil_min',
        'seuil_max',
        'adresse_ip',
        'adresse_mac',
        'status',
        'unite',
    ];
    
    protected $casts = [
        'date_installation' => 'date',
        'date_derniere_connexion' => 'datetime',
        'date_derniere_deconnexion' => 'datetime',
        // 'status' peut rester string, pas besoin de cast particulier pour enum
    ];

    // Relation avec la famille
    public function famille() {
        return $this->belongsTo(Famille::class);
    }

    // Relation avec le service
    public function service() {
        return $this->belongsTo(Service::class);
    }

    // Relation avec les mesures
    public function mesures() {
        return $this->hasMany(Mesure::class);
    }

    // Relation avec les alertes
    public function alertes() {
        return $this->hasMany(Alerte::class);
    }

    // Dernière mesure
    public function derniereMesure() {
        return $this->hasOne(Mesure::class)->latestOfMany('date_mesure');
    }
}
