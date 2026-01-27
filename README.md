# ABB Palletizing Template / Modèle de Palettisation ABB

## [FR] Description du Projet

Ce dépôt contient le code source optimisé pour une cellule de palettisation robotisée ABB. Basé sur un modèle standard, il a été adapté pour répondre aux besoins spécifiques de la production actuelle.

### Modifications et Optimisations Récentes
*   **Suppression du LiftKit** : Tout le code relatif à l'axe externe (LiftKit) a été retiré car non utilisé dans cette configuration.
*   **Nettoyage du Code** : Suppression des modules obsolètes (Wizards, exemples ASI) et du code mort.
*   **Optimisation** : Retrait des traces de débogage pour clarifier les logs système.
*   **Extension de capacité** : Agrandissement du tableau de base qui était limité.

### Architecture Logicielle
Basé sur le **Palletizing Template**, le programme est structuré en modules distincts :
1.  **PalletizingTemplate (PROGMOD)** : Programme principal (`Main`) qui gère l'initialisation et la boucle de production.
2.  **RunCycle (PROGMOD)** : Orchestre la séquence de mouvements (Prise Intercalaire -> Dépose -> Prise Carton -> Dépose).
3.  **PickPlaceItem (SYSMOD)** : Contient la logique bas-niveau des mouvements (Approches, positions de prise/dépose). Il fait le lien avec `PatternCalc` pour calculer la position de chaque boîte selon le schéma de palettisation.
4.  **Settings (PROGMOD)** : Centralise les constantes de configuration (dimensions pile, offsets pince, zones de travail).

---

## [EN] Project Description

This repository contains the optimized source code for an ABB robotic palletizing cell. Based on a standard template, it has been adapted to meet specific production requirements.

### Recent Changes and Optimizations
*   **LiftKit Removal**: All code related to the external axis (LiftKit) has been removed as it is not used in this configuration.
*   **Code Cleanup**: Removal of obsolete modules (Wizards, ASI examples) and dead code.
*   **Optimization**: Removal of debug traces to clear up system logs.
*   **Capacity Expansion**: Increased the size of the base array which was previously limited.

### Software Architecture
Based on the **Palletizing Template**, the program is structured into distinct modules:
1.  **PalletizingTemplate (PROGMOD)**: Main program (`Main`) handling initialization and the production loop.
2.  **RunCycle (PROGMOD)**: Orchestrates the movement sequence (Pick Slip Sheet -> Place -> Pick Box -> Place).
3.  **PickPlaceItem (SYSMOD)**: Contains low-level motion logic (Approaches, pick/place positions). Interfaces with `PatternCalc` to calculate each box position according to the pallet pattern.
4.  **Settings (PROGMOD)**: Centralizes configuration constants (stack dimensions, gripper offsets, work zones).


---

**Apprenti Ingénieur ABB / ABB Apprentice Engineer**
