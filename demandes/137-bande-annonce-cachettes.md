# Demande n° 137 : plus de cachettes, et une bande-annonce plus vivante

> Statut : ✅ livrée (tanks version 81).
> ✍️ = ce qu'Iron Wolf Studio a décidé.

## 🎯 Quoi
✍️ « Sur la map et dans la pub, il n'y a pas assez de cachettes. L'infanterie avance sur un terrain découvert : les gens
vont se dire "on va se faire tuer tout de suite". Je veux plus d'arbres, un peu de partout, des maisons détruites. Quand
les tanks avancent, il ne se passe rien, et deux tanks sont collés : il faut les séparer. Je veux des bombardements sur
les côtés, de la fumée, du feu et des explosions en arrière-plan. Quand l'infanterie avance, je veux qu'on montre quand
ils tirent sur quelqu'un, ce qui se passe. » (✍️ « Fais ça en 10 minutes. »)

## ⚙️ Comment
- La carte Moderne : 3 300 arbres au lieu de 2 700, et 30 % d'arbres tout seuls (avant 15 %) ; 95 bosquets (70),
  170 haies (120), 44 granges en ruines (30). `config.js`, `monde`.
- La bande-annonce : 13 feux qui fument au lieu de 5 ; les 4 blindés roulent en V, bien séparés (avant, 2 étaient collés
  l'un dans l'autre) ; 9 obus et bombes tombent sur les côtés pendant le plan des blindés ; des ennemis en face : quand nos
  soldats tirent (« au coin du mur », « à terre »), on voit la poussière des impacts et l'ennemi tombe à plat ventre.

## ✅ Critères
- [ ] Bataille libre : plus d'arbres partout, des bosquets, des haies, des granges en ruines pour se cacher.
- [ ] Bande-annonce : fumée et feux derrière les soldats ; les tanks séparés ; des explosions autour des tanks.
- [ ] Quand un soldat tire, on voit l'ennemi touché tomber.
