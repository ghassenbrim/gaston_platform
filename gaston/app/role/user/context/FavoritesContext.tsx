"use client";

// Contexte global pour la gestion des photos favorites de l'utilisateur.
// Fournit les identifiants des favoris, la liste complète des photos favorites,
// ainsi que les fonctions pour basculer et vérifier l'état favori d'une photo.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Structure d'une photo pouvant être mise en favori
export interface FavoritePhoto {
    id: string;
    url: string;
    category: string;
    createdAt: string;
    mediaType: "image" | "video";
    aspectRatio?: "16:9" | "9:16" | null;
}

// Interface exposée par le contexte aux composants consommateurs
interface FavoritesContextType {
    favoriteIds: Set<string>;          // Ensemble des IDs de photos favorites (accès O(1))
    favoritePhotos: FavoritePhoto[];   // Liste complète des objets photos favorites
    toggleFavorite: (photo: FavoritePhoto) => void; // Ajoute ou retire une photo des favoris
    isFavorite: (id: string) => boolean;            // Vérifie si une photo est favorite
}

// Création du contexte React (undefined par défaut pour forcer l'usage du Provider)
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Fournisseur du contexte : enveloppe les composants qui ont besoin des favoris
export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Ensemble des IDs favoris pour les vérifications rapides
    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
    // Liste des objets photos favorites pour l'affichage
    const [favoritePhotos, setFavoritePhotos] = useState<FavoritePhoto[]>([]);

    // Charger les favoris depuis la DB au montage du composant.
    // On récupère en parallèle les IDs favoris et toutes les photos,
    // puis on filtre les photos pour ne garder que celles qui sont favorites.
    useEffect(() => {
        Promise.all([
            fetch("/api/user/favorites").then(r => r.ok ? r.json() : []),
            fetch("/api/user/photos").then(r => r.ok ? r.json() : []),
        ]).then(([ids, photos]: [string[], FavoritePhoto[]]) => {
            const idSet = new Set<string>(ids);
            setFavoriteIds(idSet);
            // Filtrer les photos pour n'afficher que celles marquées comme favorites
            setFavoritePhotos(photos.filter(p => idSet.has(p.id)));
        }).catch(() => {});
    }, []);

    /**
     * Bascule l'état favori d'une photo (ajout ou suppression).
     * Applique une mise à jour optimiste de l'UI avant la réponse du serveur,
     * puis effectue un rollback en cas d'erreur réseau.
     */
    const toggleFavorite = useCallback((photo: FavoritePhoto) => {
        const isCurrentlyFav = favoriteIds.has(photo.id);

        // Mise à jour optimiste : modification immédiate de l'état local
        setFavoriteIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyFav) next.delete(photo.id); // Retire des favoris
            else next.add(photo.id);                    // Ajoute aux favoris
            return next;
        });
        setFavoritePhotos(prev =>
            isCurrentlyFav
                ? prev.filter(p => p.id !== photo.id)  // Supprime de la liste
                : [...prev, photo]                      // Ajoute à la liste
        );

        // Synchronisation avec la base de données via l'API
        fetch("/api/user/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photoId: photo.id }),
        }).catch(() => {
            // Rollback en cas d'erreur : on annule la mise à jour optimiste
            setFavoriteIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyFav) next.add(photo.id);
                else next.delete(photo.id);
                return next;
            });
            setFavoritePhotos(prev =>
                isCurrentlyFav ? [...prev, photo] : prev.filter(p => p.id !== photo.id)
            );
        });
    }, [favoriteIds]);

    // Vérifie rapidement si une photo est dans les favoris grâce au Set
    const isFavorite = useCallback((id: string) => favoriteIds.has(id), [favoriteIds]);

    return (
        <FavoritesContext.Provider value={{ favoriteIds, favoritePhotos, toggleFavorite, isFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

/**
 * Hook personnalisé pour accéder au contexte des favoris.
 * Lève une erreur si utilisé en dehors d'un FavoritesProvider.
 */
export const useFavorites = () => {
    const ctx = useContext(FavoritesContext);
    if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
    return ctx;
};
