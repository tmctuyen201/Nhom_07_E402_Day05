# VF8 & VF9 User Guide | AVO North America

- URL: https://vinfastowners.org/vf8-vf9-user-guide.html?utm_source=chatgpt.com
- Published date: N/A
- Fetched at: 2026-04-09T09:37:34

## Summary

Comprehensive unofficial user guide for VinFast VF8 and VF9 electric vehicles. Startup procedures, troubleshooting, 12V battery management, charging tips, and common solutions.

## Content

# VinFast VF8/VF9 User GuideGuide d'utilisation VinFast VF8/VF9

Unofficial Comprehensive Manual & Troubleshooting GuideManuel non officiel complet et guide de dépannage

📅Last Updated: November 2025Dernière mise à jour : Novembre 2025

👤Original Author: Thích Xe (YouTube)Auteur original : Thích Xe (YouTube)

🌐Source: Vietnamese Community GuideSource : Guide communautaire vietnamien

Version 1.0Version 1.0

**⚠️ DISCLAIMER:⚠️ AVERTISSEMENT :**

This is an unofficial community guide translated from Vietnamese sources. While we strive for accuracy, always consult official VinFast documentation and authorized service centers for critical issues. Performing modifications or repairs may void your warranty. Use this information at your own risk.

Il s'agit d'un guide communautaire non officiel traduit de sources vietnamiennes. Bien que nous visions l'exactitude, consultez toujours la documentation officielle VinFast et les centres de service autorisés pour les problèmes critiques. Effectuer des modifications ou des réparations peut annuler votre garantie. Utilisez ces informations à vos propres risques.

### 📢 About Updates📢 À propos des mises à jour

This guide is based on a living document that may receive updates from the community. When significant changes occur, they will be highlighted on this page. Check the version number and last updated date above to ensure you have the most current information.

Ce guide est basé sur un document évolutif qui peut recevoir des mises à jour de la communauté. Lorsque des changements importants se produisent, ils seront mis en évidence sur cette page. Vérifiez le numéro de version et la date de dernière mise à jour ci-dessus pour vous assurer d'avoir les informations les plus récentes.

## 📋 Table of Contents📋 Table des matières

- [I. VF8/VF9 Startup ProcedureI. Procédure de démarrage VF8/VF9](https://vinfastowners.org/vf8-vf9-user-guide.html#section-1)
- [II. "Wrench 10 Universal Fix" Hotfix ProcedureII. Procédure de correctif "Clé universelle 10"](https://vinfastowners.org/vf8-vf9-user-guide.html#section-2)
- [III. 12V Battery Sensor ResetIII. Réinitialisation du capteur de batterie 12V](https://vinfastowners.org/vf8-vf9-user-guide.html#section-3)
- [IV. Actions Causing 12V Battery DepletionIV. Actions causant l'épuisement de la batterie 12V](https://vinfastowners.org/vf8-vf9-user-guide.html#section-4)
- [V. Common Operating Errors (14 Issues)V. Erreurs courantes de fonctionnement (14 problèmes)](https://vinfastowners.org/vf8-vf9-user-guide.html#section-5)
- [VI. Hardware Issues (7 Problems)VI. Problèmes matériels (7 problèmes)](https://vinfastowners.org/vf8-vf9-user-guide.html#section-6)
- [VII. Charging Issues (3 Problems)VII. Problèmes de charge (3 problèmes)](https://vinfastowners.org/vf8-vf9-user-guide.html#section-7)
- [VIII. YouTube Viewing via Android AutoVIII. Visionnement YouTube via Android Auto](https://vinfastowners.org/vf8-vf9-user-guide.html#section-8)
- [IX. LFP 12V Battery Parallel InstallationIX. Installation parallèle de batterie LFP 12V](https://vinfastowners.org/vf8-vf9-user-guide.html#section-9)
- [X. Recommended AccessoriesX. Accessoires recommandés](https://vinfastowners.org/vf8-vf9-user-guide.html#section-10)

## I. VF8/VF9 Startup ProcedureI. Procédure de démarrage VF8/VF9

| StepsÉtapes | RationaleJustification |
| --- | --- |
| 1\. Open key/press door handle button (VF8)<br> 2\. Press brake when screen shows "Press brake to begin"<br> 3\. Wait for "Ready" to appear before shifting to Drive1\. Ouvrir avec la clé/appuyer sur le bouton de la poignée de porte (VF8)<br> 2\. Appuyer sur le frein lorsque l'écran affiche "Appuyez sur le frein pour commencer"<br> 3\. Attendre que "Ready" apparaisse avant de passer en mode Drive | During the initial 30 seconds, many modules load simultaneously, causing a 12V battery voltage drop. Forcing electrical system closure through brake depression before stabilization can freeze the contactor, preventing proper motor engagement and causing continuous battery drain without charging capability.Pendant les 30 premières secondes, de nombreux modules se chargent simultanément, provoquant une chute de tension de la batterie 12V. Forcer la fermeture du système électrique en appuyant sur le frein avant la stabilisation peut bloquer le contacteur, empêchant l'engagement approprié du moteur et causant une décharge continue de la batterie sans capacité de charge. |
| **UPDATE:MISE À JOUR :** VF8 Firmware 8.7.9 and VF9 Firmware 8.5.5 allow braking at any time, but it's still recommended to wait for the main interface to fully load before shifting to Drive.Le micrologiciel VF8 8.7.9 et le micrologiciel VF9 8.5.5 permettent de freiner à tout moment, mais il est toujours recommandé d'attendre que l'interface principale se charge complètement avant de passer en mode Drive. |

## II. "Wrench 10 Universal Fix" Hotfix ProcedureII. Procédure de correctif "Clé universelle 10"

This procedure is a community-discovered reset method that resolves many common electrical and sensor issues.

Cette procédure est une méthode de réinitialisation découverte par la communauté qui résout de nombreux problèmes électriques et de capteurs courants.

1. **Disconnect negative battery terminal** \- Locate and carefully disconnect the negative (-) terminal from the 12V battery.**Déconnecter la borne négative de la batterie** \- Localiser et déconnecter soigneusement la borne négative (-) de la batterie 12V.
2. **Remove 30A fuse** \- Remove the designated 30A fuse (see manual for location) for 5-10 seconds until the vehicle fully powers down, then reinstall it.**Retirer le fusible 30A** \- Retirer le fusible 30A désigné (voir le manuel pour l'emplacement) pendant 5-10 secondes jusqu'à ce que le véhicule s'éteigne complètement, puis le réinstaller.
3. **Wait period** \- Wait 5-10 minutes before reconnecting the negative terminal (10+ minutes for VF8 v8.7.9).**Période d'attente** \- Attendre 5-10 minutes avant de reconnecter la borne négative (10+ minutes pour VF8 v8.7.9).
4. **Recalibration run** \- Start the vehicle to "Ready" mode and maintain it for 12-15 minutes in camping mode or while driving. Avoid shutting down during this period to allow sensor recalibration.**Recalibrage** \- Démarrer le véhicule en mode "Ready" et le maintenir pendant 12-15 minutes en mode camping ou en conduisant. Éviter de l'éteindre pendant cette période pour permettre le recalibrage des capteurs.

### Post-Hotfix Settings ResetRéinitialisation des paramètres après le correctif

| FeatureFonctionnalité | Reset ProcedureProcédure de réinitialisation |
| --- | --- |
| Window Auto-RaiseMontée automatique des vitres | Pull windows fully up, then hold the raise button for 3 secondsRemonter complètement les vitres, puis maintenir le bouton de montée pendant 3 secondes |
| Trunk Opening HeightHauteur d'ouverture du coffre | Open trunk, pull to desired height, then hold the lower button until you hear a beepOuvrir le coffre, tirer à la hauteur désirée, puis maintenir le bouton d'abaissement jusqu'à entendre un bip |

## III. 12V Battery Sensor ResetIII. Réinitialisation du capteur de batterie 12V

**⚠️ When to Use:⚠️ Quand utiliser :** This procedure is particularly useful for firmware 8.7.8 which experienced widespread sensor hanging or false readings, preventing battery charging or causing continuous 12V charging at the main battery's expense.Cette procédure est particulièrement utile pour le micrologiciel 8.7.8 qui a connu des blocages généralisés de capteurs ou des lectures erronées, empêchant la charge de la batterie ou causant une charge continue de 12V aux dépens de la batterie principale.

1. Keep the vehicle in "READY" mode with camping mode engaged or parking brake setMaintenir le véhicule en mode "READY" avec le mode camping activé ou le frein de stationnement serré
2. Disconnect the battery sensor connector located at the negative postDéconnecter le connecteur du capteur de batterie situé sur la borne négative
3. Wait 1 minute (10 minutes for VF8 FW8.7.9+ and VF9), then reconnect the connectorAttendre 1 minute (10 minutes pour VF8 FW8.7.9+ et VF9), puis reconnecter le connecteur
4. Check the battery percentage and charge current on the main display to verify proper operationVérifier le pourcentage de batterie et le courant de charge sur l'écran principal pour confirmer le bon fonctionnement

## IV. Actions Causing 12V Battery DepletionIV. Actions causant l'épuisement de la batterie 12V

| Common ErrorErreur courante | SolutionSolution |
| --- | --- |
| Opening doors/trunk repeatedly without starting vehicleOuvrir les portes/coffre à répétition sans démarrer le véhicule | Minimize door/trunk operations and remote window controls. Each action consumes power equivalent to a full startup cycle.Minimiser les opérations des portes/coffre et les commandes à distance des vitres. Chaque action consomme une puissance équivalente à un cycle de démarrage complet. |
| Washing vehicle without camping modeLaver le véhicule sans mode camping | Always activate camping mode or set the parking brake during washing to prevent excessive power draw.Toujours activer le mode camping ou serrer le frein de stationnement pendant le lavage pour éviter une consommation excessive d'énergie. |
| Placing heavy objects on seatsPlacer des objets lourds sur les sièges | The vehicle detects child presence and triggers alarms with continuous power draw. Remove heavy objects from seats when parked.Le véhicule détecte une présence d'enfant et déclenche des alarmes avec une consommation d'énergie continue. Retirer les objets lourds des sièges lorsque garé. |

## V. Common Operating Errors (14 Issues)V. Erreurs courantes de fonctionnement (14 problèmes)

#### 1\. No "READY" Despite Pressing Brake1\. Pas de "READY" malgré l'appui sur le frein

Remove parking brake → Lock all doors → Wait for screen to shut down → Unlock via remote → Retry (wait 30 seconds between attempts)Retirer le frein de stationnement → Verrouiller toutes les portes → Attendre l'extinction de l'écran → Déverrouiller avec la télécommande → Réessayer (attendre 30 secondes entre les tentatives)

#### 2\. System/Battery Error Warnings2\. Avertissements d'erreur système/batterie

Exit vehicle → Lock it → Wait 5 minutes outside remote range → Restart. For FW8.7.9, may require battery terminal disconnection.Sortir du véhicule → Le verrouiller → Attendre 5 minutes hors de portée de la télécommande → Redémarrer. Pour FW8.7.9, peut nécessiter la déconnexion de la borne de batterie.

#### 3\. Vehicle Won't Sleep When Parked3\. Le véhicule ne se met pas en veille lorsque garé

Check for weak battery (<70-75%), upgrade to LFP battery, perform "Wrench 10" hotfix, or reset battery sensor.Vérifier la faiblesse de la batterie (<70-75%), passer à une batterie LFP, effectuer le correctif "Clé 10", ou réinitialiser le capteur de batterie.

#### 4\. Steering Wheel Buttons Frozen4\. Boutons du volant gelés

Execute the "Wrench 10 Universal Fix" hotfix procedure (see Section II).Exécuter la procédure de correctif "Clé universelle 10" (voir Section II).

#### 5\. Flickering Central Display5\. Écran central vacillant

Perform the "Wrench 10" hotfix procedure to reset display systems.Effectuer la procédure de correctif "Clé 10" pour réinitialiser les systèmes d'affichage.

#### 6\. Unresponsive Touchscreen6\. Écran tactile ne répondant pas

Hold the power button for 30 seconds to 1 minute to force a system reboot.Maintenir le bouton d'alimentation pendant 30 secondes à 1 minute pour forcer un redémarrage du système.

#### 7\. Battery Drains During Charging7\. La batterie se décharge pendant la charge

Dealership firmware update required. Contact your VinFast service center.Mise à jour du micrologiciel chez le concessionnaire requise. Contacter votre centre de service VinFast.

#### 8\. 12V Not Charging Despite Vehicle Running8\. 12V ne charge pas malgré le véhicule en marche

Disconnect battery when parking long-term, or install a parallel LFP battery for improved reliability.Déconnecter la batterie lors de stationnement prolongé, ou installer une batterie LFP parallèle pour une meilleure fiabilité.

#### 9\. 360 Camera Malfunction9\. Dysfonctionnement de la caméra 360

Dealership ADAS reset (1 hour procedure) or hardware replacement if reset fails.Réinitialisation ADAS chez le concessionnaire (procédure d'1 heure) ou remplacement matériel si la réinitialisation échoue.

#### 10\. Frequent Camera/Phantom Errors10\. Erreurs fréquentes de caméra/fantômes

Upgrade to LFP battery or reset via battery terminal disconnection procedure.Passer à une batterie LFP ou réinitialiser via la procédure de déconnexion de la borne de batterie.

#### 11\. Shifting to "N" (Neutral) While Driving11\. Passage en "N" (Neutre) pendant la conduite

⚠️ EMERGENCY: Call VinFast roadside assistance immediately. Do not attempt to fix while driving.⚠️ URGENCE : Appeler l'assistance routière VinFast immédiatement. Ne pas tenter de réparer en conduisant.

#### 12\. Complete 12V Battery Depletion12\. Épuisement complet de la batterie 12V

Jump-start using another vehicle or battery. Avoid portable chargers designed for gasoline vehicles as they may be incompatible.Démarrer avec des câbles en utilisant un autre véhicule ou une batterie. Éviter les chargeurs portables conçus pour les véhicules à essence car ils peuvent être incompatibles.

#### 13\. False Warnings (FW 8.7.9.1)13\. Faux avertissements (FW 8.7.9.1)

Lock vehicle for 5 minutes to allow automatic clearing of phantom battery/charging alerts.Verrouiller le véhicule pendant 5 minutes pour permettre l'effacement automatique des alertes fantômes de batterie/charge.

#### 14\. "Turtle" Mode (Thermal Throttling)14\. Mode "Tortue" (limitation thermique)

Park in shaded area for 15-20 minutes. Verify coolant level is above minimum mark. Perform hotfix if condition persists.Garer dans une zone ombragée pendant 15-20 minutes. Vérifier que le niveau de liquide de refroidissement est au-dessus du minimum. Effectuer le correctif si la condition persiste.

#### 15\. No Remote Response15\. Pas de réponse de la télécommande

Check for dead 12V battery or module malfunction. Use mechanical key to access vehicle if needed.Vérifier si la batterie 12V est déchargée ou dysfonctionnement du module. Utiliser la clé mécanique pour accéder au véhicule si nécessaire.

## VI. Hardware Issues (7 Problems)VI. Problèmes matériels (7 problèmes)

| ProblemProblème | SolutionSolution |
| --- | --- |
| Loud braking/steering noise during movementBruit de freinage/direction fort pendant le mouvement | Switch to high regenerative braking mode. Noise typically resolves within 3-5 days of regular use.Passer en mode de freinage régénératif élevé. Le bruit se résout généralement dans les 3-5 jours d'utilisation régulière. |
| Front mudguard scraping curbs/bumper damageGarde-boue avant raclant les bordures/dommages au pare-chocs | Remove or trim mudguard. Note that rear guard has similar issues on curbs.Retirer ou couper le garde-boue. Noter que le garde arrière a des problèmes similaires sur les bordures. |
| Rear suspension clicking/clunkingCliquetis/bruit sourd de la suspension arrière | Trim plastic contact points on spring. Apply MoS₂ (molybdenum disulfide) lubricant. Consider upgrading shock absorber pads.Couper les points de contact en plastique sur le ressort. Appliquer du lubrifiant MoS₂ (disulfure de molybdène). Envisager la mise à niveau des coussinets d'amortisseur. |
| Rough/loud rear suspension rideConduite rude/bruyante de la suspension arrière | Install thicker suspension pads (1.5-3cm elevation). Consider aftermarket rear shock absorbers for improved comfort.Installer des coussinets de suspension plus épais (élévation de 1,5-3 cm). Envisager des amortisseurs arrière de rechange pour un meilleur confort. |
| Heavy/hard door closingFermeture de porte lourde/difficile | Apply RP7 lubricant to hinge contact points. Apply long-lasting grease to plastic door retention mechanisms.Appliquer du lubrifiant RP7 aux points de contact de la charnière. Appliquer de la graisse longue durée aux mécanismes de rétention de porte en plastique. |
| Electrical/battery faults during rain/floodingDéfauts électriques/de batterie pendant la pluie/inondation | Avoid flooded roads. Inspect high-voltage seals during regular maintenance to ensure water resistance.Éviter les routes inondées. Inspecter les joints haute tension lors de l'entretien régulier pour assurer la résistance à l'eau. |
| Weak 12V battery inadequate for operationBatterie 12V faible inadéquate pour le fonctionnement | ⚠️ Upgrade to LFP (Lithium Iron Phosphate) battery immediately for improved reliability and longevity.⚠️ Passer immédiatement à une batterie LFP (phosphate de fer-lithium) pour une fiabilité et une longévité améliorées. |

## VII. Charging Issues (3 Problems)VII. Problèmes de charge (3 problèmes)

| IssueProblème | ResolutionRésolution |
| --- | --- |
| Charging gun stuck/won't disconnectPistolet de charge coincé/ne se déconnecte pas | Method 1: Lock vehicle → Unlock → Press brake for "READY" → Wait 10 seconds → Remove gun.<br> Method 2: Pull the safety cable beneath the front hood (red plastic-wrapped wire near charging port) to manually release.Méthode 1 : Verrouiller le véhicule → Déverrouiller → Appuyer sur le frein pour "READY" → Attendre 10 secondes → Retirer le pistolet.<br> Méthode 2 : Tirer le câble de sécurité sous le capot avant (fil enveloppé de plastique rouge près du port de charge) pour libérer manuellement. |
| Charging gun won't extract from stationPistolet de charge ne se retire pas de la station | Two connector types exist:<br> • Type 1: Press locking pin before removal<br> • Type 2: Lift handle and pull upward<br> Identify your station type and use appropriate method.Deux types de connecteurs existent :<br> • Type 1 : Appuyer sur la goupille de verrouillage avant le retrait<br> • Type 2 : Soulever la poignée et tirer vers le haut<br> Identifier le type de votre station et utiliser la méthode appropriée. |
| Charge won't initiate (functioning station)La charge ne démarre pas (station fonctionnelle) | Observe the "V" indicator light at the charging port:<br> • Green blinking = Charging active ✓<br> • Red = Fault detected ✗<br> • Yellow = Authentication pending ⏳<br> If red, disconnect and retry. If yellow persists, check app authentication.Observer le voyant indicateur "V" au port de charge :<br> • Vert clignotant = Charge active ✓<br> • Rouge = Défaut détecté ✗<br> • Jaune = Authentification en attente ⏳<br> Si rouge, déconnecter et réessayer. Si jaune persiste, vérifier l'authentification de l'application. |

## VIII. YouTube Viewing via Android AutoVIII. Visionnement YouTube via Android Auto

**⚠️ SAFETY WARNING:⚠️ AVERTISSEMENT DE SÉCURITÉ :** Use this feature only when parked. Watching videos while driving is illegal and dangerous.Utilisez cette fonctionnalité uniquement lorsque vous êtes garé. Regarder des vidéos en conduisant est illégal et dangereux.

**Installation Instructions:**

**Instructions d'installation :**

Install files in the following sequence:

Installer les fichiers dans l'ordre suivant :

1. Install Kinginstaller (File 1) on your Android deviceInstaller Kinginstaller (Fichier 1) sur votre appareil Android
2. Use Kinginstaller to install additional apps (Files 2-3)Utiliser Kinginstaller pour installer les applications supplémentaires (Fichiers 2-3)
3. Connect your device to the vehicle via Android AutoConnecter votre appareil au véhicule via Android Auto

**Download Link:** [Google Drive Folder](https://drive.google.com/drive/folders/1-EKYN3nxxN9-ENXHSPXk1HikPIIQIxoD)

**Lien de téléchargement :** [Dossier Google Drive](https://drive.google.com/drive/folders/1-EKYN3nxxN9-ENXHSPXk1HikPIIQIxoD)

## IX. LFP 12V Battery Parallel InstallationIX. Installation parallèle de batterie LFP 12V

Installing a Lithium Iron Phosphate (LFP) battery in parallel with the factory 12V lead-acid battery significantly improves reliability and addresses many common electrical issues.

L'installation d'une batterie au phosphate de fer-lithium (LFP) en parallèle avec la batterie plomb-acide 12V d'origine améliore considérablement la fiabilité et résout de nombreux problèmes électriques courants.

### Operating PrinciplesPrincipes de fonctionnement

- **Startup Support:** Provides high current during engine start, preventing voltage sag
- **Support au démarrage :** Fournit un courant élevé pendant le démarrage du moteur, empêchant la chute de tension
- **Rapid Charging:** Charges quickly from main battery once vehicle reaches "Ready" mode
- **Charge rapide :** Se charge rapidement à partir de la batterie principale une fois que le véhicule atteint le mode "Ready"
- **Extended Parking:** 21Ah usable capacity during sleep mode (vs. 1-5Ah from standard 45Ah lead-acid), enabling 4-5 days of parking without main battery drain
- **Stationnement prolongé :** Capacité utilisable de 21Ah en mode veille (contre 1-5Ah pour le plomb-acide standard de 45Ah), permettant 4-5 jours de stationnement sans décharge de la batterie principale
- **Self-Balancing:** Automatically maintains and preserves lead-acid battery health during sleep cycles
- **Auto-équilibrage :** Maintient et préserve automatiquement la santé de la batterie plomb-acide pendant les cycles de veille
- **Emergency Protection:** Cuts off at 9.2V to prevent complete discharge during system malfunction
- **Protection d'urgence :** Se coupe à 9,2V pour éviter une décharge complète lors d'un dysfonctionnement du système
- **Manual Override:** Can be manually disconnected if vehicle malfunction prevents normal shutdown
- **Dérogation manuelle :** Peut être déconnectée manuellement si un dysfonctionnement du véhicule empêche l'arrêt normal

### When to Consider InstallationQuand envisager l'installation

#### Indicator 1Indicateur 1

Frequent 12V charging cycles during parking, indicating the factory battery cannot maintain adequate chargeCycles de charge 12V fréquents pendant le stationnement, indiquant que la batterie d'origine ne peut pas maintenir une charge adéquate

#### Indicator 2Indicateur 2

Multiple phantom errors during startup, suggesting voltage instabilityPlusieurs erreurs fantômes au démarrage, suggérant une instabilité de tension

#### Indicator 3Indicateur 3

Slow 360 camera initialization or frequent camera malfunctions due to insufficient powerInitialisation lente de la caméra 360 ou dysfonctionnements fréquents de la caméra en raison d'une puissance insuffisante

**⚠️ Professional Installation Recommended:⚠️ Installation professionnelle recommandée :** While this modification is safe when properly installed, we recommend having it performed by a qualified automotive electrician to ensure correct wiring, fusing, and connection polarity.Bien que cette modification soit sûre lorsqu'elle est correctement installée, nous recommandons de la faire effectuer par un électricien automobile qualifié pour garantir un câblage, des fusibles et une polarité de connexion corrects.

## X. Recommended AccessoriesX. Accessoires recommandés

The original guide includes 17 recommended accessories with purchase links. Since these are specific to the Vietnamese market and may not be applicable to North American owners, we've omitted the detailed product list.

Le guide original inclut 17 accessoires recommandés avec des liens d'achat. Comme ceux-ci sont spécifiques au marché vietnamien et peuvent ne pas être applicables aux propriétaires nord-américains, nous avons omis la liste détaillée des produits.

### General CategoriesCatégories générales

- LCD key fobs for improved remote functionality
- Télécommandes LCD pour une fonctionnalité améliorée
- Cabin air filters (activated charcoal and standard types)
- Filtres à air d'habitacle (charbon activé et types standard)
- Specialized lubricants (RP7, MoS₂) for suspension and door mechanisms
- Lubrifiants spécialisés (RP7, MoS₂) pour la suspension et les mécanismes de porte
- Battery monitoring devices
- Dispositifs de surveillance de batterie
- Charging adapters and accessories
- Adaptateurs de charge et accessoires
- Door seals and weatherstripping
- Joints de porte et joints d'étanchéité
- Wheel decals and cosmetic accessories
- Décalcomanies de roue et accessoires cosmétiques
- Rodent repellent systems
- Systèmes de répulsion des rongeurs
- Grounding terminals for improved electrical stability
- Bornes de mise à la terre pour une stabilité électrique améliorée
- Electric tire pumps
- Pompes à pneus électriques
- Dashcams (front and rear)
- Caméras embarquées (avant et arrière)
- Premium floor mats and TPE floor liners
- Tapis de sol premium et revêtements de sol TPE
- Battery disconnect switches for long-term storage
- Interrupteurs de déconnexion de batterie pour stockage à long terme

**For North American Owners:** Consult local VinFast dealers, EV specialty shops, or general automotive retailers for equivalent products suitable for your market.

**Pour les propriétaires nord-américains :** Consulter les concessionnaires VinFast locaux, les magasins spécialisés VE ou les détaillants automobiles généraux pour des produits équivalents adaptés à votre marché.

**Original Source:** This guide is translated from the Vietnamese community resource "Cẩm nang sử dụng xe điện Vinfast VF8/VF9"**Source originale :** Ce guide est traduit de la ressource communautaire vietnamienne "Cẩm nang sử dụng xe điện Vinfast VF8/VF9"

**Editor:** Thích Xe \| **YouTube:** [Thích Xe Channel](https://www.youtube.com/channel/UCIHR-OeB10voVDaIeQhgkHg) \| **Hotline:** 0986666351**Éditeur :** Thích Xe \| **YouTube :** [Chaîne Thích Xe](https://www.youtube.com/channel/UCIHR-OeB10voVDaIeQhgkHg) \| **Ligne directe :** 0986666351

**Translation & Adaptation:** VinFast Owners Association (AVO) \| Community effort to make Vietnamese knowledge accessible to English and French speaking owners**Traduction et adaptation :** Association des propriétaires VinFast (AVO) \| Effort communautaire pour rendre les connaissances vietnamiennes accessibles aux propriétaires anglophones et francophones

📧 Have corrections or updates? Contact us through our main website.📧 Avez-vous des corrections ou des mises à jour? Contactez-nous via notre site Web principal.
