# ABB Palletizing Template / Modèle de Palettisation ABB

## [FR] Description du Projet

Ce dépôt contient le code source optimisé pour une cellule de palettisation robotisée ABB. Basé sur un modèle standard, il a été adapté pour répondre aux besoins spécifiques de la production actuelle.

### Modifications et Optimisations Récentes
*   **Suppression du LiftKit** : Tout le code relatif à l'axe externe (LiftKit) a été retiré car non utilisé dans cette configuration.
*   **Nettoyage du Code** : Suppression des modules obsolètes (Wizards, exemples ASI) et du code mort.
*   **Optimisation** : Retrait des traces de débogage pour clarifier les logs système.
*   **Extension de capacité** : Agrandissement du tableau de base qui était limité.
*   **Modification Interface Web (WebApp)** : L'interface utilisateur de la WebApp a été modifiée pour n'afficher qu'une seule palette. Cela permet de simplifier la vue pour les installations ne comportant qu'une zone de palettisation.

### Architecture Logicielle
Basé sur le **Palletizing Template**, le programme est structuré en modules distincts :
1.  **PalletizingTemplate (PROGMOD)** : Programme principal (`Main`) qui gère l'initialisation et la boucle de production.
2.  **RunCycle (PROGMOD)** : Orchestre la séquence de mouvements (Prise Intercalaire -> Dépose -> Prise Carton -> Dépose).
3.  **PickPlaceItem (SYSMOD)** : Contient la logique bas-niveau des mouvements (Approches, positions de prise/dépose). Il fait le lien avec `PatternCalc` pour calculer la position de chaque boîte selon le schéma de palettisation.
4.  **Settings (PROGMOD)** : Centralise les constantes de configuration (dimensions pile, offsets pince, zones de travail).

### Guide d'Installation

Ce guide explique étape par étape comment installer le programme RAPID et l'application Web FlexPendant sur le contrôleur robot.

#### Étape 1 : Installation des fichiers RAPID
1.  Accédez au dossier **`Rapid`** du projet.
2.  Copiez les deux sous-dossiers **`PROGMOD`** et **`SYSMOD`** (et tout leur contenu).
3.  Transférez-les dans le système de fichiers du contrôleur robot (par exemple, dans le dossier `HOME/Rapid` ou à la racine d'un disque usb, selon votre méthode de chargement préférée).
4.  Chargez les modules via RobotStudio ou le FlexPendant.

#### Étape 2 : Installation de la WebApp
Accédez au dossier **`Interface_flexpendant`**. Vous y trouverez deux versions :
*   **`WebApp_1_Pallet`** : Contient la version modifiée pour une seule palette (Configuration actuelle).
*   **`WebApp_2_Pallets`** : Dossier réservé pour la version standard à deux palettes.

**Choisissez la version qui correspond à votre installation :**

**Option A : Installation pour 1 Palette (Recommandé pour ce projet)**
1.  Ouvrez le dossier **`Interface_flexpendant/WebApp_1_Pallet`**.
2.  Vous y trouverez un sous-dossier **`WebApps`** contenant le dossier **`Palletizing`**. (Chemin complet : `WebApp_1_Pallet/WebApps/Palletizing`).
3.  Copiez ce dossier **`Palletizing`** final.
4.  Collez-le dans le répertoire **`HOME/WebApps`** du contrôleur robot.
    *   *Chemin final attendu sur le robot* : `HOME/WebApps/Palletizing/`

**Option B : Installation pour 2 Palettes (Standard)**
1.  Ouvrez le dossier **`Interface_flexpendant/WebApp_2_Pallets`**.
2.  Suivez la même procédure que ci-dessus en copiant le dossier `Palletizing` contenu à l'intérieur.

#### Étape 3 : Configuration des WorkObjects (Repères Objet)

Pour garantir la précision des mouvements, il est impératif de définir / calibrer les WorkObjects (Repères Objet) suivants sur votre installation réelle.
Les valeurs présentes dans le programme sont des valeurs par défaut ou provenant d'une autre cellule et ne correspondront pas à votre implantation.

*   **`obFeeder1`** : Repère du convoyeur d'entrée (prise carton).
*   **`obPallet1`** (à `obPallet4`) : Repères des palettes (zones de dépose).

> [!IMPORTANT]
> Si ces repères ne sont pas calibrés correctement, le robot risque d'entrer en collision ou de rater ses prises.

#### Étape 4 : Configuration des Signaux (E/S)
Pour que le programme fonctionne, les signaux suivants doivent être déclarés dans la configuration E/S (I/O System) du contrôleur.

**Sorties Digitales (Digital Outputs - DO)**
Ces signaux pilotent les actionneurs (ventouses, grippeurs, lampes).

| Nom du Signal   | Description / Usage |
| :--- | :--- |
| `doVacuum1`     | Activation vide préhenseur circuit 1 |
| `doVacuum2`     | Activation vide préhenseur circuit 2 |
| `doVacuum3`     | Activation vide préhenseur circuit 3 |
| `doSlipSheet`   | Activation préhension intercalaire |
| `dogrip`        | Fermeture pinces mécaniques / Sécurité prise |
| `doPalletFull1` | Indication palette 1 pleine |
| `doPalletFull2` | Indication palette 2 pleine |
| `doPalletFull3` | Indication palette 3 pleine |
| `doPalletFull4` | Indication palette 4 pleine |

**Entrées Digitales (Digital Inputs - DI)**
Ces signaux proviennent des capteurs.

| Nom du Signal    | Description / Usage |
| :--- | :--- |
| `diBoxAtFeeder`  | Présence boîte au convoyeur d'entrée |
| `diVacuumCheck1` | Contrôle vide circuit 1 (Vacuostat) |
| `diVacuumCheck2` | Contrôle vide circuit 2 (Vacuostat) |
| `diVacuumCheck3` | Contrôle vide circuit 3 (Vacuostat) |
| `diSearch`       | Capteur de recherche (hauteur pile intercalaires) |
| `diNewPallet1`   | Confirmation palette 1 vide/disponible |
| `diNewPallet2`   | Confirmation palette 2 vide/disponible |
| `diNewPallet3`   | Confirmation palette 3 vide/disponible |
| `diNewPallet4`   | Confirmation palette 4 vide/disponible |

---

## [EN] Project Description

This repository contains the optimized source code for an ABB robotic palletizing cell. Based on a standard template, it has been adapted to meet specific production requirements.

### Recent Changes and Optimizations
*   **LiftKit Removal**: All code related to the external axis (LiftKit) has been removed as it is not used in this configuration.
*   **Code Cleanup**: Removal of obsolete modules (Wizards, ASI examples) and dead code.
*   **Optimization**: Removal of debug traces to clear up system logs.
*   **Capacity Expansion**: Increased the size of the base array which was previously limited.
*   **Web Interface (WebApp) Modification**: The WebApp user interface has been modified to display only a single pallet. This simplifies the view for installations with only one palletizing zone.

### Software Architecture
Based on the **Palletizing Template**, the program is structured into distinct modules:
1.  **PalletizingTemplate (PROGMOD)**: Main program (`Main`) handling initialization and the production loop.
2.  **RunCycle (PROGMOD)**: Orchestrates the movement sequence (Pick Slip Sheet -> Place -> Pick Box -> Place).
3.  **PickPlaceItem (SYSMOD)**: Contains low-level motion logic (Approaches, pick/place positions). Interfaces with `PatternCalc` to calculate each box position according to the pallet pattern.
4.  **Settings (PROGMOD)**: Centralizes configuration constants (stack dimensions, gripper offsets, work zones).

### Installation Guide

This guide explains step-by-step how to install the RAPID program and the FlexPendant WebApp on the robot controller.

#### Step 1: Installing RAPID Files
1.  Navigate to the **`Rapid`** folder of the project.
2.  Copy the two subfolders **`PROGMOD`** and **`SYSMOD`** (and all their contents).
3.  Transfer them to the robot controller's file system (e.g., in the `HOME/Rapid` folder or the root of a USB drive, depending on your preferred loading method).
4.  Load the modules via RobotStudio or the FlexPendant.

#### Step 2: Installing the WebApp
Navigate to the **`Interface_flexpendant`** folder. You will find two versions:
*   **`WebApp_1_Pallet`**: Contains the modified version for a single pallet (Current configuration).
*   **`WebApp_2_Pallets`**: Folder reserved for the standard two-pallet version.

**Choose the version that matches your installation:**

**Option A: Installation for 1 Pallet (Recommended for this project)**
1.  Open the folder **`Interface_flexpendant/WebApp_1_Pallet`**.
2.  Inside, you will find a subfolder **`WebApps`** containing the **`Palletizing`** folder. (Full path: `WebApp_1_Pallet/WebApps/Palletizing`).
3.  Copy this final **`Palletizing`** folder.
4.  Paste it into the **`HOME/WebApps`** directory of the robot controller.
    *   *Expected final path on the robot*: `HOME/WebApps/Palletizing/`

**Option B: Installation for 2 Pallets (Standard)**
1.  Open the folder **`Interface_flexpendant/WebApp_2_Pallets`**.
2.  Follow the same procedure as above by copying the `Palletizing` folder found inside.

#### Step 3: WorkObject Calibration

To ensure movement accuracy, it is imperative to define/calibrate the following WorkObjects on your actual installation.
The values present in the program are defaults or from another cell and will not match your layout.

*   **`obFeeder1`**: Infeed conveyor work object (box pick).
*   **`obPallet1`** (to `obPallet4`): Pallet work objects (place zones).

> [!IMPORTANT]
> If these work objects are not correctly calibrated, the robot risks collision or missing picks.

#### Step 4: Signal Configuration (I/O)
For the program to function, the following signals must be declared in the controller's I/O System configuration.

**Digital Outputs (DO)**
These signals control actuators (vacuum cups, grippers, lamps).

| Signal Name     | Description / Usage |
| :--- | :--- |
| `doVacuum1`     | Vacuum activation gripper circuit 1 |
| `doVacuum2`     | Vacuum activation gripper circuit 2 |
| `doVacuum3`     | Vacuum activation gripper circuit 3 |
| `doSlipSheet`   | Slip sheet gripper activation |
| `dogrip`        | Mechanical gripper close / Grip security |
| `doPalletFull1` | Indication pallet 1 full |
| `doPalletFull2` | Indication pallet 2 full |
| `doPalletFull3` | Indication pallet 3 full |
| `doPalletFull4` | Indication pallet 4 full |

**Digital Inputs (DI)**
These signals come from sensors.

| Signal Name      | Description / Usage |
| :--- | :--- |
| `diBoxAtFeeder`  | Box presence at infeed conveyor |
| `diVacuumCheck1` | Vacuum check circuit 1 (Vacuum switch) |
| `diVacuumCheck2` | Vacuum check circuit 2 (Vacuum switch) |
| `diVacuumCheck3` | Vacuum check circuit 3 (Vacuum switch) |
| `diSearch`       | Search sensor (Slip sheet stack height) |
| `diNewPallet1`   | Confirmation pallet 1 empty/available |
| `diNewPallet2`   | Confirmation pallet 2 empty/available |
| `diNewPallet3`   | Confirmation pallet 3 empty/available |
| `diNewPallet4`   | Confirmation pallet 4 empty/available |

---

**Apprenti Ingénieur ABB / ABB Apprentice Engineer**
